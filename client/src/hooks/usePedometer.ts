import { useState, useEffect, useRef } from 'react';

interface PedometerState {
    steps: number;
    isTracking: boolean;
    permissionGranted: boolean;
}

export const usePedometer = () => {
    const [state, setState] = useState<PedometerState>({
        steps: 0,
        isTracking: false,
        permissionGranted: false
    });

    // Algorithm constants
    const ALPHA = 0.8; // Low-pass filter constant (0-1)
    const STEP_THRESHOLD = 1.2; // Magnitude threshold for a step (above gravity)
    const MIN_STEP_DELAY = 300; // Minimum ms between steps (max ~3.3 steps/sec)
    const GRAVITY = 9.81;

    // Refs for mutable state to avoid re-renders
    const lastStepTime = useRef(0);
    const lastAccel = useRef({ x: 0, y: 0, z: 0 });
    const currentSteps = useRef(0);

    // Load saved steps for today
    useEffect(() => {
        // In a real app, we'd load from storage based on today's date
        // For now, we start fresh
    }, []);

    const handleMotion = (event: DeviceMotionEvent) => {
        if (!event.accelerationIncludingGravity) return;

        const { x, y, z } = event.accelerationIncludingGravity;
        if (x === null || y === null || z === null) return;

        // 1. Low-Pass Filter to smooth out noise
        // New = Alpha * Old + (1 - Alpha) * Current
        const smoothX = ALPHA * lastAccel.current.x + (1 - ALPHA) * x;
        const smoothY = ALPHA * lastAccel.current.y + (1 - ALPHA) * y;
        const smoothZ = ALPHA * lastAccel.current.z + (1 - ALPHA) * z;

        lastAccel.current = { x: smoothX, y: smoothY, z: smoothZ };

        // 2. Calculate Magnitude
        const magnitude = Math.sqrt(smoothX * smoothX + smoothY * smoothY + smoothZ * smoothZ);

        // 3. Step Detection
        // We look for a peak that exceeds gravity by a certain threshold
        // Normal gravity is ~9.8. Walking creates forces > 11-12.
        if (magnitude > (GRAVITY + STEP_THRESHOLD)) {
            const now = Date.now();
            // 4. Debounce
            if (now - lastStepTime.current > MIN_STEP_DELAY) {
                currentSteps.current += 1;
                setState(prev => ({ ...prev, steps: currentSteps.current }));
                lastStepTime.current = now;
            }
        }
    };

    const startTracking = async () => {
        // iOS 13+ requires permission request
        if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
            try {
                const response = await (DeviceMotionEvent as any).requestPermission();
                if (response === 'granted') {
                    setState(prev => ({ ...prev, permissionGranted: true, isTracking: true }));
                    window.addEventListener('devicemotion', handleMotion);
                }
            } catch (e) {
                console.error(e);
            }
        } else {
            // Non-iOS or older devices
            setState(prev => ({ ...prev, permissionGranted: true, isTracking: true }));
            window.addEventListener('devicemotion', handleMotion);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            window.removeEventListener('devicemotion', handleMotion);
        };
    }, []);

    return {
        ...state,
        startTracking
    };
};

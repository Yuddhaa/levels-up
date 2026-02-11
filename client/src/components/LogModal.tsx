import React, { useState, useEffect } from 'react';
import { storage, type WeightLog, type UserProfile } from '../lib/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { LevelUpModal } from './LevelUpModal';

interface LogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const LogModal: React.FC<LogModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [weight, setWeight] = useState<string>('');
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [newLevelReached, setNewLevelReached] = useState(1);

    useEffect(() => {
        if (isOpen) {
            storage.getProfile().then(setProfile);
            setWeight('');
        }
    }, [isOpen]);

    const handleLog = async () => {
        if (!weight || !profile) return;

        const numWeight = parseFloat(weight);
        if (isNaN(numWeight)) return;

        // Get previous logs to compare
        const logs = await storage.getLogs();
        const sortedLogs = logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const lastLog = sortedLogs[0];

        let auraChange = 0;

        if (!lastLog) {
            auraChange = 100; // First log bonus
        } else {
            const diff = lastLog.weight - numWeight; // Positive if lost weight

            if (diff > 0) {
                // Weight loss: Base 50 + 100 per kg
                auraChange = 50 + Math.floor(diff * 100);
            } else if (diff < 0) {
                // Weight gain: Penalty 50 + 50 per kg
                auraChange = -50 - Math.floor(Math.abs(diff) * 50);
            } else {
                // Maintenance
                auraChange = 10;
            }
        }

        const newLog: WeightLog = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            weight: numWeight
        };

        await storage.addLog(newLog);

        // Gamification Logic
        let newAura = profile.aura + auraChange;
        let newLevel = profile.level;
        const auraToNextLevel = newLevel * 1000;
        let leveledUp = false;

        if (newAura >= auraToNextLevel) {
            // Level Up
            newLevel += 1;
            newAura -= auraToNextLevel;
            leveledUp = true;
        } else if (newAura < 0) {
            // Level Down (Penalty)
            if (newLevel > 1) {
                newLevel -= 1;
                newAura = (newLevel * 1000) + newAura;
            } else {
                // Allow negative Aura for Level 1 (Debt)
                // newAura is already negative here, so we keep it.
            }
        }

        const updatedProfile = {
            ...profile,
            currentWeight: numWeight,
            aura: newAura,
            level: newLevel
        };

        await storage.saveProfile(updatedProfile);
        onSuccess();

        if (leveledUp) {
            setNewLevelReached(newLevel);
            setShowLevelUp(true);
        } else {
            onClose();
        }
    };

    return (
        <>
            <LevelUpModal
                isOpen={showLevelUp}
                newLevel={newLevelReached}
                onClose={() => {
                    setShowLevelUp(false);
                    onClose();
                }}
            />

            <AnimatePresence>
                {isOpen && !showLevelUp && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 100,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '1rem'
                        }}
                    >
                        {/* Backdrop */}
                        <div
                            onClick={onClose}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0,0,0,0.6)',
                                backdropFilter: 'blur(4px)'
                            }}
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="glass-panel"
                            style={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: '320px',
                                padding: '2rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1.5rem',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Log Weight</h2>
                                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Current Weight (kg)</label>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    pattern="[0-9]*"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    placeholder="0.0"
                                    autoFocus
                                    style={{
                                        width: '100%',
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 'var(--radius-sm)',
                                        padding: '1rem',
                                        color: 'white',
                                        fontSize: '2rem',
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <button
                                className="btn-primary"
                                onClick={handleLog}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    width: '100%'
                                }}
                            >
                                <Check size={20} /> Save Progress
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

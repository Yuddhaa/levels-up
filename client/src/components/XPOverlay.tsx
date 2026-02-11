import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star } from 'lucide-react';

interface XPOverlayProps {
    xpGained: number;
    bonuses: string[];
    onClose: () => void;
    leveledUp: boolean;
    newLevel: number;
}

export const XPOverlay: React.FC<XPOverlayProps> = ({ xpGained, bonuses, onClose, leveledUp, newLevel }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, leveledUp ? 5000 : 3500);
        return () => clearTimeout(timer);
    }, [onClose, leveledUp]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 200,
                backdropFilter: 'blur(10px)'
            }}
            onClick={onClose}
        >
            <div style={{ position: 'relative', width: '100%', maxWidth: '400px', textAlign: 'center', padding: '2rem' }}>

                {leveledUp && (
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        style={{ marginBottom: '2rem' }}
                    >
                        <div style={{
                            width: '120px', height: '120px', margin: '0 auto',
                            background: 'linear-gradient(135deg, #FFD700 0%, #FDB931 100%)',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 50px rgba(255, 215, 0, 0.6)'
                        }}>
                            <Trophy size={64} color="white" />
                        </div>
                        <h2 style={{
                            fontSize: '3rem', fontWeight: 900, color: '#FFD700',
                            textShadow: '0 0 20px rgba(255,215,0,0.5)',
                            marginTop: '1rem',
                            letterSpacing: '2px'
                        }}>LEVEL UP!</h2>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>
                            You are now Level {newLevel}
                        </div>
                    </motion.div>
                )}

                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div style={{
                        fontSize: '4rem', fontWeight: 900,
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '0.5rem',
                        filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))'
                    }}>
                        +{xpGained} XP
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem', alignItems: 'center' }}
                >
                    {bonuses.map((bonus, i) => (
                        <motion.div
                            key={i}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.6 + (i * 0.1) }}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                padding: '0.5rem 1rem',
                                borderRadius: '20px',
                                fontSize: '0.9rem',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Star size={14} fill="white" /> {bonus}
                        </motion.div>
                    ))}
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    transition={{ delay: 1.5 }}
                    style={{ marginTop: '3rem', color: 'white', fontSize: '0.8rem' }}
                >
                    Tap to close
                </motion.p>
            </div>
        </motion.div>
    );
};

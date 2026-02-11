import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';

interface LevelUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    newLevel: number;
}

const QUOTES = [
    "Stay Hard!",
    "They don't know me son!",
    "Who's gonna carry the boats?",
    "You don't know me!",
    "I don't stop when I'm tired, I stop when I'm done.",
    "Roger that!",
    "Taking souls!"
];

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ isOpen, onClose, newLevel }) => {
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 200, // Higher than LogModal
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem',
                        background: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(8px)'
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        style={{
                            textAlign: 'center',
                            color: 'white',
                            maxWidth: '400px',
                            width: '100%'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <motion.div
                            animate={{
                                rotate: [0, 10, -10, 0],
                                scale: [1, 1.1, 1]
                            }}
                            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                            style={{ marginBottom: '2rem', display: 'inline-block' }}
                        >
                            <Trophy size={80} color="#f59e0b" style={{ filter: 'drop-shadow(0 0 20px #f59e0b)' }} />
                        </motion.div>

                        <h2 style={{
                            fontSize: '3rem',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            marginBottom: '0.5rem',
                            background: 'linear-gradient(to right, #f59e0b, #fbbf24)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            Aura Up!
                        </h2>

                        <div style={{ fontSize: '1.5rem', marginBottom: '2rem', fontWeight: 700 }}>
                            Level {newLevel} Reached
                        </div>

                        <div style={{
                            background: 'rgba(255,255,255,0.1)',
                            padding: '1.5rem',
                            borderRadius: '1rem',
                            marginBottom: '2rem',
                            fontStyle: 'italic',
                            fontSize: '1.25rem',
                            border: '1px solid rgba(255,255,255,0.2)'
                        }}>
                            "{randomQuote}"
                        </div>

                        <button
                            className="btn-primary"
                            onClick={onClose}
                            style={{ width: '100%', fontSize: '1.25rem', padding: '1rem' }}
                        >
                            LET'S GO!
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

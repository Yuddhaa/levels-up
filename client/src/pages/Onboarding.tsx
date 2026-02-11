import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage, type UserProfile } from '../lib/storage';
import { api } from '../lib/api';
import { motion } from 'framer-motion';
import { ChevronRight, Target, Ruler, Weight, Calendar, User } from 'lucide-react';

export const Onboarding: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<Partial<UserProfile>>({
        level: 1,
        aura: 0,
        gender: 'male'
    });

    const handleNext = async () => {
        if (step < 6) {
            setStep(step + 1);
        } else {
            // Save and finish
            if (formData.name && formData.currentWeight && formData.targetWeight && formData.height && formData.age && formData.gender) {
                const profile: UserProfile = {
                    name: formData.name,
                    currentWeight: Number(formData.currentWeight),
                    startWeight: Number(formData.currentWeight),
                    targetWeight: Number(formData.targetWeight),
                    height: Number(formData.height),
                    age: Number(formData.age),
                    gender: formData.gender,
                    level: 1,
                    aura: 0
                };

                try {
                    // Save to server first
                    const res = await api.saveProfile(profile);
                    if (!res || res.status === 'error') {
                        console.error('Failed to save to server:', res);
                    }
                } catch (e) {
                    console.error('API Save Error:', e);
                }

                // Save to both local storage and server
                await storage.saveProfile(profile);
                await api.saveProfile(profile);

                navigate('/');
            }
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
    };

    return (
        <div className="layout-container" style={{ justifyContent: 'center', minHeight: '100vh' }}>
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Level Up</h1>
                <p style={{ color: 'var(--text-muted)' }}>Your journey begins now.</p>
            </div>

            <div style={{ position: 'relative', minHeight: '300px' }}>
                {step === 1 && (
                    <motion.div
                        key="step1"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="glass-panel"
                        style={{ padding: '2rem' }}
                    >
                        <label style={{ display: 'block', marginBottom: '1rem', color: 'var(--text-muted)' }}>What should we call you?</label>
                        <input
                            type="text"
                            placeholder="Enter your name"
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            style={{
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: '2px solid var(--primary)',
                                color: 'white',
                                fontSize: '1.5rem',
                                padding: '0.5rem 0',
                                outline: 'none',
                                borderRadius: 0
                            }}
                            autoFocus
                        />
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="step2"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="glass-panel"
                        style={{ padding: '2rem' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <Calendar size={24} color="var(--primary)" />
                            <label style={{ color: 'var(--text-muted)' }}>Your Age</label>
                        </div>
                        <input
                            type="number"
                            placeholder="Years"
                            value={formData.age || ''}
                            onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) })}
                            style={{
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: '2px solid var(--primary)',
                                color: 'white',
                                fontSize: '2rem',
                                fontWeight: 'bold',
                                padding: '0.5rem 0',
                                outline: 'none',
                                borderRadius: 0
                            }}
                            autoFocus
                        />
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div
                        key="step3"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="glass-panel"
                        style={{ padding: '2rem' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <User size={24} color="var(--accent)" />
                            <label style={{ color: 'var(--text-muted)' }}>Gender</label>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {['male', 'female'].map(g => (
                                <button
                                    key={g}
                                    onClick={() => setFormData({ ...formData, gender: g })}
                                    style={{
                                        flex: 1,
                                        padding: '1rem',
                                        background: formData.gender === g ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        textTransform: 'capitalize',
                                        fontWeight: 600
                                    }}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {step === 4 && (
                    <motion.div
                        key="step4"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="glass-panel"
                        style={{ padding: '2rem' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <Ruler size={24} color="var(--secondary)" />
                            <label style={{ color: 'var(--text-muted)' }}>Height (cm)</label>
                        </div>
                        <input
                            type="number"
                            placeholder="0"
                            value={formData.height || ''}
                            onChange={e => setFormData({ ...formData, height: parseFloat(e.target.value) })}
                            style={{
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: '2px solid var(--secondary)',
                                color: 'white',
                                fontSize: '2rem',
                                fontWeight: 'bold',
                                padding: '0.5rem 0',
                                outline: 'none',
                                borderRadius: 0
                            }}
                            autoFocus
                        />
                    </motion.div>
                )}

                {step === 5 && (
                    <motion.div
                        key="step5"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="glass-panel"
                        style={{ padding: '2rem' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <Weight size={24} color="var(--primary)" />
                            <label style={{ color: 'var(--text-muted)' }}>Current Weight (kg)</label>
                        </div>
                        <input
                            type="number"
                            placeholder="0.0"
                            value={formData.currentWeight || ''}
                            onChange={e => setFormData({ ...formData, currentWeight: parseFloat(e.target.value) })}
                            style={{
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: '2px solid var(--primary)',
                                color: 'white',
                                fontSize: '2rem',
                                fontWeight: 'bold',
                                padding: '0.5rem 0',
                                outline: 'none',
                                borderRadius: 0
                            }}
                            autoFocus
                        />
                    </motion.div>
                )}

                {step === 6 && (
                    <motion.div
                        key="step6"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="glass-panel"
                        style={{ padding: '2rem' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <Target size={24} color="var(--accent)" />
                            <label style={{ color: 'var(--text-muted)' }}>Target Weight (kg)</label>
                        </div>
                        <input
                            type="number"
                            placeholder="0.0"
                            value={formData.targetWeight || ''}
                            onChange={e => setFormData({ ...formData, targetWeight: parseFloat(e.target.value) })}
                            style={{
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: '2px solid var(--accent)',
                                color: 'white',
                                fontSize: '2rem',
                                fontWeight: 'bold',
                                padding: '0.5rem 0',
                                outline: 'none',
                                borderRadius: 0
                            }}
                            autoFocus
                        />
                    </motion.div>
                )}
            </div>

            <button
                className="btn-primary"
                onClick={handleNext}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    marginTop: '2rem'
                }}
            >
                {step === 6 ? 'Start Journey' : 'Next'} <ChevronRight size={20} />
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div
                        key={i}
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: i <= step ? 'var(--primary)' : 'var(--bg-card-hover)',
                            transition: 'background 0.3s'
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

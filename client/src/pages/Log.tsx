import React, { useState, useEffect } from 'react';
import { storage, type WeightLog, type UserProfile } from '../lib/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const Log: React.FC = () => {
    const [weight, setWeight] = useState<string>('');
    const [logs, setLogs] = useState<WeightLog[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [xpGained, setXpGained] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [l, p] = await Promise.all([storage.getLogs(), storage.getProfile()]);
        setLogs(l.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setProfile(p);
    };

    const handleLog = async () => {
        if (!weight || !profile) return;

        const numWeight = parseFloat(weight);
        if (isNaN(numWeight)) return;

        const newLog: WeightLog = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            weight: numWeight
        };

        await storage.addLog(newLog);

        // Gamification Logic
        let newAura = profile.aura + 50; // Base Aura for logging
        let newLevel = profile.level;
        const auraToNextLevel = newLevel * 1000;

        if (newAura >= auraToNextLevel) {
            newLevel += 1;
            newAura -= auraToNextLevel;
            // TODO: Show level up modal
        }

        const updatedProfile = {
            ...profile,
            currentWeight: numWeight,
            aura: newAura,
            level: newLevel
        };

        await storage.saveProfile(updatedProfile);

        setWeight('');
        setXpGained(50);
        setShowSuccess(true);
        loadData();

        setTimeout(() => setShowSuccess(false), 3000);
    };

    return (
        <div className="layout-container">
            <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Log Progress</h1>

            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '1rem', color: 'var(--text-muted)' }}>Today's Weight</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="number"
                        inputMode="decimal"
                        pattern="[0-9]*"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="0.0"
                        style={{
                            flex: 1,
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '1rem',
                            color: 'white',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            outline: 'none'
                        }}
                    />
                    <button
                        className="btn-primary"
                        onClick={handleLog}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '60px' }}
                    >
                        <Plus size={24} />
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{
                            background: 'var(--primary)',
                            color: 'black',
                            padding: '1rem',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: '2rem',
                            fontWeight: 'bold',
                            textAlign: 'center'
                        }}
                    >
                        Logged! +{xpGained} XP
                    </motion.div>
                )}
            </AnimatePresence>

            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>History</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {logs.map((log, index) => {
                    const prevLog = logs[index + 1];
                    const diff = prevLog ? log.weight - prevLog.weight : 0;

                    return (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass-panel"
                            style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '0.5rem',
                                    borderRadius: 'var(--radius-sm)'
                                }}>
                                    <Calendar size={20} color="var(--text-muted)" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{log.weight} kg</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {new Date(log.date).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            {index < logs.length - 1 && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    color: diff > 0 ? 'var(--danger)' : diff < 0 ? 'var(--primary)' : 'var(--text-muted)',
                                    fontSize: '0.875rem',
                                    fontWeight: 600
                                }}>
                                    {diff > 0 ? <TrendingUp size={16} /> : diff < 0 ? <TrendingDown size={16} /> : <Minus size={16} />}
                                    {Math.abs(diff).toFixed(1)}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
                {logs.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        No logs yet. Start your journey today!
                    </div>
                )}
            </div>
        </div>
    );
};

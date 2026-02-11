import React, { useEffect, useState } from 'react';
import { storage, type UserProfile } from '../lib/storage';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { usePedometer } from '../hooks/usePedometer';
import { XPOverlay } from '../components/XPOverlay';
import { Trophy, TrendingDown, Activity, Target, Zap, Footprints, Flame, Scale, Plus, X, Camera, Info, Droplets } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import { useToast } from '../components/Toast';

export const Dashboard: React.FC = () => {
    const { showToast } = useToast();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<any>(null);
    const { steps, isTracking, startTracking } = usePedometer();

    // Water State
    const [waterIntake, setWaterIntake] = useState(0);
    const WATER_GOAL = 2500; // ml

    const [showLogModal, setShowLogModal] = useState(false);
    const [showHealthModal, setShowHealthModal] = useState(false);
    const [showLevelInfo, setShowLevelInfo] = useState(false);
    const [calorieDeficit, setCalorieDeficit] = useState(500);
    const [newWeight, setNewWeight] = useState('');
    const [note, setNote] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [xpData, setXpData] = useState<{ xp: number, bonuses: string[], leveledUp: boolean, newLevel: number } | null>(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            // Profile & Stats
            const apiStats = await api.getDashboardStats().catch(() => null);
            if (apiStats && (apiStats as any).profile) {
                const p = {
                    ...apiStats.profile,
                    level: apiStats.profile.level || 1,
                    aura: apiStats.profile.aura || 0
                };
                setProfile(p);
                setStats(apiStats);
            } else {
                const p = await storage.getProfile();
                setProfile(p);
            }

            // Water
            const today = new Date().toISOString().split('T')[0];
            const waterData = await api.getDailyWater(today).catch(() => ({ total_ml: 0 }));
            setWaterIntake(waterData.total_ml);

        } catch (e: any) {
            console.error(e);
            // Fallback
            const p = await storage.getProfile();
            setProfile(p);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        window.addEventListener('log-added', loadData);
        return () => window.removeEventListener('log-added', loadData);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleLogWeight = async () => {
        if (!newWeight) return;
        try {
            const formData = new FormData();
            formData.append('weight', newWeight);
            if (note) formData.append('note', note);
            if (selectedFile) formData.append('photo', selectedFile);

            const res = await api.addWeightLog(formData);

            if (res && res.status === 'success' && res.xpGained) {
                setXpData({
                    xp: res.xpGained,
                    bonuses: res.bonuses || [],
                    leveledUp: res.leveledUp,
                    newLevel: res.newLevel
                });
                showToast(`Logged weight! +${res.xpGained} XP`, 'success');
            }

            setShowLogModal(false);
            setNewWeight('');
            setNote('');
            setSelectedFile(null);
            setPreviewUrl(null);
            loadData();
        } catch (err) {
            showToast('Failed to log weight', 'error');
        }
    };

    const handleAddWater = async (amount: number) => {
        try {
            setWaterIntake(prev => prev + amount); // Optimistic update
            await api.logWater({
                date: new Date().toISOString().split('T')[0],
                amount_ml: amount
            });
            showToast(`Hydrated! +${amount}ml`, 'info');
        } catch (error) {
            setWaterIntake(prev => prev - amount); // Revert
            showToast('Failed to log water', 'error');
        }
    };

    // Skeleton Loading State
    if (loading && !profile) return (
        <div className="layout-container" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}><Skeleton height="80px" /></div>
            <div style={{ marginBottom: '1rem' }}><Skeleton height="150px" /></div>
            <div style={{ marginBottom: '1rem' }}><Skeleton height="200px" /></div>
        </div>
    );

    if (!profile) return <div className="layout-container">Error loading profile.</div>;

    const xpToNextLevel = stats ? stats.xpToNextLevel : profile.level * 1000;
    const xpProgress = stats ? stats.xpProgress : Math.max(0, (profile.aura / xpToNextLevel) * 100);
    const totalLost = stats ? stats.totalLost : profile.startWeight - profile.currentWeight;
    const progressPercent = stats ? stats.goalProgress : 0;

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="layout-container">
            <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.2 }}>
                        Hello, {profile.name}
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Let's get those gains.</p>
                </div>

                {/* Steps Tracker */}
                <div
                    onClick={() => !isTracking && startTracking()}
                    style={{
                        background: isTracking ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                        border: isTracking ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255,255,255,0.1)',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        cursor: isTracking ? 'default' : 'pointer',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <Footprints size={16} color={isTracking ? '#10B981' : 'var(--text-muted)'} />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isTracking ? '#10B981' : 'white' }}>
                        {steps}
                    </span>
                </div>
            </header>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
                {/* 1. Goal Progress */}
                <motion.div
                    variants={itemVariants}
                    className="glass-panel"
                    style={{
                        padding: '1.5rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'linear-gradient(145deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
                        border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}
                >
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
                            <Target size={20} />
                            <span style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Goal Progress</span>
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 800 }}>
                            {progressPercent.toFixed(1)}%
                            <span style={{ fontSize: '1rem', color: 'var(--text-muted)', marginLeft: '0.5rem', fontWeight: 500 }}>completed</span>
                        </div>
                    </div>
                    <div style={{ width: '80px', height: '80px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="80" height="80" viewBox="0 0 60 60">
                            <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                            <motion.circle
                                cx="30" cy="30" r="26" fill="none" stroke="var(--primary)" strokeWidth="6"
                                strokeDasharray="163.36"
                                strokeDashoffset={163.36 - (163.36 * progressPercent) / 100}
                                strokeLinecap="round"
                                transform="rotate(-90 30 30)"
                                initial={{ strokeDashoffset: 163.36 }}
                                animate={{ strokeDashoffset: 163.36 - (163.36 * progressPercent) / 100 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                        </svg>
                        <Zap size={24} color="var(--primary)" fill="var(--primary)" style={{ position: 'absolute' }} />
                    </div>
                </motion.div>

                {/* 2. Level Card */}
                <motion.div
                    variants={itemVariants}
                    className="glass-panel"
                    style={{
                        padding: '1.5rem', position: 'relative', overflow: 'hidden',
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)'
                    }}
                >
                    <div style={{ position: 'absolute', top: 0, right: 0, padding: '1rem', opacity: 0.1 }}>
                        <Trophy size={120} />
                    </div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1, color: 'white' }}>{profile.level}</span>
                            <span style={{ fontSize: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Level</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{profile.aura} Aura</span>
                                <button onClick={() => setShowLevelInfo(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                                    <Info size={14} />
                                </button>
                            </div>
                            <span style={{ color: 'var(--text-muted)' }}>{xpToNextLevel} Next</span>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.3)', height: '12px', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <motion.div
                                style={{ background: 'linear-gradient(90deg, var(--accent) 0%, #F59E0B 100%)', height: '100%', width: `${xpProgress}%`, boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)' }}
                                initial={{ width: 0 }}
                                animate={{ width: `${xpProgress}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* 3. Water Tracker (NEW) */}
                <motion.div
                    variants={itemVariants}
                    className="glass-panel"
                    style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.02) 100%)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60A5FA' }}>
                            <Droplets size={20} fill="#60A5FA" />
                            <span style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase' }}>Hydration</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>{waterIntake}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}> / {WATER_GOAL}ml</span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                        <motion.div
                            style={{ height: '100%', background: '#60A5FA', borderRadius: '4px' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((waterIntake / WATER_GOAL) * 100, 100)}%` }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            onClick={() => handleAddWater(250)}
                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60A5FA', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                        >
                            <Plus size={16} /> 250ml
                        </button>
                        <button
                            onClick={() => handleAddWater(500)}
                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60A5FA', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                        >
                            <Plus size={16} /> 500ml
                        </button>
                    </div>
                </motion.div>

                {/* 4. Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                            <Activity size={18} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Current</span>
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                            {profile.currentWeight} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>kg</span>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                            <TrendingDown size={18} color={totalLost >= 0 ? 'var(--primary)' : 'var(--danger)'} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Lost</span>
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: totalLost >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
                            {totalLost > 0 ? '-' : '+'}{Math.abs(totalLost).toFixed(1)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>kg</span>
                        </div>
                    </motion.div>

                    {stats && (
                        <>
                            <motion.div
                                variants={itemVariants}
                                className="glass-panel"
                                style={{ padding: '1.25rem', cursor: 'pointer' }}
                                onClick={() => setShowHealthModal(true)}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                                    <Scale size={18} color="var(--secondary)" />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>BMI</span>
                                </div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.bmi}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stats.bmiCategory}</div>
                            </motion.div>

                            <motion.div
                                variants={itemVariants}
                                className="glass-panel"
                                style={{ padding: '1.25rem', cursor: 'pointer' }}
                                onClick={() => setShowHealthModal(true)}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                                    <Flame size={18} color="var(--accent)" />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>BMR</span>
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.bmr}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Maint: {stats.tdee}</div>
                            </motion.div>
                        </>
                    )}
                </div>
            </motion.div>

            {/* FAB */}
            <motion.button
                initial={{ scale: 0 }} animate={{ scale: 1 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => setShowLogModal(true)}
                style={{
                    position: 'fixed', bottom: '6rem', right: '2rem', width: '64px', height: '64px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 15px var(--primary-glow)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 50
                }}
            >
                <Plus size={32} color="white" />
            </motion.button>

            {/* Log Weight Modal */}
            <AnimatePresence>
                {showLogModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(5px)' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-panel"
                            style={{ padding: '2rem', width: '90%', maxWidth: '400px', position: 'relative' }}
                        >
                            <button onClick={() => setShowLogModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Log Today's Weight</h2>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Weight (kg)</label>
                                <input type="number" placeholder="0.0" value={newWeight} onChange={e => setNewWeight(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '1rem', color: 'white', fontSize: '1.5rem', fontWeight: 'bold', outline: 'none' }} autoFocus />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Note</label>
                                <textarea placeholder="How are you feeling?" value={note} onChange={e => setNote(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '1rem', color: 'white', fontSize: '1rem', outline: 'none', resize: 'none', height: '100px' }} />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Progress Photo (Optional)</label>
                                <div onClick={() => document.getElementById('photo-upload')?.click()} style={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '8px', padding: '1rem', textAlign: 'center', cursor: 'pointer', background: previewUrl ? `url(${previewUrl}) center/cover no-repeat` : 'rgba(255,255,255,0.02)', height: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                                    {!previewUrl && (
                                        <>
                                            <Camera size={32} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Tap to take photo</span>
                                        </>
                                    )}
                                </div>
                                <input id="photo-upload" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                            </div>
                            <button onClick={handleLogWeight} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Save Entry</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Health Stats Modal */}
            <AnimatePresence>
                {showHealthModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-panel"
                            style={{ width: '90%', maxWidth: '500px', padding: '2rem', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}
                        >
                            <button onClick={() => setShowHealthModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Calorie Calculator</h2>

                            {stats && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Maintenance (TDEE)</div>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>{stats.tdee} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', marginLeft: '0.5rem', fontWeight: 500 }}>kcal/day</span></div>
                                    </div>

                                    {/* Deficit Selector */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 600 }}>Select Your Deficit</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                            {[
                                                { label: 'Mild', value: 250, desc: '0.25kg/week' },
                                                { label: 'Moderate', value: 500, desc: '0.5kg/week' },
                                                { label: 'Aggressive', value: 750, desc: '0.75kg/week' },
                                                { label: 'Extreme', value: 1000, desc: '1kg/week' }
                                            ].map(option => {
                                                const isSelected = calorieDeficit === option.value;
                                                return (
                                                    <motion.button
                                                        key={option.value}
                                                        onClick={() => setCalorieDeficit(option.value)}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        style={{
                                                            padding: '1rem', borderRadius: '8px',
                                                            background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                                                            border: isSelected ? '2px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                                                            cursor: 'pointer', textAlign: 'left'
                                                        }}
                                                    >
                                                        <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem', color: isSelected ? '#10B981' : 'white' }}>{option.label}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>-{option.value} kcal</div>
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                        <div style={{ fontSize: '0.875rem', color: '#10B981', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Daily Target</div>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>{stats.tdee - calorieDeficit} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', marginLeft: '0.5rem', fontWeight: 500 }}>kcal/day</span></div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Level Info Modal */}
            <AnimatePresence>
                {showLevelInfo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-panel"
                            style={{ width: '90%', maxWidth: '400px', padding: '2rem' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>Aura System</h2>
                                <button onClick={() => setShowLevelInfo(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
                            </div>

                            <p style={{ color: 'white', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                                <strong>Aura</strong> is your fitness experience (XP). Earn it by staying consistent and disciplined.
                                <br /><br />
                                <strong>Level Up:</strong> Every <strong>1,000 Aura</strong> increases your Level.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {xpData && (
                    <XPOverlay
                        xpGained={xpData.xp}
                        bonuses={xpData.bonuses}
                        leveledUp={xpData.leveledUp}
                        newLevel={xpData.newLevel}
                        onClose={() => {
                            setXpData(null);
                            loadData();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

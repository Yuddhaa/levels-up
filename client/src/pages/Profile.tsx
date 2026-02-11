import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Ruler, Weight, Calendar, LogOut, Activity, Edit2, Save, X, Check } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';

export const Profile: React.FC = () => {
    const { user, login, logout } = useAuth();
    const { showToast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                height: user.height,
                startWeight: user.startWeight,
                currentWeight: user.currentWeight,
                targetWeight: user.targetWeight,
                age: user.age,
                gender: user.gender
            });
        }
    }, [user]);

    if (!user) return <div className="layout-container">Loading...</div>;

    const handleSave = async () => {
        setLoading(true);
        try {
            const updatedProfile = {
                ...user,
                ...formData,
                height: Number(formData.height),
                startWeight: Number(formData.startWeight),
                currentWeight: Number(formData.currentWeight),
                targetWeight: Number(formData.targetWeight),
                age: Number(formData.age),
            };

            await api.saveProfile(updatedProfile);

            // Update local context
            // We re-login with the same token but updated user object to refresh context
            login(localStorage.getItem('token') || '', updatedProfile);

            showToast('Profile updated!', 'success');
            setIsEditing(false);
        } catch (err) {
            console.error(err);
            showToast('Failed to save profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const StatRow = ({ icon: Icon, label, name, value, unit }: { icon: any, label: string, name: string, value: string | number, unit?: string }) => (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 0',
            borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                    padding: '0.5rem',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'var(--text-muted)'
                }}>
                    <Icon size={18} />
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{label}</span>
            </div>

            {isEditing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                        type={name === 'gender' || name === 'name' ? 'text' : 'number'}
                        value={formData[name]}
                        onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '6px',
                            padding: '0.25rem 0.5rem',
                            color: 'white',
                            width: '100px',
                            textAlign: 'right',
                            fontSize: '1rem'
                        }}
                    />
                    {unit && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{unit}</span>}
                </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{value}</span>
                    {unit && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{unit}</span>}
                </div>
            )}
        </div>
    );

    return (
        <div className="layout-container" style={{ paddingBottom: '6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>Profile</h1>
                <button
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    style={{
                        background: isEditing ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white'
                    }}
                >
                    {isEditing ? <Check size={20} /> : <Edit2 size={20} />}
                </button>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
            >
                {/* Identity Card */}
                <motion.div
                    variants={itemVariants}
                    className="glass-panel"
                    style={{
                        padding: '2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: '1rem',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '80px',
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)',
                        zIndex: 0
                    }} />

                    <div style={{
                        width: '100px', height: '100px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 1,
                        border: '4px solid rgba(255,255,255,0.1)'
                    }}>
                        <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>
                            {user.name.charAt(0).toUpperCase()}
                        </span>
                    </div>

                    <div style={{ zIndex: 1, width: '100%' }}>
                        {isEditing ? (
                            <input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '6px',
                                    padding: '0.5rem',
                                    color: 'white',
                                    textAlign: 'center',
                                    fontSize: '1.5rem',
                                    fontWeight: 700,
                                    width: '100%'
                                }}
                            />
                        ) : (
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>{user.name}</h2>
                        )}

                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.25rem 0.75rem', background: 'rgba(255,255,255,0.05)',
                            borderRadius: '20px', fontSize: '0.875rem', color: 'var(--primary)',
                            marginTop: '0.5rem'
                        }}>
                            <span>Level {user.level || 1}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Physical Stats */}
                <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '0 1.5rem' }}>
                    <div style={{ padding: '1.5rem 0 0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Physical Stats</h3>
                    </div>
                    <div>
                        <StatRow icon={Ruler} label="Height" name="height" value={user.height} unit="cm" />
                        <StatRow icon={Weight} label="Starting Weight" name="startWeight" value={user.startWeight} unit="kg" />
                        <StatRow icon={Activity} label="Current Weight" name="currentWeight" value={user.currentWeight} unit="kg" />
                        <StatRow icon={User} label="Goal Weight" name="targetWeight" value={user.targetWeight} unit="kg" />
                    </div>
                </motion.div>

                {/* Personal Details */}
                <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '0 1.5rem' }}>
                    <div style={{ padding: '1.5rem 0 0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Personal Details</h3>
                    </div>
                    <div>
                        <StatRow icon={Calendar} label="Age" name="age" value={user.age || '-'} unit="years" />
                        <StatRow icon={User} label="Gender" name="gender" value={user.gender ? (user.gender.charAt(0).toUpperCase() + user.gender.slice(1)) : '-'} />
                    </div>
                </motion.div>

                {/* Actions */}
                <AnimatePresence>
                    {isEditing && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ display: 'flex', gap: '1rem' }}
                        >
                            <button
                                onClick={() => setIsEditing(false)}
                                style={{
                                    flex: 1, padding: '1rem',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none', borderRadius: '12px',
                                    color: 'white', fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                style={{
                                    flex: 1, padding: '1rem',
                                    background: 'var(--primary)',
                                    border: 'none', borderRadius: '12px',
                                    color: 'white', fontWeight: 600, cursor: 'pointer',
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!isEditing && (
                    <motion.div variants={itemVariants}>
                        <button
                            style={{
                                width: '100%', padding: '1.25rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: 'var(--danger)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '16px',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '0.75rem', fontWeight: 600, fontSize: '1rem'
                            }}
                            onClick={logout}
                        >
                            <LogOut size={20} />
                            <span>Sign Out</span>
                        </button>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

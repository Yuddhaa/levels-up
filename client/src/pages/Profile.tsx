import React from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Ruler, Weight, Calendar, LogOut, Activity } from 'lucide-react';

export const Profile: React.FC = () => {
    const { user, logout } = useAuth();

    if (!user) return <div className="layout-container">Loading...</div>;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const StatRow = ({ icon: Icon, label, value, unit }: { icon: any, label: string, value: string | number, unit?: string }) => (
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
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{value}</span>
                {unit && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{unit}</span>}
            </div>
        </div>
    );

    return (
        <div className="layout-container" style={{ paddingBottom: '6rem' }}>
            <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '1.5rem', fontWeight: 800 }}>Profile</h1>

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
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '80px',
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)',
                        zIndex: 0
                    }} />

                    <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        zIndex: 1,
                        border: '4px solid rgba(255,255,255,0.1)'
                    }}>
                        <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>
                            {user.name.charAt(0).toUpperCase()}
                        </span>
                    </div>

                    <div style={{ zIndex: 1 }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>{user.name}</h2>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.25rem 0.75rem',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '20px',
                            fontSize: '0.875rem',
                            color: 'var(--primary)'
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
                        <StatRow icon={Ruler} label="Height" value={user.height} unit="cm" />
                        <StatRow icon={Weight} label="Starting Weight" value={user.startWeight} unit="kg" />
                        <StatRow icon={Activity} label="Current Weight" value={user.currentWeight} unit="kg" />
                        <StatRow icon={User} label="Goal Weight" value={user.targetWeight} unit="kg" />
                    </div>
                </motion.div>

                {/* Personal Details */}
                <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '0 1.5rem' }}>
                    <div style={{ padding: '1.5rem 0 0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Personal Details</h3>
                    </div>
                    <div>
                        <StatRow icon={Calendar} label="Age" value={user.age || '-'} unit="years" />
                        <StatRow icon={User} label="Gender" value={user.gender ? (user.gender.charAt(0).toUpperCase() + user.gender.slice(1)) : '-'} />
                        {/* We could add Email here if available in user object */}
                    </div>
                </motion.div>

                {/* Actions */}
                <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button
                        style={{
                            width: '100%',
                            padding: '1.25rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: 'var(--danger)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            fontWeight: 600,
                            fontSize: '1rem',
                            transition: 'all 0.2s ease'
                        }}
                        onClick={logout}
                    >
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>

                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>
                        Level Up Fitness v2.0.0
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

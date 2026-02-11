import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, History, Sparkles, Shield, Flame, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { LogModal } from './LogModal';

export const Layout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);

    // Replaced Profile with Calories in the bottom nav
    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'Home' },
        { path: '/calories', icon: Flame, label: 'Calories' },
        { path: '/discipline', icon: Shield, label: 'Discipline' },
        { path: '/routine', icon: Sparkles, label: 'Routine' },
        { path: '/history', icon: History, label: 'History' },
    ];

    return (
        <>
            {/* Top Header with Profile Avatar */}
            <header style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '60px',
                padding: '0 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(10px)',
                zIndex: 50,
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', background: 'linear-gradient(to right, #4ade80, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    LEVEL UP
                </div>

                <button
                    onClick={() => navigate('/profile')}
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 10px rgba(99, 102, 241, 0.3)',
                        padding: 0
                    }}
                >
                    <User size={20} color="white" />
                </button>
            </header>

            {/* Main Content Area - Added padding top for header and bottom for nav */}
            <div className="layout-container" style={{ paddingTop: '70px', paddingBottom: '90px' }}>
                <Outlet />
            </div>

            <LogModal
                isOpen={isLogModalOpen}
                onClose={() => setIsLogModalOpen(false)}
                onSuccess={() => {
                    // Refresh data if needed
                    window.dispatchEvent(new Event('log-added'));
                }}
            />

            <nav style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(16px)',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                padding: '0.75rem 1rem',
                paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                zIndex: 50,
                margin: '0 auto'
            }}>
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            style={{
                                background: 'none',
                                border: 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.25rem',
                                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                position: 'relative',
                                padding: '0.5rem',
                                touchAction: 'manipulation',
                                flex: 1,
                                minWidth: '60px'
                            }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="nav-glow"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    style={{
                                        position: 'absolute',
                                        inset: '0',
                                        background: 'var(--primary-glow)',
                                        opacity: 0.15,
                                        borderRadius: '12px',
                                        zIndex: -1
                                    }}
                                />
                            )}
                            <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span style={{ fontSize: '0.7rem', fontWeight: isActive ? 600 : 500 }}>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </>
    );
};

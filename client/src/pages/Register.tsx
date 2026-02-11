import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { motion } from 'framer-motion';
import { useToast } from '../components/Toast';
import { useNavigate, Link } from 'react-router-dom';

export const Register: React.FC = () => {
    const { login } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        name: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            showToast("Passwords don't match", 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await api.register({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                name: formData.name
            });
            login(res.token, res.user);
            showToast('Welcome to Level Up!', 'success');
            navigate('/');
        } catch (err: any) {
            showToast(err.message || 'Registration failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%', padding: '0.75rem', borderRadius: '8px',
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
        color: 'white', fontSize: '1rem'
    };

    const labelStyle = {
        display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)'
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel"
                style={{ padding: '2.5rem', width: '100%', maxWidth: '400px' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Join Level Up</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Start your fitness RPG today</p>
                </div>

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Full Name</label>
                        <input name="name" type="text" value={formData.name} onChange={handleChange} required style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Username</label>
                        <input name="username" type="text" value={formData.username} onChange={handleChange} required style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Email</label>
                        <input name="email" type="email" value={formData.email} onChange={handleChange} required style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Password</label>
                        <input name="password" type="password" value={formData.password} onChange={handleChange} required style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Confirm Password</label>
                        <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required style={inputStyle} />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', marginTop: '1rem', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
                </div>
            </motion.div>
        </div>
    );
};

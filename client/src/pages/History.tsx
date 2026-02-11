import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, History as HistoryIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface WeightLog {
    id: number;
    weight: number;
    date: string;
    note?: string;
    photo_url?: string;
}

export const History: React.FC = () => {
    const [logs, setLogs] = useState<WeightLog[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        const data = await api.getWeightLogs();
        if (data && Array.isArray(data)) {
            // Sort by date descending for list
            setLogs(data.sort((a: WeightLog, b: WeightLog) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
        window.addEventListener('log-added', loadData);
        return () => window.removeEventListener('log-added', loadData);
    }, []);

    // Prepare data for chart (needs to be ascending by date)
    const chartData = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(log => ({
        date: new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        weight: log.weight
    }));

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

    return (
        <div className="layout-container" style={{ paddingBottom: '6rem' }}>
            <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '1.5rem', fontWeight: 800 }}>Progress History</h1>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading history...</div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                >
                    {/* Graph Section */}
                    {logs.length > 1 && (
                        <motion.div
                            variants={itemVariants}
                            className="glass-panel"
                            style={{ padding: '1.5rem', height: '300px' }}
                        >
                            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>Weight Trend</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="var(--text-muted)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="var(--text-muted)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        domain={['auto', 'auto']}
                                        unit="kg"
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            color: 'white'
                                        }}
                                        itemStyle={{ color: 'var(--primary)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="weight"
                                        stroke="var(--primary)"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorWeight)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </motion.div>
                    )}

                    {/* Logs List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginLeft: '0.5rem' }}>Recent Logs</h3>

                        {logs.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                color: 'var(--text-muted)',
                                padding: '4rem 2rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                                <HistoryIcon size={48} style={{ opacity: 0.2 }} />
                                <p>No logs yet. Tap the + button to start tracking!</p>
                            </div>
                        ) : (
                            logs.map((log, index) => {
                                const prevLog = logs[index + 1];
                                const diff = prevLog ? log.weight - prevLog.weight : 0;

                                return (
                                    <motion.div
                                        key={log.id}
                                        variants={itemVariants}
                                        className="glass-panel"
                                        style={{
                                            padding: '1rem',
                                            display: 'grid',
                                            gridTemplateColumns: 'auto 1fr auto',
                                            gap: '1rem',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {/* Date Box */}
                                        <div style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            padding: '0.75rem',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            minWidth: '60px',
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                                {new Date(log.date).toLocaleDateString(undefined, { month: 'short' })}
                                            </span>
                                            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                                {new Date(log.date).getDate()}
                                            </span>
                                        </div>

                                        {/* Content */}
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{log.weight}</span>
                                                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>kg</span>
                                            </div>
                                            {log.note && (
                                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                                    {log.note}
                                                </p>
                                            )}
                                        </div>

                                        {/* Right Side: Photo & Trend */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                            {log.photo_url && (
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    cursor: 'pointer'
                                                }}
                                                    onClick={() => window.open(`http://localhost:3000${log.photo_url}`, '_blank')}
                                                >
                                                    <img
                                                        src={`http://localhost:3000${log.photo_url}`}
                                                        alt="Progress"
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                </div>
                                            )}

                                            {index < logs.length - 1 && (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    color: diff > 0 ? 'var(--danger)' : diff < 0 ? 'var(--primary)' : 'var(--text-muted)',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 600,
                                                    background: diff > 0 ? 'rgba(239, 68, 68, 0.1)' : diff < 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '4px'
                                                }}>
                                                    {diff > 0 ? <TrendingUp size={14} /> : diff < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                                                    {Math.abs(diff).toFixed(1)}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

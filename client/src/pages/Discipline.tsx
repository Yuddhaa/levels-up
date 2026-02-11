import React, { useState, useEffect } from 'react';
import { storage, type DisciplineHabit } from '../lib/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { XPOverlay } from '../components/XPOverlay';

export const Discipline: React.FC = () => {
    const [habits, setHabits] = useState<DisciplineHabit[]>([]);
    const [logs, setLogs] = useState<Record<string, string[]>>({});
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showAddModal, setShowAddModal] = useState(false);
    const [newHabitTitle, setNewHabitTitle] = useState('');
    const [xpData, setXpData] = useState<{ xp: number, bonuses: string[], leveledUp: boolean, newLevel: number } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const h = await storage.getDisciplineHabits();
        setHabits(h);
        const l = await storage.getDisciplineLogs();
        setLogs(l);
    };

    const toggleHabitForToday = async (habitId: string) => {
        const today = new Date().toISOString().split('T')[0];
        const todayLogs = logs[today] || [];
        const newLogs = todayLogs.includes(habitId)
            ? todayLogs.filter(id => id !== habitId)
            : [...todayLogs, habitId];

        const updatedLogs = { ...logs, [today]: newLogs };
        setLogs(updatedLogs);
        await storage.saveDisciplineLog(today, newLogs);

        // Award XP if checking (not unchecking)
        if (!todayLogs.includes(habitId)) {
            const res = await api.awardXP({ amount: 15, reason: 'Discipline Habit Completed' });
            if (res && res.status === 'success') {
                setXpData({
                    xp: res.xpGained,
                    bonuses: res.bonuses,
                    leveledUp: res.leveledUp,
                    newLevel: res.newLevel
                });
            }
        }
    };

    const addHabit = async () => {
        if (!newHabitTitle.trim()) return;
        const newHabit: DisciplineHabit = {
            id: crypto.randomUUID(),
            title: newHabitTitle,
            isActive: true
        };
        const newHabits = [...habits, newHabit];
        setHabits(newHabits);
        await storage.saveDisciplineHabits(newHabits);
        setNewHabitTitle('');
        setShowAddModal(false);
    };

    const deleteHabit = async (id: string) => {
        if (confirm('Delete this habit?')) {
            const newHabits = habits.filter(h => h.id !== id);
            setHabits(newHabits);
            await storage.saveDisciplineHabits(newHabits);
        }
    };

    // Calendar Logic
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days: daysInMonth, firstDay } = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const getCompletionPercentage = (dateStr: string) => {
        const completedCount = (logs[dateStr] || []).length;
        if (habits.length === 0) return 0;
        return Math.round((completedCount / habits.length) * 100);
    };

    const todayStr = new Date().toISOString().split('T')[0];

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-body)' }}>
            {/* Fixed Top Section */}
            <div style={{ padding: '2rem 1.5rem 0 1.5rem', flexShrink: 0, zIndex: 10 }}>
                <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem' }}>Discipline</h1>

                {/* Monthly Consistency Calendar */}
                <section style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Consistency</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
                            <span style={{ fontWeight: 600, minWidth: '100px', textAlign: 'center' }}>{monthName}</span>
                            <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><ChevronRight size={20} /></button>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                                <div key={d} style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{d}</div>
                            ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                            {Array.from({ length: firstDay }).map((_, i) => (
                                <div key={`empty-${i}`} />
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const percentage = getCompletionPercentage(dateStr);
                                const isToday = dateStr === todayStr;

                                return (
                                    <div key={day} style={{ aspectRatio: '1', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="rgba(255,255,255,0.1)"
                                                strokeWidth="3"
                                            />
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="var(--primary)"
                                                strokeWidth="3"
                                                strokeDasharray={`${percentage}, 100`}
                                                style={{ transition: 'stroke-dasharray 0.5s ease' }}
                                            />
                                        </svg>
                                        <span style={{ position: 'absolute', fontSize: '0.8rem', fontWeight: isToday ? 700 : 400, color: isToday ? 'var(--primary)' : 'var(--text-muted)' }}>{day}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </div>

            {/* Scrollable Goals Section */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.5rem 6rem 1.5rem' }}>
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', position: 'sticky', top: 0, background: 'var(--bg-body)', zIndex: 5, padding: '1rem 0' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Daily Protocol</h2>
                        <button
                            onClick={() => setShowAddModal(true)}
                            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {habits.map(habit => {
                            const isCompleted = (logs[todayStr] || []).includes(habit.id);
                            return (
                                <motion.div
                                    key={habit.id}
                                    layout
                                    className="glass-panel"
                                    style={{
                                        padding: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        background: isCompleted ? 'rgba(16, 185, 129, 0.1)' : undefined,
                                        border: isCompleted ? '1px solid rgba(16, 185, 129, 0.3)' : undefined
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }} onClick={() => toggleHabitForToday(habit.id)}>
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '6px',
                                            border: isCompleted ? 'none' : '2px solid var(--text-muted)',
                                            background: isCompleted ? 'var(--primary)' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}>
                                            {isCompleted && <Check size={16} color="#0f172a" strokeWidth={3} />}
                                        </div>
                                        <span style={{
                                            fontWeight: 600,
                                            textDecoration: isCompleted ? 'line-through' : 'none',
                                            color: isCompleted ? 'var(--text-muted)' : 'white'
                                        }}>
                                            {habit.title}
                                        </span>
                                    </div>
                                    <button onClick={() => deleteHabit(habit.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', opacity: 0.5, cursor: 'pointer' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </motion.div>
                            );
                        })}
                        {habits.length === 0 && (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                                No habits defined. Add one to start building discipline.
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Add Habit Modal */}
            <AnimatePresence>
                {showAddModal && (
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
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Add Habit</h2>
                                <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
                            </div>

                            <input
                                type="text"
                                value={newHabitTitle}
                                onChange={e => setNewHabitTitle(e.target.value)}
                                placeholder="e.g. No Junk Food"
                                className="input-field"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', marginBottom: '1rem' }}
                                autoFocus
                            />

                            <button
                                onClick={addHabit}
                                className="btn-primary"
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                Add to Protocol
                            </button>
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
                        onClose={() => setXpData(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

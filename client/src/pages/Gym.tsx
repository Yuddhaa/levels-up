import React, { useState, useEffect } from 'react';
import { storage, type GymRoutineItem, type GymLog } from '../lib/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Plus, Trash2, Edit2, ChevronDown, X, Calendar } from 'lucide-react';

export const Gym: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');
    const [routines, setRoutines] = useState<GymRoutineItem[]>([]);
    const [logs, setLogs] = useState<GymLog[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingItem, setEditingItem] = useState<GymRoutineItem | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<GymRoutineItem>>({
        targetSets: 3,
        targetReps: '10',
        dayOfWeek: new Date().getDay()
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        console.log('Gym logs loaded:', logs);
    }, [logs]);

    const loadData = async () => {
        const r = await storage.getGymRoutines();
        setRoutines(r);
        const l = await storage.getGymLogs();
        setLogs(l);
    };

    const saveRoutineItem = async () => {
        if (!formData.exerciseName) return;

        const newItem: GymRoutineItem = {
            id: editingItem ? editingItem.id : crypto.randomUUID(),
            exerciseName: formData.exerciseName!,
            targetSets: formData.targetSets || 3,
            targetReps: formData.targetReps || '10',
            targetWeight: formData.targetWeight,
            dayOfWeek: formData.dayOfWeek !== undefined ? formData.dayOfWeek : new Date().getDay(),
            notes: formData.notes
        };

        const newRoutines = editingItem
            ? routines.map(r => r.id === editingItem.id ? newItem : r)
            : [...routines, newItem];

        setRoutines(newRoutines);
        await storage.saveGymRoutines(newRoutines);
        setShowAddModal(false);
        setEditingItem(null);
        setFormData({ targetSets: 3, targetReps: '10', dayOfWeek: new Date().getDay() });
    };

    const deleteRoutineItem = async (id: string) => {
        if (confirm('Delete this exercise?')) {
            const newRoutines = routines.filter(r => r.id !== id);
            setRoutines(newRoutines);
            await storage.saveGymRoutines(newRoutines);
        }
    };

    const openEditModal = (item: GymRoutineItem) => {
        setEditingItem(item);
        setFormData(item);
        setShowAddModal(true);
    };

    const today = new Date().getDay();
    const todaysExercises = routines.filter(r => r.dayOfWeek === today);

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
        <div className="layout-container" style={{ paddingBottom: '6rem' }}>
            <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Gym Plan</h1>

            <div style={{ display: 'flex', gap: '2rem', position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '2rem' }}>
                {['daily', 'weekly'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as 'daily' | 'weekly')}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '0.5rem 0',
                            color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            position: 'relative',
                            textTransform: 'capitalize'
                        }}
                    >
                        {tab === 'daily' ? "Today's Workout" : 'Weekly Split'}
                        {activeTab === tab && (
                            <motion.div
                                layoutId="activeTabGym"
                                style={{
                                    position: 'absolute',
                                    bottom: '-0.5rem',
                                    left: 0,
                                    right: 0,
                                    height: '2px',
                                    background: 'var(--primary)',
                                    boxShadow: '0 0 8px var(--primary-glow)'
                                }}
                            />
                        )}
                    </button>
                ))}
            </div>

            {activeTab === 'daily' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                        <Calendar size={18} />
                        <span style={{ fontWeight: 600 }}>{days[today]}</span>
                    </div>

                    {todaysExercises.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                            <Dumbbell size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p>Rest day! No exercises scheduled for today.</p>
                            <button
                                onClick={() => setActiveTab('weekly')}
                                style={{ marginTop: '1rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                            >
                                Configure Weekly Split
                            </button>
                        </div>
                    ) : (
                        todaysExercises.map(exercise => (
                            <div key={exercise.id} className="glass-panel" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{exercise.exerciseName}</h3>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                                            Target: {exercise.targetSets} sets × {exercise.targetReps} reps
                                            {exercise.targetWeight && ` @ ${exercise.targetWeight}kg`}
                                        </div>
                                    </div>
                                    <button style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        background: 'var(--primary)',
                                        color: '#0f172a',
                                        border: 'none',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}>
                                        Log Set
                                    </button>
                                </div>
                                {/* Placeholder for logged sets - to be implemented fully next step */}
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    No sets logged yet.
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {days.map((day, index) => {
                        const exercisesForDay = routines.filter(r => r.dayOfWeek === index);
                        return (
                            <div key={day}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: index === today ? 'var(--primary)' : 'white' }}>
                                    {day} {index === today && '(Today)'}
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {exercisesForDay.length === 0 && (
                                        <div style={{ padding: '1rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            Rest Day
                                        </div>
                                    )}
                                    {exercisesForDay.map(item => (
                                        <div key={item.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{item.exerciseName}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    {item.targetSets} sets × {item.targetReps} reps
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => openEditModal(item)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Edit2 size={18} /></button>
                                                <button onClick={() => deleteRoutineItem(item.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => {
                                            setEditingItem(null);
                                            setFormData({ targetSets: 3, targetReps: '10', dayOfWeek: index });
                                            setShowAddModal(true);
                                        }}
                                        style={{
                                            marginTop: '0.5rem',
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px dashed rgba(255,255,255,0.1)',
                                            background: 'transparent',
                                            color: 'var(--text-muted)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        <Plus size={16} /> Add Exercise
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add/Edit Modal */}
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
                            style={{ width: '90%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{editingItem ? 'Edit Exercise' : 'Add Exercise'}</h2>
                                <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Exercise Name</label>
                                    <input
                                        type="text"
                                        value={formData.exerciseName || ''}
                                        onChange={e => setFormData({ ...formData, exerciseName: e.target.value })}
                                        placeholder="e.g. Bench Press"
                                        className="input-field"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                        autoFocus
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Target Sets</label>
                                        <input
                                            type="number"
                                            value={formData.targetSets}
                                            onChange={e => setFormData({ ...formData, targetSets: parseInt(e.target.value) })}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Target Reps</label>
                                        <input
                                            type="text"
                                            value={formData.targetReps}
                                            onChange={e => setFormData({ ...formData, targetReps: e.target.value })}
                                            placeholder="e.g. 8-12"
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Day of Week</label>
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            value={formData.dayOfWeek}
                                            onChange={e => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '8px',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                color: 'white',
                                                appearance: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {days.map((day, index) => (
                                                <option key={index} value={index} style={{ background: '#1e293b' }}>{day}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Notes (Optional)</label>
                                    <textarea
                                        value={formData.notes || ''}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="e.g. Focus on form"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', minHeight: '80px' }}
                                    />
                                </div>

                                <button
                                    onClick={saveRoutineItem}
                                    className="btn-primary"
                                    style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
                                >
                                    Save Exercise
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

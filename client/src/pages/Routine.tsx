import React, { useState, useEffect } from 'react';
import { storage, type RoutineItem, type DailyRoutineLog } from '../lib/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Plus, Check, Trash2, Edit2, Pill, Sparkles, Droplets, ChevronDown, ChevronUp, X } from 'lucide-react';
import { api } from '../lib/api';
import { XPOverlay } from '../components/XPOverlay';

export const Routine: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');
    const [routines, setRoutines] = useState<RoutineItem[]>([]);
    const [dailyLog, setDailyLog] = useState<DailyRoutineLog>({ date: new Date().toISOString().split('T')[0], completedItemIds: [] });
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingItem, setEditingItem] = useState<RoutineItem | null>(null);
    const [xpData, setXpData] = useState<{ xp: number, bonuses: string[], leveledUp: boolean, newLevel: number } | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<RoutineItem>>({
        type: 'skin',
        timeOfDay: 'morning',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const r = await storage.getRoutines();
        setRoutines(r);
        const today = new Date().toISOString().split('T')[0];
        const log = await storage.getDailyRoutineLog(today);
        if (log) {
            setDailyLog(log);
        } else {
            setDailyLog({ date: today, completedItemIds: [] });
        }
    };

    const toggleComplete = async (itemId: string) => {
        const newCompletedIds = dailyLog.completedItemIds.includes(itemId)
            ? dailyLog.completedItemIds.filter(id => id !== itemId)
            : [...dailyLog.completedItemIds, itemId];

        const newLog = { ...dailyLog, completedItemIds: newCompletedIds };
        setDailyLog(newLog);
        await storage.saveDailyRoutineLog(newLog);

        // Award XP if checking
        if (!dailyLog.completedItemIds.includes(itemId)) {
            const res = await api.awardXP(5, 'Routine Item Completed');
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

    const saveRoutineItem = async () => {
        if (!formData.title) return;

        const newItem: RoutineItem = {
            id: editingItem ? editingItem.id : crypto.randomUUID(),
            title: formData.title!,
            description: formData.description || '',
            type: formData.type as any,
            timeOfDay: formData.timeOfDay as any,
            dosage: formData.dosage || '',
            instructions: formData.instructions || '',
            daysOfWeek: formData.daysOfWeek || []
        };

        const newRoutines = editingItem
            ? routines.map(r => r.id === editingItem.id ? newItem : r)
            : [...routines, newItem];

        setRoutines(newRoutines);
        await storage.saveRoutines(newRoutines);
        setShowAddModal(false);
        setEditingItem(null);
        setFormData({ type: 'skin', timeOfDay: 'morning', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] });
    };

    const deleteRoutineItem = async (id: string) => {
        if (confirm('Delete this routine item?')) {
            const newRoutines = routines.filter(r => r.id !== id);
            setRoutines(newRoutines);
            await storage.saveRoutines(newRoutines);
        }
    };

    const openEditModal = (item: RoutineItem) => {
        setEditingItem(item);
        setFormData(item);
        setShowAddModal(true);
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'skin': return <Sparkles size={18} />;
            case 'hair': return <Droplets size={18} />;
            case 'supplement': return <Pill size={18} />;
            default: return <Check size={18} />;
        }
    };

    const today = new Date().getDay(); // 0 is Sunday
    const todaysRoutines = routines.filter(r => r.daysOfWeek.includes(today));

    const groupedRoutines = {
        morning: todaysRoutines.filter(r => r.timeOfDay === 'morning'),
        day: todaysRoutines.filter(r => r.timeOfDay === 'day'),
        evening: todaysRoutines.filter(r => r.timeOfDay === 'evening')
    };

    return (
        <div className="layout-container" style={{ paddingBottom: '6rem' }}>
            <h1 className="text-gradient" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Routine</h1>

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
                        {tab === 'daily' ? 'Daily Check' : 'Weekly Plan'}
                        {activeTab === tab && (
                            <motion.div
                                layoutId="activeTab"
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Morning Section */}
                    <section>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            <Sun size={16} color="#F59E0B" /> Morning
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {groupedRoutines.morning.length === 0 && <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>Nothing scheduled for this morning.</div>}
                            {groupedRoutines.morning.map(item => (
                                <RoutineCard key={item.id} item={item} isCompleted={dailyLog.completedItemIds.includes(item.id)} onToggle={() => toggleComplete(item.id)} getIcon={getIconForType} />
                            ))}
                        </div>
                    </section>

                    {/* Day Section */}
                    <section>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            <Sun size={16} color="#3B82F6" /> Day
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {groupedRoutines.day.length === 0 && <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>Nothing scheduled for the day.</div>}
                            {groupedRoutines.day.map(item => (
                                <RoutineCard key={item.id} item={item} isCompleted={dailyLog.completedItemIds.includes(item.id)} onToggle={() => toggleComplete(item.id)} getIcon={getIconForType} />
                            ))}
                        </div>
                    </section>

                    {/* Evening Section */}
                    <section>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            <Moon size={16} color="#8B5CF6" /> Evening
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {groupedRoutines.evening.length === 0 && <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>Nothing scheduled for this evening.</div>}
                            {groupedRoutines.evening.map(item => (
                                <RoutineCard key={item.id} item={item} isCompleted={dailyLog.completedItemIds.includes(item.id)} onToggle={() => toggleComplete(item.id)} getIcon={getIconForType} />
                            ))}
                        </div>
                    </section>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {routines.map(item => (
                        <div key={item.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    padding: '0.75rem',
                                    borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'var(--primary)'
                                }}>
                                    {getIconForType(item.type)}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{item.title}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <span style={{ textTransform: 'capitalize' }}>{item.timeOfDay}</span>
                                        <span>•</span>
                                        <span style={{ textTransform: 'capitalize' }}>{item.type}</span>
                                    </div>
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
                            setFormData({ type: 'skin', timeOfDay: 'morning', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] });
                            setShowAddModal(true);
                        }}
                        style={{
                            marginTop: '1rem',
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '12px',
                            border: '2px dashed rgba(255,255,255,0.1)',
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            fontWeight: 600
                        }}
                    >
                        <Plus size={20} /> Add New Routine Item
                    </button>
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
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{editingItem ? 'Edit Routine' : 'Add Routine'}</h2>
                                <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Title</label>
                                    <input
                                        type="text"
                                        value={formData.title || ''}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. Vitamin C Serum"
                                        className="input-field"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Type</label>
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                value={formData.type}
                                                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
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
                                                <option value="skin" style={{ background: '#1e293b' }}>Skin Care</option>
                                                <option value="hair" style={{ background: '#1e293b' }}>Hair Care</option>
                                                <option value="supplement" style={{ background: '#1e293b' }}>Supplement</option>
                                                <option value="other" style={{ background: '#1e293b' }}>Other</option>
                                            </select>
                                            <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Time</label>
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                value={formData.timeOfDay}
                                                onChange={e => setFormData({ ...formData, timeOfDay: e.target.value as any })}
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
                                                <option value="morning" style={{ background: '#1e293b' }}>Morning</option>
                                                <option value="day" style={{ background: '#1e293b' }}>Day</option>
                                                <option value="evening" style={{ background: '#1e293b' }}>Evening</option>
                                            </select>
                                            <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Dosage / Amount (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.dosage || ''}
                                        onChange={e => setFormData({ ...formData, dosage: e.target.value })}
                                        placeholder="e.g. 1 tablet, 2 drops"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Instructions (Optional)</label>
                                    <textarea
                                        value={formData.instructions || ''}
                                        onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                                        placeholder="e.g. Apply on damp skin"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', minHeight: '80px' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Days of Week</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    const days = formData.daysOfWeek || [];
                                                    const newDays = days.includes(index)
                                                        ? days.filter(d => d !== index)
                                                        : [...days, index];
                                                    setFormData({ ...formData, daysOfWeek: newDays });
                                                }}
                                                style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '50%',
                                                    border: 'none',
                                                    background: formData.daysOfWeek?.includes(index) ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                    color: formData.daysOfWeek?.includes(index) ? '#0f172a' : 'var(--text-muted)',
                                                    fontWeight: 600,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={saveRoutineItem}
                                    className="btn-primary"
                                    style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
                                >
                                    Save Routine
                                </button>
                            </div>
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
        </div >
    );
};

const RoutineCard: React.FC<{ item: RoutineItem, isCompleted: boolean, onToggle: () => void, getIcon: (t: string) => any }> = ({ item, isCompleted, onToggle, getIcon }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <motion.div
            layout
            className="glass-panel"
            style={{
                padding: '0',
                overflow: 'hidden',
                border: isCompleted ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
                background: isCompleted ? 'rgba(16, 185, 129, 0.05)' : undefined
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', padding: '1rem' }}>
                <button
                    onClick={onToggle}
                    style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        border: isCompleted ? 'none' : '2px solid var(--text-muted)',
                        background: isCompleted ? 'var(--primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        marginRight: '1rem',
                        flexShrink: 0
                    }}
                >
                    {isCompleted && <Check size={16} color="#0f172a" strokeWidth={3} />}
                </button>

                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setIsExpanded(!isExpanded)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, textDecoration: isCompleted ? 'line-through' : 'none', color: isCompleted ? 'var(--text-muted)' : 'white' }}>
                            {item.title}
                        </span>
                        {item.dosage && (
                            <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                                {item.dosage}
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ color: 'var(--text-muted)' }}>
                        {getIcon(item.type)}
                    </div>
                    <button onClick={() => setIsExpanded(!isExpanded)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <div style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            {item.description && <p style={{ marginBottom: '0.5rem' }}>{item.description}</p>}
                            {item.instructions && (
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--accent)' }}>Usage:</span>
                                    <span>{item.instructions}</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

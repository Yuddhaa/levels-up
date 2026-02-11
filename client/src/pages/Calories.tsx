import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, ChevronLeft, ChevronRight, Flame, Droplets, Wheat, Zap, ChevronDown, ChevronUp, Trash2, Edit2, Copy, Star } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { api, type DailyNutritionStats, type FoodItem, type MealLog } from '../lib/api';
import { useToast } from '../components/Toast';
import { Skeleton } from '../components/Skeleton';

export const Calories: React.FC = () => {
    const { showToast } = useToast();

    // State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [stats, setStats] = useState<DailyNutritionStats | null>(null);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedMealType, setSelectedMealType] = useState('breakfast');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FoodItem[]>([]);

    // Favorites State
    const [favorites, setFavorites] = useState<FoodItem[]>([]);
    const [showFavorites, setShowFavorites] = useState(true); // Toggle between search/favorites

    // Edit / Quantity Logic
    const [selectedFoodDetails, setSelectedFoodDetails] = useState<FoodItem | null>(null);
    const [quantityInput, setQuantityInput] = useState<string>('100');
    const [editingLogId, setEditingLogId] = useState<number | null>(null);

    // New Food Form State
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newFood, setNewFood] = useState({
        name: '', calories: '', protein: '', carbs: '', fat: '', servingUnit: 'g', servingSize: '100'
    });

    const [expandedMeal, setExpandedMeal] = useState<string | null>('breakfast');

    useEffect(() => {
        loadData();
    }, [date]);

    useEffect(() => {
        if (showAddModal) {
            loadFavorites();
        }
    }, [showAddModal]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.length > 1) {
                setShowFavorites(false);
                performSearch();
            } else {
                setSearchResults([]);
                setShowFavorites(true);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await api.getDailyNutrition(date);
            setStats(data);

            // Auto expand logic (only on initial load or date change)
            const hour = new Date().getHours();
            if (hour < 11) setExpandedMeal('breakfast');
            else if (hour < 15) setExpandedMeal('lunch');
            else if (hour < 19) setExpandedMeal('dinner');
            else setExpandedMeal('snack');
        } catch (error) {
            showToast('Failed to load nutrition data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadFavorites = async () => {
        try {
            const favs = await api.getFavorites();
            setFavorites(favs);
        } catch (error) {
            console.error(error);
        }
    };

    const performSearch = async () => {
        try {
            const results = await api.searchFood(searchQuery);
            setSearchResults(results);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDateChange = (days: number) => {
        const currentDate = new Date(date);
        currentDate.setDate(currentDate.getDate() + days);
        setDate(currentDate.toISOString().split('T')[0]);
    };

    const handleSelectFood = (food: FoodItem) => {
        setSelectedFoodDetails(food);
        setQuantityInput(food.servingSize.toString());
        setEditingLogId(null);
    };

    const handleEditLog = async (log: MealLog) => {
        if (!log.foodItemId) {
            showToast("Cannot edit this log (missing food item link). Delete and re-log instead.", 'info');
            return;
        }
        try {
            const food = await api.getFoodItem(log.foodItemId);
            setSelectedFoodDetails(food);
            const prevQty = Math.round(log.servings * food.servingSize);
            setQuantityInput(prevQty.toString());
            setEditingLogId(log.id);
            setSelectedMealType(log.mealType);
            setShowAddModal(true);
        } catch (err) {
            showToast("Could not fetch details to edit.", 'error');
        }
    };

    const handleConfirmLog = async () => {
        if (!selectedFoodDetails) return;

        const qty = parseFloat(quantityInput);
        if (isNaN(qty) || qty <= 0) {
            showToast("Please enter a valid quantity", 'error');
            return;
        }

        const ratio = qty / selectedFoodDetails.servingSize;

        const payload = {
            date,
            mealType: selectedMealType,
            foodItemId: selectedFoodDetails.id,
            foodName: selectedFoodDetails.name,
            calories: Math.round(selectedFoodDetails.calories * ratio),
            protein: selectedFoodDetails.protein * ratio,
            carbs: selectedFoodDetails.carbs * ratio,
            fat: selectedFoodDetails.fat * ratio,
            servings: ratio
        };

        try {
            if (editingLogId) {
                await api.updateMealLog(editingLogId, payload);
                showToast("Meal updated", 'success');
            } else {
                await api.logMeal(payload);
                window.dispatchEvent(new Event('xp-awarded'));
                showToast("Meal logged", 'success');
            }
            setShowAddModal(false);
            setSearchQuery('');
            setSelectedFoodDetails(null);
            setEditingLogId(null);
            loadData();
        } catch (error) {
            showToast('Failed to save meal', 'error');
        }
    };

    const handleDeleteLog = async (id: number) => {
        // Using custom confirmation UI would be better, but for speed:
        if (!confirm('Are you sure you want to delete this log?')) return;
        try {
            await api.deleteMealLog(id);
            showToast("Meal deleted", 'success');
            loadData();
        } catch (error) {
            showToast('Failed to delete log', 'error');
        }
    };

    const handleCreateFood = async () => {
        // Validation
        if (!newFood.name.trim()) return showToast("Food name is required", 'error');
        if (!newFood.calories) return showToast("Calories are required", 'error');

        try {
            await api.createFood({
                name: newFood.name,
                calories: parseInt(newFood.calories) || 0,
                protein: parseFloat(newFood.protein) || 0,
                carbs: parseFloat(newFood.carbs) || 0,
                fat: parseFloat(newFood.fat) || 0,
                servingUnit: newFood.servingUnit || 'g',
                servingSize: parseFloat(newFood.servingSize) || 100
            });
            showToast("Food created", 'success');
            setShowCreateForm(false);
            setSearchQuery(newFood.name);
            // Trigger search
            setTimeout(() => {
                setSearchQuery(newFood.name);
                performSearch();
            }, 100);
        } catch (error) {
            showToast('Failed to create food', 'error');
        }
    };

    const handleToggleFavorite = async (e: React.MouseEvent, foodId: number) => {
        e.stopPropagation();
        const isFav = favorites.some(f => f.id === foodId);
        try {
            if (isFav) {
                await api.removeFavorite(foodId);
                setFavorites(prev => prev.filter(f => f.id !== foodId));
                showToast("Removed from favorites", 'success');
            } else {
                await api.addFavorite(foodId);
                loadFavorites(); // Refresh to ensure strict sync
                showToast("Added to favorites", 'success');
            }
        } catch (error) {
            showToast("Failed to update favorites", 'error');
        }
    };

    const handleCopyYesterday = async () => {
        if (!confirm(`Copy all meals from yesterday to today (${date})?`)) return;

        const yesterday = new Date(date);
        yesterday.setDate(yesterday.getDate() - 1);
        const fromDate = yesterday.toISOString().split('T')[0];

        try {
            const res = await api.copyMeals({
                from_date: fromDate,
                to_date: date
            });
            showToast(res.message, 'success');
            loadData();
        } catch (error) {
            showToast("Failed to copy meals", 'error');
        }
    };

    // --- Chart Logic ---
    const goalCals = stats?.goals?.calories || 2000;
    const currentCals = stats?.totalCalories || 0;
    const remainingCals = Math.max(0, goalCals - currentCals);

    const chartData = [
        { name: 'Consumed', value: currentCals, color: '#3b82f6' },
        { name: 'Remaining', value: remainingCals, color: 'rgba(255,255,255,0.1)' },
    ];
    if (currentCals > goalCals) {
        chartData[0].color = '#ef4444';
        chartData[1].value = 0;
    }

    // --- Components ---

    const MacroBar = ({ label, current, goal, color, icon: Icon }: { label: string, current: number, goal: number, color: string, icon: any }) => (
        <div style={{ padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icon size={14} color={color} /> {label}</span>
                <span style={{ color: 'white' }}>{Math.round(current)} / {goal}g</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((current / goal) * 100, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    style={{ height: '100%', background: color, borderRadius: '3px' }}
                />
            </div>
        </div>
    );

    const MealSection = ({ type, title }: { type: string, title: string }) => {
        const meals = stats?.logs.filter(l => l.mealType === type) || [];
        const sectionCals = meals.reduce((acc, curr) => acc + curr.calories, 0);
        const isExpanded = expandedMeal === type;

        return (
            <motion.div
                layout
                style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', marginBottom: '1rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}
            >
                <div
                    onClick={() => setExpandedMeal(isExpanded ? null : type)}
                    style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <div style={{ width: '4px', height: '24px', background: sectionCals > 0 ? '#3b82f6' : 'rgba(255,255,255,0.1)', borderRadius: '2px' }} />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{title}</h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.9rem', color: sectionCals > 0 ? 'white' : 'var(--text-muted)' }}>{sectionCals} kcal</span>
                        {isExpanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                    </div>
                </div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div style={{ padding: '0 1rem 1rem 1rem' }}>
                                {loading ? (
                                    <Skeleton height="60px" />
                                ) : meals.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)' }}>No meals logged</div>
                                ) : (
                                    meals.map(meal => (
                                        <div
                                            key={meal.id}
                                            onClick={(e) => { e.stopPropagation(); handleEditLog(meal); }}
                                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 500 }}>{meal.foodName}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                    <span style={{ color: '#3b82f6' }}>{Math.round(meal.protein)}p</span> •
                                                    <span style={{ color: '#10b981' }}> {Math.round(meal.carbs)}c</span> •
                                                    <span style={{ color: '#f59e0b' }}> {Math.round(meal.fat)}f</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ fontWeight: 600 }}>{meal.calories}</div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: '4px' }}>
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteLog(meal.id); }}
                                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                                                        className="hover:text-red-500"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedMealType(type); setShowAddModal(true); setEditingLogId(null); setSelectedFoodDetails(null); }}
                                    className="btn-primary"
                                    style={{ width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', borderRadius: '8px' }}
                                >
                                    <Plus size={18} /> Add Food
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    };

    return (
        <div className="layout-container" style={{ paddingBottom: '7rem', maxWidth: '600px', margin: '0 auto' }}>
            {/* Header / Date Nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '0 0.5rem' }}>
                <button onClick={() => handleDateChange(-1)} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', border: 'none', color: 'white' }}><ChevronLeft size={20} /></button>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {date === new Date().toISOString().split('T')[0] ? 'Today' : new Date(date).toLocaleDateString(undefined, { weekday: 'long' })}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                        onClick={handleCopyYesterday}
                        style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', border: 'none', color: 'white' }}
                        title="Copy Yesterday's Meals"
                    >
                        <Copy size={20} />
                    </button>
                    <button onClick={() => handleDateChange(1)} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', border: 'none', color: 'white' }}><ChevronRight size={20} /></button>
                </div>
            </div>

            {/* Stats Panel */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'linear-gradient(145deg, rgba(20,20,30,0.6) 0%, rgba(10,10,20,0.8) 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {loading ? (
                    <div>
                        <Skeleton height="130px" width="100%" borderRadius="12px" />
                        <div style={{ marginTop: '1rem' }}><Skeleton height="20px" width="100%" /></div>
                        <div style={{ marginTop: '0.5rem' }}><Skeleton height="20px" width="100%" /></div>
                        <div style={{ marginTop: '0.5rem' }}><Skeleton height="20px" width="100%" /></div>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
                            <div style={{ position: 'relative', width: '130px', height: '130px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            innerRadius={50}
                                            outerRadius={60}
                                            startAngle={90}
                                            endAngle={-270}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <Flame size={20} className="text-primary" style={{ marginBottom: '4px' }} />
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>{currentCals}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ {goalCals}</div>
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Remaining</div>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: remainingCals > 0 ? '#10b981' : '#ef4444' }}>
                                        {goalCals - currentCals} <span style={{ fontSize: '1rem', fontWeight: 400 }}>kcal</span>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    Goal: <span style={{ color: 'white' }}>{goalCals}</span>
                                </div>
                            </div>
                        </div>

                        <MacroBar label="Protein" current={stats?.totalProtein || 0} goal={stats?.goals?.protein || 150} color="#3b82f6" icon={Droplets} />
                        <MacroBar label="Carbs" current={stats?.totalCarbs || 0} goal={stats?.goals?.carbs || 250} color="#10b981" icon={Wheat} />
                        <MacroBar label="Fat" current={stats?.totalFat || 0} goal={stats?.goals?.fat || 70} color="#f59e0b" icon={Zap} />
                    </>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <MealSection type="breakfast" title="Breakfast" />
                <MealSection type="lunch" title="Lunch" />
                <MealSection type="dinner" title="Dinner" />
                <MealSection type="snack" title="Snacks" />
            </div>

            {/* --- Modals --- */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 200, display: 'flex', flexDirection: 'column', backdropFilter: 'blur(15px)' }}
                    >
                        <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <button onClick={() => setShowAddModal(false)} style={{ padding: '0.5rem', background: 'none', border: 'none', color: 'white' }}>
                                <ChevronLeft size={24} />
                            </button>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, flex: 1 }}>
                                {showCreateForm ? 'Create New Item' : (editingLogId ? 'Edit Meal' : `Add to ${selectedMealType}`)}
                            </h2>
                            {showCreateForm && <button onClick={() => setShowCreateForm(false)} style={{ fontSize: '0.9rem', color: 'var(--primary)', background: 'none', border: 'none' }}>Cancel</button>}
                        </div>

                        {!showCreateForm && !selectedFoodDetails && (
                            <div style={{ padding: '1rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Search for food..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: 'none', padding: '1.2rem 1rem 1.2rem 3.5rem', borderRadius: '12px', color: 'white', fontSize: '1.1rem' }}
                                    />
                                </div>
                            </div>
                        )}

                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {showCreateForm ? (
                                // --- NEW FOOD FORM ---
                                <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                                    <input
                                        className="input-field"
                                        autoFocus
                                        value={newFood.name}
                                        onChange={e => setNewFood({ ...newFood, name: e.target.value })}
                                        placeholder="Food Name"
                                        style={{
                                            background: 'transparent', border: 'none', borderBottom: '2px solid rgba(255,255,255,0.2)',
                                            fontSize: '1.8rem', fontWeight: 700, color: 'white', width: '100%', textAlign: 'center',
                                            paddingBottom: '0.5rem', marginBottom: '2.5rem', outline: 'none'
                                        }}
                                    />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', width: '100%', marginBottom: '2.5rem' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <input
                                                type="number"
                                                value={newFood.calories}
                                                onChange={e => setNewFood({ ...newFood, calories: e.target.value })}
                                                placeholder="0"
                                                style={{ background: 'transparent', border: 'none', fontSize: '2.5rem', fontWeight: 800, color: 'white', width: '100%', textAlign: 'center', outline: 'none' }}
                                            />
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Calories</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <input
                                                    type="number"
                                                    value={newFood.servingSize}
                                                    onChange={e => setNewFood({ ...newFood, servingSize: e.target.value })}
                                                    placeholder="100"
                                                    style={{ background: 'transparent', border: 'none', fontSize: '2.5rem', fontWeight: 800, color: 'white', width: '80px', textAlign: 'center', outline: 'none' }}
                                                />
                                                <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-muted)' }}>g</span>
                                            </div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Serving Size</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '350px', marginBottom: 'auto' }}>
                                        {[
                                            { label: 'Protein', key: 'protein', color: '#3b82f6' },
                                            { label: 'Carbs', key: 'carbs', color: '#10b981' },
                                            { label: 'Fat', key: 'fat', color: '#f59e0b' }
                                        ].map(macro => (
                                            <div key={macro.key} style={{ textAlign: 'center' }}>
                                                <input
                                                    type="number"
                                                    value={(newFood as any)[macro.key]}
                                                    onChange={e => setNewFood({ ...newFood, [macro.key]: e.target.value })}
                                                    placeholder="0"
                                                    style={{
                                                        background: 'rgba(255,255,255,0.05)', border: `1px solid ${macro.color}`, borderRadius: '12px',
                                                        fontSize: '1.5rem', fontWeight: 700, color: 'white', width: '80px', height: '80px',
                                                        textAlign: 'center', outline: 'none', marginBottom: '0.5rem'
                                                    }}
                                                />
                                                <div style={{ color: macro.color, fontSize: '0.8rem', fontWeight: 600 }}>{macro.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        className="btn-primary"
                                        onClick={handleCreateFood}
                                        style={{ width: '100%', padding: '1.2rem', borderRadius: '16px', fontSize: '1.1rem', marginTop: '2rem' }}
                                    >
                                        Save Item & Log
                                    </button>
                                </div>
                            ) : selectedFoodDetails ? (
                                // --- QUANTITY INPUT VIEW ---
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 600, textAlign: 'center', marginBottom: '0.5rem' }}>
                                        {selectedFoodDetails.name}
                                    </h3>
                                    <div style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>
                                        {selectedFoodDetails.calories} kcal per {selectedFoodDetails.servingSize}g
                                    </div>

                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '3rem' }}>
                                        <input
                                            autoFocus
                                            type="number"
                                            value={quantityInput}
                                            onChange={e => setQuantityInput(e.target.value)}
                                            style={{
                                                background: 'transparent', border: 'none', borderBottom: '2px solid rgba(255,255,255,0.2)',
                                                fontSize: '3.5rem', fontWeight: 800, color: 'white', width: '180px',
                                                textAlign: 'center', paddingBottom: '0.5rem', outline: 'none'
                                            }}
                                        />
                                        <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', position: 'absolute', right: '-40px', bottom: '1rem' }}>g</span>
                                    </div>

                                    <div style={{ display: 'flex', gap: '2rem', marginBottom: 'auto' }}>
                                        {(['calories', 'protein', 'carbs', 'fat'] as const).map(macro => {
                                            const val = Math.round(selectedFoodDetails[macro] * (parseFloat(quantityInput) || 0) / selectedFoodDetails.servingSize);
                                            const color = macro === 'calories' ? 'white' : macro === 'protein' ? '#3b82f6' : macro === 'carbs' ? '#10b981' : '#f59e0b';
                                            return (
                                                <div key={macro} style={{ textAlign: 'center' }}>
                                                    <div style={{ fontWeight: 700, fontSize: '1.2rem', color }}>{val}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{macro === 'calories' ? 'Cal' : macro}</div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div style={{ width: '100%', display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                        <button
                                            className="btn-secondary"
                                            onClick={() => { setSelectedFoodDetails(null); setEditingLogId(null); }}
                                            style={{ flex: 1, padding: '1rem' }}
                                        >
                                            Back
                                        </button>
                                        <button
                                            className="btn-primary"
                                            onClick={handleConfirmLog}
                                            style={{ flex: 1, padding: '1rem' }}
                                        >
                                            {editingLogId ? 'Update Log' : 'Log Meal'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // --- SEARCH RESULTS & FAVORITES ---
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' }}>

                                    {showFavorites ? (
                                        <>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem', marginLeft: '0.5rem' }}>Favorites</div>
                                            {favorites.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                    No favorites yet. Star foods to see them here!
                                                </div>
                                            ) : (
                                                favorites.map(food => (
                                                    <motion.div
                                                        key={food.id}
                                                        onClick={() => handleSelectFood(food)}
                                                        className="glass-panel"
                                                        style={{ padding: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.5rem' }}
                                                        whileTap={{ scale: 0.98 }}
                                                    >
                                                        <div>
                                                            <div style={{ fontSize: '1rem', fontWeight: 600 }}>{food.name}</div>
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                                {food.calories} kcal • {Math.round(food.protein)}p {Math.round(food.carbs)}c {Math.round(food.fat)}f
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                            <div
                                                                onClick={(e) => handleToggleFavorite(e, food.id)}
                                                                style={{ padding: '0.5rem' }}
                                                            >
                                                                <Star size={18} fill="#f59e0b" color="#f59e0b" />
                                                            </div>
                                                            <div style={{ background: 'rgba(59,130,246,0.1)', padding: '0.5rem', borderRadius: '50%' }}>
                                                                <Plus size={20} className="text-primary" />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))
                                            )}
                                        </>
                                    ) : (
                                        // Search Results
                                        searchResults.map(food => {
                                            const isFav = favorites.some(f => f.id === food.id);
                                            return (
                                                <motion.div
                                                    key={food.id}
                                                    // initial={{ opacity: 0, y: 10 }}
                                                    // animate={{ opacity: 1, y: 0 }}
                                                    onClick={() => handleSelectFood(food)}
                                                    className="glass-panel"
                                                    style={{ padding: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.5rem' }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <div>
                                                        <div style={{ fontSize: '1rem', fontWeight: 600 }}>{food.name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                            {food.calories} kcal • {Math.round(food.protein)}p {Math.round(food.carbs)}c {Math.round(food.fat)}f
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                        <div
                                                            onClick={(e) => handleToggleFavorite(e, food.id)}
                                                            style={{ padding: '0.5rem' }}
                                                        >
                                                            <Star size={18} fill={isFav ? "#f59e0b" : "none"} color={isFav ? "#f59e0b" : "var(--text-muted)"} />
                                                        </div>
                                                        <div style={{ background: 'rgba(59,130,246,0.1)', padding: '0.5rem', borderRadius: '50%' }}>
                                                            <Plus size={20} className="text-primary" />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )
                                        })
                                    )}

                                    {searchQuery.length > 2 && searchResults.length === 0 && !showFavorites && (
                                        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                                            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No matching foods found.</p>
                                            <button
                                                onClick={() => setShowCreateForm(true)}
                                                style={{ color: 'var(--primary)', background: 'rgba(59,130,246,0.1)', padding: '0.8rem 1.5rem', borderRadius: '25px', border: '1px solid var(--primary)', fontWeight: 600 }}
                                            >
                                                Create "{searchQuery}"
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface UserProfile {
    id?: number;
    username?: string;
    email?: string;
    name: string;
    currentWeight: number;
    startWeight: number;
    targetWeight: number;
    height: number;
    age: number;
    gender: string;
    level?: number;
    aura?: number;
}

export interface DashboardStats {
    profile: UserProfile;
    bmi: number;
    bmiCategory: string;
    bmr: number;
    tdee: number;
    totalLost: number;
    goalProgress: number;
    xpToNextLevel: number;
    xpProgress: number;
}

export interface WeightLog {
    id: number;
    weight: number;
    date: string; // ISO string
    note?: string;
    photoUrl?: string;
}

// Nutrition Interfaces
export interface FoodItem {
    id: number;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingUnit: string;
    servingSize: number;
}

export interface MealLog {
    id: number;
    date: string;
    mealType: string;
    foodItemId?: number;
    foodName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servings: number;
}

export interface NutritionGoals {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export interface DailyNutritionStats {
    date: string;
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    goals: NutritionGoals;
    logs: MealLog[];
}

export interface CreateFoodItemRequest {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingUnit: string;
    servingSize: number;
}

export interface LogMealRequest {
    date: string;
    mealType: string;
    foodItemId?: number;
    foodName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servings: number;
}

// Helper for Auth Headers
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const headers = new Headers(options.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);

    // Default Content-Type to application/json if not set and method is POST/PUT
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    if (res.status === 401) {
        // Handle unauthorized (optional: redirect to login or clear token)
        localStorage.removeItem('token');
        // window.location.href = '/login'; // Do careful redirect
    }
    return res;
};

export const api = {
    // Auth
    register: async (data: any) => {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Registration failed');
        }
        return res.json();
    },

    login: async (data: any) => {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Login failed');
        }
        return res.json();
    },

    getHealth: async () => {
        const res = await fetch(`${API_URL}/health`);
        return res.json();
    },

    getDashboardStats: async (): Promise<DashboardStats> => {
        const res = await fetchWithAuth('/dashboard-stats');
        // if (!res.ok) throw new Error('Failed to fetch stats'); 
        // Allow failure to return null in caller for better handling
        if (!res.ok) return Promise.reject(await res.json());
        return res.json();
    },

    saveProfile: async (profile: UserProfile) => {
        const res = await fetchWithAuth('/profile', {
            method: 'POST',
            body: JSON.stringify(profile),
        });
        if (!res.ok) throw new Error('Failed to save profile');
        return res.json();
    },

    addWeightLog: async (formData: FormData) => {
        const res = await fetchWithAuth('/weight-logs', {
            method: 'POST',
            body: formData,
            // Header Content-Type handled by browser for FormData
        });
        if (!res.ok) throw new Error('Failed to add log');
        return res.json();
    },

    calculateFitness: async (data: { weight: number, height: number, age: number, gender: string }) => {
        const res = await fetchWithAuth('/calculate-fitness', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return res.json();
    },

    getWeightLogs: async (): Promise<WeightLog[]> => {
        const res = await fetchWithAuth('/weight-logs');
        if (!res.ok) throw new Error('Failed to fetch logs');
        return res.json();
    },

    awardXP: async (amount: number, reason: string) => {
        const res = await fetchWithAuth('/award-xp', {
            method: 'POST',
            body: JSON.stringify({ amount, reason }),
        });
        return res.json();
    },

    // Nutrition API
    searchFood: async (query: string): Promise<FoodItem[]> => {
        const res = await fetchWithAuth(`/food-items?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('Failed to search food');
        return res.json();
    },

    getFoodItem: async (id: number): Promise<FoodItem> => {
        const res = await fetchWithAuth(`/food-items/${id}`);
        if (!res.ok) throw new Error('Failed to get food item');
        return res.json();
    },

    createFood: async (data: CreateFoodItemRequest) => {
        const res = await fetchWithAuth('/food-items', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create food');
        return res.json();
    },

    getDailyNutrition: async (date: string): Promise<DailyNutritionStats> => {
        const res = await fetchWithAuth(`/nutrition/daily/${date}`);
        if (!res.ok) throw new Error('Failed to fetch nutrition stats');
        return res.json();
    },

    logMeal: async (data: LogMealRequest) => {
        const res = await fetchWithAuth('/nutrition/log', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to log meal');
        return res.json();
    },

    deleteMealLog: async (id: number) => {
        const res = await fetchWithAuth(`/nutrition/log/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete meal log');
        return res.json();
    },

    updateMealLog: async (id: number, data: LogMealRequest) => {
        const res = await fetchWithAuth(`/nutrition/log/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update meal log');
        return res.json();
    },

    // Favorites
    getFavorites: async (): Promise<FoodItem[]> => {
        const res = await fetchWithAuth('/food-items/favorites');
        if (!res.ok) throw new Error('Failed to get favorites');
        return res.json();
    },

    addFavorite: async (id: number) => {
        const res = await fetchWithAuth(`/food-items/favorites/${id}`, {
            method: 'POST',
        });
        if (!res.ok) throw new Error('Failed to add favorite');
        return res.json();
    },

    removeFavorite: async (id: number) => {
        const res = await fetchWithAuth(`/food-items/favorites/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to remove favorite');
        return res.json();
    },

    // Copy Meals
    copyMeals: async (data: { from_date: string, to_date: string, meal_type?: string }) => {
        const res = await fetchWithAuth('/nutrition/copy', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to copy meals');
        return res.json();
    },

    // Water
    getDailyWater: async (date: string): Promise<{ total_ml: number, logs: any[] }> => {
        const res = await fetchWithAuth(`/water/daily/${date}`);
        if (!res.ok) throw new Error('Failed to get water logs');
        return res.json();
    },

    logWater: async (data: { date: string, amount_ml: number }) => {
        const res = await fetchWithAuth('/water/log', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to log water');
        return res.json();
    }
};

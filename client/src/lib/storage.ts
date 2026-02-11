import localforage from 'localforage';

localforage.config({
    name: 'LevelUpFitness',
    storeName: 'data'
});

export interface WeightLog {
    id: string;
    date: string;
    weight: number;
    note?: string;
}

export interface UserProfile {
    name: string;
    startWeight: number;
    targetWeight: number;
    currentWeight: number;
    height: number; // cm
    age: number;
    gender: string;
    level: number;
    aura: number;
}

export interface RoutineItem {
    id: string;
    title: string;
    description?: string;
    type: 'skin' | 'hair' | 'supplement' | 'other';
    timeOfDay: 'morning' | 'day' | 'evening';
    dosage?: string;
    instructions?: string;
    daysOfWeek: number[]; // 0-6, where 0 is Sunday
}

export interface DailyRoutineLog {
    date: string; // YYYY-MM-DD
    completedItemIds: string[];
}

export interface DisciplineHabit {
    id: string;
    title: string;
    isActive: boolean;
}

export interface GymRoutineItem {
    id: string;
    exerciseName: string;
    targetSets: number;
    targetReps: string;
    targetWeight?: number;
    dayOfWeek: number; // 0-6
    notes?: string;
}

export interface GymLog {
    id: string;
    date: string;
    exerciseId: string;
    sets: { weight: number; reps: number }[];
}

export const storage = {
    getProfile: async (): Promise<UserProfile | null> => {
        const profile = await localforage.getItem<any>('profile');
        if (profile && typeof profile.aura === 'undefined' && typeof profile.xp !== 'undefined') {
            // Migration: XP -> Aura
            profile.aura = profile.xp;
            delete profile.xp;
            await localforage.setItem('profile', profile);
        }
        return profile as UserProfile;
    },
    saveProfile: async (profile: UserProfile) => {
        await localforage.setItem('profile', profile);
    },
    getLogs: async (): Promise<WeightLog[]> => {
        return (await localforage.getItem<WeightLog[]>('logs')) || [];
    },
    addLog: async (log: WeightLog) => {
        const logs = (await localforage.getItem<WeightLog[]>('logs')) || [];
        logs.push(log);
        await localforage.setItem('logs', logs);
    },
    clearAll: async () => {
        await localforage.removeItem('profile');
        await localforage.removeItem('logs');
        await localforage.removeItem('routines');
        await localforage.removeItem('routine_logs');
        await localforage.removeItem('gym_routines');
        await localforage.removeItem('gym_logs');
    },
    getRoutines: async (): Promise<RoutineItem[]> => {
        return (await localforage.getItem<RoutineItem[]>('routines')) || [];
    },
    saveRoutines: async (routines: RoutineItem[]) => {
        await localforage.setItem('routines', routines);
    },
    getDailyRoutineLog: async (date: string): Promise<DailyRoutineLog | null> => {
        const logs = (await localforage.getItem<Record<string, DailyRoutineLog>>('routine_logs')) || {};
        return logs[date] || null;
    },
    saveDailyRoutineLog: async (log: DailyRoutineLog) => {
        const logs = (await localforage.getItem<Record<string, DailyRoutineLog>>('routine_logs')) || {};
        logs[log.date] = log;
        await localforage.setItem('routine_logs', logs);
    },
    getDisciplineHabits: async (): Promise<DisciplineHabit[]> => {
        return (await localforage.getItem<DisciplineHabit[]>('discipline_habits')) || [
            { id: '1', title: 'No Junk Food', isActive: true },
            { id: '2', title: 'No Sugar', isActive: true },
            { id: '3', title: 'Workout', isActive: true },
            { id: '4', title: 'Read 10 Pages', isActive: true },
        ];
    },
    saveDisciplineHabits: async (habits: DisciplineHabit[]) => {
        await localforage.setItem('discipline_habits', habits);
    },
    getDisciplineLogs: async (): Promise<Record<string, string[]>> => {
        return (await localforage.getItem<Record<string, string[]>>('discipline_logs')) || {};
    },
    saveDisciplineLog: async (date: string, completedIds: string[]) => {
        const logs = (await localforage.getItem<Record<string, string[]>>('discipline_logs')) || {};
        logs[date] = completedIds;
        await localforage.setItem('discipline_logs', logs);
    },
    getGymRoutines: async (): Promise<GymRoutineItem[]> => {
        return (await localforage.getItem<GymRoutineItem[]>('gym_routines')) || [];
    },
    saveGymRoutines: async (routines: GymRoutineItem[]) => {
        await localforage.setItem('gym_routines', routines);
    },
    getGymLogs: async (): Promise<GymLog[]> => {
        return (await localforage.getItem<GymLog[]>('gym_logs')) || [];
    },
    saveGymLog: async (log: GymLog) => {
        const logs = (await localforage.getItem<GymLog[]>('gym_logs')) || [];
        logs.push(log);
        await localforage.setItem('gym_logs', logs);
    }
};

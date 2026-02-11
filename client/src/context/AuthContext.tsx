import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, type UserProfile } from '../lib/api';

interface AuthContextType {
    user: UserProfile | null;
    token: string | null;
    login: (token: string, user: UserProfile) => void;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            console.log("AuthContext: Initializing...");
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                console.log("AuthContext: Found token, validating...");
                try {
                    // Start fetching dashboard stats to validate token and get profile
                    const stats = await api.getDashboardStats();
                    if (stats && stats.profile) {
                        console.log("AuthContext: Token valid, user logged in:", stats.profile.username);
                        setUser(stats.profile);
                    } else {
                        console.warn("AuthContext: Invalid response structure, logging out.");
                        localStorage.removeItem('token');
                        setToken(null);
                        setUser(null);
                    }
                } catch (e) {
                    console.error("AuthContext: Auth init failed", e);
                    localStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                }
            } else {
                console.log("AuthContext: No token found.");
                setLoading(false);
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = (newToken: string, newUser: UserProfile) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

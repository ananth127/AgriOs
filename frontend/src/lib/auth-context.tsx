
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from '@/navigation';
import { API_BASE_URL } from './constants';

interface User {
    email: string;
    full_name?: string;
    role: string;
    phone_number?: string;
    latitude?: number;
    longitude?: number;
    location_name?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUser: (user: User) => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const logout = useCallback(() => {
        localStorage.removeItem('access_token');
        setToken(null);
        setUser(null);
        router.push('/auth/login');
    }, [router]);

    useEffect(() => {
        // Check local storage on load
        const storedToken = localStorage.getItem('access_token');
        if (storedToken) {
            setToken(storedToken);
            // Fetch user profile
            fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${storedToken}`
                }
            })
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error('Failed to fetch user');
                })
                .then(userData => {
                    setUser(userData);
                })
                .catch((err) => {
                    console.error("Auth check failed", err);
                    logout(); // clear invalid token
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [logout]);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('access_token', newToken);
        setToken(newToken);
        setUser(newUser);
        router.push('/');
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAuthenticated: !!user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}


'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from '@/navigation';
import { API_BASE_URL } from './constants';

interface User {
    id: number;
    email: string;
    full_name?: string;
    role: string;
    unique_id?: string;
    phone_number?: string;
    latitude?: number;
    longitude?: number;
    location_name?: string;
    survey_number?: string;
    boundary?: any;
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
        localStorage.removeItem('user_data');
        setToken(null);
        setUser(null);
        router.push('/auth/login');
    }, [router]);

    useEffect(() => {
        // Optimistic Load: Check local storage immediately
        const storedToken = localStorage.getItem('access_token');
        const storedUser = localStorage.getItem('user_data');

        if (storedToken) {
            setToken(storedToken);
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    // HOTFIX: Clear stale ID found in previous session (starts with 60 is old random logic)
                    if (parsedUser.unique_id && parsedUser.unique_id.startsWith('60')) {
                        console.log("🧹 Clearing stale user data from storage.");
                        localStorage.removeItem('user_data');
                        // Don't set user, let network fetch it
                    } else {
                        setUser(parsedUser);
                    }
                } catch (e) {
                    console.error("Failed to parse stored user", e);
                }
            }
        }

        // Unblock UI immediately if we have data, or if we have nothing
        setLoading(false);

        // Background Verification (Revalidate)
        if (storedToken) {
            fetch(`${API_BASE_URL}/auth/me`, {
                cache: 'no-store',
                headers: {
                    'Authorization': `Bearer ${storedToken}`
                }
            })
                .then(async res => {
                    if (res.ok) {
                        const userData = await res.json();
                        console.log("🔄 Validated User Data from Server:", userData.unique_id);
                        setUser(userData);
                        // Update cache with fresh data
                        localStorage.setItem('user_data', JSON.stringify(userData));
                    } else if (res.status === 401) {
                        console.warn("Token expired or invalid during check, logging out.");
                        logout();
                    } else {
                        console.error(`Auth check failed with status: ${res.status}`);
                    }
                })
                .catch((err) => {
                    console.error("Auth check failed (network/other)", err);
                });
        }
    }, [logout]);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('access_token', newToken);
        localStorage.setItem('user_data', JSON.stringify(newUser));
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

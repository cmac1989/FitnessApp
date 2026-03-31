import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    const [user, setUserState] = useState(null);

    useEffect(() => {
        AsyncStorage.getItem('user').then(stored => {
            if (stored) {
                try { setUserState(JSON.parse(stored)); } catch {}
            }
        });
    }, []);

    const setUser = async (userData) => {
        setUserState(userData);
        if (userData) {
            await AsyncStorage.setItem('user', JSON.stringify(userData));
        } else {
            await AsyncStorage.removeItem('user');
        }
    };

    const updateUser = async (updates) => {
        const updated = { ...(user ?? {}), ...updates };
        setUserState(updated);
        await AsyncStorage.setItem('user', JSON.stringify(updated));
    };

    const clearUser = async () => {
        setUserState(null);
        await AsyncStorage.removeItem('user');
    };

    return (
        <UserContext.Provider value={{ user, setUser, updateUser, clearUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error('useUser must be used within UserProvider');
    return ctx;
};

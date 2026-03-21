import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightTheme = {
    dark: false,
    background: '#f8f8f8',
    backgroundSecondary: '#f0f0f0',
    card: '#ffffff',
    text: '#1a1a1a',
    textSecondary: '#555555',
    textMuted: '#888888',
    primary: '#6200EE',
    primaryDark: '#3700B3',
    primaryText: '#ffffff',
    accent: '#007bff',
    border: '#e0e0e0',
    navBar: '#ffffff',
    navBarBorder: '#e0e0e0',
    navBarText: '#1a1a1a',
    navBarIcon: '#333333',
    inputBackground: '#ffffff',
    inputBorder: '#cccccc',
    error: '#c62828',
    statValue: '#007bff',
    success: '#2e7d32',
    placeholder: '#aaaaaa',
    roleButtonBackground: '#eeeeee',
    roleButtonActiveBackground: '#6200EE',
    roleButtonText: '#333333',
    roleButtonActiveText: '#ffffff',
    divider: '#e0e0e0',
    myMessageBubble: '#cfe9ff',
    theirMessageBubble: '#e0e0e0',
    myMessageText: '#1a1a1a',
    theirMessageText: '#1a1a1a',
    readItemBackground: '#f0f0f0',
    unreadItemBackground: '#ffffff',
    unreadItemBorder: '#444444',
};

export const darkTheme = {
    dark: true,
    background: '#0f0f0f',
    backgroundSecondary: '#161616',
    card: '#1c1c1e',
    text: '#f2f2f7',
    textSecondary: '#aeaeb2',
    textMuted: '#636366',
    primary: '#BB86FC',
    primaryDark: '#9965E8',
    primaryText: '#000000',
    accent: '#4db6ff',
    border: '#2c2c2e',
    navBar: '#1c1c1e',
    navBarBorder: '#2c2c2e',
    navBarText: '#f2f2f7',
    navBarIcon: '#f2f2f7',
    inputBackground: '#2c2c2e',
    inputBorder: '#3a3a3c',
    error: '#ff453a',
    statValue: '#4db6ff',
    success: '#30d158',
    placeholder: '#636366',
    roleButtonBackground: '#2c2c2e',
    roleButtonActiveBackground: '#BB86FC',
    roleButtonText: '#aeaeb2',
    roleButtonActiveText: '#000000',
    divider: '#2c2c2e',
    myMessageBubble: '#3a1f6e',
    theirMessageBubble: '#2c2c2e',
    myMessageText: '#f2f2f7',
    theirMessageText: '#f2f2f7',
    readItemBackground: '#1c1c1e',
    unreadItemBackground: '#252528',
    unreadItemBorder: '#aeaeb2',
};

const ThemeContext = createContext({
    theme: lightTheme,
    isDark: false,
    toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem('app_theme').then(saved => {
            if (saved === 'dark') setIsDark(true);
        }).catch(() => {});
    }, []);

    const toggleTheme = async () => {
        const next = !isDark;
        setIsDark(next);
        try {
            await AsyncStorage.setItem('app_theme', next ? 'dark' : 'light');
        } catch {}
    };

    return (
        <ThemeContext.Provider value={{ theme: isDark ? darkTheme : lightTheme, isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);

import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';

export const saveToken = async (token) => {
    try {
        await AsyncStorage.setItem(TOKEN_KEY, token);
        console.log('Token saved successfully');
    } catch (error) {
        console.error('Error saving token', error);
    }
};

export const getToken = async () => {
    try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        return token;
    } catch (error) {
        console.error('Error getting token', error);
        return null;
    }
};

export const removeToken = async () => {
    try {
        await AsyncStorage.removeItem(TOKEN_KEY);
        console.log('Token removed successfully');
    } catch (error) {
        console.error('Error removing token', error);
    }
};

export const getUser = async () => {
    try {
        const user = await AsyncStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    } catch (error) {
        console.error('Error getting user', error);
        return null;
    }
};

export const removeUser = async () => {
    try {
        await AsyncStorage.removeItem('user');
    } catch (error) {
        console.error('Error removing user', error);
    }
};

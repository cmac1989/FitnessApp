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

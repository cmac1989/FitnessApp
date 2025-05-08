import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserProfile } from '../src/api/user';

const ProfileScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = await AsyncStorage.getItem('auth_token');
                if (!token) {
                    navigation.navigate('Login');
                    return;
                }
                const response = await getUserProfile(token);
                setUser(response.data.user);
            } catch (err) {
                console.log('Error fetching user profile:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [navigation]);

    useEffect(() => {
        if (!loading && user) {
            if (user.role === 'trainer') {
                navigation.replace('TrainerProfileScreen');
            } else if (user.role === 'client') {
                navigation.replace('ClientProfileScreen');
            }
        }
    }, [loading, user]);

    if (loading) {
        return <ActivityIndicator size="large" color="#0000ff" />;
    }

    return <View />;
};

export default ProfileScreen;

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserProfile } from '../src/api/auth'; // Assuming you have this API function

const ClientProfileScreen = () => {
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchClientProfile = async () => {
            try {
                const token = await AsyncStorage.getItem('auth_token');
                if (!token) {
                    // Handle if the token doesn't exist (redirect or show error)
                    return;
                }

                const response = await getUserProfile(token);
                setClient(response.data.user);
            } catch (err) {
                setError('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        fetchClientProfile();
    }, []);

    if (loading) {
        return <ActivityIndicator size="large" color="#0000ff" />;
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text>{error}</Text>
            </View>
        );
    }

    if (!client || client.role !== 'client') {
        return (
            <View style={styles.centered}>
                <Text>This profile is not available for the current user.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Client Profile</Text>
            <Text>Name: {client.name}</Text>
            <Text>Email: {client.email}</Text>
            <Text>Age: {client.age}</Text>
            <Text>Gender: {client.gender}</Text>
            <Text>Fitness Goals: {client.fitness_goals}</Text>
            <Text>Medical Conditions: {client.medical_conditions}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ClientProfileScreen;

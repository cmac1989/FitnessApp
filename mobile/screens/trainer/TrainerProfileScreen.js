import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getTrainerProfile} from '../../src/api/trainer';
import ScreenWrapper from "../../components/ScreenWrapper";

const TrainerProfileScreen = ({ navigation }) => {
    const [trainer, setTrainer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTrainerProfile = async () => {
            try {
                const token = await AsyncStorage.getItem('auth_token');
                if (!token) {
                    // Handle if the token doesn't exist (redirect or show error)
                    return;
                }

                const response = await getTrainerProfile(token);
                setTrainer(response);
                console.log(response);
            } catch (err) {
                setError('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        fetchTrainerProfile();
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

    return (
        <ScreenWrapper title="Profile">
        <View style={styles.container}>
            <Text style={styles.header}>Trainer Profile</Text>
            <Text>Name: {trainer.name}</Text>
            <Text>Email: {trainer.email}</Text>
            <Text>Certifications: {trainer.certifications}</Text>
            <Text>Years of Experience: {trainer.years_experience}</Text>
            <Text>Specialties: {trainer.specialties}</Text>
            <Text>Availability: {trainer.availability}</Text>
            <Text>Location: {trainer.location}</Text>
            <Text>Bio: {trainer.bio}</Text>

            {/* Edit Profile Button */}
            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('ProfileEdit')}
            >
                <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
        </View>
        </ScreenWrapper>
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
    button: {
        marginTop: 20,
        backgroundColor: '#007bff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default TrainerProfileScreen;

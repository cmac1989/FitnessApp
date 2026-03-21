import React, {useState, useCallback} from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTrainerProfile } from '../../src/api/trainer';
import ScreenWrapper from "../../components/ScreenWrapper";
import {useFocusEffect} from "@react-navigation/native";

const TrainerProfileScreen = ({ navigation }) => {
    const [trainer, setTrainer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTrainerProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (!token) {
                setError('not_setup');
                return;
            }

            const response = await getTrainerProfile(token);
            const profileData = response.data || response;

            setTrainer({
                ...profileData,
                specialties: Array.isArray(profileData.specialties)
                    ? profileData.specialties.join(', ')
                    : profileData.specialties,
            });
        } catch (err) {
            if (err.response?.status === 404) {
                setError('not_setup');
            } else {
                setError('failed');
            }
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchTrainerProfile();
        }, [])
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    if (error === 'not_setup') {
        return (
            <ScreenWrapper title="Profile">
                <View style={styles.centered}>
                    <Text style={styles.emptyTitle}>Profile Not Set Up</Text>
                    <Text style={styles.emptySubtitle}>
                        Complete your trainer profile so clients can find you.
                    </Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => navigation.navigate('ProfileEdit')}
                    >
                        <Text style={styles.buttonText}>Set Up Profile</Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    if (error === 'failed') {
        return (
            <ScreenWrapper title="Profile">
                <View style={styles.centered}>
                    <Text style={styles.errorText}>Failed to load profile.</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchTrainerProfile}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper title="Profile">
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.header}>Trainer Profile</Text>

                <View style={styles.card}>
                    <ProfileItem label="Name" value={trainer.name} />
                    <ProfileItem label="Email" value={trainer.email} />
                    <ProfileItem label="Certifications" value={trainer.certifications} />
                    <ProfileItem label="Years of Experience" value={trainer.years_experience} />
                    <ProfileItem label="Specialties" value={trainer.specialties} />
                    <ProfileItem label="Availability" value={trainer.availability} />
                    <ProfileItem label="Location" value={trainer.location} />
                    <ProfileItem label="Bio" value={trainer.bio} />
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('ProfileEdit')}
                >
                    <Text style={styles.buttonText}>Edit Profile</Text>
                </TouchableOpacity>
            </ScrollView>
        </ScreenWrapper>
    );
};

const ProfileItem = ({ label, value }) => (
    <View style={styles.item}>
        <Text style={styles.itemLabel}>{label}</Text>
        <Text style={styles.itemValue}>{value || 'N/A'}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f4f4f4',
        paddingBottom: 40,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 25,
        color: '#333',
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 6,
        elevation: 4,
    },
    item: {
        marginBottom: 18,
    },
    itemLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
    },
    itemValue: {
        fontSize: 17,
        color: '#222',
        marginTop: 4,
    },
    button: {
        backgroundColor: '#007bff',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    errorText: {
        fontSize: 18,
        color: 'red',
        marginBottom: 16,
        textAlign: 'center',
    },
    emptyIcon: {
        fontSize: 60,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 22,
    },
    retryButton: {
        backgroundColor: '#007bff',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 10,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default TrainerProfileScreen;
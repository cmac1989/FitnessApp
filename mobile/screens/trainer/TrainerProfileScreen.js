import React, {useState, useEffect, useCallback} from 'react';
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
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (!token) {
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

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
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
        paddingVertical: 14,
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
    },
    errorText: {
        fontSize: 18,
        color: 'red',
    },
});

export default TrainerProfileScreen;

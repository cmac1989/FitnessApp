import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import CustomButton from '../../components/CustomButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTrainerProfile } from '../../src/api/trainer';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../src/theme';

const TrainerProfileScreen = ({ navigation }) => {
    const { theme } = useTheme();
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

    const styles = makeStyles(theme);

    if (loading) {
        return (
            <ScreenWrapper title="Profile">
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            </ScreenWrapper>
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
                    <CustomButton
                        title="Set Up Profile"
                        onPress={() => navigation.navigate('ProfileEdit')}
                    />
                </View>
            </ScreenWrapper>
        );
    }

    if (error === 'failed') {
        return (
            <ScreenWrapper title="Profile">
                <View style={styles.centered}>
                    <Text style={styles.errorText}>Failed to load profile.</Text>
                    <CustomButton title="Try Again" onPress={fetchTrainerProfile} />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper title="Profile">
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.header}>Trainer Profile</Text>

                <View style={styles.card}>
                    <ProfileItem label="Name" value={trainer.name} theme={theme} />
                    <ProfileItem label="Email" value={trainer.email} theme={theme} />
                    <ProfileItem label="Certifications" value={trainer.certifications} theme={theme} />
                    <ProfileItem label="Years of Experience" value={trainer.years_experience} theme={theme} />
                    <ProfileItem label="Specialties" value={trainer.specialties} theme={theme} />
                    <ProfileItem label="Availability" value={trainer.availability} theme={theme} />
                    <ProfileItem label="Location" value={trainer.location} theme={theme} />
                    <ProfileItem label="Bio" value={trainer.bio} theme={theme} />
                </View>

                <CustomButton
                    title="Edit Profile"
                    onPress={() => navigation.navigate('ProfileEdit')}
                />
            </ScrollView>
        </ScreenWrapper>
    );
};

const ProfileItem = ({ label, value, theme }) => {
    const styles = makeStyles(theme);
    return (
        <View style={styles.item}>
            <Text style={styles.itemLabel}>{label}</Text>
            <Text style={styles.itemValue}>{value || 'N/A'}</Text>
        </View>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: theme.background,
        paddingBottom: 40,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 25,
        color: theme.text,
        textAlign: 'center',
    },
    card: {
        backgroundColor: theme.card,
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
        fontSize: 13,
        fontWeight: '600',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    itemValue: {
        fontSize: 16,
        color: theme.text,
        marginTop: 4,
    },
    button: {
        backgroundColor: theme.accent,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
        backgroundColor: theme.background,
    },
    errorText: {
        fontSize: 17,
        color: theme.error,
        marginBottom: 16,
        textAlign: 'center',
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 10,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 15,
        color: theme.textSecondary,
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 22,
    },
});

export default TrainerProfileScreen;

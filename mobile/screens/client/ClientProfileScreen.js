import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import CustomButton from '../../components/CustomButton';
import { getClientProfile } from '../../src/api/client';
import { useTheme } from '../../src/theme';

const ProfileItem = ({ label, value, theme }) => {
    const styles = makeStyles(theme);
    return (
        <View style={styles.item}>
            <Text style={styles.itemLabel}>{label}</Text>
            <Text style={styles.itemValue}>{value || 'N/A'}</Text>
        </View>
    );
};

const ClientProfileScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const styles = makeStyles(theme);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getClientProfile();
            setProfile(data);
        } catch (err) {
            setError('failed');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => {
        fetchProfile();
    }, [fetchProfile]));

    if (loading) {
        return (
            <ScreenWrapper title="Profile">
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            </ScreenWrapper>
        );
    }

    if (error) {
        return (
            <ScreenWrapper title="Profile">
                <View style={styles.centered}>
                    <Text style={styles.errorText}>Failed to load profile.</Text>
                    <CustomButton title="Try Again" onPress={fetchProfile} />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper title="Profile">
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.header}>My Profile</Text>

                <View style={styles.card}>
                    <ProfileItem label="Name"               value={profile?.name}               theme={theme} />
                    <ProfileItem label="Email"              value={profile?.email}              theme={theme} />
                    <ProfileItem label="Age"                value={profile?.age?.toString()}    theme={theme} />
                    <ProfileItem label="Gender"             value={profile?.gender}             theme={theme} />
                    <ProfileItem label="Fitness Goals"      value={profile?.fitness_goals}      theme={theme} />
                    <ProfileItem label="Medical Conditions" value={profile?.medical_conditions} theme={theme} />
                </View>

                <CustomButton
                    title="Edit Profile"
                    onPress={() => navigation.navigate('ClientProfileEdit', { profile })}
                />
            </ScrollView>
        </ScreenWrapper>
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
});

export default ClientProfileScreen;

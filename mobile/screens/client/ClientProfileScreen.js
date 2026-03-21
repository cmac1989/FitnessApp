import React, { useCallback, useEffect, useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, ScrollView,
    Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import CustomButton from '../../components/CustomButton';
import { userLogout } from '../../src/api/auth';
import { getClientProfile, updateClientProfile } from '../../src/api/client';
import { useTheme } from '../../src/theme';

const ClientProfileScreen = () => {
    const navigation = useNavigation();
    const { theme, isDark, toggleTheme } = useTheme();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [profile, setProfile] = useState({
        id: '', name: '', email: '', age: '',
        gender: '', fitness_goals: '', medical_conditions: '',
    });

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getClientProfile();
            setProfile({
                id: data.id ?? '',
                name: data.name ?? '',
                email: data.email ?? '',
                age: data.age != null ? data.age.toString() : '',
                gender: data.gender ?? '',
                fitness_goals: data.fitness_goals ?? '',
                medical_conditions: data.medical_conditions ?? '',
            });
        } catch (err) {
            setError('Failed to load profile.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    const handleSave = useCallback(async () => {
        if (saving) return;
        try {
            setSaving(true);
            await updateClientProfile(profile.id, {
                name: profile.name,
                age: profile.age.trim() !== '' ? parseInt(profile.age, 10) : null,
                gender: profile.gender,
                fitness_goals: profile.fitness_goals,
                medical_conditions: profile.medical_conditions,
            });
            Alert.alert('Profile Updated', 'Your changes have been saved.');
        } catch (err) {
            Alert.alert('Error', 'Could not save profile. Please try again.');
        } finally {
            setSaving(false);
        }
    }, [saving, profile]);

    const handleLogout = useCallback(async () => {
        try {
            await userLogout();
            navigation.navigate('Home');
        } catch (err) {
            Alert.alert('Error', 'Something went wrong logging out.');
        }
    }, [navigation]);

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

    if (error) {
        return (
            <ScreenWrapper title="Profile">
                <View style={styles.centered}>
                    <Text style={styles.errorText}>{error}</Text>
                    <CustomButton title="Try Again" onPress={fetchProfile} />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper title="Profile">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.flex}
            >
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                    <Text style={styles.title}>My Profile</Text>

                    <Text style={styles.label}>Name</Text>
                    <TextInput
                        style={styles.input}
                        value={profile.name}
                        placeholderTextColor={theme.placeholder}
                        onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
                    />

                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={[styles.input, styles.inputDisabled]}
                        value={profile.email}
                        editable={false}
                        placeholderTextColor={theme.placeholder}
                    />

                    <Text style={styles.label}>Age</Text>
                    <TextInput
                        style={styles.input}
                        value={profile.age}
                        placeholderTextColor={theme.placeholder}
                        onChangeText={(text) => setProfile(prev => ({ ...prev, age: text }))}
                        keyboardType="number-pad"
                    />

                    <Text style={styles.label}>Gender</Text>
                    <TextInput
                        style={styles.input}
                        value={profile.gender}
                        placeholderTextColor={theme.placeholder}
                        onChangeText={(text) => setProfile(prev => ({ ...prev, gender: text }))}
                    />

                    <Text style={styles.label}>Fitness Goals</Text>
                    <TextInput
                        style={[styles.input, styles.inputMultiline]}
                        value={profile.fitness_goals}
                        placeholderTextColor={theme.placeholder}
                        onChangeText={(text) => setProfile(prev => ({ ...prev, fitness_goals: text }))}
                        multiline
                    />

                    <Text style={styles.label}>Medical Conditions</Text>
                    <TextInput
                        style={[styles.input, styles.inputMultiline]}
                        value={profile.medical_conditions}
                        placeholderTextColor={theme.placeholder}
                        onChangeText={(text) => setProfile(prev => ({ ...prev, medical_conditions: text }))}
                        multiline
                    />

                    <CustomButton
                        title={saving ? 'Saving...' : 'Save Changes'}
                        onPress={handleSave}
                        disabled={saving}
                    />

                    <View style={styles.divider} />

                    <Text style={styles.sectionHeading}>Appearance</Text>
                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>Dark Mode</Text>
                        <Switch
                            value={isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: theme.border, true: theme.primary }}
                            thumbColor={isDark ? '#fff' : '#f4f3f4'}
                        />
                    </View>

                    <View style={styles.divider} />

                    <CustomButton title="Log Out" onPress={handleLogout} color="#ff4d4d" />
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    flex: { flex: 1 },
    container: {
        padding: 20,
        backgroundColor: theme.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        color: theme.text,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 4,
        color: theme.textSecondary,
    },
    input: {
        backgroundColor: theme.inputBackground,
        padding: 12,
        borderRadius: 10,
        fontSize: 16,
        borderWidth: 1,
        borderColor: theme.inputBorder,
        color: theme.text,
    },
    inputDisabled: {
        color: theme.textMuted,
    },
    inputMultiline: {
        textAlignVertical: 'top',
        minHeight: 80,
    },
    divider: {
        height: 1,
        backgroundColor: theme.divider,
        marginVertical: 28,
    },
    sectionHeading: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 12,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.card,
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.border,
    },
    toggleLabel: {
        fontSize: 16,
        color: theme.text,
        fontWeight: '500',
    },
    errorText: {
        color: theme.error,
        fontSize: 16,
        marginBottom: 10,
    },
});

export default ClientProfileScreen;

import React, { useCallback, useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, ScrollView,
    Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import CustomButton from '../../components/CustomButton';
import { userLogout } from '../../src/api/auth';
import { updateClientProfile } from '../../src/api/client';
import { useTheme } from '../../src/theme';

const ClientProfileEditScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { theme, isDark, toggleTheme } = useTheme();

    const initial = route.params?.profile ?? {};
    const [profile, setProfile] = useState({
        id:                 initial.id                 ?? '',
        name:               initial.name               ?? '',
        email:              initial.email              ?? '',
        age:                initial.age != null ? initial.age.toString() : '',
        gender:             initial.gender             ?? '',
        fitness_goals:      initial.fitness_goals      ?? '',
        medical_conditions: initial.medical_conditions ?? '',
    });
    const [saving, setSaving] = useState(false);

    const handleSave = useCallback(async () => {
        if (saving) return;
        try {
            setSaving(true);
            await updateClientProfile({
                name:               profile.name,
                age:                profile.age.trim() !== '' ? parseInt(profile.age, 10) : null,
                gender:             profile.gender,
                fitness_goals:      profile.fitness_goals,
                medical_conditions: profile.medical_conditions,
            });
            Alert.alert('Profile Updated', 'Your changes have been saved.');
            navigation.goBack();
        } catch (err) {
            Alert.alert('Error', 'Could not save profile. Please try again.');
        } finally {
            setSaving(false);
        }
    }, [saving, profile, navigation]);

    const handleLogout = useCallback(async () => {
        try {
            await userLogout();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        } catch (err) {
            Alert.alert('Error', 'Something went wrong logging out.');
        }
    }, [navigation]);

    const styles = makeStyles(theme);

    return (
        <ScreenWrapper title="Edit Profile" showBack>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.flex}
            >
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                    <Text style={styles.title}>Edit Profile</Text>

                    <Text style={styles.label}>Name</Text>
                    <TextInput
                        style={styles.input}
                        value={profile.name}
                        onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
                        placeholderTextColor={theme.placeholder}
                        color={theme.text}
                    />

                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={[styles.input, styles.inputDisabled]}
                        value={profile.email}
                        editable={false}
                        placeholderTextColor={theme.placeholder}
                        color={theme.textMuted}
                    />

                    <Text style={styles.label}>Age</Text>
                    <TextInput
                        style={styles.input}
                        value={profile.age}
                        onChangeText={(text) => setProfile(prev => ({ ...prev, age: text }))}
                        keyboardType="number-pad"
                        placeholderTextColor={theme.placeholder}
                        color={theme.text}
                    />

                    <Text style={styles.label}>Gender</Text>
                    <TextInput
                        style={styles.input}
                        value={profile.gender}
                        onChangeText={(text) => setProfile(prev => ({ ...prev, gender: text }))}
                        placeholderTextColor={theme.placeholder}
                        color={theme.text}
                    />

                    <Text style={styles.label}>Fitness Goals</Text>
                    <TextInput
                        style={[styles.input, styles.inputMultiline]}
                        value={profile.fitness_goals}
                        onChangeText={(text) => setProfile(prev => ({ ...prev, fitness_goals: text }))}
                        multiline
                        placeholderTextColor={theme.placeholder}
                        color={theme.text}
                    />

                    <Text style={styles.label}>Medical Conditions</Text>
                    <TextInput
                        style={[styles.input, styles.inputMultiline]}
                        value={profile.medical_conditions}
                        onChangeText={(text) => setProfile(prev => ({ ...prev, medical_conditions: text }))}
                        multiline
                        placeholderTextColor={theme.placeholder}
                        color={theme.text}
                    />

                    <View style={styles.buttonRow}>
                        <CustomButton
                            title={saving ? 'Saving...' : 'Save Changes'}
                            onPress={handleSave}
                            disabled={saving}
                        />
                    </View>

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
        paddingBottom: 40,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        color: theme.text,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 18,
        marginBottom: 6,
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
        opacity: 0.6,
    },
    inputMultiline: {
        textAlignVertical: 'top',
        minHeight: 80,
    },
    buttonRow: {
        marginTop: 28,
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
});

export default ClientProfileEditScreen;

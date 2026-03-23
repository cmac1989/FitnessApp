import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import CustomButton from '../../components/CustomButton';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { userLogout } from '../../src/api/auth';
import { getClientProfile, updateClientProfile } from '../../src/api/client';
import { useTheme } from '../../src/theme';

const ProfileSettingsScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const styles = makeStyles(theme);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        age: '',
        gender: '',
        fitness_goals: '',
        medical_conditions: '',
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getClientProfile();
                setProfile({
                    name:               data.name ?? '',
                    email:              data.email ?? '',
                    age:                data.age != null ? data.age.toString() : '',
                    gender:             data.gender ?? '',
                    fitness_goals:      data.fitness_goals ?? '',
                    medical_conditions: data.medical_conditions ?? '',
                });
            } catch (err) {
                console.error('Error fetching client profile:', err);
                setError('Failed to load profile.');
            }
        };
        fetchProfile();
    }, []);

    const handleSaveChanges = async () => {
        setLoading(true);
        try {
            await updateClientProfile({
                name:               profile.name,
                age:                profile.age === '' ? null : parseInt(profile.age, 10),
                gender:             profile.gender,
                fitness_goals:      profile.fitness_goals,
                medical_conditions: profile.medical_conditions,
            });
            Alert.alert('Profile Updated', 'Your changes have been saved.');
            navigation.goBack();
        } catch (err) {
            console.error('Cannot update profile:', err);
            Alert.alert('Error', 'Could not update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await userLogout();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        } catch (err) {
            console.error('Error logging out:', err);
            Alert.alert('Error', 'Something went wrong logging out.');
        }
    };

    return (
        <ScreenWrapper title="Profile">
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>Profile Settings</Text>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
                    color={theme.textSecondary}
                />

                <Text style={styles.label}>Age</Text>
                <TextInput
                    style={styles.input}
                    value={profile.age}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, age: text }))}
                    keyboardType="number-pad"
                    placeholderTextColor={theme.placeholder}
                    placeholder="e.g. 28"
                    color={theme.text}
                />

                <Text style={styles.label}>Gender</Text>
                <TextInput
                    style={styles.input}
                    value={profile.gender}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, gender: text }))}
                    placeholderTextColor={theme.placeholder}
                    placeholder="e.g. Male, Female, Non-binary"
                    color={theme.text}
                />

                <Text style={styles.label}>Fitness Goals</Text>
                <TextInput
                    style={[styles.input, styles.inputMultiline]}
                    value={profile.fitness_goals}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, fitness_goals: text }))}
                    placeholderTextColor={theme.placeholder}
                    placeholder="e.g. Lose weight, build muscle"
                    color={theme.text}
                    multiline
                />

                <Text style={styles.label}>Medical Conditions</Text>
                <TextInput
                    style={[styles.input, styles.inputMultiline]}
                    value={profile.medical_conditions}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, medical_conditions: text }))}
                    placeholderTextColor={theme.placeholder}
                    placeholder="Any conditions your trainer should know about"
                    color={theme.text}
                    multiline
                />

                <View style={styles.buttonRow}>
                    <CustomButton
                        title={loading ? 'Saving…' : 'Save Changes'}
                        onPress={handleSaveChanges}
                        disabled={loading}
                    />
                </View>

                <View style={styles.divider} />

                <CustomButton title="Log Out" onPress={handleLogout} color="#ff4d4d" />
            </ScrollView>
        </ScreenWrapper>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: theme.background,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        color: theme.text,
    },
    errorText: {
        color: theme.error,
        fontSize: 14,
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
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
        minHeight: 80,
        textAlignVertical: 'top',
    },
    buttonRow: {
        marginTop: 28,
    },
    divider: {
        height: 1,
        backgroundColor: theme.divider,
        marginVertical: 30,
    },
});

export default ProfileSettingsScreen;

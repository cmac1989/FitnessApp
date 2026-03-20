import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import CustomButton from '../../components/CustomButton';
import { userLogout } from '../../src/api/auth';
import { getClientProfile, updateClientProfile } from '../../src/api/client';

const ClientProfileScreen = () => {
    const navigation = useNavigation();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [profile, setProfile] = useState({
        id: '',
        name: '',
        email: '',
        age: '',
        gender: '',
        fitness_goals: '',
        medical_conditions: '',
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

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

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

    if (loading) {
        return (
            <ScreenWrapper title="Profile">
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#007bff" />
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
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.title}>My Profile</Text>

                    <Text style={styles.label}>Name</Text>
                    <TextInput
                        style={styles.input}
                        value={profile.name}
                        onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
                    />

                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={[styles.input, styles.inputDisabled]}
                        value={profile.email}
                        editable={false}
                    />

                    <Text style={styles.label}>Age</Text>
                    <TextInput
                        style={styles.input}
                        value={profile.age}
                        onChangeText={(text) => setProfile(prev => ({ ...prev, age: text }))}
                        keyboardType="number-pad"
                    />

                    <Text style={styles.label}>Gender</Text>
                    <TextInput
                        style={styles.input}
                        value={profile.gender}
                        onChangeText={(text) => setProfile(prev => ({ ...prev, gender: text }))}
                    />

                    <Text style={styles.label}>Fitness Goals</Text>
                    <TextInput
                        style={[styles.input, styles.inputMultiline]}
                        value={profile.fitness_goals}
                        onChangeText={(text) => setProfile(prev => ({ ...prev, fitness_goals: text }))}
                        multiline
                    />

                    <Text style={styles.label}>Medical Conditions</Text>
                    <TextInput
                        style={[styles.input, styles.inputMultiline]}
                        value={profile.medical_conditions}
                        onChangeText={(text) => setProfile(prev => ({ ...prev, medical_conditions: text }))}
                        multiline
                    />

                    <CustomButton
                        title={saving ? 'Saving...' : 'Save Changes'}
                        onPress={handleSave}
                    />

                    <View style={styles.divider} />

                    <CustomButton title="Log Out" onPress={handleLogout} color="#ff4d4d" />
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    container: {
        padding: 20,
        backgroundColor: '#f8f8f8',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 15,
    },
    input: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 10,
        marginTop: 5,
        fontSize: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 3,
        elevation: 1,
    },
    inputDisabled: {
        color: '#999',
    },
    inputMultiline: {
        textAlignVertical: 'top',
        minHeight: 80,
    },
    divider: {
        height: 1,
        backgroundColor: '#ddd',
        marginVertical: 30,
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        marginBottom: 10,
    },
});

export default ClientProfileScreen;

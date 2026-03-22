import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import CustomButton from '../../components/CustomButton';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { userLogout } from '../../src/api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTrainerProfile, updateTrainerProfile } from '../../src/api/trainer';
import { useTheme } from '../../src/theme';

const ProfileSettingsScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [profile, setProfile] = useState({
        id: '',
        name: '',
        email: '',
        certifications: '',
        years_experience: '',
        specialties: '',
        bio: '',
        availability: '',
        location: '',
    });

    const fetchProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (!token) { return; }

            const response = await getTrainerProfile(token);
            const profileData = response.data || response;

            setProfile({
                ...profileData,
                years_experience: profileData.years_experience?.toString() || '',
                specialties: Array.isArray(profileData.specialties)
                    ? profileData.specialties.join(', ')
                    : (profileData.specialties || ''),
                availability: profileData.availability || '',
                location: profileData.location || '',
                certifications: profileData.certifications || '',
                bio: profileData.bio || '',
            });
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleSaveChanges = async () => {
        try {
            await updateTrainerProfile(profile.id, {
                ...profile,
                years_experience: profile.years_experience === '' ? null : parseInt(profile.years_experience, 10),
            });
        } catch (err) {
            console.error('Cannot update profile', err);
            Alert.alert('Error', 'Could not update profile.');
            return;
        }

        navigation.goBack();
        Alert.alert('Profile Updated', 'Your changes have been saved.');
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

    const styles = makeStyles(theme);

    return (
        <ScreenWrapper title="Profile">
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Profile Settings</Text>

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
                    onChangeText={(text) => setProfile(prev => ({ ...prev, email: text }))}
                    keyboardType="email-address"
                    editable={false}
                    placeholderTextColor={theme.placeholder}
                    color={theme.textSecondary}
                />

                <Text style={styles.label}>Certifications</Text>
                <TextInput
                    style={styles.input}
                    value={profile.certifications}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, certifications: text }))}
                    placeholderTextColor={theme.placeholder}
                    color={theme.text}
                />

                <Text style={styles.label}>Years Experience</Text>
                <TextInput
                    style={styles.input}
                    value={profile.years_experience}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, years_experience: text }))}
                    keyboardType="numeric"
                    placeholderTextColor={theme.placeholder}
                    color={theme.text}
                />

                <Text style={styles.label}>Specialties</Text>
                <TextInput
                    style={styles.input}
                    value={profile.specialties}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, specialties: text }))}
                    placeholderTextColor={theme.placeholder}
                    color={theme.text}
                />

                <Text style={styles.label}>Bio</Text>
                <TextInput
                    style={styles.input}
                    value={profile.bio}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, bio: text }))}
                    placeholderTextColor={theme.placeholder}
                    color={theme.text}
                />

                <Text style={styles.label}>Availability</Text>
                <TextInput
                    style={styles.input}
                    value={profile.availability}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, availability: text }))}
                    placeholderTextColor={theme.placeholder}
                    color={theme.text}
                />

                <Text style={styles.label}>Location</Text>
                <TextInput
                    style={styles.input}
                    value={profile.location}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, location: text }))}
                    placeholderTextColor={theme.placeholder}
                    color={theme.text}
                />

                <View style={styles.buttonRow}>
                    <CustomButton title="Save Changes" onPress={handleSaveChanges} />
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

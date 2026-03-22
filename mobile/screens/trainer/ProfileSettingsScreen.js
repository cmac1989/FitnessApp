import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import CustomButton from '../../components/CustomButton';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { userLogout } from '../../src/api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTrainerProfile, updateTrainerProfile } from '../../src/api/trainer';
import { useTheme } from '../../src/theme';

const ProfileSettingsScreen = () => {
    const navigation = useNavigation();
    const { theme, isDark, toggleTheme } = useTheme();

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

    const fetchTrainerProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (!token) { return; }

            const response = await getTrainerProfile(token);
            const profileData = response.data || response;

            setProfile({
                ...profileData,
                specialties: Array.isArray(profileData.specialties)
                    ? profileData.specialties.join(', ')
                    : profileData.specialties ?? '',
                years_experience: profileData.years_experience?.toString() ?? '',
            });
        } catch (err) {
            if (err.response?.status !== 404) {
                console.error('Error fetching profile:', err);
                setError('Failed to load profile');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrainerProfile();
    }, []);

    const handleSaveChanges = async () => {
        try {
            await updateTrainerProfile(profile.id, {
                ...profile,
                years_experience: parseInt(profile.years_experience) || 0,
                specialties: profile.specialties
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean),
            });
            navigation.goBack();
            Alert.alert('Profile Updated', 'Your changes have been saved.');
        } catch (error) {
            console.error('Cannot update profile', error);
            Alert.alert('Error', 'Failed to save changes.');
        }
    };

    const handleLogout = async () => {
        try {
            await userLogout();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        } catch (error) {
            console.error('Error logging out:', error);
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
                    placeholderTextColor={theme.placeholder}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
                />

                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={styles.input}
                    value={profile.email}
                    placeholderTextColor={theme.placeholder}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, email: text }))}
                    keyboardType="email-address"
                />

                <Text style={styles.label}>Certifications</Text>
                <TextInput
                    style={styles.input}
                    value={profile.certifications}
                    placeholderTextColor={theme.placeholder}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, certifications: text }))}
                />

                <Text style={styles.label}>Years Experience</Text>
                <TextInput
                    style={styles.input}
                    value={profile.years_experience?.toString() ?? ''}
                    placeholderTextColor={theme.placeholder}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, years_experience: text }))}
                    keyboardType="number-pad"
                />

                <Text style={styles.label}>Specialties</Text>
                <TextInput
                    style={styles.input}
                    value={profile.specialties}
                    placeholder="e.g. Weight Loss, Strength Training"
                    placeholderTextColor={theme.placeholder}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, specialties: text }))}
                />

                <Text style={styles.label}>Bio</Text>
                <TextInput
                    style={[styles.input, styles.multilineInput]}
                    value={profile.bio}
                    placeholderTextColor={theme.placeholder}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, bio: text }))}
                    multiline
                    numberOfLines={3}
                />

                <Text style={styles.label}>Availability</Text>
                <TextInput
                    style={styles.input}
                    value={profile.availability}
                    placeholder="e.g. Mon–Fri 6am–8pm"
                    placeholderTextColor={theme.placeholder}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, availability: text }))}
                />

                <Text style={styles.label}>Location</Text>
                <TextInput
                    style={styles.input}
                    value={profile.location}
                    placeholderTextColor={theme.placeholder}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, location: text }))}
                />

                <CustomButton title="Save Changes" onPress={handleSaveChanges} />

                <View style={styles.divider} />

                {/* Appearance */}
                <Text style={styles.sectionHeading}>Appearance</Text>
                <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>Dark Mode</Text>
                    <Switch
                        value={isDark}
                        onValueChange={toggleTheme}
                        trackColor={{ false: theme.border, true: theme.primary }}
                        thumbColor={isDark ? theme.primaryText === '#000000' ? '#fff' : theme.primary : '#f4f3f4'}
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
    label: {
        fontSize: 15,
        fontWeight: '600',
        marginTop: 16,
        color: theme.textSecondary,
    },
    input: {
        backgroundColor: theme.inputBackground,
        padding: 12,
        borderRadius: 10,
        marginTop: 6,
        fontSize: 16,
        color: theme.text,
        borderWidth: 1,
        borderColor: theme.inputBorder,
    },
    multilineInput: {
        minHeight: 80,
        textAlignVertical: 'top',
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

export default ProfileSettingsScreen;

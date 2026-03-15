import React, {useEffect, useState} from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import CustomButton from '../../components/CustomButton';
import {useNavigation} from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import {userLogout} from '../../src/api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getTrainerProfile, updateTrainerProfile} from '../../src/api/trainer';

const ProfileSettingsScreen = () => {
    const navigation = useNavigation();

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
            if (!token) {return;}

            const response = await getTrainerProfile(token);

            const profileData = response.data || response;

            setProfile(profileData);
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Failed to load profile');
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
            });
        } catch(error) {
            console.error('Cannot update profile', error);
        }
        navigation.goBack();
        Alert.alert('Profile Updated', 'Your changes have been saved.');
    };

    const handleLogout = async () => {
        try {
            await userLogout();
            Alert.alert('Logged Out', 'You have been logged out.');
            navigation.navigate('Home');
        } catch (error) {
            console.error('Error logging out:', error);
            Alert.alert('Error', 'Something went wrong logging out.');
        }
    };

    return (
        <ScreenWrapper title="Profile">
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Profile Settings</Text>

                <Text style={styles.label}>Name</Text>
                <TextInput
                    style={styles.input}
                    value={profile.name}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
                />

                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={styles.input}
                    value={profile.email}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, email: text }))}
                    keyboardType="email-address"
                />

                <Text style={styles.label}>Certifications</Text>
                <TextInput
                    style={styles.input}
                    value={profile.certifications}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, certifications: text }))}
                />

                <Text style={styles.label}>Years Experience</Text>
                <TextInput
                    style={styles.input}
                    value={profile.years_experience.toString()}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, years_experience: text }))}
                />

                <Text style={styles.label}>Specialties</Text>
                <TextInput
                    style={styles.input}
                    value={profile.specialties}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, specialties: text }))}
                />

                <Text style={styles.label}>Bio</Text>
                <TextInput
                    style={styles.input}
                    value={profile.bio}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, bio: text }))}
                />

                <Text style={styles.label}>Availability</Text>
                <TextInput
                    style={styles.input}
                    value={profile.availability}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, availability: text }))}
                />

                <Text style={styles.label}>Location</Text>
                <TextInput
                    style={styles.input}
                    value={profile.location}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, location: text }))}
                />

                <CustomButton title="Save Changes" onPress={handleSaveChanges} />

                <View style={styles.divider} />

                <CustomButton title="Log Out" onPress={handleLogout} color="#ff4d4d" />
            </ScrollView>
        </ScreenWrapper>
    );
};

// Styles
const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f8f8f8',
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
    },
    divider: {
        height: 1,
        backgroundColor: '#ddd',
        marginVertical: 30,
    },
});

export default ProfileSettingsScreen;

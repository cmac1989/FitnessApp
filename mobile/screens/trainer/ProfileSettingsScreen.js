import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import CustomButton from '../../components/CustomButton';
import {useNavigation} from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';

const ProfileSettingsScreen = () => {
    const navigation = useNavigation();
    // Mock profile info — eventually you'd fetch this from your API
    const [profile, setProfile] = useState({
        name: 'Jordan Lee',
        email: 'jordan.trainer@example.com',
        certifications: 'Animal Flow',
        experience: '14 years',
        specialties: 'Strength Training',
        bio: 'I am a coach',
        availability: 'full-time',
        location: 'Canada',
    });

    const handleSaveChanges = () => {
        // Add API call here later
        Alert.alert('Profile Updated', 'Your changes have been saved.');
    };

    const handleLogout = () => {
        // Add logout logic later
        Alert.alert('Logged Out', 'You have been logged out.');
        navigation.navigate('Home');
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
                    onChangeText={(text) => setProfile(prev => ({ ...prev, email: text }))}
                    keyboardType="email-address"
                />

                <Text style={styles.label}>Years Experience</Text>
                <TextInput
                    style={styles.input}
                    value={profile.experience}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, email: text }))}
                    keyboardType="email-address"
                />

                <Text style={styles.label}>Specialties</Text>
                <TextInput
                    style={styles.input}
                    value={profile.specialties}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, specialty: text }))}
                />

                <Text style={styles.label}>Bio</Text>
                <TextInput
                    style={styles.input}
                    value={profile.bio}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, specialty: text }))}
                />

                <Text style={styles.label}>Availability</Text>
                <TextInput
                    style={styles.input}
                    value={profile.availability}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, specialty: text }))}
                />

                <Text style={styles.label}>Location</Text>
                <TextInput
                    style={styles.input}
                    value={profile.location}
                    onChangeText={(text) => setProfile(prev => ({ ...prev, specialty: text }))}
                />

                <CustomButton title="Save Changes" onPress={handleSaveChanges} />

                <View style={styles.divider} />

                <CustomButton title="Log Out" onPress={handleLogout} color="#ff4d4d" />
            </ScrollView>
        </ScreenWrapper>
    );
};

//TODO store in its own file

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

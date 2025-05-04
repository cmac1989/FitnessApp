import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView } from 'react-native';
import CustomButton from '../../components/CustomButton';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from "../../components/ScreenWrapper";

const CreateSessionScreen = () => {
    const navigation = useNavigation();

    const [sessionInfo, setSessionInfo] = useState({
        client: '',
        date: '',
        time: '',
        location: '',
    });

    const handleCreateSession = () => {
        if (!sessionInfo.client || !sessionInfo.date || !sessionInfo.time || !sessionInfo.location) {
            Alert.alert('Missing Info', 'Please fill out all fields.');
            return;
        }

        // You can replace this with a POST API call later
        console.log('New Session:', sessionInfo);

        Alert.alert('Session Created', `Session with ${sessionInfo.client} scheduled!`);
        navigation.goBack();
    };

    return (
        <ScreenWrapper title="New Session">
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Create New Session</Text>

                <Text style={styles.label}>Client Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter client name"
                    value={sessionInfo.client}
                    onChangeText={text => setSessionInfo(prev => ({ ...prev, client: text }))}
                />

                <Text style={styles.label}>Date</Text>
                <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    value={sessionInfo.date}
                    onChangeText={text => setSessionInfo(prev => ({ ...prev, date: text }))}
                />

                <Text style={styles.label}>Time</Text>
                <TextInput
                    style={styles.input}
                    placeholder="HH:MM AM/PM"
                    value={sessionInfo.time}
                    onChangeText={text => setSessionInfo(prev => ({ ...prev, time: text }))}
                />

                <Text style={styles.label}>Location</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter location"
                    value={sessionInfo.location}
                    onChangeText={text => setSessionInfo(prev => ({ ...prev, location: text }))}
                />

                <CustomButton
                    title="Create Session"
                    onPress={handleCreateSession}
                />
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f8f8f8',
        flexGrow: 1,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        backgroundColor: '#fff',
    },
});

export default CreateSessionScreen;

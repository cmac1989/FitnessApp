import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import CustomButton from '../../components/CustomButton';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';

const EditSessionScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { session } = route.params;

    const [client, setClient] = useState(session.client);
    const [date, setDate] = useState(session.date);
    const [time, setTime] = useState(session.time);
    const [location, setLocation] = useState(session.location);
    const [workout, setWorkout] = useState(session.workout || '');

    const handleSave = () => {
        // Normally here you'd make an API call to update the session
        Alert.alert('Success', 'Session details updated.');
        navigation.goBack();
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Edit Session</Text>

            <Text style={styles.label}>Client</Text>
            <TextInput
                style={styles.input}
                value={client}
                onChangeText={setClient}
            />

            <Text style={styles.label}>Date</Text>
            <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
            />

            <Text style={styles.label}>Time</Text>
            <TextInput
                style={styles.input}
                value={time}
                onChangeText={setTime}
            />

            <Text style={styles.label}>Location</Text>
            <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
            />

            <CustomButton title="Save Changes" onPress={handleSave} />
        </ScrollView>
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
        fontWeight: '600',
        marginTop: 10,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginTop: 5,
        borderColor: '#ddd',
        borderWidth: 1,
    },
});

export default EditSessionScreen;

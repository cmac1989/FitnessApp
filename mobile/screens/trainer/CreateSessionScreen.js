import React, {useEffect, useState} from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView } from 'react-native';
import CustomButton from '../../components/CustomButton';
import { useNavigation } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import { createSession } from '../../src/api/trainingSession';
import { getClients } from '../../src/api/user';

const CreateSessionScreen = () => {
    const navigation = useNavigation();
    const [clients, setClients] = useState([]);
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(null);

    // fetch clients once
    useEffect(() => {
        getClients()
            .then(data => {
                setClients(
                    data.map(client => ({ label: client.name, value: client.id }))
                );
            })
            .catch(err => console.error('Failed to load clients', err));
    }, []);

    const [sessionInfo, setSessionInfo] = useState({
        client_id: null,
        scheduled_at: '',
        location: '',
    });

    const handleCreateSession = async () => {
        const { client_id, scheduled_at, location } = sessionInfo;
        if (!client_id || !scheduled_at || !location) {
            Alert.alert('Missing Info', 'Please fill out all fields.');
            return;
        }

        try {
            await createSession(sessionInfo);
            Alert.alert('Success', 'Session created!');
            navigation.goBack();
        } catch (error) {
            console.error(error.response?.data || error);
            Alert.alert('Error', 'Could not create session.');
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Create New Session</Text>

            <Text style={styles.label}>Select Client</Text>
            <DropDownPicker
                open={open}
                value={value}
                items={clients}
                setOpen={setOpen}
                setValue={val => {
                    setValue(val);
                    setSessionInfo(prev => ({ ...prev, client_id: val }));
                }}
                setItems={setClients}
                placeholder="Select a client…"
                style={styles.input}
                dropDownContainerStyle={styles.dropdown}
            />

            <Text style={styles.label}>Date & Time</Text>
            <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD HH:MM:SS"
                value={sessionInfo.scheduled_at}
                onChangeText={text =>
                    setSessionInfo(prev => ({ ...prev, scheduled_at: text }))
                }
            />

            <Text style={styles.label}>Location</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter location"
                value={sessionInfo.location}
                onChangeText={text =>
                    setSessionInfo(prev => ({ ...prev, location: text }))
                }
            />

            <CustomButton title="Create Session" onPress={handleCreateSession} />
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
        fontWeight: '500',
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 15,
        backgroundColor: '#fff',
    },
    dropdown: {
        borderColor: '#ccc',
        borderRadius: 8,
    },
});

export default CreateSessionScreen;

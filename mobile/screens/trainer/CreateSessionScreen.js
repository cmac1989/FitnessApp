import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, SafeAreaView } from 'react-native';
import CustomButton from '../../components/CustomButton';
import { useNavigation } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import { createSession } from '../../src/api/trainingSession';
import { getClients } from '../../src/api/user';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';
import { useTheme } from '../../src/theme';

const CreateSessionScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const [clients, setClients] = useState([]);
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(null);

    const [sessionInfo, setSessionInfo] = useState({
        client_id: null,
        client_name: '',
        scheduled_at: '',
        location: '',
    });

    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

    useEffect(() => {
        getClients()
            .then(data => {
                setClients(
                    data.map(client => ({ label: client.name, value: client.id }))
                );
            })
            .catch(err => console.error('Failed to load clients', err));
    }, []);

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

    const handleConfirm = (date) => {
        const formattedDate = moment(date).format('YYYY-MM-DD HH:mm:ss');
        setSessionInfo(prev => ({ ...prev, scheduled_at: formattedDate }));
        setDatePickerVisibility(false);
    };

    const styles = makeStyles(theme);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Create New Session</Text>

                <Text style={styles.label}>Select Client</Text>
                <DropDownPicker
                    open={open}
                    value={value}
                    items={clients}
                    setOpen={setOpen}
                    setValue={setValue}
                    setItems={setClients}
                    placeholder="Select a client…"
                    onChangeValue={(val) => {
                        const selectedClient = clients.find(c => c.value === val);
                        setSessionInfo(prev => ({
                            ...prev,
                            client_id: val,
                            client_name: selectedClient ? selectedClient.label : '',
                        }));
                    }}
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownContainer}
                    textStyle={{ color: theme.text }}
                    placeholderStyle={{ color: theme.placeholder }}
                    selectedItemContainerStyle={{ backgroundColor: theme.backgroundSecondary }}
                />

                <Text style={styles.label}>Date & Time</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Tap to pick date & time"
                    placeholderTextColor={theme.placeholder}
                    value={sessionInfo.scheduled_at}
                    onFocus={() => setDatePickerVisibility(true)}
                    showSoftInputOnFocus={false}
                />

                <DateTimePickerModal
                    isVisible={isDatePickerVisible}
                    mode="datetime"
                    onConfirm={handleConfirm}
                    onCancel={() => setDatePickerVisibility(false)}
                    date={sessionInfo.scheduled_at ? new Date(sessionInfo.scheduled_at) : new Date()}
                />

                <Text style={styles.label}>Location</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter location"
                    placeholderTextColor={theme.placeholder}
                    value={sessionInfo.location}
                    onChangeText={text => setSessionInfo(prev => ({ ...prev, location: text }))}
                />

                <CustomButton title="Create Session" onPress={handleCreateSession} />
            </ScrollView>
        </SafeAreaView>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.background,
    },
    container: {
        padding: 20,
        backgroundColor: theme.background,
        flexGrow: 1,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        color: theme.text,
    },
    label: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 6,
        color: theme.textSecondary,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.inputBorder,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginBottom: 16,
        backgroundColor: theme.inputBackground,
        color: theme.text,
        fontSize: 16,
    },
    dropdown: {
        borderColor: theme.inputBorder,
        borderRadius: 8,
        backgroundColor: theme.inputBackground,
        marginBottom: 16,
    },
    dropdownContainer: {
        borderColor: theme.inputBorder,
        backgroundColor: theme.card,
    },
});

export default CreateSessionScreen;

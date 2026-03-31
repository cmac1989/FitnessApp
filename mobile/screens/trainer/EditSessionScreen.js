import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, SafeAreaView } from 'react-native';
import CustomButton from '../../components/CustomButton';
import { useNavigation, useRoute } from '@react-navigation/native';
import { updateSession } from '../../src/api/trainingSession';
import { useTheme } from '../../src/theme';
import { useToast } from '../../src/context/ToastContext';

const EditSessionScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { session } = route.params;
    const { theme } = useTheme();
    const { showToast } = useToast();

    const [client, setClient] = useState(session.client);
    const [date, setDate] = useState(session.date);
    const [time, setTime] = useState(session.time);
    const [location, setLocation] = useState(session.location);
    const [workout, setWorkout] = useState(session.workout || '');

    const handleSave = async () => {
        try {
            const updatedSession = {
                ...session,
                client,
                scheduled_at: `${date} ${time}`,
                location,
                workout,
            };
            await updateSession(session.id, updatedSession);
            showToast('Session details updated.', 'success');
            navigation.goBack();
        } catch (error) {
            console.error('Could not update session', error);
            showToast('Could not update session.', 'error');
        }
    };

    const styles = makeStyles(theme);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Edit Session</Text>

                <Text style={styles.label}>Client</Text>
                <TextInput
                    style={styles.input}
                    value={client}
                    onChangeText={setClient}
                    placeholderTextColor={theme.placeholder}
                />

                <Text style={styles.label}>Date</Text>
                <TextInput
                    style={styles.input}
                    value={date}
                    onChangeText={setDate}
                    placeholderTextColor={theme.placeholder}
                    placeholder="YYYY-MM-DD"
                />

                <Text style={styles.label}>Time</Text>
                <TextInput
                    style={styles.input}
                    value={time}
                    onChangeText={setTime}
                    placeholderTextColor={theme.placeholder}
                    placeholder="HH:MM"
                />

                <Text style={styles.label}>Location</Text>
                <TextInput
                    style={styles.input}
                    value={location}
                    onChangeText={setLocation}
                    placeholderTextColor={theme.placeholder}
                />

                <CustomButton title="Save Changes" onPress={handleSave} />
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
        fontWeight: '600',
        marginTop: 12,
        marginBottom: 4,
        color: theme.textSecondary,
    },
    input: {
        backgroundColor: theme.inputBackground,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        borderColor: theme.inputBorder,
        borderWidth: 1,
        color: theme.text,
    },
});

export default EditSessionScreen;

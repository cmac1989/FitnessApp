import React from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView, ScrollView } from 'react-native';
import CustomButton from '../../components/CustomButton';
import { useNavigation, useRoute } from '@react-navigation/native';
import { deleteSession } from '../../src/api/trainingSession';
import { useTheme } from '../../src/theme';

const SessionDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { session } = route.params;
    const { theme } = useTheme();

    const styles = makeStyles(theme);

    if (!session) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <Text style={styles.errorText}>No session details available.</Text>
            </SafeAreaView>
        );
    }

    const handleDeleteSession = async (sessionId) => {
        try {
            await deleteSession(sessionId);
            Alert.alert('Deleted', 'Session successfully removed.');
            navigation.goBack();
        } catch (error) {
            console.error('Could not delete session', error);
            Alert.alert('Error', 'Could not delete session.');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Session Details</Text>

                <View style={styles.detailCard}>
                    <DetailRow label="Client" value={session.client} theme={theme} />
                    <DetailRow label="Date" value={session.date} theme={theme} />
                    <DetailRow label="Time" value={session.time} theme={theme} />
                    <DetailRow label="Location" value={session.location} theme={theme} />
                    {session.workout && (
                        <DetailRow label="Workout Plan" value={session.workout} theme={theme} />
                    )}
                </View>

                <CustomButton
                    title="Edit Session"
                    onPress={() => navigation.navigate('EditSession', { session })}
                />
                <CustomButton
                    title="Delete Session"
                    onPress={() => handleDeleteSession(session.id)}
                    color="#ff4d4d"
                />
            </ScrollView>
        </SafeAreaView>
    );
};

const DetailRow = ({ label, value, theme }) => {
    const styles = makeStyles(theme);
    return (
        <View style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value ?? 'N/A'}</Text>
        </View>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.background,
    },
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: theme.background,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        color: theme.text,
    },
    detailCard: {
        backgroundColor: theme.card,
        padding: 20,
        borderRadius: 12,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
    },
    row: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    value: {
        fontSize: 16,
        color: theme.text,
        marginTop: 4,
    },
    errorText: {
        fontSize: 17,
        color: theme.error,
        textAlign: 'center',
        margin: 20,
    },
});

export default SessionDetailScreen;

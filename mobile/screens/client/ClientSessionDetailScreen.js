import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useTheme } from '../../src/theme';

const ClientSessionDetailScreen = () => {
    const route = useRoute();
    const session = route.params?.session;
    const { theme } = useTheme();

    const styles = makeStyles(theme);

    if (!session) {
        return (
            <ScreenWrapper title="Session Details">
                <View style={styles.centered}>
                    <Text style={styles.errorText}>No session details available.</Text>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper title="Session Details">
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Session Details</Text>

                <View style={styles.card}>
                    <DetailRow label="Trainer" value={session.trainer} theme={theme} />
                    <DetailRow label="Date" value={session.date} theme={theme} />
                    <DetailRow label="Time" value={session.time} theme={theme} />
                    <DetailRow label="Location" value={session.location} theme={theme} />
                    {session.status ? (
                        <DetailRow label="Status" value={session.status} theme={theme} />
                    ) : null}
                </View>
            </ScrollView>
        </ScreenWrapper>
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
    container: {
        padding: 20,
        backgroundColor: theme.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        color: theme.text,
    },
    card: {
        backgroundColor: theme.card,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
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
    },
});

export default ClientSessionDetailScreen;

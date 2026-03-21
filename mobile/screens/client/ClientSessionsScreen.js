import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import CustomButton from '../../components/CustomButton';
import { getClientSessions } from '../../src/api/client';
import { useTheme } from '../../src/theme';

const ClientSessionsScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSessions = useCallback(async (cancelled) => {
        try {
            setLoading(true);
            setError(null);
            const data = await getClientSessions();
            if (cancelled.value) return;
            const formatted = data.map(session => ({
                id: session.id.toString(),
                trainer: session.trainer ? session.trainer.name : 'Unknown',
                date: session.scheduled_at.substring(0, 10),
                time: session.scheduled_at.substring(11, 16),
                location: session.location,
                status: session.status,
            }));
            setSessions(formatted);
        } catch (err) {
            if (!cancelled.value) setError('Could not load sessions.');
        } finally {
            if (!cancelled.value) setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            const cancelled = { value: false };
            fetchSessions(cancelled);
            return () => { cancelled.value = true; };
        }, [fetchSessions])
    );

    const styles = makeStyles(theme);

    if (loading) {
        return (
            <ScreenWrapper title="My Sessions">
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            </ScreenWrapper>
        );
    }

    const renderItem = ({ item }) => (
        <Pressable
            onPress={() => navigation.navigate('ClientSessionDetail', { session: item })}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
            <Text style={styles.cardTitle}>Trainer: {item.trainer}</Text>
            <Text style={styles.cardDetail}>{item.date} at {item.time}</Text>
            <Text style={styles.cardDetail}>Location: {item.location}</Text>
            {item.status ? <Text style={styles.cardStatus}>Status: {item.status}</Text> : null}
        </Pressable>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Sessions Yet</Text>
            <Text style={styles.emptySubtitle}>Your trainer will schedule sessions with you here.</Text>
        </View>
    );

    return (
        <ScreenWrapper title="My Sessions">
            <View style={styles.container}>
                <Text style={styles.title}>My Sessions</Text>
                {error ? (
                    <View style={styles.centered}>
                        <Text style={styles.errorText}>{error}</Text>
                        <CustomButton title="Try Again" onPress={() => fetchSessions({ value: false })} />
                    </View>
                ) : (
                    <FlatList
                        data={sessions}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={renderEmpty}
                    />
                )}
            </View>
        </ScreenWrapper>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
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
    listContent: {
        paddingBottom: 20,
    },
    card: {
        backgroundColor: theme.card,
        padding: 16,
        borderRadius: 10,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: theme.border,
    },
    pressed: { opacity: 0.75 },
    cardTitle: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 5,
        color: theme.text,
    },
    cardDetail: {
        fontSize: 14,
        color: theme.textSecondary,
        marginTop: 2,
    },
    cardStatus: {
        fontSize: 14,
        color: theme.accent,
        marginTop: 4,
        fontWeight: '500',
    },
    errorText: {
        color: theme.error,
        textAlign: 'center',
        marginBottom: 10,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
        paddingHorizontal: 30,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: theme.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default ClientSessionsScreen;

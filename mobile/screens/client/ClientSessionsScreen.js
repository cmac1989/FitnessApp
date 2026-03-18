import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Pressable,
    ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import CustomButton from '../../components/CustomButton';
import { getClientSessions } from '../../src/api/client';

const ClientSessionsScreen = () => {
    const navigation = useNavigation();
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

    const renderItem = useCallback(({ item }) => (
        <Pressable
            onPress={() => navigation.navigate('ClientSessionDetail', { session: item })}
            style={styles.card}
        >
            <Text style={styles.cardTitle}>Trainer: {item.trainer}</Text>
            <Text style={styles.cardDetail}>{item.date} at {item.time}</Text>
            <Text style={styles.cardDetail}>Location: {item.location}</Text>
            {item.status ? (
                <Text style={styles.cardStatus}>Status: {item.status}</Text>
            ) : null}
        </Pressable>
    ), [navigation]);

    if (loading) {
        return (
            <ScreenWrapper title="My Sessions">
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#007bff" />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper title="My Sessions">
            <View style={styles.container}>
                <Text style={styles.title}>My Sessions</Text>
                {error ? (
                    <View style={styles.centered}>
                        <Text style={styles.errorText}>{error}</Text>
                        <CustomButton
                            title="Try Again"
                            onPress={() => fetchSessions({ value: false })}
                        />
                    </View>
                ) : sessions.length === 0 ? (
                    <Text style={styles.emptyText}>No sessions scheduled.</Text>
                ) : (
                    <FlatList
                        data={sessions}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f8f8f8',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    listContent: {
        paddingBottom: 20,
    },
    card: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 4,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 5,
    },
    cardDetail: {
        fontSize: 14,
        color: '#666',
    },
    cardStatus: {
        fontSize: 14,
        color: '#007bff',
        marginTop: 4,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    emptyText: {
        color: '#888',
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
    },
});

export default ClientSessionsScreen;

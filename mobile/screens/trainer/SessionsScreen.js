import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import CustomButton from '../../components/CustomButton';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getAllSessions } from '../../src/api/trainingSession';
import { useTheme } from '../../src/theme';

const SessionsScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const data = await getAllSessions();
            const formattedSessions = data.map(session => ({
                id: session.id.toString(),
                client: session.client ? session.client.name : 'Unknown',
                date: session.scheduled_at.substring(0, 10),
                time: session.scheduled_at.substring(11, 16),
                location: session.location,
            }));
            setSessions(formattedSessions);
        } catch (error) {
            console.error('Could not load sessions', error);
            Alert.alert('Error', 'Could not load sessions.');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchSessions();
        }, [])
    );

    const styles = makeStyles(theme);

    if (loading) {
        return (
            <ScreenWrapper title="Sessions">
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            </ScreenWrapper>
        );
    }

    const renderSessionItem = ({ item }) => (
        <Pressable
            style={({ pressed }) => [styles.sessionCard, pressed && styles.pressed]}
            onPress={() => navigation.navigate('SessionDetail', { session: item })}
        >
            <Text style={styles.sessionTitle}>{item.client}</Text>
            <Text style={styles.sessionDetail}>{item.date} at {item.time}</Text>
            <Text style={styles.sessionDetail}>Location: {item.location}</Text>
        </Pressable>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Sessions Scheduled</Text>
            <Text style={styles.emptySubtitle}>Schedule a session with a client to get started.</Text>
        </View>
    );

    return (
        <ScreenWrapper title="Sessions">
            <View style={styles.container}>
                <Text style={styles.title}>Upcoming Sessions</Text>
                <FlatList
                    data={sessions}
                    keyExtractor={(item) => item.id}
                    renderItem={renderSessionItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmpty}
                />
                <CustomButton
                    title="Schedule New Session"
                    onPress={() => navigation.navigate('CreateSession')}
                />
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
    sessionCard: {
        backgroundColor: theme.card,
        padding: 16,
        borderRadius: 10,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: theme.border,
    },
    pressed: {
        opacity: 0.75,
    },
    sessionTitle: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 5,
        color: theme.text,
    },
    sessionDetail: {
        fontSize: 14,
        color: theme.textSecondary,
        marginTop: 2,
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

export default SessionsScreen;

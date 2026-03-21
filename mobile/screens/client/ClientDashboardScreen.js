import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import CustomButton from '../../components/CustomButton';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getClientStats } from '../../src/api/client';
import { useTheme } from '../../src/theme';

const ClientDashboardScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();

    const [stats, setStats] = useState({
        sessions_today: 0,
        sessions_upcoming: 0,
        trainer_name: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = useCallback(async (cancelled) => {
        try {
            setLoading(true);
            setError(null);
            const data = await getClientStats();
            if (!cancelled.value) setStats(data);
        } catch (err) {
            if (!cancelled.value) setError('Failed to load stats.');
        } finally {
            if (!cancelled.value) setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            const cancelled = { value: false };
            fetchStats(cancelled);
            return () => { cancelled.value = true; };
        }, [fetchStats])
    );

    const styles = makeStyles(theme);

    return (
        <ScreenWrapper title="Dashboard">
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>
                    {stats.trainer_name
                        ? `Welcome!\nYour Trainer: ${stats.trainer_name}`
                        : 'Welcome!'}
                </Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Stats</Text>
                    {loading ? (
                        <ActivityIndicator size="large" color={theme.accent} />
                    ) : error ? (
                        <View style={styles.centered}>
                            <Text style={styles.errorText}>{error}</Text>
                            <CustomButton title="Try Again" onPress={() => fetchStats({ value: false })} />
                        </View>
                    ) : (
                        <View style={styles.statsContainer}>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{stats.sessions_today}</Text>
                                <Text style={styles.statLabel}>Sessions Today</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{stats.sessions_upcoming}</Text>
                                <Text style={styles.statLabel}>Upcoming Sessions</Text>
                            </View>
                        </View>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <CustomButton title="My Sessions" onPress={() => navigation.navigate('Sessions')} />
                    <CustomButton title="My Workouts" onPress={() => navigation.navigate('Workout')} />
                    <CustomButton title="Messages" onPress={() => navigation.navigate('Messages', { client: { name: 'Trainer' } })} />
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: theme.background,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: theme.text,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 15,
        color: theme.textSecondary,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statCard: {
        backgroundColor: theme.card,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    statValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.statValue,
    },
    statLabel: {
        fontSize: 14,
        color: theme.textMuted,
        marginTop: 5,
    },
    centered: {
        alignItems: 'center',
    },
    errorText: {
        color: theme.error,
        textAlign: 'center',
        marginBottom: 10,
    },
});

export default ClientDashboardScreen;

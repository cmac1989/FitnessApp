import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import dashboardStyles from '../../styles/DashboardStyles';
import CustomButton from '../../components/CustomButton';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getClientStats } from '../../src/api/client';

const ClientDashboardScreen = () => {
    const navigation = useNavigation();

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

    return (
        <ScreenWrapper title="Dashboard">
            <ScrollView contentContainerStyle={dashboardStyles.container}>
                <Text style={dashboardStyles.title}>
                    {stats.trainer_name
                        ? `Welcome!\nYour Trainer: ${stats.trainer_name}`
                        : 'Welcome!'}
                </Text>

                <View style={dashboardStyles.section}>
                    <Text style={dashboardStyles.sectionTitle}>Stats</Text>

                    {loading ? (
                        <ActivityIndicator size="large" color="#007bff" />
                    ) : error ? (
                        <View>
                            <Text style={styles.errorText}>{error}</Text>
                            <CustomButton
                                title="Try Again"
                                onPress={() => fetchStats({ value: false })}
                            />
                        </View>
                    ) : (
                        <View style={dashboardStyles.statsContainer}>
                            <View style={dashboardStyles.statCard}>
                                <Text style={dashboardStyles.statValue}>{stats.sessions_today}</Text>
                                <Text style={dashboardStyles.statLabel}>Sessions Today</Text>
                            </View>
                            <View style={dashboardStyles.statCard}>
                                <Text style={dashboardStyles.statValue}>{stats.sessions_upcoming}</Text>
                                <Text style={dashboardStyles.statLabel}>Upcoming Sessions</Text>
                            </View>
                        </View>
                    )}
                </View>

                <View style={dashboardStyles.section}>
                    <Text style={dashboardStyles.sectionTitle}>Quick Actions</Text>
                    <CustomButton
                        title="My Sessions"
                        onPress={() => navigation.navigate('Sessions')}
                    />
                    <CustomButton
                        title="My Workouts"
                        onPress={() => navigation.navigate('Workout')}
                    />
                    <CustomButton
                        title="Messages"
                        onPress={() => navigation.navigate('Messages')}
                    />
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    errorText: {
        color: 'red',
        textAlign: 'center',
    },
});

export default ClientDashboardScreen;

import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import CustomButton from '../../components/CustomButton';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getTrainerStats } from '../../src/api/trainer';
import { useTheme } from '../../src/theme';

const TrainerDashboardScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();

    const [stats, setStats] = useState({
        clients: 0,
        sessions_today: 0,
        total_plans: 0,
    });

    useFocusEffect(
        useCallback(() => {
            const fetchStats = async () => {
                try {
                    const data = await getTrainerStats();
                    setStats(data);
                } catch (error) {
                    console.error('Error fetching trainer stats', error);
                }
            };
            fetchStats();
        }, [])
    );

    const styles = makeStyles(theme);

    return (
        <ScreenWrapper title="Dashboard">
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Welcome, Trainer!</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Stats</Text>
                    <View style={styles.statsContainer}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{stats.clients}</Text>
                            <Text style={styles.statLabel}>Clients</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{stats.sessions_today}</Text>
                            <Text style={styles.statLabel}>Sessions Today</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{stats.total_plans}</Text>
                            <Text style={styles.statLabel}>Total Plans</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <CustomButton
                        title="Add Workout"
                        onPress={() => navigation.navigate('CreateWorkout')}
                    />
                    <CustomButton
                        title="Add Session"
                        onPress={() => navigation.navigate('CreateSession')}
                    />
                    <CustomButton
                        title="Messages"
                        onPress={() => navigation.navigate('MessageList')}
                    />
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
});

export default TrainerDashboardScreen;

import React, {useCallback, useState} from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import dashboardStyles from '../../styles/DashboardStyles';
import CustomButton from '../../components/CustomButton';
import ScreenWrapper from '../../components/ScreenWrapper';
import {getTrainerStats} from '../../src/api/trainer';

const TrainerDashboardScreen = () => {
    const navigation = useNavigation();

    const [stats, setStats] = useState({
        clients: 0,
        sessions_today: 0,
        total_plans: 0
    });

    useFocusEffect(
        useCallback(() => {
            const fetchStats = async () => {
                try {
                    const data = await getTrainerStats();
                    setStats(data);
                } catch(error) {
                    console.error('Error fetching trainer stats', error);
                }
            };
            fetchStats();
        }, [])
    );

    return (
        <ScreenWrapper title="Dashboard">
            <ScrollView contentContainerStyle={dashboardStyles.container}>
                <Text style={dashboardStyles.title}>Welcome, Trainer!</Text>

                <View style={dashboardStyles.section}>
                    <Text style={dashboardStyles.sectionTitle}>Stats</Text>
                    <View style={dashboardStyles.statsContainer}>
                        <View style={dashboardStyles.statCard}>
                            <Text style={dashboardStyles.statValue}>{stats.clients}</Text>
                            <Text style={dashboardStyles.statLabel}>Clients</Text>
                        </View>
                        <View style={dashboardStyles.statCard}>
                            <Text style={dashboardStyles.statValue}>{stats.sessions_today}</Text>
                            <Text style={dashboardStyles.statLabel}>Sessions Today</Text>
                        </View>
                        <View style={dashboardStyles.statCard}>
                            <Text style={dashboardStyles.statValue}>{stats.total_plans}</Text>
                            <Text style={dashboardStyles.statLabel}>Total Plans</Text>
                        </View>
                    </View>
                </View>

                <View style={dashboardStyles.section}>
                    <Text style={dashboardStyles.sectionTitle}>Quick Actions</Text>
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

export default TrainerDashboardScreen;

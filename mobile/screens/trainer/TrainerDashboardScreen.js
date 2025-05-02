import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import dashboardStyles from '../../styles/DashboardStyles';
import CustomButton from '../../components/CustomButton';

const TrainerDashboardScreen = () => {
    const navigation = useNavigation();

    return (
        <ScrollView contentContainerStyle={dashboardStyles.container}>
            <Text style={dashboardStyles.title}>Welcome, Trainer!</Text>

            <View style={dashboardStyles.section}>
                <Text style={dashboardStyles.sectionTitle}>Quick Actions</Text>

                <CustomButton
                    title="View Clients"
                    onPress={() => navigation.navigate('ClientsList')}
                />

                <CustomButton
                    title="Upcoming Sessions"
                    onPress={() => navigation.navigate('Sessions')}
                />

                <CustomButton
                    title="Create Workout Plan"
                    onPress={() => navigation.navigate('CreateWorkout')}
                />

                <CustomButton
                    title="Profile Settings"
                    onPress={() => navigation.navigate('Profile')}
                />

                <CustomButton
                    title="Logout"
                    onPress={() => navigation.navigate('Home')}
                />
            </View>

            <View style={dashboardStyles.section}>
                <Text style={dashboardStyles.sectionTitle}>Stats</Text>
                <View style={dashboardStyles.statsContainer}>
                    <View style={dashboardStyles.statCard}>
                        <Text style={dashboardStyles.statValue}>12</Text>
                        <Text style={dashboardStyles.statLabel}>Clients</Text>
                    </View>
                    <View style={dashboardStyles.statCard}>
                        <Text style={dashboardStyles.statValue}>8</Text>
                        <Text style={dashboardStyles.statLabel}>Sessions Today</Text>
                    </View>
                    <View style={dashboardStyles.statCard}>
                        <Text style={dashboardStyles.statValue}>24</Text>
                        <Text style={dashboardStyles.statLabel}>Total Plans</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

export default TrainerDashboardScreen;

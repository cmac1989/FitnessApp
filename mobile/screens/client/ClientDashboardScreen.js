import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import dashboardStyles from '../../styles/DashboardStyles';
import CustomButton from '../../components/CustomButton';
import ScreenWrapper from '../../components/ScreenWrapper';

const ClientDashboardScreen = () => {
    const navigation = useNavigation();

    return (
        <ScreenWrapper title="Dashboard">
            <ScrollView contentContainerStyle={dashboardStyles.container}>
                <Text style={dashboardStyles.title}>Welcome, Client!</Text>

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
                        // onPress={() => navigation.navigate('Messages')}
                    />
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

export default ClientDashboardScreen;

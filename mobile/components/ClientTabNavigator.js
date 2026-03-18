import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import ClientDashboardScreen from '../screens/client/ClientDashboardScreen';
import ClientSessionsScreen from '../screens/client/ClientSessionsScreen';
import ClientWorkoutListScreen from '../screens/client/ClientWorkoutListScreen';
import ClientProfileScreen from '../screens/client/ClientProfileScreen';

const Tab = createBottomTabNavigator();

const ClientTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#007bff',
                tabBarInactiveTintColor: '#888',
                tabBarStyle: {
                    paddingVertical: 5,
                    height: 70,
                },
            }}
        >
            <Tab.Screen
                name="ClientDashboard"
                component={ClientDashboardScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color }) => (
                        <Icon name="home-outline" color={color} size={24} />
                    ),
                }}
            />
            <Tab.Screen
                name="Sessions"
                component={ClientSessionsScreen}
                options={{
                    tabBarIcon: ({ color }) => (
                        <Icon name="calendar-outline" color={color} size={24} />
                    ),
                }}
            />
            <Tab.Screen
                name="Workout"
                component={ClientWorkoutListScreen}
                options={{
                    tabBarIcon: ({ color }) => (
                        <Icon name="barbell-outline" color={color} size={24} />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ClientProfileScreen}
                options={{
                    tabBarIcon: ({ color }) => (
                        <Icon name="person-outline" color={color} size={24} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

export default ClientTabNavigator;

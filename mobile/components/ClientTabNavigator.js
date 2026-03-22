import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import ClientDashboardScreen from '../screens/client/ClientDashboardScreen';
import CheckInsScreen from '../screens/client/CheckInsScreen';
import ClientWorkoutListScreen from '../screens/client/ClientWorkoutListScreen';
import ClientProfileScreen from '../screens/client/ClientProfileScreen';
import { useTheme } from '../src/theme';

const Tab = createBottomTabNavigator();

const ClientTabNavigator = () => {
    const { theme } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.accent,
                tabBarInactiveTintColor: theme.textMuted,
                tabBarStyle: {
                    backgroundColor: theme.navBar,
                    borderTopColor: theme.navBarBorder,
                    borderTopWidth: 1,
                    paddingVertical: 5,
                    height: 70,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
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
                component={CheckInsScreen}
                options={{
                    tabBarLabel: 'Check-ins',
                    tabBarIcon: ({ color }) => (
                        <Icon name="clipboard-outline" color={color} size={24} />
                    ),
                }}
            />
            <Tab.Screen
                name="Workout"
                component={ClientWorkoutListScreen}
                options={{
                    tabBarLabel: 'Workouts',
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

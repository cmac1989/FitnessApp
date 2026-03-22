import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import TrainerDashboardScreen from '../screens/trainer/TrainerDashboardScreen';
import CheckInsScreen from '../screens/trainer/CheckInsScreen';
import ClientsListScreen from '../screens/trainer/ClientsListScreen';
import WorkoutListScreen from '../screens/trainer/WorkoutListScreen';
import TrainerProfileScreen from '../screens/trainer/TrainerProfileScreen';
import { useTheme } from '../src/theme';

const Tab = createBottomTabNavigator();

const TrainerTabNavigator = () => {
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
                name="TrainerDashboard"
                component={TrainerDashboardScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color }) => (
                        <Icon name="home-outline" color={color} size={24} />
                    ),
                }}
            />
            <Tab.Screen
                name="Clients"
                component={ClientsListScreen}
                options={{
                    tabBarIcon: ({ color }) => (
                        <Icon name="people-outline" color={color} size={24} />
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
                component={WorkoutListScreen}
                options={{
                    tabBarIcon: ({ color }) => (
                        <Icon name="barbell-outline" color={color} size={24} />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={TrainerProfileScreen}
                options={{
                    tabBarIcon: ({ color }) => (
                        <Icon name="person-outline" color={color} size={24} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

export default TrainerTabNavigator;

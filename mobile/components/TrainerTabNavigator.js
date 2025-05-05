import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import TrainerDashboardScreen from '../screens/trainer/TrainerDashboardScreen';
import SessionsScreen from '../screens/trainer/SessionsScreen';
import ClientsListScreen from '../screens/trainer/ClientsListScreen';
import ProfileSettingsScreen from '../screens/trainer/ProfileSettingsScreen';
import WorkoutListScreen from '../screens/trainer/WorkoutListScreen';

const Tab = createBottomTabNavigator();

const TrainerTabNavigator = () => {
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
                name="TrainerDashboard"
                component={TrainerDashboardScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="home-outline" color={color} size={24} />
                    ),
                }}
            />
            <Tab.Screen
                name="Clients"
                component={ClientsListScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="people-outline" color={color} size={24} />
                    ),
                }}
            />
            <Tab.Screen
                name="Sessions"
                component={SessionsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="calendar-outline" color={color} size={24} />
                    ),
                }}
            />
            <Tab.Screen
                name="Workout"
                component={WorkoutListScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="barbell-outline" color={color} size={24} />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileSettingsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="person-outline" color={color} size={24} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

export default TrainerTabNavigator;

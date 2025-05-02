import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import TrainerDashboardScreen from '../screens/trainer/TrainerDashboardScreen';
import SessionsScreen from '../screens/trainer/SessionsScreen';
import ClientsListScreen from '../screens/trainer/ClientsListScreen';
import CreateWorkoutScreen from '../screens/trainer/CreateWorkoutScreen';
import ProfileSettingsScreen from '../screens/trainer/ProfileSettingsScreen';

const Tab = createBottomTabNavigator();

const TrainerTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#007bff',
                tabBarInactiveTintColor: '#888',
                tabBarStyle: {
                    paddingVertical: 5,
                    height: 60,
                },
            }}
        >
            <Tab.Screen
                name="Dashboard"
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
                component={CreateWorkoutScreen}
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

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import ClientTabNavigator from '../components/ClientTabNavigator';
import CreateWorkoutScreen from '../screens/trainer/CreateWorkoutScreen';
import CreateSessionScreen from '../screens/trainer/CreateSessionScreen';
import SessionDetailsScreen from '../screens/trainer/SessionDetailsScreen';
import ClientDetailsScreen from '../screens/trainer/ClientDetailsScreen';
import WorkoutDetailsScreen from '../screens/trainer/WorkoutDetailsScreen';
import EditSessionScreen from '../screens/trainer/EditSessionScreen';
import EditWorkoutScreen from '../screens/trainer/EditWorkoutScreen';
import MessagesScreen from '../screens/trainer/MessagesScreen';

const Stack = createStackNavigator();

const ClientStackNavigator = () => {
    return (
        <Stack.Navigator>
            {/* Tabs */}
            <Stack.Screen
                name="Back"
                component={ClientTabNavigator}
                options={{ headerShown: false }}
            />

            {/* Stack screens on top of tabs */}
            <Stack.Screen name="CreateWorkout" options={{ title: 'Create Workout' }} component={CreateWorkoutScreen} />
            <Stack.Screen name="CreateSession" options={{ title: 'Create Session' }} component={CreateSessionScreen} />
            <Stack.Screen name="SessionDetail" options={{ title: 'Session Details' }} component={SessionDetailsScreen} />
            <Stack.Screen name="ClientDetails" options={{ title: 'Client Details' }} component={ClientDetailsScreen} />
            <Stack.Screen name="WorkoutDetails" options={{ title: 'Workout Details' }} component={WorkoutDetailsScreen} />
            <Stack.Screen name="EditSession" options={{ title: 'Edit Session' }} component={EditSessionScreen} />
            <Stack.Screen name="EditWorkout" options={{ title: 'Edit Workout' }} component={EditWorkoutScreen} />
            <Stack.Screen name="Messages" options={{ title: 'Messages' }} component={MessagesScreen} />
        </Stack.Navigator>
    );
};

export default ClientStackNavigator;

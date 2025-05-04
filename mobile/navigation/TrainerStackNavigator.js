import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TrainerTabNavigator from '../components/TrainerTabNavigator';

import CreateWorkoutScreen from '../screens/trainer/CreateWorkoutScreen';
import CreateSessionScreen from '../screens/trainer/CreateSessionScreen';
import SessionDetailsScreen from '../screens/trainer/SessionDetailsScreen';
import ClientDetailsScreen from '../screens/trainer/ClientDetailsScreen';
import WorkoutDetailsScreen from '../screens/trainer/WorkoutDetailsScreen';
import EditSessionScreen from '../screens/trainer/EditSessionScreen';
import EditWorkoutScreen from '../screens/trainer/EditWorkoutScreen';
import MessagesScreen from '../screens/trainer/MessagesScreen';

const Stack = createStackNavigator();

const TrainerStackNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: true }}>
            {/* Tab Navigator lives here */}
            <Stack.Screen
                name="TrainerTabs"
                component={TrainerTabNavigator}
                options={{ headerShown: false }}
            />

            {/* Screens accessible from within tabs */}
            <Stack.Screen name="CreateWorkout" component={CreateWorkoutScreen} />
            <Stack.Screen name="CreateSession" component={CreateSessionScreen} />
            <Stack.Screen name="SessionDetail" component={SessionDetailsScreen} />
            <Stack.Screen name="ClientDetails" component={ClientDetailsScreen} />
            <Stack.Screen name="WorkoutDetails" component={WorkoutDetailsScreen} />
            <Stack.Screen name="EditSession" component={EditSessionScreen} />
            <Stack.Screen name="EditWorkout" component={EditWorkoutScreen} />
            <Stack.Screen name="Messages" component={MessagesScreen} />
        </Stack.Navigator>
    );
};

export default TrainerStackNavigator;

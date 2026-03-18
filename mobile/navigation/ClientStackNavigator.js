import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import ClientTabNavigator from '../components/ClientTabNavigator';
import ClientSessionDetailScreen from '../screens/client/ClientSessionDetailScreen';
import ClientWorkoutDetailsScreen from '../screens/client/ClientWorkoutDetailsScreen';
import MessagesScreen from '../screens/trainer/MessagesScreen';

const Stack = createStackNavigator();

const ClientStackNavigator = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="Back"
                component={ClientTabNavigator}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ClientSessionDetail"
                component={ClientSessionDetailScreen}
                options={{ title: 'Session Details' }}
            />
            <Stack.Screen
                name="ClientWorkoutDetails"
                component={ClientWorkoutDetailsScreen}
                options={{ title: 'Workout Details' }}
            />
            <Stack.Screen
                name="Messages"
                component={MessagesScreen}
                options={{ title: 'Messages' }}
            />
        </Stack.Navigator>
    );
};

export default ClientStackNavigator;

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { useTheme } from '../src/theme';
import ClientTabNavigator from '../components/ClientTabNavigator';
import ClientSessionDetailScreen from '../screens/client/ClientSessionDetailScreen';
import ClientWorkoutDetailsScreen from '../screens/client/ClientWorkoutDetailsScreen';
import MessagesListScreen from '../screens/client/MessagesListScreen';
import MessagesScreen from '../screens/client/MessagesScreen';
import NotificationsScreen from '../screens/client/NotificationsScreen';
import NotificationDetailScreen from '../screens/NotificationDetailScreen';
import AssignmentDetailScreen from '../screens/AssignmentDetailScreen';
import ClientProfileEditScreen from '../screens/client/ClientProfileEditScreen';
import CheckInFormScreen from '../screens/client/CheckInFormScreen';
import CheckInDetailScreen from '../screens/client/CheckInDetailScreen';

const Stack = createStackNavigator();

const ClientStackNavigator = () => {
    const { theme } = useTheme();

    const headerOptions = {
        headerStyle: {
            backgroundColor: theme.navBar,
            shadowColor: theme.navBarBorder,
            elevation: 0,
            borderBottomWidth: 1,
            borderBottomColor: theme.navBarBorder,
        },
        headerTintColor: theme.navBarText,
        headerTitleStyle: {
            fontWeight: '600',
            color: theme.navBarText,
        },
    };

    return (
        <Stack.Navigator screenOptions={headerOptions}>
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
                name="MessageList"
                component={MessagesListScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ClientMessages"
                component={MessagesScreen}
                options={({ route }) => ({
                    title: route.params?.trainer?.name ?? 'Messages',
                })}
            />
            <Stack.Screen
                name="ClientProfileEdit"
                component={ClientProfileEditScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="CheckInForm"
                component={CheckInFormScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="CheckInDetail"
                component={CheckInDetailScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="NotificationDetail"
                component={NotificationDetailScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="AssignmentDetail"
                component={AssignmentDetailScreen}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
};

export default ClientStackNavigator;

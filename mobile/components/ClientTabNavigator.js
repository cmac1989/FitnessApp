import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';

import { useTheme } from '../src/theme';

// Tab root screens
import ClientDashboardScreen from '../screens/client/ClientDashboardScreen';
import CheckInsScreen from '../screens/client/CheckInsScreen';
import ClientWorkoutListScreen from '../screens/client/ClientWorkoutListScreen';
import ClientProfileScreen from '../screens/client/ClientProfileScreen';

// Detail / action screens
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
import AllNotificationsScreen from '../screens/AllNotificationsScreen';
import AllMessagesScreen from '../screens/AllMessagesScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const makeScreenOptions = (theme) => ({
    headerStyle: {
        backgroundColor: theme.navBar,
        shadowColor: theme.navBarBorder,
        elevation: 0,
        borderBottomWidth: 1,
        borderBottomColor: theme.navBarBorder,
    },
    headerTintColor: theme.navBarText,
    headerTitleStyle: { fontWeight: '600', color: theme.navBarText },
});

// Screens reachable from the TopNavBar on any tab (notifications bell / messages icon).
// Added to every stack so navigation works regardless of which tab is active.
const sharedScreens = (
    <>
        <Stack.Screen name="Notifications"      component={NotificationsScreen}     options={{ headerShown: false }} />
        <Stack.Screen name="AllNotifications"   component={AllNotificationsScreen}  options={{ headerShown: false }} />
        <Stack.Screen name="NotificationDetail" component={NotificationDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MessageList"        component={MessagesListScreen}       options={{ headerShown: false }} />
        <Stack.Screen name="ClientMessages"     component={MessagesScreen}           options={{ headerShown: false }} />
        <Stack.Screen name="AllMessages"        component={AllMessagesScreen}        options={{ headerShown: false }} />
        <Stack.Screen name="AssignmentDetail"   component={AssignmentDetailScreen}   options={{ headerShown: false }} />
        {/* Deep-linked from notifications */}
        <Stack.Screen name="CheckInForm"        component={CheckInFormScreen}        options={{ headerShown: false }} />
        <Stack.Screen name="CheckInDetail"      component={CheckInDetailScreen}      options={{ headerShown: false }} />
    </>
);

// ── Home Stack ────────────────────────────────────────────────────────────────
const HomeStack = () => {
    const { theme } = useTheme();
    return (
        <Stack.Navigator screenOptions={makeScreenOptions(theme)}>
            <Stack.Screen name="ClientDashboard" component={ClientDashboardScreen} options={{ headerShown: false }} />
            {sharedScreens}
        </Stack.Navigator>
    );
};

// ── Sessions Stack ────────────────────────────────────────────────────────────
const SessionsStack = () => {
    const { theme } = useTheme();
    return (
        <Stack.Navigator screenOptions={makeScreenOptions(theme)}>
            <Stack.Screen name="Sessions"            component={CheckInsScreen}            options={{ headerShown: false }} />
            <Stack.Screen name="ClientSessionDetail" component={ClientSessionDetailScreen} options={{ title: 'Session Details' }} />
            {sharedScreens}
        </Stack.Navigator>
    );
};

// ── Workouts Stack ────────────────────────────────────────────────────────────
const WorkoutsStack = () => {
    const { theme } = useTheme();
    return (
        <Stack.Navigator screenOptions={makeScreenOptions(theme)}>
            <Stack.Screen name="Workouts"             component={ClientWorkoutListScreen}    options={{ headerShown: false }} />
            <Stack.Screen name="ClientWorkoutDetails" component={ClientWorkoutDetailsScreen} options={{ title: 'Workout Details' }} />
            {sharedScreens}
        </Stack.Navigator>
    );
};

// ── Profile Stack ─────────────────────────────────────────────────────────────
const ProfileStack = () => {
    const { theme } = useTheme();
    return (
        <Stack.Navigator screenOptions={makeScreenOptions(theme)}>
            <Stack.Screen name="Profile"           component={ClientProfileScreen}     options={{ headerShown: false }} />
            <Stack.Screen name="ClientProfileEdit" component={ClientProfileEditScreen} options={{ headerShown: false }} />
            {sharedScreens}
        </Stack.Navigator>
    );
};

// ── Tab Navigator ─────────────────────────────────────────────────────────────

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
                component={HomeStack}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color }) => <Icon name="home-outline" color={color} size={24} />,
                }}
                listeners={({ navigation, route }) => ({
                    tabPress: (e) => {
                        e.preventDefault();
                        navigation.navigate(route.name, { screen: 'ClientDashboard' });
                    },
                })}
            />
            <Tab.Screen
                name="Sessions"
                component={SessionsStack}
                options={{
                    tabBarLabel: 'Check-ins',
                    tabBarIcon: ({ color }) => <Icon name="clipboard-outline" color={color} size={24} />,
                }}
                listeners={({ navigation, route }) => ({
                    tabPress: (e) => {
                        e.preventDefault();
                        navigation.navigate(route.name, { screen: 'Sessions' });
                    },
                })}
            />
            <Tab.Screen
                name="Workouts"
                component={WorkoutsStack}
                options={{
                    tabBarLabel: 'Workouts',
                    tabBarIcon: ({ color }) => <Icon name="barbell-outline" color={color} size={24} />,
                }}
                listeners={({ navigation, route }) => ({
                    tabPress: (e) => {
                        e.preventDefault();
                        navigation.navigate(route.name, { screen: 'Workouts' });
                    },
                })}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileStack}
                options={{
                    tabBarIcon: ({ color }) => <Icon name="person-outline" color={color} size={24} />,
                }}
                listeners={({ navigation, route }) => ({
                    tabPress: (e) => {
                        e.preventDefault();
                        navigation.navigate(route.name, { screen: 'Profile' });
                    },
                })}
            />
        </Tab.Navigator>
    );
};

export default ClientTabNavigator;

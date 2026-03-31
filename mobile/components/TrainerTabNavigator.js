import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';

import { useTheme } from '../src/theme';

// Tab root screens
import TrainerDashboardScreen from '../screens/trainer/TrainerDashboardScreen';
import CheckInsScreen from '../screens/trainer/CheckInsScreen';
import ClientsListScreen from '../screens/trainer/ClientsListScreen';
import WorkoutListScreen from '../screens/trainer/WorkoutListScreen';
import TrainerProfileScreen from '../screens/trainer/TrainerProfileScreen';

// Detail / action screens
import CreateWorkoutScreen from '../screens/trainer/CreateWorkoutScreen';
import AIWorkoutScreen from '../screens/trainer/AIWorkoutScreen';
import EditWorkoutScreen from '../screens/trainer/EditWorkoutScreen';
import WorkoutDetailsScreen from '../screens/trainer/WorkoutDetailsScreen';
import ProgramDetailsScreen from '../screens/trainer/ProgramDetailsScreen';
import CreateEditProgramScreen from '../screens/trainer/CreateEditProgramScreen';
import CreateSessionScreen from '../screens/trainer/CreateSessionScreen';
import SessionDetailsScreen from '../screens/trainer/SessionDetailsScreen';
import EditSessionScreen from '../screens/trainer/EditSessionScreen';
import ClientDetailsScreen from '../screens/trainer/ClientDetailsScreen';
import ClientAssignmentListScreen from '../screens/trainer/ClientAssignmentListScreen';
import InviteClientScreen from '../screens/trainer/InviteClientScreen';
import CheckInReviewScreen from '../screens/trainer/CheckInReviewScreen';
import TrainerCheckInFormScreen from '../screens/trainer/TrainerCheckInFormScreen';
import ProfileSettingsScreen from '../screens/trainer/ProfileSettingsScreen';
import MessagesScreen from '../screens/trainer/MessagesScreen';
import MessagesListScreen from '../screens/trainer/MessagesListScreen';
import NotificationsScreen from '../screens/trainer/NotificationsScreen';
import AssignmentDetailScreen from '../screens/AssignmentDetailScreen';
import ExerciseLibraryScreen from '../screens/trainer/ExerciseLibraryScreen';
import NotificationDetailScreen from '../screens/NotificationDetailScreen';
import AllNotificationsScreen from '../screens/AllNotificationsScreen';
import AllMessagesScreen from '../screens/AllMessagesScreen';
import ClientProfileScreen from '../screens/client/ClientProfileScreen';

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

// Screens reachable from any tab (notifications, messages, deep-links, cross-tab navigation).
// Added to every stack so navigation works regardless of which tab is active.
const sharedScreens = (
    <>
        <Stack.Screen name="Notifications"        component={NotificationsScreen}        options={{ headerShown: false }} />
        <Stack.Screen name="AllNotifications"     component={AllNotificationsScreen}     options={{ headerShown: false }} />
        <Stack.Screen name="NotificationDetail"   component={NotificationDetailScreen}   options={{ headerShown: false }} />
        <Stack.Screen name="MessageList"          component={MessagesListScreen}         options={{ headerShown: false }} />
        <Stack.Screen name="Messages"             component={MessagesScreen}             options={{ headerShown: false }} />
        <Stack.Screen name="AllMessages"          component={AllMessagesScreen}          options={{ headerShown: false }} />
        <Stack.Screen name="AssignmentDetail"     component={AssignmentDetailScreen}     options={{ headerShown: false }} />
        <Stack.Screen name="CheckInReview"        component={CheckInReviewScreen}        options={{ headerShown: false }} />
        <Stack.Screen name="TrainerCheckInForm"   component={TrainerCheckInFormScreen}   options={{ headerShown: false }} />
        <Stack.Screen name="ClientDetails"        component={ClientDetailsScreen}        options={{ title: 'Client Details' }} />
        <Stack.Screen name="InviteClient"         component={InviteClientScreen}         options={{ headerShown: false }} />
        <Stack.Screen name="ClientAssignmentList" component={ClientAssignmentListScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ExerciseLibrary"      component={ExerciseLibraryScreen}      options={{ headerShown: false }} />
    </>
);

// ── Home Stack ────────────────────────────────────────────────────────────────
const HomeStack = () => {
    const { theme } = useTheme();
    return (
        <Stack.Navigator screenOptions={makeScreenOptions(theme)}>
            <Stack.Screen name="TrainerDashboard" component={TrainerDashboardScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CreateWorkout"    component={CreateWorkoutScreen}    options={{ headerShown: false }} />
            <Stack.Screen name="AIWorkout"        component={AIWorkoutScreen}        options={{ headerShown: false }} />
            {sharedScreens}
        </Stack.Navigator>
    );
};

// ── Clients Stack ─────────────────────────────────────────────────────────────
const ClientsStack = () => {
    const { theme } = useTheme();
    return (
        <Stack.Navigator screenOptions={makeScreenOptions(theme)}>
            <Stack.Screen name="Clients" component={ClientsListScreen} options={{ headerShown: false }} />
            {sharedScreens}
        </Stack.Navigator>
    );
};

// ── Sessions Stack ────────────────────────────────────────────────────────────
const SessionsStack = () => {
    const { theme } = useTheme();
    return (
        <Stack.Navigator screenOptions={makeScreenOptions(theme)}>
            <Stack.Screen name="Sessions"      component={CheckInsScreen}       options={{ headerShown: false }} />
            <Stack.Screen name="SessionDetail" component={SessionDetailsScreen} options={{ title: 'Session Details' }} />
            <Stack.Screen name="CreateSession" component={CreateSessionScreen}  options={{ title: 'Create Session' }} />
            <Stack.Screen name="EditSession"   component={EditSessionScreen}    options={{ title: 'Edit Session' }} />
            {sharedScreens}
        </Stack.Navigator>
    );
};

// ── Workouts Stack ────────────────────────────────────────────────────────────
const WorkoutsStack = () => {
    const { theme } = useTheme();
    return (
        <Stack.Navigator screenOptions={makeScreenOptions(theme)}>
            <Stack.Screen name="Workouts"          component={WorkoutListScreen}       options={{ headerShown: false }} />
            <Stack.Screen name="WorkoutDetails"    component={WorkoutDetailsScreen}    options={{ title: 'Workout Details' }} />
            <Stack.Screen name="ProgramDetails"    component={ProgramDetailsScreen}    options={{ title: 'Program' }} />
            <Stack.Screen name="CreateEditProgram" component={CreateEditProgramScreen} options={{ title: 'Program' }} />
            <Stack.Screen name="CreateWorkout"     component={CreateWorkoutScreen}     options={{ headerShown: false }} />
            <Stack.Screen name="AIWorkout"         component={AIWorkoutScreen}         options={{ headerShown: false }} />
            <Stack.Screen name="EditWorkout"       component={EditWorkoutScreen}       options={{ headerShown: false }} />
            {sharedScreens}
        </Stack.Navigator>
    );
};

// ── Profile Stack ─────────────────────────────────────────────────────────────
const ProfileStack = () => {
    const { theme } = useTheme();
    return (
        <Stack.Navigator screenOptions={makeScreenOptions(theme)}>
            <Stack.Screen name="Profile"              component={TrainerProfileScreen}  options={{ headerShown: false }} />
            <Stack.Screen name="ProfileEdit"          component={ProfileSettingsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="TrainerProfileScreen" component={TrainerProfileScreen}  options={{ headerShown: false }} />
            <Stack.Screen name="ClientProfileScreen"  component={ClientProfileScreen}   options={{ headerShown: false }} />
            {sharedScreens}
        </Stack.Navigator>
    );
};

// ── Tab Navigator ─────────────────────────────────────────────────────────────

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
                component={HomeStack}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color }) => <Icon name="home-outline" color={color} size={24} />,
                }}
                listeners={({ navigation, route }) => ({
                    tabPress: (e) => {
                        e.preventDefault();
                        navigation.navigate(route.name, { screen: 'TrainerDashboard' });
                    },
                })}
            />
            <Tab.Screen
                name="Clients"
                component={ClientsStack}
                options={{
                    tabBarIcon: ({ color }) => <Icon name="people-outline" color={color} size={24} />,
                }}
                listeners={({ navigation, route }) => ({
                    tabPress: (e) => {
                        e.preventDefault();
                        navigation.navigate(route.name, { screen: 'Clients' });
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

export default TrainerTabNavigator;

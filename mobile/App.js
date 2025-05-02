import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import RegisterScreen from './screens/RegisterScreen';
import ClientsListScreen from './screens/trainer/ClientsListScreen';
import CreateWorkoutScreen from './screens/trainer/CreateWorkoutScreen';
import SessionsScreen from './screens/trainer/SessionsScreen';
import CreateSessionScreen from './screens/trainer/CreateSessionScreen';
import SessionDetailsScreen from './screens/trainer/SessionDetailsScreen';
import ProfileSettingsScreen from './screens/trainer/ProfileSettingsScreen';
import TrainerTabNavigator from './components/TrainerTabNavigator';

const Stack = createStackNavigator();

const App = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Home">
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />

                <Stack.Screen name="ClientsList" component={ClientsListScreen} />
                <Stack.Screen name="CreateWorkout" component={CreateWorkoutScreen} />
                <Stack.Screen name="Sessions" component={SessionsScreen} />
                <Stack.Screen name="CreateSession" component={CreateSessionScreen} />
                <Stack.Screen name="SessionDetail" component={SessionDetailsScreen} />
                <Stack.Screen name="Profile" component={ProfileSettingsScreen} />
                <Stack.Screen name="TrainerHome" component={TrainerTabNavigator} options={{ headerShown: false }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default App;

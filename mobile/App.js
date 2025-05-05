import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import TrainerStackNavigator from './navigation/TrainerStackNavigator';
import ClientStackNavigator from "./navigation/ClientStackNavigator";

const Stack = createStackNavigator();

const App = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: true }} initialRouteName="Home">
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />

                {/* Trainer's whole stack lives here */}
                <Stack.Screen
                    name="TrainerHome"
                    component={TrainerStackNavigator}
                    options={{ headerShown: false, title: 'Home' }}
                />

                {/* Client's whole stack lives here */}
                <Stack.Screen
                    name="ClientHome"
                    component={ClientStackNavigator}
                    options={{ headerShown: false, title: 'Home' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default App;

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from './src/theme';
import { ToastProvider } from './src/context/ToastContext';
import { UserProvider } from './src/context/UserContext';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import TrainerStackNavigator from './navigation/TrainerStackNavigator';
import ClientStackNavigator from './navigation/ClientStackNavigator';

const Stack = createStackNavigator();

const RootNavigator = () => {
    const { theme } = useTheme();

    return (
        <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
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
            }}
        >
            <Stack.Screen name="Home"           component={HomeScreen}           options={{ headerShown: false }} />
            <Stack.Screen name="Login"          component={LoginScreen}          options={{ title: 'Sign In' }} />
            <Stack.Screen name="Register"       component={RegisterScreen}       options={{ title: 'Create Account' }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />

            <Stack.Screen
                name="TrainerHome"
                component={TrainerStackNavigator}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ClientHome"
                component={ClientStackNavigator}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
};

const App = () => {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <UserProvider>
                    <ToastProvider>
                        <NavigationContainer>
                            <RootNavigator />
                        </NavigationContainer>
                    </ToastProvider>
                </UserProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
};

export default App;

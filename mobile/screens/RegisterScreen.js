import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import RegisterForm from '../components/RegisterForm';
import { useTheme } from '../src/theme';

const RegisterScreen = ({ navigation }) => {
    const { theme } = useTheme();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar
                barStyle={theme.dark ? 'light-content' : 'dark-content'}
                backgroundColor={theme.navBar}
            />
            <RegisterForm navigation={navigation} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default RegisterScreen;

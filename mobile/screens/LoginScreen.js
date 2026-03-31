import React from 'react';
import { SafeAreaView, Text, View, StyleSheet, StatusBar } from 'react-native';
import LoginForm from '../components/LoginForm';
import { useTheme } from '../src/theme';

const LoginScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const styles    = makeStyles(theme);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar
                barStyle={theme.dark ? 'light-content' : 'dark-content'}
                backgroundColor={theme.background}
            />
            <View style={styles.inner}>
                <Text style={styles.header}>Welcome Back</Text>
                <Text style={styles.subheader}>Sign in to continue</Text>
                <LoginForm navigation={navigation} />
            </View>
        </SafeAreaView>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    inner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        fontSize: 32,
        fontWeight: '800',
        color: theme.text,
        marginBottom: 6,
    },
    subheader: {
        fontSize: 16,
        color: theme.textSecondary,
        marginBottom: 8,
    },
});

export default LoginScreen;

import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import TopNavBar from './TopNavBar';
import { useTheme } from '../src/theme';

const ScreenWrapper = ({ children, title, showBack = false }) => {
    const { theme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar
                barStyle={theme.dark ? 'light-content' : 'dark-content'}
                backgroundColor={theme.navBar}
            />
            <TopNavBar title={title} showBack={showBack} />
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
});

export default ScreenWrapper;

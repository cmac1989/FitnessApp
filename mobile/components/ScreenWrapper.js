import React from 'react';
import { View, StyleSheet } from 'react-native';
import TopNavBar from './TopNavBar';

const ScreenWrapper = ({ children, title }) => {
    return (
        <View style={styles.container}>
            <TopNavBar title={title} />
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    content: {
        flex: 1,
    },
});

export default ScreenWrapper;

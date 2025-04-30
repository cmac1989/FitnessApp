import {SafeAreaView, Text, View} from 'react-native';
import React from 'react';
import LoginForm from '../components/LoginForm';
import formScreenStyles from '../styles/FormScreenStyles';

const LoginScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={formScreenStyles.container}>
            <View style={formScreenStyles.viewContainer}>
                <Text style={formScreenStyles.header}>Login Screen</Text>
                <LoginForm navigation={navigation}/>
            </View>
        </SafeAreaView>
    );
};

export default LoginScreen;

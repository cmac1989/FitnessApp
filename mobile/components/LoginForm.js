import React from 'react';
import {View, Text, TextInput} from 'react-native';
import CustomButton from './CustomButton';
import TextButton from './TextButton';
import formInputStyles from '../styles/FormInputStyles';

const LoginForm = ({ navigation }) => {
    return (
        <View style={formInputStyles.container}>
            <Text style={formInputStyles.label}>Email</Text>
            <TextInput style={formInputStyles.input} placeholder="Enter your email" />

            <Text style={formInputStyles.label}>Password</Text>
            <TextInput style={formInputStyles.input} placeholder="Enter your password" secureTextEntry />

            <CustomButton
                title="Login"
                // onPress={() => submitFormHandler()}
            />
            <View style={formInputStyles.registerContainer}>
                <Text style={formInputStyles.registerText}>Not a registered user?</Text>
                <TextButton
                    title=" Click here to sign up"
                    onPress={() => navigation.navigate('Register')}
                />
            </View>

        </View>
    );
};

export default LoginForm;

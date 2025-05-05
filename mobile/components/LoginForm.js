import React, {useCallback, useState} from 'react';
import { View, Text, TextInput } from 'react-native';
import CustomButton from './CustomButton';
import TextButton from './TextButton';
import formInputStyles from '../styles/FormInputStyles';
import formErrorStyles from '../styles/FormErrorStyles';
import { validateLoginForm, validateField } from '../src/utils/validation';
import { userLogin } from '../src/api/auth';
import {useFocusEffect} from '@react-navigation/native';
import {saveToken} from '../src/services/authService';

const LoginForm = ({ navigation }) => {
    useFocusEffect(
        useCallback(() => {
            // Reset form state when screen comes into focus
            setUserInfo({
                email: '',
                password: '',
            });
            setErrors({});
        }, [])
    );

    const [userInfo, setUserInfo] = useState({
        email: '',
        password: '',
    });

    const [errors, setErrors] = useState({});

    const handleLogin = async () => {
        const validationErrors = validateLoginForm(userInfo);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            const response = await userLogin({ email: userInfo.email, password: userInfo.password });

            // Check if response contains a token and save it
            if (response && response.token) {
                await saveToken(response.token);

                if (response.user.role === 'trainer') {
                    navigation.navigate('TrainerHome');
                } else {
                    navigation.navigate('ClientHome');
                }
            } else {
                // Add more detailed error handling
                setErrors(prev => ({
                    ...prev,
                    general: 'Invalid login credentials. Please check your email and password.',
                }));
            }
        } catch (error) {
            console.error('Login failed:', error.response || error.message || error);  // Detailed log

            if (error.response?.status === 401) {
                setErrors(prev => ({
                    ...prev,
                    general: error.response?.data?.message || 'Invalid credentials.',
                }));
            } else {
                setErrors(prev => ({
                    ...prev,
                    general: 'Login failed, please try again later.',
                }));
            }
        }
    };


    return (
        <View style={formInputStyles.container}>
            <Text style={formInputStyles.label}>Email</Text>
            <TextInput
                style={formInputStyles.input}
                placeholder="Enter your email"
                value={userInfo.email}
                onChangeText={text => {
                    setUserInfo(prev => ({ ...prev, email: text }));
                    const error = validateField('email', text, userInfo);
                    setErrors(prev => ({ ...prev, email: error }));
                }}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
            />
            <Text style={formErrorStyles.errorText}>
                {errors.email ? errors.email : ' '}
            </Text>

            <Text style={formInputStyles.label}>Password</Text>
            <TextInput
                style={formInputStyles.input}
                placeholder="Enter your password"
                secureTextEntry
                value={userInfo.password}
                onChangeText={text => {
                    setUserInfo(prev => ({ ...prev, password: text }));
                    const error = validateField('password', text, userInfo);
                    setErrors(prev => ({ ...prev, password: error }));
                }}
                textContentType="password"
                autoComplete="password"
            />
            <Text style={formErrorStyles.errorText}>
                {errors.password ? errors.password : ' '}
            </Text>

            {errors.general ? (
                <Text style={formErrorStyles.errorText}>{errors.general}</Text>
            ) : null}

            <CustomButton
                title="Login"
                onPress={handleLogin}
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

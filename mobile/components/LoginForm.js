import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import CustomButton from './CustomButton';
import TextButton from './TextButton';
import { validateLoginForm, validateField } from '../src/utils/validation';
import { userLogin } from '../src/api/auth';
import { useFocusEffect } from '@react-navigation/native';
import { saveToken } from '../src/services/authService';
import { useTheme } from '../src/theme';
import { useUser } from '../src/context/UserContext';

const LoginForm = ({ navigation }) => {
    const { theme } = useTheme();
    const { setUser } = useUser();

    const [userInfo, setUserInfo] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});

    useFocusEffect(
        useCallback(() => {
            setUserInfo({ email: 'trainer@example.com', password: 'Test1234!' });
            setErrors({});
        }, [])
    );

    const handleLogin = async () => {
        const validationErrors = validateLoginForm(userInfo);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            const response = await userLogin({ email: userInfo.email, password: userInfo.password });

            if (!response?.token || !response?.user) {
                setErrors(prev => ({ ...prev, general: 'Unexpected response from server. Please try again.' }));
                return;
            }

            await saveToken(response.token);

            const userData = {
                id: response.user.id,
                name: response.user.name,
                email: response.user.email,
                role: response.user.role,
                profile_picture: response.user.profile_picture,
                bio: response.user.bio,
            };

            await setUser(userData);

            if (response.user.role === 'trainer') {
                navigation.navigate('TrainerHome');
            } else {
                navigation.navigate('ClientHome');
            }
        } catch (error) {
            console.error('Login failed:', error.response?.data || error.message);

            if (error.response?.status === 401) {
                setErrors(prev => ({ ...prev, general: 'Incorrect email or password.' }));
            } else if (error.response) {
                setErrors(prev => ({ ...prev, general: error.response.data?.message || 'Login failed. Please try again.' }));
            } else {
                setErrors(prev => ({ ...prev, general: 'Cannot connect to server. Check your connection.' }));
            }
        }
    };

    const styles = makeStyles(theme);

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Email</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={theme.placeholder}
                value={userInfo.email}
                onChangeText={text => {
                    setUserInfo(prev => ({ ...prev, email: text }));
                    const error = validateField('email', text, userInfo);
                    setErrors(prev => ({ ...prev, email: error }));
                }}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                autoCapitalize="none"
            />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : <View style={styles.errorSpacer} />}

            <Text style={styles.label}>Password</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={theme.placeholder}
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
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : <View style={styles.errorSpacer} />}

            {errors.general ? <Text style={styles.errorText}>{errors.general}</Text> : null}

            <TouchableOpacity
                style={styles.forgotBtn}
                onPress={() => navigation.navigate('ForgotPassword')}
                activeOpacity={0.7}
            >
                <Text style={[styles.forgotText, { color: theme.primary }]}>Forgot password?</Text>
            </TouchableOpacity>

            <CustomButton title="Login" onPress={handleLogin} />

            <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Not registered yet?</Text>
                <TextButton
                    title=" Sign up here"
                    onPress={() => navigation.navigate('Register')}
                />
            </View>
        </View>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    container: {
        width: '85%',
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.textSecondary,
        marginBottom: 6,
        marginTop: 14,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: theme.inputBorder,
        backgroundColor: theme.inputBackground,
        paddingHorizontal: 14,
        borderRadius: 10,
        fontSize: 16,
        color: theme.text,
    },
    errorText: {
        color: theme.error,
        fontSize: 13,
        marginTop: 4,
        marginBottom: 2,
    },
    errorSpacer: {
        height: 18,
    },
    forgotBtn: {
        alignSelf: 'flex-end',
        marginBottom: 6,
        paddingVertical: 2,
    },
    forgotText: {
        fontSize: 14,
        fontWeight: '600',
    },
    registerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
    },
    registerText: {
        fontSize: 15,
        color: theme.textSecondary,
    },
});

export default LoginForm;

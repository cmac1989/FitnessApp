import React, { useState, useCallback } from 'react';
import {
    Pressable, ScrollView, Text, TextInput, View,
    StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import CustomButton from './CustomButton';
import { registerUser } from '../src/api/auth';
import { useFocusEffect } from '@react-navigation/native';
import { validateRegisterForm, validateField } from '../src/utils/validation';
import { useTheme } from '../src/theme';

const EMPTY_FORM = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'client',
    profile_picture: '',
    bio: '',
    age: '',
    gender: '',
    fitness_goals: '',
    medical_conditions: '',
    certifications: '',
    years_experience: '',
    specialties: '',
    availability: 'available',
    location: '',
};

const RegisterForm = ({ navigation }) => {
    const { theme } = useTheme();
    const [userInfo, setUserInfo] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState('');

    useFocusEffect(
        useCallback(() => {
            setUserInfo(EMPTY_FORM);
            setErrors({});
            setGeneralError('');
        }, [])
    );

    const normalizeTrainerPayload = (data) => ({
        ...data,
        years_experience: data.years_experience === '' ? null : parseInt(data.years_experience, 10),
        specialties: data.specialties.split(',').map(s => s.trim()).filter(Boolean),
        availability: data.availability,
    });

    const handleRegister = async () => {
        const validationErrors = validateRegisterForm(userInfo);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setGeneralError('');
            return;
        }
        try {
            setGeneralError('');
            setErrors({});
            const payload = userInfo.role === 'trainer'
                ? normalizeTrainerPayload(userInfo)
                : {
                    ...userInfo,
                    years_experience: userInfo.years_experience === '' ? null : parseInt(userInfo.years_experience, 10),
                };
            await registerUser(payload);
            navigation.navigate('Login');
        } catch (error) {
            const backendErrors = error.validationErrors || {};
            const flattenedErrors = Object.fromEntries(
                Object.entries(backendErrors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
            );
            if (Object.keys(flattenedErrors).length > 0) {
                setErrors(prev => ({ ...prev, ...flattenedErrors }));
                setGeneralError('Please fix the errors below.');
            } else {
                setGeneralError(error.message || 'Registration failed. Please try again.');
            }
        }
    };

    const styles = makeStyles(theme);

    const field = (label, key, props = {}) => (
        <>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={styles.input}
                value={userInfo[key]}
                placeholderTextColor={theme.placeholder}
                onChangeText={text => {
                    setUserInfo(prev => ({ ...prev, [key]: text }));
                    const err = validateField(key, text, userInfo);
                    setErrors(prev => ({ ...prev, [key]: err }));
                }}
                {...props}
            />
            <Text style={styles.errorText}>{errors[key] || ' '}</Text>
        </>
    );

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                style={styles.flex}
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                {field('Name', 'name', { textContentType: 'name', autoComplete: 'name' })}
                {field('Email', 'email', { keyboardType: 'email-address', textContentType: 'emailAddress', autoComplete: 'email' })}
                {field('Password', 'password', {
                    secureTextEntry: true,
                    textContentType: 'newPassword',
                    autoComplete: 'password-new',
                    onChangeText: text => {
                        setUserInfo(prev => ({ ...prev, password: text }));
                        setErrors(prev => ({
                            ...prev,
                            password: validateField('password', text, userInfo),
                            password_confirmation: validateField('password_confirmation', userInfo.password_confirmation, { ...userInfo, password: text }),
                        }));
                    },
                })}
                {field('Confirm Password', 'password_confirmation', {
                    secureTextEntry: true,
                    textContentType: 'newPassword',
                    autoComplete: 'password-new',
                })}
                {field('Bio', 'bio', { placeholder: 'Tell us a little about yourself', multiline: true })}

                {/* Role selector */}
                <Text style={styles.label}>Select your role:</Text>
                <View style={styles.roleContainer}>
                    {['client', 'trainer'].map(role => (
                        <Pressable
                            key={role}
                            onPress={() => setUserInfo(prev => ({ ...prev, role }))}
                            style={({ pressed }) => [
                                styles.roleButton,
                                userInfo.role === role && styles.activeRoleButton,
                                pressed && styles.pressedButton,
                            ]}
                        >
                            <Text style={[
                                styles.roleButtonText,
                                userInfo.role === role && styles.activeRoleButtonText,
                            ]}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                            </Text>
                        </Pressable>
                    ))}
                </View>
                <Text style={styles.errorText}>{errors.role || ' '}</Text>

                {/* Client fields */}
                {userInfo.role === 'client' && (
                    <>
                        {field('Age', 'age', { keyboardType: 'numeric' })}
                        {field('Gender (M/F/O)', 'gender')}
                        {field('Fitness Goal', 'fitness_goals', { placeholder: "What's your fitness goal?" })}
                        {field('Medical Conditions', 'medical_conditions', { placeholder: 'List any conditions' })}
                    </>
                )}

                {/* Trainer fields */}
                {userInfo.role === 'trainer' && (
                    <>
                        {field('Certifications', 'certifications')}
                        {field('Years of Experience', 'years_experience', { keyboardType: 'numeric' })}
                        {field('Specialties', 'specialties', { placeholder: 'Strength Training, Weight Loss' })}

                        <Text style={styles.label}>Availability</Text>
                        <View style={styles.roleContainer}>
                            {['available', 'unavailable'].map(option => (
                                <Pressable
                                    key={option}
                                    onPress={() => setUserInfo(prev => ({ ...prev, availability: option }))}
                                    style={({ pressed }) => [
                                        styles.roleButton,
                                        userInfo.availability === option && styles.activeRoleButton,
                                        pressed && styles.pressedButton,
                                    ]}
                                >
                                    <Text style={[
                                        styles.roleButtonText,
                                        userInfo.availability === option && styles.activeRoleButtonText,
                                    ]}>
                                        {option.charAt(0).toUpperCase() + option.slice(1)}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                        <Text style={styles.errorText}>{errors.availability || ' '}</Text>

                        {field('Location', 'location', { placeholder: 'Your city / region' })}
                    </>
                )}

                {generalError ? <Text style={styles.generalError}>{generalError}</Text> : null}

                <CustomButton title="Register" onPress={handleRegister} />
                <View style={styles.bottomPad} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    flex: { flex: 1 },
    container: {
        padding: 20,
        backgroundColor: theme.background,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.textSecondary,
        marginTop: 14,
        marginBottom: 4,
    },
    input: {
        backgroundColor: theme.inputBackground,
        borderWidth: 1,
        borderColor: theme.inputBorder,
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        color: theme.text,
    },
    errorText: {
        fontSize: 12,
        color: theme.error,
        marginTop: 2,
        minHeight: 16,
    },
    generalError: {
        fontSize: 14,
        color: theme.error,
        textAlign: 'center',
        marginVertical: 10,
    },
    roleContainer: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
    },
    roleButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.inputBorder,
        backgroundColor: theme.inputBackground,
        alignItems: 'center',
    },
    activeRoleButton: {
        backgroundColor: theme.primary,
        borderColor: theme.primary,
    },
    pressedButton: {
        opacity: 0.75,
    },
    roleButtonText: {
        fontSize: 15,
        fontWeight: '500',
        color: theme.textSecondary,
    },
    activeRoleButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
    bottomPad: {
        height: 30,
    },
});

export default RegisterForm;

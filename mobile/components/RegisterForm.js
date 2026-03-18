import {Pressable, ScrollView, Text, TextInput, View} from 'react-native';
import CustomButton from './CustomButton';
import React, {useState, useCallback} from 'react';
import formInputStyles from '../styles/FormInputStyles';
import {registerUser} from '../src/api/auth';
import { useFocusEffect } from '@react-navigation/native';
import formErrorStyles from '../styles/FormErrorStyles';
import { validateRegisterForm, validateField } from '../src/utils/validation';

const RegisterForm = ({ navigation }) => {
    useFocusEffect(
        useCallback(() => {
            // Reset form state when screen comes into focus
            setUserInfo({
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
                availability: '',
                location: '',
            });
            setErrors({});
            setGeneralError('');
        }, [])
    );

    const [userInfo, setUserInfo] = useState({
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
        availability: '',
        location: '',
    });

    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState('');

    const handleRegister = async () => {
        const validationErrors = validateRegisterForm(userInfo);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setGeneralError('');
            return;
        }
        try {
            setGeneralError('');
            await registerUser(userInfo);
            navigation.navigate('Login');
        } catch (error) {
            const backendErrors = error.validationErrors || {};
            const flattenedErrors = Object.fromEntries(
                Object.entries(backendErrors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
            );

            if (Object.keys(flattenedErrors).length > 0) {
                setErrors(prev => ({ ...prev, ...flattenedErrors }));
            }

            setGeneralError(error.message || 'Registration failed. Please try again.');
        }
    };

    return (
        <ScrollView style={formInputStyles.container}>
            <Text style={formInputStyles.label}>Name</Text>
            <TextInput
                style={formInputStyles.input}
                placeholder="Enter your name"
                value={userInfo.name}
                onChangeText={text => {
                    setUserInfo(prev => ({ ...prev, name: text }));
                    const error = validateField('name', text, userInfo);
                    setErrors(prev => ({ ...prev, name: error }));
                }}
                textContentType="name"
                autoComplete="name"
            />
            <Text style={formErrorStyles.errorText}>
                {errors.name ? errors.name : ' '}
            </Text>

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
                    const passwordError = validateField('password', text, userInfo);
                    const confirmError = validateField('password_confirmation', userInfo.password_confirmation, {
                        ...userInfo,
                        password: text,
                    });
                    setErrors(prev => ({
                        ...prev,
                        password: passwordError,
                        password_confirmation: confirmError
                    }));
                }}
                textContentType="newPassword"
                autoComplete="password-new"
            />
            <Text style={formErrorStyles.errorText}>
                {errors.password ? errors.password : ' '}
            </Text>

            <Text style={formInputStyles.label}>Confirm Password</Text>
            <TextInput
                style={formInputStyles.input}
                placeholder="Confirm your password"
                secureTextEntry
                value={userInfo.password_confirmation}
                onChangeText={text => {
                    setUserInfo(prev => ({ ...prev, password_confirmation: text }));
                    const confirmError = validateField('password_confirmation', text, userInfo);
                    setErrors(prev => ({
                        ...prev,
                        password_confirmation: confirmError,
                    }));
                }}
                textContentType="newPassword"
                autoComplete="password-new"
            />
            <Text style={formErrorStyles.errorText}>
                {errors.password_confirmation ? errors.password_confirmation : ' '}
            </Text>

            <Text style={formInputStyles.label}>Bio</Text>
            <TextInput
                style={formInputStyles.input}
                placeholder="Tell us a little about yourself"
                value={userInfo.bio}
                onChangeText={text => {
                    setUserInfo(prev => ({ ...prev, bio: text }));
                    setErrors(prev => ({ ...prev, bio: null }));
                }}
                multiline
            />
            <Text style={formErrorStyles.errorText}>
                {errors.bio ? errors.bio : ' '}
            </Text>

            <Text style={formInputStyles.label}>Select your role:</Text>
            <View style={formInputStyles.roleContainer}>
                {['client', 'trainer'].map((role) => (
                    <Pressable
                        key={role}
                        onPress={() => setUserInfo(prev => ({ ...prev, role }))}
                        style={({ pressed }) => [
                            formInputStyles.roleButton,
                            userInfo.role === role && formInputStyles.activeRoleButton,
                            pressed && formInputStyles.pressedButton,
                        ]}
                    >
                        <Text style={[
                            formInputStyles.roleButtonText,
                            userInfo.role === role && formInputStyles.activeRoleButtonText,
                        ]}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                        </Text>
                    </Pressable>
                ))}
            </View>
            <Text style={formErrorStyles.errorText}>
                {errors.role ? errors.role : ' '}
            </Text>

            {userInfo.role === 'client' && (
                <>
                    <Text style={formInputStyles.label}>Age</Text>
                    <TextInput
                        style={formInputStyles.input}
                        placeholder="Your age"
                        keyboardType="numeric"
                        value={userInfo.age}
                        onChangeText={text =>
                            setUserInfo(prev => ({ ...prev, age: text }))
                        }
                    />
                    <Text style={formErrorStyles.errorText}>
                        {errors.age ? errors.age : ' '}
                    </Text>

                    <Text style={formInputStyles.label}>Gender (M/F/O)</Text>
                    <TextInput
                        style={formInputStyles.input}
                        placeholder="Gender"
                        value={userInfo.gender}
                        onChangeText={text =>
                            setUserInfo(prev => ({ ...prev, gender: text }))
                        }
                    />
                    <Text style={formErrorStyles.errorText}>
                        {errors.gender ? errors.gender : ' '}
                    </Text>

                    <Text style={formInputStyles.label}>Fitness Goal</Text>
                    <TextInput
                        style={formInputStyles.input}
                        placeholder="What’s your fitness goal?"
                        value={userInfo.fitness_goals}
                        onChangeText={text =>
                            setUserInfo(prev => ({ ...prev, fitness_goals: text }))
                        }
                    />
                    <Text style={formErrorStyles.errorText}>
                        {errors.fitness_goals ? errors.fitness_goals : ' '}
                    </Text>

                    <Text style={formInputStyles.label}>Medical Conditions</Text>
                    <TextInput
                        style={formInputStyles.input}
                        placeholder="List any conditions"
                        value={userInfo.medical_conditions}
                        onChangeText={text =>
                            setUserInfo(prev => ({ ...prev, medical_conditions: text }))
                        }
                    />
                    <Text style={formErrorStyles.errorText}>
                        {errors.medical_conditions ? errors.medical_conditions : ' '}
                    </Text>
                </>
            )}

            {userInfo.role === 'trainer' && (
                <>
                    <Text style={formInputStyles.label}>Certifications</Text>
                    <TextInput
                        style={formInputStyles.input}
                        placeholder="Certifications"
                        value={userInfo.certifications}
                        onChangeText={text =>
                            setUserInfo(prev => ({ ...prev, certifications: text }))
                        }
                    />
                    <Text style={formErrorStyles.errorText}>
                        {errors.certifications ? errors.certifications : ' '}
                    </Text>

                    <Text style={formInputStyles.label}>Years of Experience</Text>
                    <TextInput
                        style={formInputStyles.input}
                        placeholder="Years"
                        keyboardType="numeric"
                        value={userInfo.years_experience}
                        onChangeText={text =>
                            setUserInfo(prev => ({ ...prev, years_experience: text }))
                        }
                    />
                    <Text style={formErrorStyles.errorText}>
                        {errors.years_experience ? errors.years_experience : ' '}
                    </Text>

                    <Text style={formInputStyles.label}>Specialties</Text>
                    <TextInput
                        style={formInputStyles.input}
                        placeholder="Specialties (comma separated)"
                        value={userInfo.specialties}
                        onChangeText={text =>
                            setUserInfo(prev => ({ ...prev, specialties: text }))
                        }
                    />
                    <Text style={formErrorStyles.errorText}>
                        {errors.specialties ? errors.specialties : ' '}
                    </Text>

                    <Text style={formInputStyles.label}>Availability</Text>
                    <TextInput
                        style={formInputStyles.input}
                        placeholder="Available times/days"
                        value={userInfo.availability}
                        onChangeText={text =>
                            setUserInfo(prev => ({ ...prev, availability: text }))
                        }
                    />
                    <Text style={formErrorStyles.errorText}>
                        {errors.availability ? errors.availability : ' '}
                    </Text>

                    <Text style={formInputStyles.label}>Location</Text>
                    <TextInput
                        style={formInputStyles.input}
                        placeholder="Your city / region"
                        value={userInfo.location}
                        onChangeText={text =>
                            setUserInfo(prev => ({ ...prev, location: text }))
                        }
                    />
                    <Text style={formErrorStyles.errorText}>
                        {errors.location ? errors.location : ' '}
                    </Text>
                </>
            )}

            <Text style={formErrorStyles.errorText}>
                {generalError ? generalError : ' '}
            </Text>

            <CustomButton
                title="Register"
                onPress={handleRegister}
            />
        </ScrollView>
    );
};

export default RegisterForm;

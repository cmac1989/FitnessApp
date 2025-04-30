import {Pressable, Text, TextInput, View} from 'react-native';
import CustomButton from './CustomButton';
import React, {useState} from 'react';
import formInputStyles from '../styles/FormInputStyles';

const RegisterForm = ({ navigation }) => {
    const [selectedRole, setSelectedRole] = useState('client');
    return (
        <View style={formInputStyles.container}>
            <Text style={formInputStyles.label}>Email</Text>
            <TextInput style={formInputStyles.input} placeholder="Enter your email" />

            <Text style={formInputStyles.label}>Password</Text>
            <TextInput style={formInputStyles.input} placeholder="Enter your password" secureTextEntry />

            <Text style={formInputStyles.label}>Select your role:</Text>
            <View style={formInputStyles.roleContainer}>
                {['client', 'trainer'].map((role) => (
                    <Pressable
                        key={role}
                        onPress={() => setSelectedRole(role)}
                        style={({ pressed }) => [
                            formInputStyles.roleButton,
                            selectedRole === role && formInputStyles.activeRoleButton,
                            pressed && formInputStyles.pressedButton,
                        ]}
                    >
                        <Text style={[
                            formInputStyles.roleButtonText,
                            selectedRole === role && formInputStyles.activeRoleButtonText,
                        ]}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <CustomButton
                title="Register"
                // onPress={() => navigation.navigate('Register')}
            />
        </View>
    );
};

export default RegisterForm;

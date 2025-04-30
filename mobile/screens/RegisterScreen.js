import {Pressable, SafeAreaView, StyleSheet, Text, TextInput, View} from 'react-native';
import formScreenStyles from "../styles/FormScreenStyles";

import RegisterForm from '../components/RegisterForm';

const RegisterScreen = ({ navigation }) => {

    return (
        <SafeAreaView style={formScreenStyles.container}>
            <View style={formScreenStyles.viewContainer}>
                <Text style={formScreenStyles.header}>Register</Text>
                <RegisterForm navigation={navigation}/>
            </View>
        </SafeAreaView>
    );
};

export default RegisterScreen;

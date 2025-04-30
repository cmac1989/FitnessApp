import {Image, SafeAreaView, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import CustomButton from '../components/CustomButton';
import formScreenStyles from "../styles/FormScreenStyles";

const HomeScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={formScreenStyles.container}>
            <View style={formScreenStyles.buttonContainer}>
                <Text style={formScreenStyles.header}>Trainer App</Text>
                <Text style={formScreenStyles.tagline}>Get Stronger, Fitter, Better.</Text>
                <Image
                    source={require('../assets/images/icons8-fitness-100.png')}
                    style={formScreenStyles.logo}
                />

                <CustomButton
                title="Go to Login"
                onPress={() => navigation.navigate('Login')}
                />
            </View>
        </SafeAreaView>
    );
};



export default HomeScreen;

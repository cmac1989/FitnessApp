import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import React from 'react';

const CustomButton = ({ title, onPress, style, textStyle }) => {
    return (
        <TouchableOpacity onPress={onPress}>
            <Text style={[styles.buttonText, textStyle]}>{title}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    buttonText: {
        color: '#6200EE',
        fontSize: 16,
        marginTop: 5,
    },
});

export default CustomButton;

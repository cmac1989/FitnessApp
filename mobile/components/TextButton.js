import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../src/theme';

const TextButton = ({ title, onPress, style, textStyle }) => {
    const { theme } = useTheme();

    return (
        <TouchableOpacity onPress={onPress} style={style}>
            <Text style={[styles.buttonText, { color: theme.primary }, textStyle]}>{title}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    buttonText: {
        fontSize: 15,
        fontWeight: '600',
        marginTop: 5,
    },
});

export default TextButton;

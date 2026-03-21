import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../src/theme';

const CustomButton = ({ title, onPress, style, textStyle, disabled, color }) => {
    const { theme } = useTheme();

    const backgroundColor = color ?? theme.primary;
    const textColor = color ? '#fff' : theme.primaryText;

    return (
        <TouchableOpacity
            style={[styles.button, { backgroundColor }, style, disabled && styles.disabled]}
            onPress={onPress}
            disabled={!!disabled}
            activeOpacity={0.75}
        >
            <Text style={[styles.buttonText, { color: textColor }, textStyle]}>{title}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    disabled: {
        opacity: 0.4,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});

export default CustomButton;

import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const CustomButton = ({ title, onPress, style, textStyle, disabled }) => {
    return (
        <TouchableOpacity
            style={[styles.button, style, disabled && styles.disabled]}
            onPress={onPress}
            disabled={!!disabled}
            activeOpacity={0.7}
        >
            <Text style={[styles.buttonText, textStyle]}>{title}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#6200EE',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    disabled: {
        opacity: 0.4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default CustomButton;

import {TouchableOpacity, Text, StyleSheet, SafeAreaView} from 'react-native';

const CustomButton = ({ title, onPress, style, textStyle }) => {
    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
                <Text style={[styles.buttonText, textStyle]}>{title}</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#6200EE',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 5,
        marginBottom: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
export default CustomButton;

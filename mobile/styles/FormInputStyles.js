import { StyleSheet } from 'react-native';

const formInputStyles = StyleSheet.create({
    container: {
        width: '80%',
        margin: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: '#333',
    },
    input: {
        height: 40,
        borderWidth: 1,
        borderColor: '#ccc',
        paddingHorizontal: 10,
        borderRadius: 6,
        marginBottom: 5,
    },
    roleContainer: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    roleButton: {
        flex: 1,
        paddingVertical: 10,
        backgroundColor: '#eee',
        borderRadius: 6,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    activeRoleButton: {
        backgroundColor: '#6200EE',
    },
    pressedButton: {
        opacity: 0.75,
    },
    roleButtonText: {
        color: '#333',
        fontSize: 16,
    },
    activeRoleButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    registerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    registerText: {
        marginTop: 10,
    },
});

export default formInputStyles;

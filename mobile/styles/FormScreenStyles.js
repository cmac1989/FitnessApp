import {StyleSheet} from 'react-native';

const formScreenStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    viewContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        fontSize: 35,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    tagline: {
        fontSize: 25,
        marginBottom: 30,
    },
    buttonContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        height: 150,
        width: 150,
        marginBottom: 10,
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
});

export default formScreenStyles;

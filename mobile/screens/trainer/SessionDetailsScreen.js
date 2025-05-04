import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CustomButton from '../../components/CustomButton';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';

const SessionDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { session } = route.params;

    if (!session) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>No session details available.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Session Details</Text>

            <View style={styles.detailCard}>
                <Text style={styles.label}>Client:</Text>
                <Text style={styles.value}>{session.client}</Text>

                <Text style={styles.label}>Date:</Text>
                <Text style={styles.value}>{session.date}</Text>

                <Text style={styles.label}>Time:</Text>
                <Text style={styles.value}>{session.time}</Text>

                <Text style={styles.label}>Location:</Text>
                <Text style={styles.value}>{session.location}</Text>

                {session.workout && (
                    <>
                        <Text style={styles.label}>Workout Plan:</Text>
                        <Text style={styles.value}>{session.workout}</Text>
                    </>
                )}
            </View>

            <CustomButton
                title="Edit Session"
                onPress={() => navigation.navigate('EditSession', { session })}
            />
            <CustomButton
                title="Delete Session"
                // onPress={() => navigation.navigate('EditSession', { session })}
            />
        </View>
    );
};
//TODO move to separate file
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f8f8f8',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    detailCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 4,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 10,
    },
    value: {
        fontSize: 16,
        color: '#333',
        marginTop: 2,
    },
    errorText: {
        fontSize: 18,
        color: 'red',
    },
});

export default SessionDetailScreen;

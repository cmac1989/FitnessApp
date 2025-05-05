import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import CustomButton from '../../components/CustomButton';
import ScreenWrapper from '../../components/ScreenWrapper';

const WorkoutDetailsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { workout } = route.params;

    if (!workout) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>No workout details available.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{workout.name}</Text>

            <View style={styles.detailCard}>
                <Text style={styles.label}>Warm Up:</Text>
                <Text style={styles.value}>{workout.warmUp}</Text>

                <Text style={styles.label}>Main Set:</Text>
                <Text style={styles.value}>{workout.mainSet}</Text>

                <Text style={styles.label}>Accessories:</Text>
                <Text style={styles.value}>{workout.accessories}</Text>
            </View>

            <CustomButton
                title="Edit Workout"
                onPress={() => navigation.navigate('EditWorkout', { workout })}
            />
            <CustomButton
                title="Delete Workout"
                // onPress={() => navigation.navigate('EditWorkout', { workout })}
            />
        </View>
    );
};

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

export default WorkoutDetailsScreen;

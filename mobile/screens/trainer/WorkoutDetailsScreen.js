import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import CustomButton from '../../components/CustomButton';
import { deleteWorkout, getTrainerWorkout } from '../../src/api/workout';

const WorkoutDetailsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { workout } = route.params;

    const [currentWorkout, setCurrentWorkout] = useState(workout);
    const [isLoading, setIsLoading] = useState(false);

    // Trigger refetch when screen is focused or workout data changes
    useFocusEffect(
        React.useCallback(() => {
            if (workout) {
                fetchWorkout(workout.id);  // Re-fetch when the screen is focused
            }
        }, [workout]) // Re-fetch on workout change or screen focus
    );

    const fetchWorkout = async (workoutId) => {
        try {
            setIsLoading(true);
            const fetchedWorkout = await getTrainerWorkout(workoutId);
            setCurrentWorkout(fetchedWorkout);
            setIsLoading(false);
        } catch (error) {
            console.error('Could not grab workout', error);
            setIsLoading(false);
        }
    };

    const deleteWorkoutHandler = async (id) => {
        try {
            await deleteWorkout(id);
            Alert.alert('Success', 'Workout deleted successfully.');
            navigation.goBack(); // Go back to the previous screen
        } catch (error) {
            console.error('Failed to delete workout', error);
            Alert.alert('Error', 'Failed to delete workout. Please try again.');
        }
    };

    const updateWorkoutHandler = async () => {
        try {
            // Navigate to the edit screen or do the update logic here
            navigation.navigate('EditWorkout', { workout: currentWorkout });
        } catch (error) {
            console.error('Failed to update workout', error);
            Alert.alert('Error', 'Failed to update workout. Please try again.');
        }
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Loading...</Text>
            </View>
        );
    }

    if (!currentWorkout) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>No workout details available.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{currentWorkout.title}</Text>

            <View style={styles.detailCard}>
                <Text style={styles.label}>Description:</Text>
                <Text style={styles.value}>{currentWorkout.description}</Text>

                <Text style={styles.label}>Duration:</Text>
                <Text style={styles.value}>{currentWorkout.duration}</Text>

                <Text style={styles.label}>Workout:</Text>
                <Text style={styles.value}>{currentWorkout.workout_list}</Text>
            </View>

            <CustomButton
                title="Edit Workout"
                onPress={updateWorkoutHandler}
            />
            <CustomButton
                title="Delete Workout"
                onPress={() => deleteWorkoutHandler(currentWorkout.id)}
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

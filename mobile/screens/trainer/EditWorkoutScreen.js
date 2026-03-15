import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import CustomButton from '../../components/CustomButton';
import { updateWorkout } from '../../src/api/workout';

const EditWorkoutScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { workout } = route.params;

    // States to store the input values
    const [title, setTitle] = useState(workout.title || ''); // Match 'title'
    const [description, setDescription] = useState(workout.description || ''); // Match 'description'
    const [workoutList, setWorkoutList] = useState(workout.workout_list || ''); // Match 'workout_list'
    const [difficulty, setDifficulty] = useState(workout.difficulty || ''); // Match 'difficulty'
    const [duration, setDuration] = useState(workout.duration?.toString() || ''); // Match 'duration' (ensure it's a string for TextInput)

    // The handler to update workout
    const updateWorkoutHandler = async () => {
        // Prepare the workout data
        const updatedData = {
            title,
            description,
            workout_list: workoutList,
            difficulty,
            duration: parseInt(duration, 10), // Ensure duration is an integer
        };

        try {
            // Call the updateWorkout API function to update the workout
            const updated = await updateWorkout(workout.id, updatedData);

            // Show success message
            Alert.alert('Success', 'Workout updated successfully.');

            // Optionally, navigate back or to a different screen
            navigation.goBack();
        } catch (error) {
            console.error('Failed to update workout', error);
            Alert.alert('Error', 'Failed to update workout. Please try again.');
        }
    };

    // Save button logic
    const handleSave = () => {
        updateWorkoutHandler();
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Edit Workout</Text>

            <Text style={styles.label}>Workout Title</Text>
            <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
                style={[styles.input, styles.multiLine]}
                value={description}
                onChangeText={setDescription}
                multiline
            />

            <Text style={styles.label}>Workout List</Text>
            <TextInput
                style={[styles.input, styles.multiLine]}
                value={workoutList}
                onChangeText={setWorkoutList}
                multiline
            />

            <Text style={styles.label}>Difficulty</Text>
            <TextInput
                style={styles.input}
                value={difficulty}
                onChangeText={setDifficulty}
            />

            <Text style={styles.label}>Duration (in minutes)</Text>
            <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric" // Ensures only numbers can be input
            />

            <CustomButton title="Save Changes" onPress={handleSave} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f8f8f8',
        flexGrow: 1,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 10,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginTop: 5,
        borderColor: '#ddd',
        borderWidth: 1,
    },
    multiLine: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
});

export default EditWorkoutScreen;

import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import CustomButton from '../../components/CustomButton';
import dashboardStyles from '../../styles/DashboardStyles';

const CreateWorkoutScreen = () => {
    const [workoutName, setWorkoutName] = useState('');
    const [description, setDescription] = useState('');
    const [exercises, setExercises] = useState('');

    const handleCreateWorkout = () => {
        console.log('Workout Created:', { workoutName, description, exercises });
        // Call API to save workout later
    };

    return (
        <ScrollView contentContainerStyle={dashboardStyles.container}>
            <Text style={dashboardStyles.title}>Create New Workout</Text>

            <Text style={dashboardStyles.sectionTitle}>Workout Name</Text>
            <TextInput
                style={dashboardStyles.input}
                placeholder="Enter workout name"
                value={workoutName}
                onChangeText={setWorkoutName}
            />

            <Text style={dashboardStyles.sectionTitle}>Description</Text>
            <TextInput
                style={[dashboardStyles.input, { height: 100 }]}
                placeholder="Describe the workout"
                value={description}
                onChangeText={setDescription}
                multiline
            />

            <Text style={dashboardStyles.sectionTitle}>Exercises (comma separated)</Text>
            <TextInput
                style={[dashboardStyles.input, { height: 80 }]}
                placeholder="e.g., Push Ups, Squats, Burpees"
                value={exercises}
                onChangeText={setExercises}
                multiline
            />

            <CustomButton title="Create Workout" onPress={handleCreateWorkout} />
        </ScrollView>
    );
};

export default CreateWorkoutScreen;

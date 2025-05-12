import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import CustomButton from '../../components/CustomButton';
import dashboardStyles from '../../styles/DashboardStyles';
import { createWorkout } from '../../src/api/workout';
import {useNavigation} from "@react-navigation/native";

const CreateWorkoutScreen = ({ userId }) => {
    const navigation = useNavigation();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [workoutList, setWorkoutList] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [duration, setDuration] = useState('');

    const handleCreateWorkout = async () => {
        const workoutData = {
            user_id: userId,
            title,
            description,
            workout_list: workoutList,
            difficulty,
            duration,
        };

        try {
            await createWorkout(workoutData);
            console.log('Workout created successfully!');

            navigation.goBack();
        } catch (error) {
            console.error('Could not create workout', error);
        }
    };

    return (
        <ScrollView contentContainerStyle={dashboardStyles.container}>
            <Text style={dashboardStyles.title}>Create New Workout</Text>

            <Text style={dashboardStyles.sectionTitle}>Workout Title</Text>
            <TextInput
                style={dashboardStyles.input}
                placeholder="Enter workout title"
                value={title}
                onChangeText={setTitle}
            />

            <Text style={dashboardStyles.sectionTitle}>Description</Text>
            <TextInput
                style={[dashboardStyles.input, { height: 100 }]}
                placeholder="Describe the workout"
                value={description}
                onChangeText={setDescription}
                multiline
            />

            <Text style={dashboardStyles.sectionTitle}>Workout List</Text>
            <TextInput
                style={dashboardStyles.input}
                placeholder="e.g., A1 asdf"
                value={workoutList}
                onChangeText={setWorkoutList}
            />

            <Text style={dashboardStyles.sectionTitle}>Difficulty Level</Text>
            <TextInput
                style={dashboardStyles.input}
                placeholder="e.g., Beginner, Intermediate, Advanced"
                value={difficulty}
                onChangeText={setDifficulty}
            />

            <Text style={dashboardStyles.sectionTitle}>Duration (minutes)</Text>
            <TextInput
                style={dashboardStyles.input}
                placeholder="Enter duration in minutes"
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
            />

            <CustomButton title="Create Workout" onPress={handleCreateWorkout} />
        </ScrollView>
    );
};

export default CreateWorkoutScreen;

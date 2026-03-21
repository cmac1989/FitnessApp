import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import CustomButton from '../../components/CustomButton';
import { createWorkout } from '../../src/api/workout';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../src/theme';

const CreateWorkoutScreen = ({ userId }) => {
    const navigation = useNavigation();
    const { theme } = useTheme();

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
            navigation.goBack();
        } catch (error) {
            console.error('Could not create workout', error);
        }
    };

    const styles = makeStyles(theme);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Create New Workout</Text>

                <Text style={styles.label}>Workout Title</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter workout title"
                    placeholderTextColor={theme.placeholder}
                    value={title}
                    onChangeText={setTitle}
                />

                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.multiLine]}
                    placeholder="Describe the workout"
                    placeholderTextColor={theme.placeholder}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                />

                <Text style={styles.label}>Workout List</Text>
                <TextInput
                    style={[styles.input, styles.multiLine]}
                    placeholder="e.g. 3x10 Squats, 4x8 Deadlifts"
                    placeholderTextColor={theme.placeholder}
                    value={workoutList}
                    onChangeText={setWorkoutList}
                    multiline
                />

                <Text style={styles.label}>Difficulty Level</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Beginner, Intermediate, Advanced"
                    placeholderTextColor={theme.placeholder}
                    value={difficulty}
                    onChangeText={setDifficulty}
                />

                <Text style={styles.label}>Duration (minutes)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter duration in minutes"
                    placeholderTextColor={theme.placeholder}
                    value={duration}
                    onChangeText={setDuration}
                    keyboardType="numeric"
                />

                <CustomButton title="Create Workout" onPress={handleCreateWorkout} />
            </ScrollView>
        </SafeAreaView>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.background,
    },
    container: {
        padding: 20,
        backgroundColor: theme.background,
        flexGrow: 1,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        color: theme.text,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        marginTop: 12,
        marginBottom: 4,
        color: theme.textSecondary,
    },
    input: {
        backgroundColor: theme.inputBackground,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 4,
        borderColor: theme.inputBorder,
        borderWidth: 1,
        color: theme.text,
    },
    multiLine: {
        minHeight: 90,
        textAlignVertical: 'top',
    },
});

export default CreateWorkoutScreen;

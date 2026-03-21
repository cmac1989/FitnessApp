import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import CustomButton from '../../components/CustomButton';
import { updateWorkout } from '../../src/api/workout';
import { useTheme } from '../../src/theme';

const EditWorkoutScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { workout } = route.params;
    const { theme } = useTheme();

    const [title, setTitle] = useState(workout.title || '');
    const [description, setDescription] = useState(workout.description || '');
    const [workoutList, setWorkoutList] = useState(workout.workout_list || '');
    const [difficulty, setDifficulty] = useState(workout.difficulty || '');
    const [duration, setDuration] = useState(workout.duration?.toString() || '');

    const handleSave = async () => {
        const updatedData = {
            title,
            description,
            workout_list: workoutList,
            difficulty,
            duration: parseInt(duration, 10),
        };
        try {
            await updateWorkout(workout.id, updatedData);
            Alert.alert('Success', 'Workout updated successfully.');
            navigation.goBack();
        } catch (error) {
            console.error('Failed to update workout', error);
            Alert.alert('Error', 'Failed to update workout. Please try again.');
        }
    };

    const styles = makeStyles(theme);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Edit Workout</Text>

                <Text style={styles.label}>Workout Title</Text>
                <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholderTextColor={theme.placeholder}
                />

                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.multiLine]}
                    value={description}
                    onChangeText={setDescription}
                    placeholderTextColor={theme.placeholder}
                    multiline
                />

                <Text style={styles.label}>Workout List</Text>
                <TextInput
                    style={[styles.input, styles.multiLine]}
                    value={workoutList}
                    onChangeText={setWorkoutList}
                    placeholderTextColor={theme.placeholder}
                    multiline
                />

                <Text style={styles.label}>Difficulty</Text>
                <TextInput
                    style={styles.input}
                    value={difficulty}
                    onChangeText={setDifficulty}
                    placeholderTextColor={theme.placeholder}
                />

                <Text style={styles.label}>Duration (minutes)</Text>
                <TextInput
                    style={styles.input}
                    value={duration}
                    onChangeText={setDuration}
                    placeholderTextColor={theme.placeholder}
                    keyboardType="numeric"
                />

                <CustomButton title="Save Changes" onPress={handleSave} />
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
        borderColor: theme.inputBorder,
        borderWidth: 1,
        color: theme.text,
    },
    multiLine: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
});

export default EditWorkoutScreen;

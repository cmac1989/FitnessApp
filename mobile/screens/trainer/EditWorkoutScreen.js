import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, ScrollView,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import CustomButton from '../../components/CustomButton';
import ScreenWrapper from '../../components/ScreenWrapper';
import { updateWorkout } from '../../src/api/workout';
import { useTheme } from '../../src/theme';
import { useToast } from '../../src/context/ToastContext';

const EditWorkoutScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { workout } = route.params;
    const { theme } = useTheme();
    const styles = makeStyles(theme);
    const { showToast } = useToast();

    const [title, setTitle]           = useState(workout.title || '');
    const [description, setDescription] = useState(workout.description || '');
    const [workoutList, setWorkoutList] = useState(workout.workout_list || '');
    const [difficulty, setDifficulty]  = useState(workout.difficulty || '');
    const [duration, setDuration]      = useState(workout.duration?.toString() || '');
    const [saving, setSaving]          = useState(false);

    const handleSave = async () => {
        if (saving) return;
        try {
            setSaving(true);
            await updateWorkout(workout.id, {
                title,
                description,
                workout_list: workoutList,
                difficulty,
                duration: duration ? parseInt(duration, 10) : null,
            });
            showToast('Workout updated successfully.', 'success');
            navigation.goBack();
        } catch (error) {
            showToast('Failed to update workout. Please try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <ScreenWrapper title="Edit Workout" showBack>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.flex}
            >
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                    <Text style={styles.label}>Workout Title</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholderTextColor={theme.placeholder}
                        color={theme.text}
                    />

                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.multiLine]}
                        value={description}
                        onChangeText={setDescription}
                        placeholderTextColor={theme.placeholder}
                        color={theme.text}
                        multiline
                    />

                    <Text style={styles.label}>Workout List</Text>
                    <TextInput
                        style={[styles.input, styles.multiLine]}
                        value={workoutList}
                        onChangeText={setWorkoutList}
                        placeholderTextColor={theme.placeholder}
                        color={theme.text}
                        multiline
                    />

                    <Text style={styles.label}>Difficulty</Text>
                    <TextInput
                        style={styles.input}
                        value={difficulty}
                        onChangeText={setDifficulty}
                        placeholderTextColor={theme.placeholder}
                        color={theme.text}
                    />

                    <Text style={styles.label}>Duration (minutes)</Text>
                    <TextInput
                        style={styles.input}
                        value={duration}
                        onChangeText={setDuration}
                        placeholderTextColor={theme.placeholder}
                        color={theme.text}
                        keyboardType="numeric"
                    />

                    <View style={styles.buttonRow}>
                        <CustomButton
                            title={saving ? 'Saving…' : 'Save Changes'}
                            onPress={handleSave}
                            disabled={saving}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    flex: { flex: 1 },
    container: {
        padding: 20,
        backgroundColor: theme.background,
        paddingBottom: 40,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 18,
        marginBottom: 6,
    },
    input: {
        backgroundColor: theme.inputBackground,
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        borderColor: theme.inputBorder,
        borderWidth: 1,
        color: theme.text,
    },
    multiLine: {
        minHeight: 90,
        textAlignVertical: 'top',
    },
    buttonRow: {
        marginTop: 28,
    },
});

export default EditWorkoutScreen;

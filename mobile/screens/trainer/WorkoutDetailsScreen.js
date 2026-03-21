import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import CustomButton from '../../components/CustomButton';
import { deleteWorkout, getTrainerWorkout } from '../../src/api/workout';
import { useTheme } from '../../src/theme';

const WorkoutDetailsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { workout } = route.params;
    const { theme } = useTheme();

    const [currentWorkout, setCurrentWorkout] = useState(workout);
    const [isLoading, setIsLoading] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            if (workout) {
                fetchWorkout(workout.id);
            }
        }, [workout])
    );

    const fetchWorkout = async (workoutId) => {
        try {
            setIsLoading(true);
            const fetched = await getTrainerWorkout(workoutId);
            setCurrentWorkout(fetched);
        } catch (error) {
            console.error('Could not grab workout', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteWorkout(id);
            Alert.alert('Success', 'Workout deleted successfully.');
            navigation.goBack();
        } catch (error) {
            console.error('Failed to delete workout', error);
            Alert.alert('Error', 'Failed to delete workout. Please try again.');
        }
    };

    const styles = makeStyles(theme);

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            </SafeAreaView>
        );
    }

    if (!currentWorkout) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <Text style={styles.errorText}>No workout details available.</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>{currentWorkout.title}</Text>

                <View style={styles.detailCard}>
                    <DetailRow label="Description" value={currentWorkout.description} theme={theme} />
                    <DetailRow label="Duration" value={currentWorkout.duration ? `${currentWorkout.duration} min` : null} theme={theme} />
                    <DetailRow label="Difficulty" value={currentWorkout.difficulty} theme={theme} />
                    <DetailRow label="Workout List" value={currentWorkout.workout_list} theme={theme} />
                </View>

                <CustomButton
                    title="Edit Workout"
                    onPress={() => navigation.navigate('EditWorkout', { workout: currentWorkout })}
                />
                <CustomButton
                    title="Delete Workout"
                    onPress={() => handleDelete(currentWorkout.id)}
                    color="#ff4d4d"
                />
            </ScrollView>
        </SafeAreaView>
    );
};

const DetailRow = ({ label, value, theme }) => {
    const styles = makeStyles(theme);
    return (
        <View style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value ?? 'N/A'}</Text>
        </View>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.background,
    },
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: theme.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        color: theme.text,
    },
    detailCard: {
        backgroundColor: theme.card,
        padding: 20,
        borderRadius: 12,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
    },
    row: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    value: {
        fontSize: 16,
        color: theme.text,
        marginTop: 4,
    },
    errorText: {
        fontSize: 17,
        color: theme.error,
        textAlign: 'center',
        margin: 20,
    },
});

export default WorkoutDetailsScreen;

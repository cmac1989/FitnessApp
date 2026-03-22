import React, { useState, useCallback } from 'react';
import { View, FlatList, Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import CustomButton from '../../components/CustomButton';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getTrainerWorkouts } from '../../src/api/workout';
import { useTheme } from '../../src/theme';

const WorkoutListScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const [workouts, setWorkouts] = useState([]);
    const [loading, setLoading]   = useState(true);

    const fetchWorkouts = useCallback(async (cancelled) => {
        try {
            setLoading(true);
            const data = await getTrainerWorkouts();
            if (!cancelled.value) setWorkouts(data);
        } catch (error) {
            console.error('error fetching workouts', error);
        } finally {
            if (!cancelled.value) setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            const cancelled = { value: false };
            fetchWorkouts(cancelled);
            return () => { cancelled.value = true; };
        }, [fetchWorkouts])
    );

    const styles = makeStyles(theme);

    if (loading) {
        return (
            <ScreenWrapper title="Workouts">
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            </ScreenWrapper>
        );
    }

    const renderWorkout = ({ item }) => (
        <Pressable
            style={({ pressed }) => [styles.workoutCard, pressed && styles.pressed]}
            onPress={() => navigation.navigate('WorkoutDetails', { workout: item })}
        >
            <Text style={styles.workoutTitle}>{item.title}</Text>
            {item.difficulty && (
                <Text style={styles.workoutMeta}>{item.difficulty} · {item.duration} min</Text>
            )}
        </Pressable>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Workouts Yet</Text>
            <Text style={styles.emptySubtitle}>Create your first workout plan to get started.</Text>
        </View>
    );

    return (
        <ScreenWrapper title="Workouts">
            <View style={styles.container}>
                <Text style={styles.title}>Workout Plans</Text>
                <FlatList
                    data={workouts}
                    keyExtractor={(item) => item.id?.toString()}
                    renderItem={renderWorkout}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmpty}
                />
                <CustomButton
                    title="Add Workout"
                    onPress={() => navigation.navigate('CreateWorkout')}
                />
            </View>
        </ScreenWrapper>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: theme.background,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        color: theme.text,
    },
    listContent: {
        paddingBottom: 12,
    },
    workoutCard: {
        backgroundColor: theme.card,
        padding: 16,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.border,
    },
    pressed: {
        opacity: 0.75,
    },
    workoutTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: theme.text,
    },
    workoutMeta: {
        fontSize: 13,
        color: theme.textMuted,
        marginTop: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
        paddingHorizontal: 30,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: theme.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default WorkoutListScreen;

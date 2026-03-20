import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';

const ClientWorkoutDetailsScreen = () => {
    const route = useRoute();
    const workout = route.params?.workout;

    if (!workout) {
        return (
            <ScreenWrapper title="Workout Details">
                <View style={styles.centered}>
                    <Text style={styles.errorText}>No workout details available.</Text>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper title="Workout Details">
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>{workout.title}</Text>

                <View style={styles.card}>
                    {workout.description ? (
                        <>
                            <Text style={styles.label}>Description</Text>
                            <Text style={styles.value}>{workout.description}</Text>
                        </>
                    ) : null}

                    {workout.difficulty ? (
                        <>
                            <Text style={styles.label}>Difficulty</Text>
                            <Text style={styles.value}>{workout.difficulty}</Text>
                        </>
                    ) : null}

                    {workout.duration ? (
                        <>
                            <Text style={styles.label}>Duration</Text>
                            <Text style={styles.value}>{workout.duration} min</Text>
                        </>
                    ) : null}

                    {workout.workout_list ? (
                        <>
                            <Text style={styles.label}>Exercises</Text>
                            <Text style={styles.value}>{workout.workout_list}</Text>
                        </>
                    ) : null}
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f8f8f8',
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
    },
    card: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 4,
        elevation: 2,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 15,
        color: '#444',
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

export default ClientWorkoutDetailsScreen;

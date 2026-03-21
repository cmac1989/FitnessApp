import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useTheme } from '../../src/theme';

const ClientWorkoutDetailsScreen = () => {
    const route = useRoute();
    const workout = route.params?.workout;
    const { theme } = useTheme();

    const styles = makeStyles(theme);

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
                        <DetailRow label="Description" value={workout.description} theme={theme} />
                    ) : null}
                    {workout.difficulty ? (
                        <DetailRow label="Difficulty" value={workout.difficulty} theme={theme} />
                    ) : null}
                    {workout.duration ? (
                        <DetailRow label="Duration" value={`${workout.duration} min`} theme={theme} />
                    ) : null}
                    {workout.workout_list ? (
                        <DetailRow label="Exercises" value={workout.workout_list} theme={theme} />
                    ) : null}
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const DetailRow = ({ label, value, theme }) => {
    const styles = makeStyles(theme);
    return (
        <View style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
        </View>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: theme.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        color: theme.text,
    },
    card: {
        backgroundColor: theme.card,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
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
    },
});

export default ClientWorkoutDetailsScreen;

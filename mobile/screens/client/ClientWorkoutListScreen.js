import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Pressable,
    ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import CustomButton from '../../components/CustomButton';
import { getClientWorkouts } from '../../src/api/client';

const ClientWorkoutListScreen = () => {
    const navigation = useNavigation();
    const [workouts, setWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchWorkouts = useCallback(async (cancelled) => {
        try {
            setLoading(true);
            setError(null);
            const data = await getClientWorkouts();
            if (!cancelled.value) setWorkouts(data);
        } catch (err) {
            if (!cancelled.value) setError('Could not load workouts.');
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

    const renderItem = useCallback(({ item }) => (
        <Pressable
            onPress={() => navigation.navigate('ClientWorkoutDetails', { workout: item })}
            style={styles.card}
        >
            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.difficulty ? (
                <Text style={styles.cardDetail}>Difficulty: {item.difficulty}</Text>
            ) : null}
            {item.duration ? (
                <Text style={styles.cardDetail}>Duration: {item.duration} min</Text>
            ) : null}
        </Pressable>
    ), [navigation]);

    if (loading) {
        return (
            <ScreenWrapper title="My Workouts">
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#007bff" />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper title="My Workouts">
            <View style={styles.container}>
                <Text style={styles.title}>Workout Plans</Text>
                {error ? (
                    <View style={styles.centered}>
                        <Text style={styles.errorText}>{error}</Text>
                        <CustomButton
                            title="Try Again"
                            onPress={() => fetchWorkouts({ value: false })}
                        />
                    </View>
                ) : workouts.length === 0 ? (
                    <Text style={styles.emptyText}>No workouts available yet.</Text>
                ) : (
                    <FlatList
                        data={workouts}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    listContent: {
        paddingBottom: 20,
    },
    card: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 4,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    cardDetail: {
        fontSize: 14,
        color: '#666',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    emptyText: {
        color: '#888',
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
    },
});

export default ClientWorkoutListScreen;

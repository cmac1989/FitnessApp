import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import CustomButton from '../../components/CustomButton';
import { getClientWorkouts } from '../../src/api/client';
import { useTheme } from '../../src/theme';

const ClientWorkoutListScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const [workouts, setWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchWorkouts = useCallback(async (cancelled, isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);
            setError(null);
            const data = await getClientWorkouts();
            if (!cancelled.value) setWorkouts(data);
        } catch (err) {
            if (!cancelled.value) setError('Could not load workouts.');
        } finally {
            if (!cancelled.value) {
                setLoading(false);
                setRefreshing(false);
            }
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
            <ScreenWrapper title="My Workouts">
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            </ScreenWrapper>
        );
    }

    const renderItem = ({ item }) => (
        <Pressable
            onPress={() => navigation.navigate('ClientWorkoutDetails', { workout: item })}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.difficulty ? <Text style={styles.cardDetail}>Difficulty: {item.difficulty}</Text> : null}
            {item.duration ? <Text style={styles.cardDetail}>Duration: {item.duration} min</Text> : null}
        </Pressable>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Workouts Yet</Text>
            <Text style={styles.emptySubtitle}>Your trainer will assign workout plans here.</Text>
        </View>
    );

    return (
        <ScreenWrapper title="My Workouts">
            <View style={styles.container}>
                <Text style={styles.title}>Workout Plans</Text>
                {error ? (
                    <View style={styles.centered}>
                        <Text style={styles.errorText}>{error}</Text>
                        <CustomButton title="Try Again" onPress={() => fetchWorkouts({ value: false })} />
                    </View>
                ) : (
                    <FlatList
                        data={workouts}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={renderEmpty}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => {
                                    const cancelled = { value: false };
                                    fetchWorkouts(cancelled, true);
                                }}
                                tintColor={theme.accent}
                                colors={[theme.accent]}
                            />
                        }
                    />
                )}
            </View>
        </ScreenWrapper>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
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
    listContent: {
        paddingBottom: 20,
    },
    card: {
        backgroundColor: theme.card,
        padding: 16,
        borderRadius: 10,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: theme.border,
    },
    pressed: { opacity: 0.75 },
    cardTitle: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 4,
        color: theme.text,
    },
    cardDetail: {
        fontSize: 14,
        color: theme.textSecondary,
        marginTop: 2,
    },
    errorText: {
        color: theme.error,
        textAlign: 'center',
        marginBottom: 10,
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

export default ClientWorkoutListScreen;

import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, Alert, SafeAreaView, ScrollView,
    ActivityIndicator, Modal, FlatList, TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import CustomButton from '../../components/CustomButton';
import { deleteWorkout, getTrainerWorkout, assignWorkout } from '../../src/api/workout';
import { getClients } from '../../src/api/user';
import { useTheme } from '../../src/theme';

const WorkoutDetailsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { workout } = route.params;
    const { theme } = useTheme();
    const styles = makeStyles(theme);

    const [currentWorkout, setCurrentWorkout] = useState(workout);
    const [isLoading, setIsLoading]           = useState(false);

    // Assign modal
    const [assignVisible, setAssignVisible]   = useState(false);
    const [clients, setClients]               = useState([]);
    const [loadingClients, setLoadingClients] = useState(false);
    const [assigning, setAssigning]           = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (workout?.id) fetchWorkout(workout.id);
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

    const handleDelete = () => {
        Alert.alert('Delete Workout', 'Are you sure you want to delete this workout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteWorkout(currentWorkout.id);
                        Alert.alert('Deleted', 'Workout deleted successfully.');
                        navigation.goBack();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete workout. Please try again.');
                    }
                },
            },
        ]);
    };

    const openAssignModal = async () => {
        setAssignVisible(true);
        setLoadingClients(true);
        try {
            const data = await getClients();
            setClients(data);
        } catch (err) {
            Alert.alert('Error', 'Could not load clients.');
            setAssignVisible(false);
        } finally {
            setLoadingClients(false);
        }
    };

    const handleAssign = (client) => {
        Alert.alert(
            'Assign Workout',
            `Assign "${currentWorkout.title}" to ${client.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Assign',
                    onPress: async () => {
                        try {
                            setAssigning(true);
                            const res = await assignWorkout(currentWorkout.id, client.id);
                            setAssignVisible(false);
                            Alert.alert('Assigned', res.message);
                        } catch (err) {
                            const msg = err.response?.data?.error ?? 'Failed to assign workout.';
                            Alert.alert('Error', msg);
                        } finally {
                            setAssigning(false);
                        }
                    },
                },
            ]
        );
    };

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
                    <DetailRow label="Duration"    value={currentWorkout.duration ? `${currentWorkout.duration} min` : null} theme={theme} />
                    <DetailRow label="Difficulty"  value={currentWorkout.difficulty} theme={theme} />
                    <DetailRow label="Workout List" value={currentWorkout.workout_list} theme={theme} />
                </View>

                <CustomButton
                    title="Assign to Client"
                    onPress={openAssignModal}
                />
                <CustomButton
                    title="Edit Workout"
                    onPress={() => navigation.navigate('EditWorkout', { workout: currentWorkout })}
                />
                <CustomButton
                    title="Delete Workout"
                    onPress={handleDelete}
                    color="#ff4d4d"
                />
            </ScrollView>

            {/* ── Assign client modal ── */}
            <Modal
                visible={assignVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setAssignVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Assign to Client</Text>
                            <TouchableOpacity onPress={() => setAssignVisible(false)}>
                                <Text style={styles.modalClose}>Cancel</Text>
                            </TouchableOpacity>
                        </View>

                        {loadingClients ? (
                            <ActivityIndicator color={theme.primary} style={{ marginTop: 30 }} />
                        ) : clients.length === 0 ? (
                            <Text style={styles.emptyText}>
                                No linked clients yet. Invite clients first.
                            </Text>
                        ) : (
                            <FlatList
                                data={clients}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.clientRow}
                                        onPress={() => !assigning && handleAssign(item)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.clientName}>{item.name}</Text>
                                        <Text style={styles.clientEmail}>{item.email}</Text>
                                    </TouchableOpacity>
                                )}
                                contentContainerStyle={{ paddingBottom: 30 }}
                            />
                        )}
                    </View>
                </View>
            </Modal>
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
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: theme.card,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 12,
        paddingHorizontal: 20,
        maxHeight: '65%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
    },
    modalClose: {
        fontSize: 15,
        color: theme.primary,
        fontWeight: '600',
    },
    clientRow: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    clientName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
    },
    clientEmail: {
        fontSize: 13,
        color: theme.textMuted,
        marginTop: 2,
    },
    emptyText: {
        textAlign: 'center',
        color: theme.textMuted,
        fontStyle: 'italic',
        marginTop: 30,
        marginBottom: 20,
    },
});

export default WorkoutDetailsScreen;

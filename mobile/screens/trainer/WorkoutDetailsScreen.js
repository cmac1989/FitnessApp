import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, Alert, SafeAreaView, ScrollView,
    ActivityIndicator, Modal, TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import CustomButton from '../../components/CustomButton';
import { deleteWorkout, getTrainerWorkout, batchAssignWorkout } from '../../src/api/workout';
import { getClients } from '../../src/api/user';
import { useTheme } from '../../src/theme';

// ── Date picker helpers ────────────────────────────────────────────────────────

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const toYMD = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const buildDays = (count = 21) => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < count; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        days.push({
            ymd:     toYMD(d),
            dayName: DAY_NAMES[d.getDay()],
            dayNum:  d.getDate(),
            month:   MONTH_NAMES[d.getMonth()],
            isToday: i === 0,
        });
    }
    return days;
};

const DAYS = buildDays(21);

// ── Avatar helpers ─────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

const avatarColor = (name = '') => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase();
};

// ── Screen ────────────────────────────────────────────────────────────────────

const WorkoutDetailsScreen = () => {
    const navigation = useNavigation();
    const route      = useRoute();
    const { workout } = route.params;
    const { theme }  = useTheme();
    const styles     = makeStyles(theme);

    const [currentWorkout, setCurrentWorkout] = useState(workout);
    const [isLoading, setIsLoading]           = useState(false);

    // Modal state
    const [assignVisible, setAssignVisible]   = useState(false);
    const [clients, setClients]               = useState([]);
    const [loadingClients, setLoadingClients] = useState(false);

    // Step 1: multi-select clients; Step 2: pick date
    const [step, setStep]                     = useState(1); // 1 | 2
    const [selectedIds, setSelectedIds]       = useState(new Set());
    const [selectedDate, setSelectedDate]     = useState(null);
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
                    } catch {
                        Alert.alert('Error', 'Failed to delete workout. Please try again.');
                    }
                },
            },
        ]);
    };

    const openAssignModal = async () => {
        setStep(1);
        setSelectedIds(new Set());
        setSelectedDate(null);
        setAssignVisible(true);
        setLoadingClients(true);
        try {
            const data = await getClients();
            setClients(data || []);
        } catch {
            Alert.alert('Error', 'Could not load clients.');
            setAssignVisible(false);
        } finally {
            setLoadingClients(false);
        }
    };

    const closeAssignModal = () => {
        setAssignVisible(false);
        setStep(1);
        setSelectedIds(new Set());
        setSelectedDate(null);
    };

    const toggleClient = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selectedIds.size === clients.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(clients.map(c => c.id)));
    };

    const handleConfirmAssign = async () => {
        if (selectedIds.size === 0) return;
        try {
            setAssigning(true);
            const res = await batchAssignWorkout(currentWorkout.id, [...selectedIds], selectedDate);
            closeAssignModal();
            Alert.alert('Assigned', res.message);
        } catch (err) {
            const msg = err.response?.data?.error ?? err.response?.data?.message ?? 'Failed to assign workout.';
            Alert.alert('Error', msg);
        } finally {
            setAssigning(false);
        }
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

    const allSelected = clients.length > 0 && selectedIds.size === clients.length;

    // ── Step 1: client multi-select ────────────────────────────────────────────

    const renderClientPicker = () => (
        <>
            <View style={styles.stepHeaderRow}>
                <Text style={styles.stepHint}>Select clients</Text>
                {clients.length > 0 && (
                    <TouchableOpacity onPress={toggleAll} activeOpacity={0.7}>
                        <Text style={styles.selectAllText}>
                            {allSelected ? 'Deselect All' : 'Select All'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {loadingClients ? (
                <ActivityIndicator color={theme.primary} style={{ marginTop: 30 }} />
            ) : clients.length === 0 ? (
                <Text style={styles.emptyText}>No linked clients yet.</Text>
            ) : (
                <ScrollView style={styles.clientScroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.clientList}>
                        {clients.map((item, index) => {
                            const isSelected = selectedIds.has(item.id);
                            const bg = avatarColor(item.name);
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[
                                        styles.clientRow,
                                        index < clients.length - 1 && styles.clientRowBorder,
                                        isSelected && styles.clientRowSelected,
                                    ]}
                                    onPress={() => toggleClient(item.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.avatar, { backgroundColor: bg }]}>
                                        <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
                                    </View>
                                    <View style={styles.clientInfo}>
                                        <Text style={[styles.clientName, isSelected && styles.clientNameActive]}>
                                            {item.name}
                                        </Text>
                                        <Text style={styles.clientEmail}>{item.email}</Text>
                                    </View>
                                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                        {isSelected && <Text style={styles.checkboxCheck}>✓</Text>}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>
            )}

            <TouchableOpacity
                style={[styles.nextBtn, selectedIds.size === 0 && styles.nextBtnDisabled]}
                onPress={() => setStep(2)}
                disabled={selectedIds.size === 0}
                activeOpacity={0.8}
            >
                <Text style={styles.nextBtnText}>
                    {selectedIds.size === 0
                        ? 'Next: Pick Date'
                        : `Next: Pick Date for ${selectedIds.size} ${selectedIds.size === 1 ? 'client' : 'clients'}`}
                </Text>
            </TouchableOpacity>
        </>
    );

    // ── Step 2: date picker ────────────────────────────────────────────────────

    const renderDatePicker = () => (
        <>
            <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
                <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.stepHint}>
                Pick a date ({selectedIds.size} {selectedIds.size === 1 ? 'client' : 'clients'})
            </Text>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateScroll}
            >
                {DAYS.map((day) => {
                    const isSelected = selectedDate === day.ymd;
                    return (
                        <TouchableOpacity
                            key={day.ymd}
                            style={[styles.dayChip, isSelected && styles.dayChipSelected]}
                            onPress={() => setSelectedDate(isSelected ? null : day.ymd)}
                            activeOpacity={0.75}
                        >
                            <Text style={[styles.dayName, isSelected && styles.dayTextSelected]}>
                                {day.isToday ? 'Today' : day.dayName}
                            </Text>
                            <Text style={[styles.dayNum, isSelected && styles.dayTextSelected]}>
                                {day.dayNum}
                            </Text>
                            <Text style={[styles.dayMonth, isSelected && styles.dayTextSelected]}>
                                {day.month}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {!selectedDate && (
                <Text style={styles.noDateHint}>
                    No date selected — workout will be assigned without a schedule.
                </Text>
            )}

            <TouchableOpacity
                style={[styles.assignBtn, assigning && styles.assignBtnDisabled]}
                onPress={handleConfirmAssign}
                disabled={assigning}
                activeOpacity={0.8}
            >
                {assigning ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.assignBtnText}>
                        {selectedDate ? `Assign for ${selectedDate}` : 'Assign Without Date'}
                    </Text>
                )}
            </TouchableOpacity>
        </>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>{currentWorkout.title}</Text>

                <View style={styles.detailCard}>
                    <DetailRow label="Description"  value={currentWorkout.description}  theme={theme} />
                    <DetailRow label="Duration"      value={currentWorkout.duration ? `${currentWorkout.duration} min` : null} theme={theme} />
                    <DetailRow label="Difficulty"    value={currentWorkout.difficulty}   theme={theme} />
                    <DetailRow label="Workout List"  value={currentWorkout.workout_list} theme={theme} />
                </View>

                <CustomButton title="Assign to Clients" onPress={openAssignModal} />
                <CustomButton title="Edit Workout" onPress={() => navigation.navigate('EditWorkout', { workout: currentWorkout })} />
                <CustomButton title="Delete Workout" onPress={handleDelete} color="#ff4d4d" />
            </ScrollView>

            {/* ── Assign modal ── */}
            <Modal
                visible={assignVisible}
                animationType="slide"
                transparent
                onRequestClose={closeAssignModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Assign Workout</Text>
                            <TouchableOpacity onPress={closeAssignModal}>
                                <Text style={styles.modalClose}>Cancel</Text>
                            </TouchableOpacity>
                        </View>

                        {step === 1 ? renderClientPicker() : renderDatePicker()}
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
    row: { marginBottom: 16 },
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
    // ── Modal ──
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
        maxHeight: '80%',
        paddingBottom: 34,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
        marginBottom: 12,
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
    stepHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    stepHint: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    selectAllText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.primary,
    },
    backBtn: {
        marginBottom: 8,
    },
    backBtnText: {
        fontSize: 14,
        color: theme.primary,
        fontWeight: '600',
    },
    emptyText: {
        textAlign: 'center',
        color: theme.textMuted,
        fontStyle: 'italic',
        marginTop: 30,
        marginBottom: 20,
    },
    // Client list
    clientScroll: {
        maxHeight: 280,
    },
    clientList: {
        backgroundColor: theme.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
        overflow: 'hidden',
        marginBottom: 8,
    },
    clientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        gap: 10,
    },
    clientRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border,
    },
    clientRowSelected: {
        backgroundColor: theme.primary + '0e',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    avatarText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },
    clientInfo: {
        flex: 1,
    },
    clientName: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.text,
    },
    clientNameActive: {
        color: theme.primary,
    },
    clientEmail: {
        fontSize: 12,
        color: theme.textMuted,
        marginTop: 1,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: theme.border,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    checkboxSelected: {
        backgroundColor: theme.primary,
        borderColor: theme.primary,
    },
    checkboxCheck: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    // Next button
    nextBtn: {
        backgroundColor: theme.primary,
        borderRadius: 10,
        paddingVertical: 13,
        alignItems: 'center',
        marginTop: 10,
    },
    nextBtnDisabled: {
        opacity: 0.45,
    },
    nextBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    // Date picker
    dateScroll: {
        paddingVertical: 12,
        paddingHorizontal: 4,
        gap: 8,
    },
    dayChip: {
        width: 60,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: theme.background,
        borderWidth: 1,
        borderColor: theme.border,
    },
    dayChipSelected: {
        backgroundColor: theme.accent,
        borderColor: theme.accent,
    },
    dayName: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.textMuted,
        marginBottom: 2,
    },
    dayNum: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
    },
    dayMonth: {
        fontSize: 10,
        color: theme.textMuted,
        marginTop: 2,
    },
    dayTextSelected: {
        color: '#fff',
    },
    noDateHint: {
        fontSize: 12,
        color: theme.textMuted,
        textAlign: 'center',
        marginTop: 8,
        fontStyle: 'italic',
    },
    // Confirm assign button
    assignBtn: {
        backgroundColor: theme.accent,
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 16,
    },
    assignBtnDisabled: {
        opacity: 0.6,
    },
    assignBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
});

export default WorkoutDetailsScreen;

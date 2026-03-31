import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput,
    TouchableOpacity, ActivityIndicator, Modal,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { createProgram, updateProgram } from '../../src/api/program';
import { getTrainerWorkouts } from '../../src/api/workout';
import { useTheme } from '../../src/theme';
import { useToast } from '../../src/context/ToastContext';

// ── Difficulty color ───────────────────────────────────────────────────────────

const difficultyColor = (level = '') => {
    const l = level.toLowerCase();
    if (l.includes('easy')     || l.includes('beginner'))    return '#22c55e';
    if (l.includes('moderate') || l.includes('intermediate')) return '#f59e0b';
    if (l.includes('hard')     || l.includes('advanced'))    return '#ef4444';
    return '#6366f1';
};

// ── Screen ─────────────────────────────────────────────────────────────────────

const CreateEditProgramScreen = () => {
    const navigation = useNavigation();
    const route      = useRoute();
    const { theme }  = useTheme();
    const styles     = makeStyles(theme);
    const { showToast } = useToast();

    const existingProgram = route.params?.program ?? null;
    const isEditing       = !!existingProgram;

    // Form state
    const [title, setTitle]             = useState(existingProgram?.title ?? '');
    const [description, setDescription] = useState(existingProgram?.description ?? '');
    // Ordered list of workout objects currently in the program
    const [programWorkouts, setProgramWorkouts] = useState(
        existingProgram?.workouts ?? []
    );
    const [saving, setSaving] = useState(false);

    // Workout picker modal
    const [pickerVisible, setPickerVisible]         = useState(false);
    const [allWorkouts, setAllWorkouts]             = useState([]);
    const [loadingWorkouts, setLoadingWorkouts]     = useState(false);

    useEffect(() => {
        navigation.setOptions({
            title: isEditing ? 'Edit Program' : 'Create Program',
            headerBackTitle: '',
            headerBackTitleVisible: false,
        });
    }, [navigation, isEditing]);

    const openPicker = async () => {
        setPickerVisible(true);
        if (allWorkouts.length > 0) return; // already loaded
        setLoadingWorkouts(true);
        try {
            const data = await getTrainerWorkouts();
            setAllWorkouts(data || []);
        } catch {
            showToast('Could not load workouts.', 'error');
            setPickerVisible(false);
        } finally {
            setLoadingWorkouts(false);
        }
    };

    const addWorkout = (workout) => {
        if (programWorkouts.some(w => w.id === workout.id)) return; // already added
        setProgramWorkouts(prev => [...prev, workout]);
        setPickerVisible(false);
    };

    const removeWorkout = (workoutId) => {
        setProgramWorkouts(prev => prev.filter(w => w.id !== workoutId));
    };

    const moveUp = (index) => {
        if (index === 0) return;
        setProgramWorkouts(prev => {
            const next = [...prev];
            [next[index - 1], next[index]] = [next[index], next[index - 1]];
            return next;
        });
    };

    const moveDown = (index) => {
        setProgramWorkouts(prev => {
            if (index === prev.length - 1) return prev;
            const next = [...prev];
            [next[index], next[index + 1]] = [next[index + 1], next[index]];
            return next;
        });
    };

    const handleSave = async () => {
        if (!title.trim()) {
            showToast('Please enter a program title.', 'info');
            return;
        }
        if (saving) return;
        setSaving(true);
        try {
            const payload = {
                title:       title.trim(),
                description: description.trim() || null,
                workout_ids: programWorkouts.map(w => w.id),
            };
            if (isEditing) {
                await updateProgram(existingProgram.id, payload);
                showToast('Program updated!', 'success');
            } else {
                await createProgram(payload);
                showToast('Program created!', 'success');
            }
            navigation.goBack();
        } catch (err) {
            const msg = err.response?.data?.message ?? 'Failed to save program.';
            showToast(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    // Workouts already in program (IDs set for O(1) lookup)
    const inProgramIds = new Set(programWorkouts.map(w => w.id));
    const availableWorkouts = allWorkouts.filter(w => !inProgramIds.has(w.id));

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Program info ── */}
                    <Text style={styles.sectionLabel}>Program Details</Text>
                    <View style={styles.card}>
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabel}>Title</Text>
                            <TextInput
                                style={[styles.fieldInput, { color: theme.text }]}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="e.g. 4-Week Strength Plan"
                                placeholderTextColor={theme.placeholder}
                                returnKeyType="next"
                                maxLength={100}
                            />
                        </View>
                    </View>

                    <View style={[styles.card, { marginTop: 10 }]}>
                        <View style={styles.multiRow}>
                            <Text style={styles.multiLabel}>Description (optional)</Text>
                            <TextInput
                                style={[styles.multiInput, { color: theme.text }]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="What is this program designed for?"
                                placeholderTextColor={theme.placeholder}
                                multiline
                                textAlignVertical="top"
                                maxLength={500}
                            />
                        </View>
                    </View>

                    {/* ── Workouts in program ── */}
                    <View style={styles.workoutsHeader}>
                        <Text style={styles.sectionLabel}>
                            Workouts in Program{programWorkouts.length > 0 ? ` · ${programWorkouts.length}` : ''}
                        </Text>
                    </View>

                    {programWorkouts.length === 0 ? (
                        <View style={[styles.card, styles.emptyCard]}>
                            <Icon name="barbell-outline" size={28} color={theme.textMuted} />
                            <Text style={styles.emptyCardText}>
                                No workouts added yet. Tap "Add Workout" below.
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.card}>
                            {programWorkouts.map((w, index) => {
                                const diffColor = difficultyColor(w.difficulty ?? '');
                                return (
                                    <View
                                        key={w.id}
                                        style={[
                                            styles.workoutRow,
                                            index < programWorkouts.length - 1 && styles.workoutRowBorder,
                                        ]}
                                    >
                                        {/* Day number */}
                                        <View style={styles.dayBadge}>
                                            <Text style={styles.dayBadgeText}>{index + 1}</Text>
                                        </View>

                                        {/* Info */}
                                        <View style={styles.workoutInfo}>
                                            <Text style={styles.workoutTitle} numberOfLines={1}>{w.title}</Text>
                                            <View style={styles.workoutMeta}>
                                                {w.difficulty && (
                                                    <Text style={[styles.workoutMetaText, { color: diffColor }]}>
                                                        {w.difficulty}
                                                    </Text>
                                                )}
                                                {w.duration && (
                                                    <Text style={styles.workoutMetaText}>{w.duration} min</Text>
                                                )}
                                            </View>
                                        </View>

                                        {/* Reorder + remove */}
                                        <View style={styles.workoutControls}>
                                            <TouchableOpacity
                                                onPress={() => moveUp(index)}
                                                style={[styles.controlBtn, index === 0 && styles.controlBtnDisabled]}
                                                disabled={index === 0}
                                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                            >
                                                <Icon
                                                    name="chevron-up"
                                                    size={16}
                                                    color={index === 0 ? theme.border : theme.textMuted}
                                                />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => moveDown(index)}
                                                style={[
                                                    styles.controlBtn,
                                                    index === programWorkouts.length - 1 && styles.controlBtnDisabled,
                                                ]}
                                                disabled={index === programWorkouts.length - 1}
                                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                            >
                                                <Icon
                                                    name="chevron-down"
                                                    size={16}
                                                    color={index === programWorkouts.length - 1 ? theme.border : theme.textMuted}
                                                />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => removeWorkout(w.id)}
                                                style={styles.removeBtn}
                                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                            >
                                                <Icon name="close-circle" size={20} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* ── Add workout button ── */}
                    <TouchableOpacity
                        style={styles.addWorkoutBtn}
                        onPress={openPicker}
                        activeOpacity={0.8}
                    >
                        <Icon name="add-circle-outline" size={18} color={theme.accent} />
                        <Text style={[styles.addWorkoutBtnText, { color: theme.accent }]}>
                            Add Workout
                        </Text>
                    </TouchableOpacity>

                    {/* ── Save ── */}
                    <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: theme.accent }, saving && styles.saveBtnDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                        activeOpacity={0.82}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <Icon name="checkmark-outline" size={18} color="#fff" />
                                <Text style={styles.saveBtnText}>
                                    {isEditing ? 'Save Changes' : 'Create Program'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ── Workout picker modal ── */}
            <Modal
                visible={pickerVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setPickerVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />

                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add a Workout</Text>
                            <TouchableOpacity
                                onPress={() => setPickerVisible(false)}
                                style={styles.modalCloseBtn}
                                activeOpacity={0.7}
                            >
                                <Icon name="close" size={18} color={theme.textMuted} />
                            </TouchableOpacity>
                        </View>

                        {loadingWorkouts ? (
                            <ActivityIndicator color={theme.accent} style={{ marginTop: 30, marginBottom: 30 }} />
                        ) : availableWorkouts.length === 0 ? (
                            <View style={styles.pickerEmpty}>
                                <Icon name="checkmark-circle-outline" size={32} color={theme.textMuted} />
                                <Text style={styles.pickerEmptyText}>
                                    {allWorkouts.length === 0
                                        ? 'No workouts found. Create some first.'
                                        : 'All your workouts are already in this program.'}
                                </Text>
                            </View>
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.pickerList}>
                                    {availableWorkouts.map((w, index) => {
                                        const diffColor = difficultyColor(w.difficulty ?? '');
                                        return (
                                            <TouchableOpacity
                                                key={w.id}
                                                style={[
                                                    styles.pickerRow,
                                                    index < availableWorkouts.length - 1 && styles.pickerRowBorder,
                                                ]}
                                                onPress={() => addWorkout(w)}
                                                activeOpacity={0.7}
                                            >
                                                <View style={[styles.pickerIcon, { backgroundColor: theme.accent }]}>
                                                    <Icon name="barbell-outline" size={16} color="#fff" />
                                                </View>
                                                <View style={styles.pickerInfo}>
                                                    <Text style={styles.pickerTitle} numberOfLines={1}>{w.title}</Text>
                                                    <View style={styles.pickerMeta}>
                                                        {w.difficulty && (
                                                            <Text style={[styles.pickerMetaText, { color: diffColor }]}>
                                                                {w.difficulty}
                                                            </Text>
                                                        )}
                                                        {w.duration && (
                                                            <Text style={styles.pickerMetaText}>{w.duration} min</Text>
                                                        )}
                                                    </View>
                                                </View>
                                                <Icon name="add-circle-outline" size={22} color={theme.accent} />
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const makeStyles = (theme) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.background,
    },
    scroll: {
        padding: 16,
        paddingBottom: 48,
        backgroundColor: theme.background,
    },

    // Section label
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
        paddingLeft: 4,
    },
    workoutsHeader: {
        marginTop: 20,
        marginBottom: 0,
    },

    // Card
    card: {
        backgroundColor: theme.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border,
        overflow: 'hidden',
    },
    emptyCard: {
        alignItems: 'center',
        paddingVertical: 28,
        gap: 10,
    },
    emptyCardText: {
        fontSize: 13,
        color: theme.textMuted,
        textAlign: 'center',
        paddingHorizontal: 20,
    },

    // Inline field row
    fieldRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 4,
        minHeight: 52,
    },
    fieldLabel: {
        width: 72,
        fontSize: 14,
        fontWeight: '600',
        color: theme.textSecondary,
        flexShrink: 0,
    },
    fieldInput: {
        flex: 1,
        fontSize: 15,
        paddingVertical: 10,
        textAlign: 'right',
    },

    // Multiline
    multiRow: { padding: 16 },
    multiLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    multiInput: {
        fontSize: 15,
        minHeight: 72,
        textAlignVertical: 'top',
        lineHeight: 21,
    },

    // Workout rows in program list
    workoutRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        gap: 10,
    },
    workoutRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border,
    },
    dayBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#6366f118',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    dayBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6366f1',
    },
    workoutInfo: { flex: 1 },
    workoutTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 2,
    },
    workoutMeta: { flexDirection: 'row', gap: 8 },
    workoutMetaText: { fontSize: 12, color: theme.textMuted },

    // Reorder / remove controls
    workoutControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    controlBtn: {
        padding: 4,
    },
    controlBtnDisabled: {
        opacity: 0.3,
    },
    removeBtn: {
        padding: 4,
        marginLeft: 4,
    },

    // Add workout button
    addWorkoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 10,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: theme.accent,
        borderStyle: 'dashed',
    },
    addWorkoutBtnText: {
        fontSize: 15,
        fontWeight: '700',
    },

    // Save button
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 24,
        paddingVertical: 15,
        borderRadius: 14,
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: theme.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 8,
        paddingHorizontal: 20,
        maxHeight: '75%',
        paddingBottom: 34,
    },
    modalHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.border,
        alignSelf: 'center',
        marginBottom: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.text,
    },
    modalCloseBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.border,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Picker list
    pickerEmpty: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 12,
    },
    pickerEmptyText: {
        fontSize: 14,
        color: theme.textMuted,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    pickerList: {
        backgroundColor: theme.background,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.border,
        overflow: 'hidden',
        marginBottom: 12,
    },
    pickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        gap: 12,
    },
    pickerRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border,
    },
    pickerIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    pickerInfo: { flex: 1 },
    pickerTitle: { fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 2 },
    pickerMeta: { flexDirection: 'row', gap: 8 },
    pickerMetaText: { fontSize: 12, color: theme.textMuted },
});

export default CreateEditProgramScreen;

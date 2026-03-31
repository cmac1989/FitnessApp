import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, Alert, SafeAreaView, ScrollView,
    ActivityIndicator, Modal, TouchableOpacity, Image,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import WorkoutCalendar, { toYMD } from '../../components/WorkoutCalendar';
import { deleteWorkout, getTrainerWorkout, batchAssignWorkout } from '../../src/api/workout';
import { getClients } from '../../src/api/user';
import { useTheme } from '../../src/theme';
import { useToast } from '../../src/context/ToastContext';

// ── Avatar helpers (for client list in modal) ──────────────────────────────────

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

// ── Difficulty color ───────────────────────────────────────────────────────────

const difficultyColor = (level = '') => {
    const l = level.toLowerCase();
    if (l.includes('easy')     || l.includes('beginner'))    return '#22c55e';
    if (l.includes('moderate') || l.includes('intermediate')) return '#f59e0b';
    if (l.includes('hard')     || l.includes('advanced'))    return '#ef4444';
    return '#6366f1';
};

// ── Screen ────────────────────────────────────────────────────────────────────

const WorkoutDetailsScreen = () => {
    const navigation = useNavigation();
    const route      = useRoute();
    const { workout } = route.params;
    const { theme }  = useTheme();
    const styles     = makeStyles(theme);
    const { showToast } = useToast();

    const [currentWorkout, setCurrentWorkout] = useState(workout);
    const [isLoading, setIsLoading]           = useState(false);

    // Modal state
    const [assignVisible, setAssignVisible]   = useState(false);
    const [clients, setClients]               = useState([]);
    const [loadingClients, setLoadingClients] = useState(false);

    // Step 1: multi-select clients; Step 2: pick date
    const [step, setStep]                 = useState(1);
    const [selectedIds, setSelectedIds]   = useState(new Set());
    const [selectedDate, setSelectedDate] = useState(null);
    const [assigning, setAssigning]       = useState(false);

    // Remove back button text on iOS; Android has no text by default
    useEffect(() => {
        navigation.setOptions({
            headerBackTitle: '',
            headerBackTitleVisible: false,
        });
    }, [navigation]);

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
                        showToast('Workout deleted successfully.', 'success');
                        navigation.goBack();
                    } catch {
                        showToast('Failed to delete workout. Please try again.', 'error');
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
            showToast('Could not load clients.', 'error');
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
            showToast(res.message, 'success');
        } catch (err) {
            const msg = err.response?.data?.error ?? err.response?.data?.message ?? 'Failed to assign workout.';
            showToast(msg, 'error');
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
                <View style={styles.centered}>
                    <Text style={styles.errorText}>No workout details available.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const diffColor  = difficultyColor(currentWorkout.difficulty ?? '');
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
                <ActivityIndicator color={theme.accent} style={{ marginTop: 30 }} />
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
                                    <View style={[styles.clientAvatar, { backgroundColor: bg }]}>
                                        <Text style={styles.clientAvatarText}>{getInitials(item.name)}</Text>
                                    </View>
                                    <View style={styles.clientInfo}>
                                        <Text style={[styles.clientName, isSelected && { color: theme.accent }]}>
                                            {item.name}
                                        </Text>
                                        <Text style={styles.clientEmail}>{item.email}</Text>
                                    </View>
                                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                        {isSelected && <Icon name="checkmark" size={13} color="#fff" />}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>
            )}

            <TouchableOpacity
                style={[styles.modalPrimaryBtn, selectedIds.size === 0 && styles.modalPrimaryBtnDisabled]}
                onPress={() => setStep(2)}
                disabled={selectedIds.size === 0}
                activeOpacity={0.8}
            >
                <Icon name="arrow-forward" size={16} color="#fff" />
                <Text style={styles.modalPrimaryBtnText}>
                    {selectedIds.size === 0
                        ? 'Pick Date'
                        : `Next — ${selectedIds.size} ${selectedIds.size === 1 ? 'client' : 'clients'} selected`}
                </Text>
            </TouchableOpacity>
        </>
    );

    // ── Step 2: date picker ────────────────────────────────────────────────────

    const renderDatePicker = () => (
        <>
            <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn} activeOpacity={0.7}>
                <Icon name="arrow-back" size={16} color={theme.accent} />
                <Text style={styles.backBtnText}>Back to clients</Text>
            </TouchableOpacity>

            <Text style={styles.stepHint}>
                Pick a date · {selectedIds.size} {selectedIds.size === 1 ? 'client' : 'clients'}
            </Text>

            <WorkoutCalendar
                selectedDate={selectedDate}
                onSelectDate={(ymd) => setSelectedDate(prev => prev === ymd ? null : ymd)}
                minDate={toYMD(new Date())}
                theme={theme}
                style={styles.assignCalendar}
            />

            {!selectedDate && (
                <Text style={styles.noDateHint}>
                    No date — assign without a scheduled date
                </Text>
            )}

            <TouchableOpacity
                style={[styles.modalPrimaryBtn, assigning && styles.modalPrimaryBtnDisabled]}
                onPress={handleConfirmAssign}
                disabled={assigning}
                activeOpacity={0.8}
            >
                {assigning ? (
                    <ActivityIndicator color="#fff" size="small" />
                ) : (
                    <>
                        <Icon name="checkmark-circle" size={16} color="#fff" />
                        <Text style={styles.modalPrimaryBtnText}>
                            {selectedDate ? `Assign · ${selectedDate}` : 'Assign Without Date'}
                        </Text>
                    </>
                )}
            </TouchableOpacity>
        </>
    );

    // ── Main render ────────────────────────────────────────────────────────────

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Hero ──────────────────────────────────────────────────────
                    Banner height = heroIcon.marginTop + heroIcon.height / 2
                    = 40 + 80/2 = 80  →  banner bisects the icon vertically
                ── */}
                <View style={styles.hero}>
                    <View style={[styles.heroBanner, { backgroundColor: theme.accent + '20' }]} />

                    <View style={[styles.heroIcon, { backgroundColor: theme.accent }]}>
                        <Icon name="barbell-outline" size={36} color="#fff" />
                    </View>

                    <Text style={styles.heroTitle}>{currentWorkout.title}</Text>

                    <View style={styles.heroTags}>
                        {currentWorkout.difficulty && (
                            <View style={[styles.tag, { backgroundColor: diffColor + '20', borderColor: diffColor + '50' }]}>
                                <View style={[styles.tagDot, { backgroundColor: diffColor }]} />
                                <Text style={[styles.tagText, { color: diffColor }]}>{currentWorkout.difficulty}</Text>
                            </View>
                        )}
                        {currentWorkout.duration && (
                            <View style={[styles.tag, { backgroundColor: theme.accent + '18', borderColor: theme.accent + '40' }]}>
                                <Icon name="time-outline" size={12} color={theme.accent} />
                                <Text style={[styles.tagText, { color: theme.accent }]}>{currentWorkout.duration} min</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ── Description ── */}
                {currentWorkout.description ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Description</Text>
                        <View style={styles.card}>
                            <Text style={styles.bodyText}>{currentWorkout.description}</Text>
                        </View>
                    </View>
                ) : null}

                {/* ── Exercises (structured library exercises or legacy text) ── */}
                {currentWorkout.workout_exercises?.length > 0 ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Exercises ({currentWorkout.workout_exercises.length})</Text>
                        {currentWorkout.workout_exercises.map((we, i) => {
                            const ex = we.exercise ?? {};
                            return (
                                <View key={we.id ?? i} style={styles.exerciseCard}>
                                    <View style={styles.exNumBadge}>
                                        <Text style={styles.exNumText}>{i + 1}</Text>
                                    </View>
                                    {ex.gif_url ? (
                                        <Image source={{ uri: ex.gif_url }} style={styles.exGif} resizeMode="cover" />
                                    ) : null}
                                    <View style={styles.exBody}>
                                        <Text style={styles.exName} numberOfLines={2}>
                                            {ex.name ? ex.name.charAt(0).toUpperCase() + ex.name.slice(1) : 'Exercise'}
                                        </Text>
                                        <Text style={styles.exMeta}>
                                            {[we.sets && `${we.sets} sets`, we.reps && `${we.reps} reps`].filter(Boolean).join(' × ')}
                                        </Text>
                                        <View style={styles.exPills}>
                                            {ex.body_part ? (
                                                <View style={[styles.exPill, { backgroundColor: theme.accent + '20' }]}>
                                                    <Text style={[styles.exPillText, { color: theme.accent }]}>{ex.body_part}</Text>
                                                </View>
                                            ) : null}
                                            {ex.equipment ? (
                                                <View style={[styles.exPill, { backgroundColor: theme.border }]}>
                                                    <Text style={[styles.exPillText, { color: theme.textMuted }]}>{ex.equipment}</Text>
                                                </View>
                                            ) : null}
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                ) : currentWorkout.workout_list ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Exercises</Text>
                        <View style={styles.card}>
                            <Text style={styles.bodyText}>{currentWorkout.workout_list}</Text>
                        </View>
                    </View>
                ) : null}

                {/* ── Actions ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Actions</Text>

                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: theme.accent }]}
                        onPress={openAssignModal}
                        activeOpacity={0.82}
                    >
                        <View style={styles.actionBtnInner}>
                            <View style={styles.actionIconWrap}>
                                <Icon name="people-outline" size={20} color="#fff" />
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={styles.actionTitle}>Assign to Clients</Text>
                                <Text style={styles.actionSub}>Schedule this workout for one or more clients</Text>
                            </View>
                            <Icon name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnOutline]}
                        onPress={() => navigation.navigate('EditWorkout', { workout: currentWorkout })}
                        activeOpacity={0.82}
                    >
                        <View style={styles.actionBtnInner}>
                            <View style={[styles.actionIconWrap, { backgroundColor: theme.accent + '20' }]}>
                                <Icon name="create-outline" size={20} color={theme.accent} />
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={[styles.actionTitle, { color: theme.text }]}>Edit Workout</Text>
                                <Text style={styles.actionSub}>Update details and exercises</Text>
                            </View>
                            <Icon name="chevron-forward" size={18} color={theme.textMuted} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnDanger]}
                        onPress={handleDelete}
                        activeOpacity={0.82}
                    >
                        <View style={styles.actionBtnInner}>
                            <View style={[styles.actionIconWrap, { backgroundColor: '#ef444420' }]}>
                                <Icon name="trash-outline" size={20} color="#ef4444" />
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={[styles.actionTitle, { color: '#ef4444' }]}>Delete Workout</Text>
                                <Text style={styles.actionSub}>Permanently remove this workout</Text>
                            </View>
                            <Icon name="chevron-forward" size={18} color="#ef444480" />
                        </View>
                    </TouchableOpacity>
                </View>
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
                        <View style={styles.modalHandle} />

                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Assign Workout</Text>
                                <Text style={styles.modalSubtitle}>{currentWorkout.title}</Text>
                            </View>
                            <TouchableOpacity onPress={closeAssignModal} style={styles.modalCloseBtn} activeOpacity={0.7}>
                                <Icon name="close" size={18} color={theme.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.stepIndicator}>
                            <View style={[styles.stepDot, step === 1 && styles.stepDotActive]} />
                            <View style={[styles.stepLine, step === 2 && styles.stepLineActive]} />
                            <View style={[styles.stepDot, step === 2 && styles.stepDotActive]} />
                        </View>

                        {step === 1 ? renderClientPicker() : renderDatePicker()}
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
        paddingBottom: 48,
        backgroundColor: theme.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },
    errorText: {
        fontSize: 16,
        color: theme.error,
        textAlign: 'center',
    },

    // ── Hero ──────────────────────────────────────────────────────────────────
    // Layout:  heroBanner.height = heroIcon.marginTop + heroIcon.height / 2
    //          = 40 + 80/2 = 80  →  banner ends at the icon's vertical midpoint
    hero: {
        alignItems: 'center',
        paddingBottom: 28,
        marginBottom: 8,
    },
    heroBanner: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 80,           // ends at midpoint of heroIcon (marginTop 40 + half of 80)
    },
    heroIcon: {
        width: 80,
        height: 80,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    heroTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: theme.text,
        textAlign: 'center',
        paddingHorizontal: 24,
        letterSpacing: 0.2,
        marginBottom: 14,
    },
    heroTags: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    tagDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    tagText: {
        fontSize: 13,
        fontWeight: '600',
    },

    // ── Sections ──────────────────────────────────────────────────────────────
    section: {
        marginBottom: 20,
        paddingHorizontal: 16,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 10,
        paddingLeft: 4,
    },
    card: {
        backgroundColor: theme.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border,
        padding: 16,
    },
    bodyText: {
        fontSize: 15,
        color: theme.text,
        lineHeight: 22,
    },

    // ── Structured exercise cards ──────────────────────────────────────────────
    exerciseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.border,
        padding: 12,
        marginBottom: 8,
        gap: 10,
    },
    exNumBadge: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: theme.accent + '20',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    exNumText: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.accent,
    },
    exGif: {
        width: 60,
        height: 60,
        borderRadius: 10,
        flexShrink: 0,
    },
    exBody: {
        flex: 1,
        gap: 3,
    },
    exName: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.text,
    },
    exMeta: {
        fontSize: 12,
        color: theme.textSecondary,
        fontWeight: '600',
    },
    exPills: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 2,
        flexWrap: 'wrap',
    },
    exPill: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
    },
    exPillText: {
        fontSize: 10,
        fontWeight: '600',
    },

    // ── Action buttons ────────────────────────────────────────────────────────
    actionBtn: {
        borderRadius: 14,
        marginBottom: 10,
    },
    actionBtnOutline: {
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: theme.border,
    },
    actionBtnDanger: {
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: '#ef444428',
    },
    actionBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
    },
    actionIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 2,
    },
    actionSub: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.65)',
    },

    // ── Modal ─────────────────────────────────────────────────────────────────
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
        maxHeight: '92%',
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
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.text,
    },
    modalSubtitle: {
        fontSize: 13,
        color: theme.textMuted,
        marginTop: 2,
    },
    modalCloseBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.border,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Step indicator
    stepIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.border,
    },
    stepDotActive: {
        backgroundColor: theme.accent,
    },
    stepLine: {
        flex: 1,
        height: 2,
        backgroundColor: theme.border,
        marginHorizontal: 4,
    },
    stepLineActive: {
        backgroundColor: theme.accent,
    },

    stepHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    stepHint: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    selectAllText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.accent,
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 12,
    },
    backBtnText: {
        fontSize: 14,
        color: theme.accent,
        fontWeight: '600',
    },
    emptyText: {
        textAlign: 'center',
        color: theme.textMuted,
        fontStyle: 'italic',
        marginTop: 30,
        marginBottom: 20,
    },

    // Client list in modal
    clientScroll: {
        maxHeight: 280,
    },
    clientList: {
        backgroundColor: theme.background,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.border,
        overflow: 'hidden',
        marginBottom: 12,
    },
    clientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 11,
        paddingHorizontal: 14,
        gap: 12,
    },
    clientRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border,
    },
    clientRowSelected: {
        backgroundColor: theme.accent + '10',
    },
    clientAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    clientAvatarText: {
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
        backgroundColor: theme.accent,
        borderColor: theme.accent,
    },

    // Modal primary button
    modalPrimaryBtn: {
        backgroundColor: theme.accent,
        borderRadius: 14,
        paddingVertical: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 4,
    },
    modalPrimaryBtnDisabled: {
        opacity: 0.45,
    },
    modalPrimaryBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },

    // Calendar in modal
    assignCalendar: {
        marginTop: 8,
        marginBottom: 4,
    },
    noDateHint: {
        fontSize: 12,
        color: theme.textMuted,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 4,
        fontStyle: 'italic',
    },
});

export default WorkoutDetailsScreen;

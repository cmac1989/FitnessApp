import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    ActivityIndicator, Modal, TouchableOpacity, Alert,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import WorkoutCalendar, { toYMD } from '../../components/WorkoutCalendar';
import { getProgram, deleteProgram, batchAssignProgram } from '../../src/api/program';
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
    return '#8b5cf6';
};

// ── Screen ─────────────────────────────────────────────────────────────────────

const ProgramDetailsScreen = () => {
    const navigation = useNavigation();
    const route      = useRoute();
    const { theme }  = useTheme();
    const styles     = makeStyles(theme);
    const { showToast } = useToast();

    const initialProgram = route.params?.program ?? null;
    const [program, setProgram]   = useState(initialProgram);
    const [loading, setLoading]   = useState(!initialProgram?.workouts);

    // Modal state
    const [assignVisible, setAssignVisible]   = useState(false);
    const [clients, setClients]               = useState([]);
    const [loadingClients, setLoadingClients] = useState(false);
    const [step, setStep]                     = useState(1);
    const [selectedIds, setSelectedIds]       = useState(new Set());
    const [selectedDate, setSelectedDate]     = useState(null);
    const [assigning, setAssigning]           = useState(false);

    useEffect(() => {
        navigation.setOptions({
            headerBackTitle: '',
            headerBackTitleVisible: false,
        });
    }, [navigation]);

    const fetchProgram = useCallback(async (cancelled) => {
        if (!initialProgram?.id) return;
        try {
            setLoading(true);
            const data = await getProgram(initialProgram.id);
            if (!cancelled.value) setProgram(data);
        } catch (e) {
            console.error('fetchProgram', e);
        } finally {
            if (!cancelled.value) setLoading(false);
        }
    }, [initialProgram?.id]);

    useFocusEffect(
        useCallback(() => {
            const cancelled = { value: false };
            fetchProgram(cancelled);
            return () => { cancelled.value = true; };
        }, [fetchProgram])
    );

    const handleDelete = () => {
        Alert.alert('Delete Program', `Delete "${program?.title}"? This won't remove already-assigned workouts.`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteProgram(program.id);
                        showToast('Program deleted.', 'success');
                        navigation.goBack();
                    } catch {
                        showToast('Failed to delete program.', 'error');
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
            const res = await batchAssignProgram(program.id, [...selectedIds], selectedDate);
            closeAssignModal();
            showToast(res.message, 'success');
        } catch (err) {
            const msg = err.response?.data?.error ?? err.response?.data?.message ?? 'Failed to assign program.';
            showToast(msg, 'error');
        } finally {
            setAssigning(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            </SafeAreaView>
        );
    }

    if (!program) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centered}>
                    <Text style={styles.errorText}>Program not found.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const workouts    = program.workouts ?? [];
    const allSelected = clients.length > 0 && selectedIds.size === clients.length;
    const totalDays   = workouts.length;

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
                        ? 'Pick Start Date'
                        : `Next — ${selectedIds.size} ${selectedIds.size === 1 ? 'client' : 'clients'} selected`}
                </Text>
            </TouchableOpacity>
        </>
    );

    // ── Step 2: start date picker ──────────────────────────────────────────────

    const renderDatePicker = () => (
        <>
            <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn} activeOpacity={0.7}>
                <Icon name="arrow-back" size={16} color={theme.accent} />
                <Text style={styles.backBtnText}>Back to clients</Text>
            </TouchableOpacity>

            <Text style={styles.stepHint}>
                Pick a start date · {selectedIds.size} {selectedIds.size === 1 ? 'client' : 'clients'}
            </Text>

            {totalDays > 1 && (
                <View style={styles.dateHintBox}>
                    <Icon name="information-circle-outline" size={15} color={theme.accent} />
                    <Text style={styles.dateHintText}>
                        {totalDays} workouts will be scheduled across {totalDays} consecutive days from the start date.
                    </Text>
                </View>
            )}

            <WorkoutCalendar
                selectedDate={selectedDate}
                onSelectDate={(ymd) => setSelectedDate(prev => prev === ymd ? null : ymd)}
                minDate={toYMD(new Date())}
                theme={theme}
                style={styles.assignCalendar}
            />

            {!selectedDate && (
                <Text style={styles.noDateHint}>
                    No date — assign all workouts without a schedule
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
                            {selectedDate ? `Assign starting ${selectedDate}` : 'Assign Without Dates'}
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
                {/* ── Hero ─────────────────────────────────────────────────────
                    heroBanner.height = heroIcon.marginTop + heroIcon.height / 2
                    = 40 + 80/2 = 80
                ── */}
                <View style={styles.hero}>
                    <View style={[styles.heroBanner, { backgroundColor: '#6366f120' }]} />
                    <View style={[styles.heroIcon, { backgroundColor: '#6366f1' }]}>
                        <Icon name="layers-outline" size={36} color="#fff" />
                    </View>
                    <Text style={styles.heroTitle}>{program.title}</Text>
                    <View style={styles.heroTags}>
                        <View style={[styles.tag, { backgroundColor: '#6366f118', borderColor: '#6366f140' }]}>
                            <Icon name="barbell-outline" size={12} color="#6366f1" />
                            <Text style={[styles.tagText, { color: '#6366f1' }]}>
                                {totalDays} {totalDays === 1 ? 'workout' : 'workouts'}
                            </Text>
                        </View>
                        {totalDays > 0 && (
                            <View style={[styles.tag, { backgroundColor: theme.accent + '18', borderColor: theme.accent + '40' }]}>
                                <Icon name="calendar-outline" size={12} color={theme.accent} />
                                <Text style={[styles.tagText, { color: theme.accent }]}>
                                    {totalDays}-day plan
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ── Description ── */}
                {program.description ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>About</Text>
                        <View style={styles.card}>
                            <Text style={styles.bodyText}>{program.description}</Text>
                        </View>
                    </View>
                ) : null}

                {/* ── Workouts in program ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>
                        Workouts · {totalDays} {totalDays === 1 ? 'day' : 'days'}
                    </Text>
                    {workouts.length === 0 ? (
                        <View style={[styles.card, styles.emptyWorkoutsCard]}>
                            <Icon name="barbell-outline" size={24} color={theme.textMuted} />
                            <Text style={styles.emptyWorkoutsText}>No workouts added yet</Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('CreateEditProgram', { program })}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.emptyWorkoutsAction, { color: theme.accent }]}>
                                    Edit program to add workouts
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.card}>
                            {workouts.map((w, index) => {
                                const diffColor = difficultyColor(w.difficulty ?? '');
                                return (
                                    <View
                                        key={w.id}
                                        style={[styles.workoutRow, index < workouts.length - 1 && styles.workoutRowBorder]}
                                    >
                                        <View style={styles.workoutDayBadge}>
                                            <Text style={styles.workoutDayText}>{index + 1}</Text>
                                        </View>
                                        <View style={styles.workoutInfo}>
                                            <Text style={styles.workoutTitle} numberOfLines={1}>{w.title}</Text>
                                            <View style={styles.workoutMeta}>
                                                {w.difficulty && (
                                                    <Text style={[styles.workoutMetaText, { color: diffColor }]}>
                                                        {w.difficulty}
                                                    </Text>
                                                )}
                                                {w.duration && (
                                                    <Text style={styles.workoutMetaText}>
                                                        {w.duration} min
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>

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
                                <Text style={styles.actionSub}>Schedule all workouts for one or more clients</Text>
                            </View>
                            <Icon name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnOutline]}
                        onPress={() => navigation.navigate('CreateEditProgram', { program })}
                        activeOpacity={0.82}
                    >
                        <View style={styles.actionBtnInner}>
                            <View style={[styles.actionIconWrap, { backgroundColor: '#6366f120' }]}>
                                <Icon name="create-outline" size={20} color="#6366f1" />
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={[styles.actionTitle, { color: theme.text }]}>Edit Program</Text>
                                <Text style={styles.actionSub}>Update details and workout order</Text>
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
                                <Text style={[styles.actionTitle, { color: '#ef4444' }]}>Delete Program</Text>
                                <Text style={styles.actionSub}>Remove this program (assignments kept)</Text>
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
                                <Text style={styles.modalTitle}>Assign Program</Text>
                                <Text style={styles.modalSubtitle}>{program.title}</Text>
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

    // Hero (banner bisects icon: marginTop=40, height=80 → banner=80)
    hero: {
        alignItems: 'center',
        paddingBottom: 28,
        marginBottom: 8,
    },
    heroBanner: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 80,
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
    tagText: {
        fontSize: 13,
        fontWeight: '600',
    },

    // Sections
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
        overflow: 'hidden',
    },
    bodyText: {
        fontSize: 15,
        color: theme.text,
        lineHeight: 22,
        padding: 16,
    },

    // Workout rows
    workoutRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
    },
    workoutRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border,
    },
    workoutDayBadge: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#6366f118',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    workoutDayText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6366f1',
    },
    workoutInfo: {
        flex: 1,
    },
    workoutTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 3,
    },
    workoutMeta: {
        flexDirection: 'row',
        gap: 8,
    },
    workoutMetaText: {
        fontSize: 12,
        color: theme.textMuted,
    },
    emptyWorkoutsCard: {
        alignItems: 'center',
        paddingVertical: 28,
        gap: 8,
    },
    emptyWorkoutsText: {
        fontSize: 14,
        color: theme.textMuted,
    },
    emptyWorkoutsAction: {
        fontSize: 14,
        fontWeight: '600',
    },

    // Action buttons
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
    actionContent: { flex: 1 },
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
    stepDotActive: { backgroundColor: theme.accent },
    stepLine: {
        flex: 1,
        height: 2,
        backgroundColor: theme.border,
        marginHorizontal: 4,
    },
    stepLineActive: { backgroundColor: theme.accent },

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
        marginBottom: 4,
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

    // Date hint
    dateHintBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        backgroundColor: theme.accent + '12',
        borderRadius: 10,
        padding: 10,
        marginBottom: 8,
    },
    dateHintText: {
        fontSize: 12,
        color: theme.accent,
        flex: 1,
        lineHeight: 17,
    },

    // Client list
    clientScroll: { maxHeight: 280 },
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
    clientRowSelected: { backgroundColor: theme.accent + '10' },
    clientAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    clientAvatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    clientInfo: { flex: 1 },
    clientName: { fontSize: 15, fontWeight: '600', color: theme.text },
    clientEmail: { fontSize: 12, color: theme.textMuted, marginTop: 1 },
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
    checkboxSelected: { backgroundColor: theme.accent, borderColor: theme.accent },

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
    modalPrimaryBtnDisabled: { opacity: 0.45 },
    modalPrimaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    assignCalendar: { marginTop: 8, marginBottom: 4 },
    noDateHint: {
        fontSize: 12,
        color: theme.textMuted,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 4,
        fontStyle: 'italic',
    },
});

export default ProgramDetailsScreen;

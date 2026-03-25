import React, { useCallback, useState } from 'react';
import {
    View, Text, ScrollView, ActivityIndicator, StyleSheet,
    Pressable, Modal, TextInput, KeyboardAvoidingView,
    Platform, Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import CustomButton from '../../components/CustomButton';
import { getClientDashboard, logClientMetric, setClientGoal, updateClientGoal } from '../../src/api/client';
import { useTheme } from '../../src/theme';

// ── Sparkline ─────────────────────────────────────────────────────────────────
const Sparkline = ({ data, color }) => {
    if (!data || data.length < 2) return null;
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const BAR_W = 10;
    const HEIGHT = 40;

    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: HEIGHT, gap: 3 }}>
            {values.map((v, i) => {
                const pct = (v - min) / range;
                const barH = Math.max(4, Math.round(pct * HEIGHT));
                return (
                    <View
                        key={i}
                        style={{
                            width: BAR_W,
                            height: barH,
                            backgroundColor: color,
                            borderRadius: 3,
                            opacity: 0.6 + 0.4 * pct,
                        }}
                    />
                );
            })}
        </View>
    );
};

// ── Progress Bar ──────────────────────────────────────────────────────────────
const ProgressBar = ({ percent, color, backgroundColor }) => (
    <View style={[pbStyles.track, { backgroundColor }]}>
        <View style={[pbStyles.fill, { width: `${Math.min(100, percent)}%`, backgroundColor: color }]} />
    </View>
);
const pbStyles = StyleSheet.create({
    track: { height: 12, borderRadius: 6, overflow: 'hidden' },
    fill: { height: 12, borderRadius: 6 },
});

// ── Stat Chip ─────────────────────────────────────────────────────────────────
const StatChip = ({ label, value, unit, accent, theme }) => (
    <View style={[chipStyles.chip, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[chipStyles.value, { color: accent || theme.text }]}>{value ?? '—'}</Text>
        {unit ? <Text style={[chipStyles.unit, { color: theme.textMuted }]}>{unit}</Text> : null}
        <Text style={[chipStyles.label, { color: theme.textSecondary }]}>{label}</Text>
    </View>
);
const chipStyles = StyleSheet.create({
    chip: { alignItems: 'center', flex: 1, padding: 12, borderRadius: 12, borderWidth: 1 },
    value: { fontSize: 22, fontWeight: '700' },
    unit: { fontSize: 11, fontWeight: '500', marginTop: 1 },
    label: { fontSize: 11, marginTop: 4, textAlign: 'center' },
});

// ── Goal Type Config ──────────────────────────────────────────────────────────
const GOAL_TYPES = [
    { key: 'weight_loss',       label: 'Weight Loss',   unit: 'lbs' },
    { key: 'strength',          label: 'Strength',      unit: 'lbs' },
    { key: 'body_composition',  label: 'Body Fat %',    unit: '%'   },
    { key: 'endurance',         label: 'Endurance',     unit: 'min' },
    { key: 'custom',            label: 'Custom',        unit: ''    },
];

const goalConfig = (type) => GOAL_TYPES.find(g => g.key === type) ?? GOAL_TYPES[4];

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
const ClientDashboardScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modals
    const [logWeightModal, setLogWeightModal] = useState(false);
    const [logWeight, setLogWeight] = useState('');
    const [logWeightUnit, setLogWeightUnit] = useState('lbs');
    const [logWeightNotes, setLogWeightNotes] = useState('');
    const [loggingWeight, setLoggingWeight] = useState(false);

    const [goalModal, setGoalModal] = useState(false);
    const [goalForm, setGoalForm] = useState({ type: 'weight_loss', description: '', exercise: '', activity: 'run', start_value: '', target_value: '', unit: 'lbs', deadline: '' });
    const [savingGoal, setSavingGoal] = useState(false);
    const [showAllTypes, setShowAllTypes] = useState(false);

    const fetchDashboard = useCallback(async (cancelled) => {
        try {
            setLoading(true);
            setError(null);
            const d = await getClientDashboard();
            if (!cancelled?.value) setData(d);
        } catch (err) {
            if (!cancelled?.value) setError('Failed to load dashboard.');
        } finally {
            if (!cancelled?.value) setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            const cancelled = { value: false };
            fetchDashboard(cancelled);
            return () => { cancelled.value = true; };
        }, [fetchDashboard])
    );

    const handleLogWeight = async () => {
        const val = parseFloat(logWeight);
        if (!logWeight || isNaN(val) || val <= 0) {
            Alert.alert('Invalid', 'Enter a valid weight.');
            return;
        }
        try {
            setLoggingWeight(true);
            await logClientMetric({ type: 'weight', value: val, unit: logWeightUnit, notes: logWeightNotes });
            setLogWeightModal(false);
            setLogWeight('');
            setLogWeightNotes('');
            fetchDashboard({ value: false });
        } catch {
            Alert.alert('Error', 'Could not log weight. Please try again.');
        } finally {
            setLoggingWeight(false);
        }
    };

    const openGoalModal = () => {
        if (data?.goal) {
            const g = data.goal;
            const t = g.type;
            setGoalForm({
                type: t,
                description: (t === 'strength' || t === 'endurance') ? '' : (g.description ?? ''),
                exercise:    t === 'strength'  ? (g.description ?? '') : '',
                activity:    t === 'endurance' ? (g.description ?? 'run') : 'run',
                start_value: g.start_value?.toString() ?? '',
                target_value: g.target_value?.toString() ?? '',
                unit: g.unit ?? (t === 'body_composition' ? '%' : t === 'endurance' ? 'min' : 'lbs'),
                deadline: g.deadline ?? '',
            });
        } else {
            setGoalForm({ type: 'weight_loss', description: '', exercise: '', activity: 'run', start_value: '', target_value: '', unit: 'lbs', deadline: '' });
        }
        setShowAllTypes(false);
        setGoalModal(true);
    };

    const handleSaveGoal = async () => {
        const type = goalForm.type;
        if (type === 'custom') {
            if (!goalForm.description?.trim()) {
                Alert.alert('Required', 'Please enter a description for your custom goal.');
                return;
            }
        } else if (type === 'strength') {
            if (!goalForm.exercise?.trim()) {
                Alert.alert('Required', 'Please enter an exercise name.');
                return;
            }
            if (!goalForm.target_value) {
                Alert.alert('Required', 'Enter a target max weight.');
                return;
            }
        } else {
            if (!goalForm.target_value) {
                Alert.alert('Required', 'Enter a target value.');
                return;
            }
        }

        let description = goalForm.description || null;
        if (type === 'strength')  description = goalForm.exercise.trim() || null;
        if (type === 'endurance') description = goalForm.activity || null;

        try {
            setSavingGoal(true);
            const payload = {
                type,
                description,
                start_value:   goalForm.start_value  ? parseFloat(goalForm.start_value)  : null,
                current_value: goalForm.start_value  ? parseFloat(goalForm.start_value)  : null,
                target_value:  goalForm.target_value ? parseFloat(goalForm.target_value) : null,
                unit:          goalForm.unit || null,
                deadline:      goalForm.deadline || null,
            };
            if (data?.goal?.id) {
                await updateClientGoal(data.goal.id, payload);
            } else {
                await setClientGoal(payload);
            }
            setGoalModal(false);
            fetchDashboard({ value: false });
        } catch {
            Alert.alert('Error', 'Could not save goal. Please try again.');
        } finally {
            setSavingGoal(false);
        }
    };

    const styles = makeStyles(theme);

    if (loading) {
        return (
            <ScreenWrapper title="Dashboard">
                <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>
            </ScreenWrapper>
        );
    }

    if (error) {
        return (
            <ScreenWrapper title="Dashboard">
                <View style={styles.centered}>
                    <Text style={styles.errorText}>{error}</Text>
                    <CustomButton title="Try Again" onPress={() => fetchDashboard({ value: false })} />
                </View>
            </ScreenWrapper>
        );
    }

    const { goal, metrics, workout_analytics: wa, trainer_name, sessions_upcoming } = data ?? {};
    const gc = goal ? goalConfig(goal.type) : null;

    const weightChange = metrics?.weight_change_7d;
    const weightChangeStr = weightChange !== null && weightChange !== undefined
        ? `${weightChange > 0 ? '+' : ''}${weightChange} ${metrics.weight_unit} this week`
        : null;

    const completionPct = wa?.workouts_assigned > 0
        ? Math.min(100, Math.round((wa.workouts_completed / wa.workouts_assigned) * 100))
        : 0;

    return (
        <ScreenWrapper title="Dashboard">
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                {/* ── Greeting ───────────────────────────────────────────── */}
                <View style={styles.greetingCard}>
                    <Text style={styles.greetingTitle}>
                        Hey, {data?.client_name?.split(' ')[0] ?? 'there'}!
                    </Text>
                    {trainer_name ? (
                        <Text style={styles.greetingSubtitle}>Training with {trainer_name}</Text>
                    ) : null}
                    {sessions_upcoming > 0 ? (
                        <Pressable onPress={() => navigation.navigate('Sessions')} style={styles.sessionPill}>
                            <Text style={styles.sessionPillText}>
                                {sessions_upcoming} upcoming session{sessions_upcoming > 1 ? 's' : ''}
                            </Text>
                        </Pressable>
                    ) : null}
                </View>

                {/* ── Goal Progress ──────────────────────────────────────── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Goal Progress</Text>
                        <Pressable onPress={openGoalModal}>
                            <Text style={[styles.sectionAction, { color: theme.accent }]}>
                                {goal ? 'Edit' : 'Set Goal'}
                            </Text>
                        </Pressable>
                    </View>

                    {goal ? (
                        <View style={styles.card}>
                            <View style={styles.goalHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.goalType}>{gc?.label ?? goal.type}</Text>
                                    {goal.description ? (
                                        <Text style={styles.goalDesc}>{goal.description}</Text>
                                    ) : null}
                                </View>
                                <Text style={[styles.goalPercent, { color: theme.accent }]}>
                                    {goal.progress_percent}%
                                </Text>
                            </View>

                            <ProgressBar
                                percent={goal.progress_percent}
                                color={theme.accent}
                                backgroundColor={theme.inputBackground}
                            />

                            <View style={styles.goalMeta}>
                                {goal.start_value != null && goal.target_value != null ? (
                                    <Text style={styles.goalMilestone}>
                                        {goal.current_value} → {goal.target_value} {goal.unit}
                                        {goal.start_value !== goal.current_value
                                            ? `  (started at ${goal.start_value})`
                                            : ''}
                                    </Text>
                                ) : null}
                                {goal.days_remaining != null ? (
                                    <Text style={[styles.goalDeadline, goal.days_remaining < 14 && { color: theme.error }]}>
                                        {goal.days_remaining === 0
                                            ? 'Deadline today'
                                            : `${goal.days_remaining} days remaining`}
                                    </Text>
                                ) : null}
                            </View>
                        </View>
                    ) : (
                        <Pressable style={[styles.card, styles.emptyCard]} onPress={openGoalModal}>
                            {/*<Text style={styles.emptyCardEmoji}>🎯</Text>*/}
                            <Text style={styles.emptyCardTitle}>No active goal</Text>
                            <Text style={styles.emptyCardSub}>Tap to set your first goal and start tracking progress.</Text>
                        </Pressable>
                    )}
                </View>

                {/* ── Body & Performance Metrics ────────────────────────── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Body & Performance</Text>
                        <Pressable onPress={() => setLogWeightModal(true)}>
                            <Text style={[styles.sectionAction, { color: theme.accent }]}>Log Weight</Text>
                        </Pressable>
                    </View>

                    <View style={styles.card}>
                        {metrics?.latest_weight != null ? (
                            <>
                                <View style={styles.metricsRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.bigMetric}>
                                            {metrics.latest_weight}
                                            <Text style={styles.bigMetricUnit}> {metrics.weight_unit}</Text>
                                        </Text>
                                        <Text style={styles.metricLabel}>Current Weight</Text>
                                        {weightChangeStr ? (
                                            <Text style={[
                                                styles.metricChange,
                                                { color: weightChange < 0 ? theme.accent : theme.error },
                                            ]}>
                                                {weightChange < 0 ? '↓' : '↑'} {weightChangeStr}
                                            </Text>
                                        ) : null}
                                    </View>
                                    {metrics.weight_trend?.length >= 2 ? (
                                        <Sparkline data={metrics.weight_trend} color={theme.accent} />
                                    ) : null}
                                </View>

                                {(metrics.latest_waist != null || metrics.latest_body_fat != null) ? (
                                    <View style={[styles.chipRow, { marginTop: 12 }]}>
                                        {metrics.latest_waist != null ? (
                                            <StatChip label="Waist" value={metrics.latest_waist} unit="in" theme={theme} accent={theme.primary} />
                                        ) : null}
                                        {metrics.latest_body_fat != null ? (
                                            <StatChip label="Body Fat" value={metrics.latest_body_fat} unit="%" theme={theme} accent={theme.primary} />
                                        ) : null}
                                    </View>
                                ) : null}
                            </>
                        ) : (
                            <Pressable style={styles.emptyInner} onPress={() => setLogWeightModal(true)}>
                                {/*<Text style={styles.emptyCardEmoji}>⚖️</Text>*/}
                                <Text style={styles.emptyCardTitle}>No measurements yet</Text>
                                <Text style={styles.emptyCardSub}>Log your weight to start tracking trends.</Text>
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* ── Workout Analytics ─────────────────────────────────── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Workout Analytics</Text>
                        <Pressable onPress={() => navigation.navigate('Workout')}>
                            <Text style={[styles.sectionAction, { color: theme.accent }]}>View All</Text>
                        </Pressable>
                    </View>

                    <View style={styles.card}>
                        {/* Streak */}
                        <View style={styles.streakRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.streakCount, { color: wa?.current_streak > 0 ? theme.accent : theme.textSecondary }]}>
                                    {wa?.current_streak ?? 0}-day streak
                                </Text>
                                <Text style={styles.streakSub}>
                                    {wa?.current_streak > 0
                                        ? 'Keep it up! Don\'t break the chain.'
                                        : 'Complete a workout today to start a streak.'}
                                </Text>
                            </View>
                        </View>

                        {/* Completion rate */}
                        {wa?.workouts_assigned > 0 ? (
                            <View style={{ marginTop: 16 }}>
                                <View style={[styles.sectionHeader, { marginBottom: 6 }]}>
                                    <Text style={styles.metricLabel}>Workout Completion</Text>
                                    <Text style={[styles.metricLabel, { color: theme.accent }]}>{completionPct}%</Text>
                                </View>
                                <ProgressBar
                                    percent={completionPct}
                                    color={completionPct >= 80 ? theme.accent : completionPct >= 50 ? theme.primary : theme.error}
                                    backgroundColor={theme.inputBackground}
                                />
                                <Text style={[styles.metricSub, { marginTop: 6 }]}>
                                    {wa.workouts_completed} of {wa.workouts_assigned} assigned workouts completed
                                </Text>
                            </View>
                        ) : null}

                        {/* Chips row */}
                        <View style={[styles.chipRow, { marginTop: 16 }]}>
                            <StatChip
                                label="This Week"
                                value={wa?.this_week_completed ?? 0}
                                unit="done"
                                theme={theme}
                                accent={theme.accent}
                            />
                            <StatChip
                                label="Total Done"
                                value={wa?.workouts_completed ?? 0}
                                unit="workouts"
                                theme={theme}
                            />
                        </View>
                    </View>
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>

            {/* ── Log Weight Modal ────────────────────────────────────────── */}
            <Modal visible={logWeightModal} animationType="slide" transparent onRequestClose={() => setLogWeightModal(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
                    <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
                        <Text style={styles.modalTitle}>Log Weight</Text>

                        <View style={styles.unitToggle}>
                            {['lbs', 'kg'].map(u => (
                                <Pressable
                                    key={u}
                                    style={[styles.unitBtn, logWeightUnit === u && { backgroundColor: theme.accent }]}
                                    onPress={() => setLogWeightUnit(u)}
                                >
                                    <Text style={[styles.unitBtnText, { color: logWeightUnit === u ? '#fff' : theme.textSecondary }]}>{u}</Text>
                                </Pressable>
                            ))}
                        </View>

                        <TextInput
                            style={[styles.modalInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                            placeholder={`Weight in ${logWeightUnit}`}
                            placeholderTextColor={theme.placeholder}
                            keyboardType="decimal-pad"
                            value={logWeight}
                            onChangeText={setLogWeight}
                        />
                        <TextInput
                            style={[styles.modalInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                            placeholder="Notes (optional)"
                            placeholderTextColor={theme.placeholder}
                            value={logWeightNotes}
                            onChangeText={setLogWeightNotes}
                        />

                        <View style={styles.modalActions}>
                            <Pressable style={[styles.modalBtn, { borderColor: theme.border }]} onPress={() => setLogWeightModal(false)}>
                                <Text style={[styles.modalBtnText, { color: theme.textSecondary }]}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalBtn, { backgroundColor: theme.accent, borderColor: theme.accent }]}
                                onPress={handleLogWeight}
                                disabled={loggingWeight}
                            >
                                <Text style={[styles.modalBtnText, { color: '#fff' }]}>
                                    {loggingWeight ? 'Saving…' : 'Save'}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* ── Set / Edit Goal Modal ───────────────────────────────────── */}
            <Modal visible={goalModal} animationType="slide" transparent onRequestClose={() => setGoalModal(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
                    <ScrollView contentContainerStyle={[styles.modalSheet, { backgroundColor: theme.card }]} keyboardShouldPersistTaps="handled">

                        {/* Drag handle + title */}
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>
                            {data?.goal ? 'Edit Goal' : 'Set a Goal'}
                        </Text>

                        {/* Type selector */}
                        <Text style={styles.modalLabel}>Goal Type</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                            {(showAllTypes ? GOAL_TYPES : GOAL_TYPES.slice(0, 3)).map(g => (
                                <Pressable
                                    key={g.key}
                                    style={[
                                        styles.typeChip,
                                        { borderColor: theme.border, backgroundColor: theme.inputBackground },
                                        goalForm.type === g.key && { backgroundColor: theme.accent, borderColor: theme.accent },
                                    ]}
                                    onPress={() => {
                                        const defaultUnit = { weight_loss: 'lbs', body_composition: '%', strength: 'lbs', endurance: 'min', custom: '' }[g.key] ?? '';
                                        setGoalForm(prev => ({ ...prev, type: g.key, unit: defaultUnit, start_value: '', target_value: '', exercise: '', activity: 'run', description: '' }));
                                    }}
                                >
                                    <Text style={{ fontSize: 14, color: goalForm.type === g.key ? '#fff' : theme.text }}>
                                        {g.label}
                                    </Text>
                                </Pressable>
                            ))}
                            <Pressable
                                style={[styles.typeChip, { borderColor: theme.border, backgroundColor: 'transparent' }]}
                                onPress={() => setShowAllTypes(v => !v)}
                            >
                                <Text style={{ fontSize: 14, color: theme.accent }}>
                                    {showAllTypes ? 'Show less' : 'More…'}
                                </Text>
                            </Pressable>
                        </View>

                        {/* ── WEIGHT LOSS ──────────────────────────────────── */}
                        {goalForm.type === 'weight_loss' && (
                            <>
                                <Text style={styles.modalLabel}>Unit</Text>
                                <View style={styles.unitToggle}>
                                    {['lbs', 'kg'].map(u => (
                                        <Pressable
                                            key={u}
                                            style={[styles.unitBtn, goalForm.unit === u && { backgroundColor: theme.accent }]}
                                            onPress={() => setGoalForm(p => ({ ...p, unit: u }))}
                                        >
                                            <Text style={[styles.unitBtnText, { color: goalForm.unit === u ? '#fff' : theme.textSecondary }]}>{u}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.modalLabel}>Current Weight</Text>
                                        <TextInput
                                            style={[styles.modalInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                                            placeholder={`e.g. 200 ${goalForm.unit}`}
                                            placeholderTextColor={theme.placeholder}
                                            keyboardType="decimal-pad"
                                            value={goalForm.start_value}
                                            onChangeText={v => setGoalForm(p => ({ ...p, start_value: v }))}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.modalLabel}>Target Weight *</Text>
                                        <TextInput
                                            style={[styles.modalInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                                            placeholder={`e.g. 175 ${goalForm.unit}`}
                                            placeholderTextColor={theme.placeholder}
                                            keyboardType="decimal-pad"
                                            value={goalForm.target_value}
                                            onChangeText={v => setGoalForm(p => ({ ...p, target_value: v }))}
                                        />
                                    </View>
                                </View>
                                <Text style={styles.modalLabel}>Description (optional)</Text>
                                <TextInput
                                    style={[styles.modalInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                                    placeholder="e.g. Lose 20 lbs before summer"
                                    placeholderTextColor={theme.placeholder}
                                    value={goalForm.description}
                                    onChangeText={v => setGoalForm(p => ({ ...p, description: v }))}
                                />
                                <Text style={styles.modalLabel}>Deadline (optional)</Text>
                                <TextInput
                                    style={[styles.modalInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={theme.placeholder}
                                    value={goalForm.deadline}
                                    onChangeText={v => setGoalForm(p => ({ ...p, deadline: v }))}
                                />
                            </>
                        )}

                        {/* ── BODY FAT % ───────────────────────────────────── */}
                        {goalForm.type === 'body_composition' && (
                            <>
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.modalLabel}>Current Body Fat %</Text>
                                        <TextInput
                                            style={[styles.modalInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                                            placeholder="e.g. 25"
                                            placeholderTextColor={theme.placeholder}
                                            keyboardType="decimal-pad"
                                            value={goalForm.start_value}
                                            onChangeText={v => setGoalForm(p => ({ ...p, start_value: v }))}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.modalLabel}>Target Body Fat % *</Text>
                                        <TextInput
                                            style={[styles.modalInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                                            placeholder="e.g. 18"
                                            placeholderTextColor={theme.placeholder}
                                            keyboardType="decimal-pad"
                                            value={goalForm.target_value}
                                            onChangeText={v => setGoalForm(p => ({ ...p, target_value: v }))}
                                        />
                                    </View>
                                </View>
                                <Text style={styles.modalLabel}>Description (optional)</Text>
                                <TextInput
                                    style={[styles.modalInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                                    placeholder="e.g. Get lean for summer"
                                    placeholderTextColor={theme.placeholder}
                                    value={goalForm.description}
                                    onChangeText={v => setGoalForm(p => ({ ...p, description: v }))}
                                />
                                <Text style={styles.modalLabel}>Deadline (optional)</Text>
                                <TextInput
                                    style={[styles.modalInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={theme.placeholder}
                                    value={goalForm.deadline}
                                    onChangeText={v => setGoalForm(p => ({ ...p, deadline: v }))}
                                />
                            </>
                        )}

                        {/* ── STRENGTH ─────────────────────────────────────── */}
                        {goalForm.type === 'strength' && (
                            <>
                                <Text style={styles.modalLabel}>Exercise / Lift *</Text>
                                <TextInput
                                    style={[styles.modalInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                                    placeholder="e.g. Bench Press, Squat, Deadlift"
                                    placeholderTextColor={theme.placeholder}
                                    value={goalForm.exercise}
                                    onChangeText={v => setGoalForm(p => ({ ...p, exercise: v }))}
                                />
                                <Text style={styles.modalLabel}>Unit</Text>
                                <View style={styles.unitToggle}>
                                    {['lbs', 'kg'].map(u => (
                                        <Pressable
                                            key={u}
                                            style={[styles.unitBtn, goalForm.unit === u && { backgroundColor: theme.accent }]}
                                            onPress={() => setGoalForm(p => ({ ...p, unit: u }))}
                                        >
                                            <Text style={[styles.unitBtnText, { color: goalForm.unit === u ? '#fff' : theme.textSecondary }]}>{u}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.modalLabel}>Current Max</Text>
                                        <TextInput
                                            style={[styles.modalInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                                            placeholder={`e.g. 185 ${goalForm.unit}`}
                                            placeholderTextColor={theme.placeholder}
                                            keyboardType="decimal-pad"
                                            value={goalForm.start_value}
                                            onChangeText={v => setGoalForm(p => ({ ...p, start_value: v }))}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.modalLabel}>Target Max *</Text>
                                        <TextInput
                                            style={[styles.modalInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                                            placeholder={`e.g. 225 ${goalForm.unit}`}
                                            placeholderTextColor={theme.placeholder}
                                            keyboardType="decimal-pad"
                                            value={goalForm.target_value}
                                            onChangeText={v => setGoalForm(p => ({ ...p, target_value: v }))}
                                        />
                                    </View>
                                </View>
                                <Text style={styles.modalLabel}>Deadline (optional)</Text>
                                <TextInput
                                    style={[styles.modalInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={theme.placeholder}
                                    value={goalForm.deadline}
                                    onChangeText={v => setGoalForm(p => ({ ...p, deadline: v }))}
                                />
                            </>
                        )}

                        {/* ── ENDURANCE ────────────────────────────────────── */}
                        {goalForm.type === 'endurance' && (
                            <>
                                <Text style={styles.modalLabel}>Activity</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                                    {['Run', 'Cycle', 'Swim', 'Row', 'Other'].map(a => (
                                        <Pressable
                                            key={a}
                                            style={[
                                                styles.typeChip,
                                                { borderColor: theme.border, backgroundColor: theme.inputBackground },
                                                goalForm.activity === a.toLowerCase() && { backgroundColor: theme.accent, borderColor: theme.accent },
                                            ]}
                                            onPress={() => setGoalForm(p => ({ ...p, activity: a.toLowerCase() }))}
                                        >
                                            <Text style={{ fontSize: 14, color: goalForm.activity === a.toLowerCase() ? '#fff' : theme.text }}>
                                                {a}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                                <Text style={styles.modalLabel}>Measure</Text>
                                <View style={styles.unitToggle}>
                                    {['km', 'mi', 'min'].map(u => (
                                        <Pressable
                                            key={u}
                                            style={[styles.unitBtn, goalForm.unit === u && { backgroundColor: theme.accent }]}
                                            onPress={() => setGoalForm(p => ({ ...p, unit: u }))}
                                        >
                                            <Text style={[styles.unitBtnText, { color: goalForm.unit === u ? '#fff' : theme.textSecondary }]}>{u}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.modalLabel}>Current Benchmark</Text>
                                        <TextInput
                                            style={[styles.modalInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                                            placeholder={goalForm.unit === 'min' ? 'e.g. 35' : 'e.g. 5'}
                                            placeholderTextColor={theme.placeholder}
                                            keyboardType="decimal-pad"
                                            value={goalForm.start_value}
                                            onChangeText={v => setGoalForm(p => ({ ...p, start_value: v }))}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.modalLabel}>Target Benchmark *</Text>
                                        <TextInput
                                            style={[styles.modalInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                                            placeholder={goalForm.unit === 'min' ? 'e.g. 25' : 'e.g. 10'}
                                            placeholderTextColor={theme.placeholder}
                                            keyboardType="decimal-pad"
                                            value={goalForm.target_value}
                                            onChangeText={v => setGoalForm(p => ({ ...p, target_value: v }))}
                                        />
                                    </View>
                                </View>
                                <Text style={styles.modalLabel}>Deadline (optional)</Text>
                                <TextInput
                                    style={[styles.modalInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={theme.placeholder}
                                    value={goalForm.deadline}
                                    onChangeText={v => setGoalForm(p => ({ ...p, deadline: v }))}
                                />
                            </>
                        )}

                        {/* ── CUSTOM ───────────────────────────────────────── */}
                        {goalForm.type === 'custom' && (
                            <>
                                <Text style={styles.modalLabel}>Description *</Text>
                                <TextInput
                                    style={[styles.modalInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text, minHeight: 80, textAlignVertical: 'top' }]}
                                    placeholder="Describe your goal"
                                    placeholderTextColor={theme.placeholder}
                                    multiline
                                    value={goalForm.description}
                                    onChangeText={v => setGoalForm(p => ({ ...p, description: v }))}
                                />
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.modalLabel}>Start Value (optional)</Text>
                                        <TextInput
                                            style={[styles.modalInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                                            placeholder="e.g. 0"
                                            placeholderTextColor={theme.placeholder}
                                            keyboardType="decimal-pad"
                                            value={goalForm.start_value}
                                            onChangeText={v => setGoalForm(p => ({ ...p, start_value: v }))}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.modalLabel}>Target Value (optional)</Text>
                                        <TextInput
                                            style={[styles.modalInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                                            placeholder="e.g. 10"
                                            placeholderTextColor={theme.placeholder}
                                            keyboardType="decimal-pad"
                                            value={goalForm.target_value}
                                            onChangeText={v => setGoalForm(p => ({ ...p, target_value: v }))}
                                        />
                                    </View>
                                </View>
                                <Text style={styles.modalLabel}>Unit (optional)</Text>
                                <TextInput
                                    style={[styles.modalInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                                    placeholder="e.g. sessions, miles, reps"
                                    placeholderTextColor={theme.placeholder}
                                    value={goalForm.unit}
                                    onChangeText={v => setGoalForm(p => ({ ...p, unit: v }))}
                                />
                                <Text style={styles.modalLabel}>Deadline (optional)</Text>
                                <TextInput
                                    style={[styles.modalInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={theme.placeholder}
                                    value={goalForm.deadline}
                                    onChangeText={v => setGoalForm(p => ({ ...p, deadline: v }))}
                                />
                            </>
                        )}

                        <View style={[styles.modalActions, { marginTop: 8 }]}>
                            <Pressable style={[styles.modalBtn, { borderColor: theme.border }]} onPress={() => setGoalModal(false)}>
                                <Text style={[styles.modalBtnText, { color: theme.textSecondary }]}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalBtn, { backgroundColor: theme.accent, borderColor: theme.accent }]}
                                onPress={handleSaveGoal}
                                disabled={savingGoal}
                            >
                                <Text style={[styles.modalBtnText, { color: '#fff' }]}>
                                    {savingGoal ? 'Saving…' : 'Save Goal'}
                                </Text>
                            </Pressable>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>
        </ScreenWrapper>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
const makeStyles = (theme) => StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: theme.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },
    errorText: { color: theme.error, fontSize: 15, marginBottom: 12 },

    // Greeting
    greetingCard: {
        backgroundColor: theme.card,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: theme.border,
    },
    greetingTitle: { fontSize: 24, fontWeight: '800', color: theme.text },
    greetingSubtitle: { fontSize: 14, color: theme.textSecondary, marginTop: 4 },
    sessionPill: {
        marginTop: 12,
        alignSelf: 'flex-start',
        backgroundColor: theme.accent + '22',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    sessionPillText: { fontSize: 13, color: theme.accent, fontWeight: '600' },

    // Sections
    section: { marginBottom: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: theme.text },
    sectionAction: { fontSize: 14, fontWeight: '600' },

    // Card
    card: {
        backgroundColor: theme.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.border,
    },

    // Empty states
    emptyCard: { alignItems: 'center', paddingVertical: 28 },
    emptyInner: { alignItems: 'center', paddingVertical: 12 },
    emptyCardEmoji: { fontSize: 36, marginBottom: 8 },
    emptyCardTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 4 },
    emptyCardSub: { fontSize: 13, color: theme.textSecondary, textAlign: 'center', lineHeight: 18 },

    // Goal card
    goalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
    goalEmoji: { fontSize: 28 },
    goalType: { fontSize: 16, fontWeight: '700', color: theme.text },
    goalDesc: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
    goalPercent: { fontSize: 22, fontWeight: '800' },
    goalMeta: { marginTop: 10, gap: 4 },
    goalMilestone: { fontSize: 13, color: theme.textSecondary },
    goalDeadline: { fontSize: 13, color: theme.textMuted, fontWeight: '500' },

    // Metrics
    metricsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    bigMetric: { fontSize: 32, fontWeight: '800', color: theme.text },
    bigMetricUnit: { fontSize: 16, fontWeight: '500', color: theme.textSecondary },
    metricLabel: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
    metricChange: { fontSize: 13, fontWeight: '600', marginTop: 4 },
    metricSub: { fontSize: 12, color: theme.textMuted },
    chipRow: { flexDirection: 'row', gap: 10 },

    // Streak
    streakRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    streakBadge: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
    streakFire: { fontSize: 26 },
    streakCount: { fontSize: 18, fontWeight: '800' },
    streakSub: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },

    // Modals
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.border,
        alignSelf: 'center',
        marginBottom: 16,
    },
    modalTitle: { fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 16 },
    modalLabel: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginTop: 12, marginBottom: 4 },
    modalInput: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
    },
    unitToggle: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    unitBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: theme.inputBackground,
        borderWidth: 1,
        borderColor: theme.inputBorder,
    },
    unitBtnText: { fontSize: 15, fontWeight: '600' },
    typeChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
    modalBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
    },
    modalBtnText: { fontSize: 15, fontWeight: '700' },
});

export default ClientDashboardScreen;

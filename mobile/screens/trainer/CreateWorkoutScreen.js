import React, { useState } from 'react';
import {
    View, Text, TextInput, ScrollView, StyleSheet, Image,
    TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import CustomButton from '../../components/CustomButton';
import { createWorkout } from '../../src/api/workout';
import { registerExerciseCallback } from '../../src/utils/exerciseSelection';
import { useTheme } from '../../src/theme';
import Icon from 'react-native-vector-icons/Ionicons';
import { useToast } from '../../src/context/ToastContext';

const DIFFICULTY_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];
const capitalize = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);

const CreateWorkoutScreen = () => {
    const navigation = useNavigation();
    const { theme }  = useTheme();
    const styles     = makeStyles(theme);
    const { showToast } = useToast();

    const [title, setTitle]             = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty]   = useState('');
    const [duration, setDuration]       = useState('');
    const [exercises, setExercises]     = useState([]);
    const [saving, setSaving]           = useState(false);

    const removeExercise = (index) => {
        setExercises(prev =>
            prev.filter((_, i) => i !== index).map((e, i) => ({ ...e, order_index: i }))
        );
    };

    const moveExercise = (from, to) => {
        if (to < 0 || to >= exercises.length) return;
        const next = [...exercises];
        [next[from], next[to]] = [next[to], next[from]];
        setExercises(next.map((e, i) => ({ ...e, order_index: i })));
    };

    const openLibrary = () => {
        // Register callback BEFORE navigating — ExerciseLibraryScreen will call it
        // then goBack(), so CreateWorkoutScreen never unmounts and state is preserved.
        registerExerciseCallback((ex) => {
            setExercises(prev => {
                if (prev.some(e => e.external_id === ex.external_id)) return prev;
                return [...prev, { ...ex, order_index: prev.length }];
            });
        });
        navigation.push('ExerciseLibrary', { selectionMode: true });
    };

    const handleCreate = async () => {
        if (!title.trim()) {
            showToast('Please enter a workout title.', 'info');
            return;
        }
        if (saving) return;
        setSaving(true);
        try {
            await createWorkout({
                title:       title.trim(),
                description: description.trim() || null,
                difficulty:  difficulty || null,
                duration:    duration ? parseInt(duration, 10) : null,
                exercises:   exercises.length > 0 ? exercises : undefined,
            });
            showToast('Workout created!', 'success');
            navigation.goBack();
        } catch (e) {
            console.error('createWorkout error', e?.response?.data ?? e.message);
            showToast('Could not create workout. Please try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <ScreenWrapper title="Create Workout" showBack>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.flex}
            >
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* AI banner */}
                    <TouchableOpacity
                        style={styles.aiBanner}
                        onPress={() => navigation.navigate('AIWorkout')}
                        activeOpacity={0.85}
                    >
                        <View style={styles.aiBannerLeft}>
                            <Text style={styles.aiSparkle}>✦</Text>
                            <View>
                                <Text style={styles.aiBannerTitle}>Generate with AI</Text>
                                <Text style={styles.aiBannerSub}>Describe your workout, get a full plan</Text>
                            </View>
                        </View>
                        <Text style={styles.aiBannerArrow}>›</Text>
                    </TouchableOpacity>

                    <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or create manually</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Title */}
                    <Text style={styles.label}>WORKOUT TITLE</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Push Day A"
                        placeholderTextColor={theme.placeholder}
                        value={title}
                        onChangeText={setTitle}
                        color={theme.text}
                    />

                    {/* Description */}
                    <Text style={styles.label}>DESCRIPTION</Text>
                    <TextInput
                        style={[styles.input, styles.multiLine]}
                        placeholder="What's the purpose and target muscles?"
                        placeholderTextColor={theme.placeholder}
                        value={description}
                        onChangeText={setDescription}
                        color={theme.text}
                        multiline
                    />

                    {/* Difficulty */}
                    <Text style={styles.label}>DIFFICULTY</Text>
                    <View style={styles.diffRow}>
                        {DIFFICULTY_OPTIONS.map(opt => (
                            <TouchableOpacity
                                key={opt}
                                style={[styles.diffChip, difficulty === opt && styles.diffChipActive]}
                                onPress={() => setDifficulty(opt)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.diffChipText, difficulty === opt && styles.diffChipTextActive]}>
                                    {opt}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Duration */}
                    <Text style={styles.label}>DURATION (MINUTES)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 45"
                        placeholderTextColor={theme.placeholder}
                        value={duration}
                        onChangeText={setDuration}
                        keyboardType="numeric"
                        color={theme.text}
                    />

                    {/* Exercises */}
                    <View style={styles.exercisesHeader}>
                        <Text style={styles.label}>EXERCISES</Text>
                        {exercises.length > 0 && (
                            <Text style={styles.exercisesCount}>{exercises.length} added</Text>
                        )}
                    </View>

                    {exercises.length > 0 && (
                        <View style={styles.exerciseList}>
                            {exercises.map((ex, i) => (
                                <View
                                    key={`${ex.external_id}-${i}`}
                                    style={[styles.exRow, i < exercises.length - 1 && styles.exRowBorder]}
                                >
                                    <View style={styles.exDayBadge}>
                                        <Text style={styles.exDayText}>{i + 1}</Text>
                                    </View>
                                    {ex.gif_url ? (
                                        <Image
                                            source={{ uri: ex.gif_url }}
                                            style={styles.exGif}
                                            resizeMode="cover"
                                        />
                                    ) : null}
                                    <View style={styles.exBody}>
                                        <Text style={styles.exName} numberOfLines={1}>{capitalize(ex.name)}</Text>
                                        <Text style={styles.exMeta}>{ex.sets} sets × {ex.reps} reps · {ex.body_part}</Text>
                                    </View>
                                    <View style={styles.exActions}>
                                        <TouchableOpacity
                                            onPress={() => moveExercise(i, i - 1)}
                                            disabled={i === 0}
                                            activeOpacity={0.7}
                                            style={styles.exActionBtn}
                                        >
                                            <Icon name="chevron-up" size={16} color={i === 0 ? theme.border : theme.textMuted} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => moveExercise(i, i + 1)}
                                            disabled={i === exercises.length - 1}
                                            activeOpacity={0.7}
                                            style={styles.exActionBtn}
                                        >
                                            <Icon name="chevron-down" size={16} color={i === exercises.length - 1 ? theme.border : theme.textMuted} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => removeExercise(i)}
                                            activeOpacity={0.7}
                                            style={styles.exActionBtn}
                                        >
                                            <Icon name="close" size={16} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.addExerciseBtn}
                        onPress={openLibrary}
                        activeOpacity={0.8}
                    >
                        <Icon name="add-circle-outline" size={18} color={theme.accent} />
                        <Text style={styles.addExerciseBtnText}>Add Exercise from Library</Text>
                    </TouchableOpacity>

                    <View style={styles.buttonRow}>
                        <CustomButton
                            title={saving ? 'Creating…' : 'Create Workout'}
                            onPress={handleCreate}
                            disabled={saving}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    flex: { flex: 1 },
    container: {
        padding: 20,
        paddingBottom: 48,
        backgroundColor: theme.background,
    },

    aiBanner: {
        backgroundColor: theme.primary,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 22,
    },
    aiBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    aiSparkle: { fontSize: 24, color: '#fff' },
    aiBannerTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 2 },
    aiBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
    aiBannerArrow: { fontSize: 24, color: 'rgba(255,255,255,0.7)', fontWeight: '300' },

    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 22 },
    dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.border },
    dividerText: { fontSize: 12, color: theme.textMuted, fontWeight: '500' },

    label: {
        fontSize: 11, fontWeight: '700', color: theme.textMuted,
        letterSpacing: 0.8, marginTop: 16, marginBottom: 6,
    },
    input: {
        backgroundColor: theme.inputBackground,
        borderRadius: 12, padding: 13, fontSize: 15,
        borderColor: theme.inputBorder, borderWidth: 1, color: theme.text,
    },
    multiLine: { minHeight: 90, textAlignVertical: 'top' },

    diffRow: { flexDirection: 'row', gap: 10 },
    diffChip: {
        flex: 1, backgroundColor: theme.card, borderRadius: 10,
        borderWidth: 1, borderColor: theme.border, paddingVertical: 11, alignItems: 'center',
    },
    diffChipActive: { backgroundColor: theme.primary + '18', borderColor: theme.primary + '66' },
    diffChipText: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
    diffChipTextActive: { color: theme.primary },

    exercisesHeader: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginTop: 16, marginBottom: 6,
    },
    exercisesCount: { fontSize: 12, color: theme.textMuted, fontWeight: '600' },

    exerciseList: {
        backgroundColor: theme.card, borderRadius: 14,
        borderWidth: 1, borderColor: theme.border, overflow: 'hidden', marginBottom: 10,
    },
    exRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 10, paddingHorizontal: 12, gap: 10,
    },
    exRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border,
    },
    exDayBadge: {
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: theme.accent + '20',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    exDayText: { fontSize: 12, fontWeight: '700', color: theme.accent },
    exGif: { width: 48, height: 48, borderRadius: 8, flexShrink: 0 },
    exBody: { flex: 1 },
    exName: { fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 2 },
    exMeta: { fontSize: 11, color: theme.textMuted },
    exActions: { flexDirection: 'row', gap: 2 },
    exActionBtn: { padding: 4 },

    addExerciseBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, borderWidth: 1.5, borderColor: theme.accent,
        borderStyle: 'dashed', borderRadius: 12, paddingVertical: 14, marginBottom: 4,
    },
    addExerciseBtnText: { fontSize: 14, fontWeight: '700', color: theme.accent },

    buttonRow: { marginTop: 28 },
});

export default CreateWorkoutScreen;

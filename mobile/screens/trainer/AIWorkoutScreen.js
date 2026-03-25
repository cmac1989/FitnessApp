import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, ScrollView, StyleSheet,
    TouchableOpacity, Animated, Easing, Alert,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { generateWorkout, createWorkout } from '../../src/api/workout';
import { useTheme } from '../../src/theme';

// ── Constants ─────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
    'Upper body strength, intermediate',
    '30-min HIIT for beginners',
    'Full body powerlifting session',
    'Core and abs circuit, 20 min',
    'Leg day for advanced athletes',
    'Cardio + mobility, beginner',
];

const DIFFICULTY_COLORS = {
    Beginner:     '#10b981',
    Intermediate: '#f59e0b',
    Advanced:     '#ef4444',
};

// ── Loading dots animation ────────────────────────────────────────────────────

const LoadingDots = ({ color }) => {
    const dots = [
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
    ];

    useEffect(() => {
        const loop = Animated.loop(
            Animated.stagger(180,
                dots.map(a =>
                    Animated.sequence([
                        Animated.timing(a, { toValue: 1, duration: 380, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
                        Animated.timing(a, { toValue: 0, duration: 380, useNativeDriver: true, easing: Easing.in(Easing.ease) }),
                    ])
                )
            )
        );
        loop.start();
        return () => loop.stop();
    }, []);

    return (
        <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 28 }}>
            {dots.map((a, i) => (
                <Animated.View
                    key={i}
                    style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: color,
                        opacity: a,
                        transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
                    }}
                />
            ))}
        </View>
    );
};

// ── Main Screen ───────────────────────────────────────────────────────────────

const AIWorkoutScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const styles = makeStyles(theme);

    // 'prompt' | 'loading' | 'result' | 'edit'
    const [phase, setPhase] = useState('prompt');
    const [prompt, setPrompt] = useState('');
    const [generated, setGenerated] = useState(null);
    const [saving, setSaving] = useState(false);

    // Edit form fields
    const [title, setTitle]           = useState('');
    const [description, setDescription] = useState('');
    const [workoutList, setWorkoutList] = useState('');
    const [difficulty, setDifficulty]  = useState('');
    const [duration, setDuration]      = useState('');

    // Phase-transition fade
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const fadeTransition = useCallback((next) => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
            next();
            Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
        });
    }, [fadeAnim]);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            Alert.alert('Describe your workout', 'Enter a prompt to get started.');
            return;
        }
        fadeTransition(() => setPhase('loading'));
        try {
            const data = await generateWorkout(prompt.trim());
            const w = data.workout;
            setGenerated(w);
            setTitle(w.title);
            setDescription(w.description);
            setWorkoutList(w.workout_list);
            setDifficulty(w.difficulty);
            setDuration(w.duration?.toString() ?? '');
            fadeTransition(() => setPhase('result'));
        } catch (err) {
            fadeTransition(() => setPhase('prompt'));
            const msg = err?.response?.data?.error ?? 'Could not generate workout. Please try again.';
            Alert.alert('Generation Failed', msg);
        }
    };

    const handleCreateAsIs = async () => {
        if (saving || !generated) return;
        setSaving(true);
        try {
            await createWorkout({
                title:        generated.title,
                description:  generated.description,
                workout_list: generated.workout_list,
                difficulty:   generated.difficulty,
                duration:     generated.duration,
            });
            navigation.navigate('Workouts');
        } catch {
            Alert.alert('Error', 'Could not save workout. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveEdited = async () => {
        if (saving) return;
        setSaving(true);
        try {
            await createWorkout({
                title,
                description,
                workout_list: workoutList,
                difficulty,
                duration: duration ? parseInt(duration, 10) : null,
            });
            navigation.navigate('Workouts');
        } catch {
            Alert.alert('Error', 'Could not save workout. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // ── Prompt phase ──────────────────────────────────────────────────────────

    const renderPrompt = () => (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.flex}
        >
            <ScrollView
                contentContainerStyle={styles.promptScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Hero card */}
                <View style={styles.heroCard}>
                    <Text style={styles.heroSparkle}>✦</Text>
                    <Text style={styles.heroTitle}>AI Workout Generator</Text>
                    <Text style={styles.heroSubtitle}>
                        Describe what you need and get a complete,{'\n'}ready-to-use workout plan in seconds.
                    </Text>
                </View>

                {/* Prompt input card */}
                <View style={styles.inputCard}>
                    <Text style={styles.inputCardLabel}>DESCRIBE YOUR WORKOUT</Text>
                    <TextInput
                        style={styles.promptInput}
                        value={prompt}
                        onChangeText={setPrompt}
                        placeholder={'e.g. A 45-minute upper body strength session for an intermediate athlete, focusing on shoulders and triceps'}
                        placeholderTextColor={theme.placeholder}
                        color={theme.text}
                        multiline
                        autoFocus
                        textAlignVertical="top"
                    />
                    <View style={styles.charHint}>
                        <Text style={styles.charHintText}>{prompt.length} / 1000</Text>
                    </View>
                </View>

                {/* Suggestions */}
                <Text style={styles.sectionLabel}>QUICK STARTS</Text>
                <View style={styles.chipsWrap}>
                    {SUGGESTIONS.map(s => (
                        <TouchableOpacity
                            key={s}
                            style={[styles.chip, prompt === s && styles.chipActive]}
                            onPress={() => setPrompt(s)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.chipText, prompt === s && styles.chipTextActive]}>{s}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Generate button */}
                <TouchableOpacity
                    style={[styles.generateBtn, !prompt.trim() && styles.generateBtnDisabled]}
                    onPress={handleGenerate}
                    activeOpacity={0.85}
                >
                    <Text style={styles.generateBtnText}>✦  Generate Workout</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );

    // ── Loading phase ─────────────────────────────────────────────────────────

    const renderLoading = () => (
        <View style={styles.centerFill}>
            <View style={styles.loadingCard}>
                <Text style={styles.loadingSparkle}>✦</Text>
                <Text style={styles.loadingTitle}>Building Your Workout</Text>
                <Text style={styles.loadingPromptText} numberOfLines={3}>"{prompt}"</Text>
                <LoadingDots color={theme.primary} />
                <Text style={styles.loadingHint}>This usually takes a few seconds…</Text>
            </View>
        </View>
    );

    // ── Result phase ──────────────────────────────────────────────────────────

    const renderResult = () => {
        if (!generated) return null;
        const diffColor = DIFFICULTY_COLORS[generated.difficulty] ?? theme.primary;
        const exercises = (generated.workout_list ?? '')
            .split('\n')
            .map(l => l.trim())
            .filter(Boolean);

        return (
            <ScrollView
                contentContainerStyle={styles.resultScroll}
                showsVerticalScrollIndicator={false}
            >
                {/* AI badge */}
                <View style={styles.aiBadge}>
                    <Text style={styles.aiBadgeText}>✦  AI GENERATED</Text>
                </View>

                {/* Title */}
                <Text style={styles.resultTitle}>{generated.title}</Text>

                {/* Meta chips */}
                <View style={styles.metaRow}>
                    <View style={[styles.metaBadge, {
                        backgroundColor: diffColor + '22',
                        borderColor: diffColor + '55',
                    }]}>
                        <Text style={[styles.metaBadgeText, { color: diffColor }]}>
                            {generated.difficulty}
                        </Text>
                    </View>
                    <View style={styles.metaBadge}>
                        <Text style={styles.metaBadgeText}>⏱  {generated.duration} min</Text>
                    </View>
                    <View style={styles.metaBadge}>
                        <Text style={styles.metaBadgeText}>💪  {exercises.length} exercises</Text>
                    </View>
                </View>

                {/* Overview */}
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>OVERVIEW</Text>
                    <Text style={styles.cardBody}>{generated.description}</Text>
                </View>

                {/* Exercise list */}
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>EXERCISES</Text>
                    {exercises.map((ex, i) => (
                        <View key={i} style={[styles.exerciseRow, i < exercises.length - 1 && styles.exerciseRowBorder]}>
                            <View style={[styles.exNum, { backgroundColor: theme.primary + '18' }]}>
                                <Text style={[styles.exNumText, { color: theme.primary }]}>{i + 1}</Text>
                            </View>
                            <Text style={styles.exText}>{ex}</Text>
                        </View>
                    ))}
                </View>

                {/* Prompt used */}
                <View style={styles.promptUsedCard}>
                    <Text style={styles.promptUsedLabel}>PROMPT USED</Text>
                    <Text style={styles.promptUsedText}>{prompt}</Text>
                </View>

                {/* CTA buttons */}
                <View style={styles.ctaRow}>
                    <TouchableOpacity
                        style={styles.ctaEdit}
                        onPress={() => fadeTransition(() => setPhase('edit'))}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.ctaEditText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.ctaCreate, saving && styles.ctaDisabled]}
                        onPress={handleCreateAsIs}
                        disabled={saving}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.ctaCreateText}>{saving ? 'Saving…' : 'Create Workout'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Retry link */}
                <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => fadeTransition(() => setPhase('prompt'))}
                    activeOpacity={0.7}
                >
                    <Text style={styles.retryBtnText}>↺  Try a different prompt</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    };

    // ── Edit phase ────────────────────────────────────────────────────────────

    const renderEdit = () => (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.flex}
        >
            <ScrollView
                contentContainerStyle={styles.editScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.aiBadge}>
                    <Text style={styles.aiBadgeText}>✦  AI GENERATED — EDITING</Text>
                </View>
                <Text style={styles.editHeading}>Refine Your Workout</Text>
                <Text style={styles.editSubtitle}>All fields are pre-filled from the generated plan. Adjust anything you'd like.</Text>

                <Text style={styles.fieldLabel}>WORKOUT TITLE</Text>
                <TextInput
                    style={styles.fieldInput}
                    value={title}
                    onChangeText={setTitle}
                    placeholderTextColor={theme.placeholder}
                    color={theme.text}
                />

                <Text style={styles.fieldLabel}>DESCRIPTION</Text>
                <TextInput
                    style={[styles.fieldInput, styles.fieldMulti]}
                    value={description}
                    onChangeText={setDescription}
                    placeholderTextColor={theme.placeholder}
                    color={theme.text}
                    multiline
                />

                <Text style={styles.fieldLabel}>EXERCISE LIST</Text>
                <Text style={styles.fieldHint}>One exercise per line, e.g. "3x10 Barbell Squats"</Text>
                <TextInput
                    style={[styles.fieldInput, styles.fieldMultiXL]}
                    value={workoutList}
                    onChangeText={setWorkoutList}
                    placeholderTextColor={theme.placeholder}
                    color={theme.text}
                    multiline
                />

                <View style={styles.fieldRow}>
                    <View style={styles.fieldHalf}>
                        <Text style={styles.fieldLabel}>DIFFICULTY</Text>
                        <TextInput
                            style={styles.fieldInput}
                            value={difficulty}
                            onChangeText={setDifficulty}
                            placeholderTextColor={theme.placeholder}
                            color={theme.text}
                            placeholder="Beginner / Intermediate / Advanced"
                        />
                    </View>
                    <View style={styles.fieldHalf}>
                        <Text style={styles.fieldLabel}>DURATION (MIN)</Text>
                        <TextInput
                            style={styles.fieldInput}
                            value={duration}
                            onChangeText={setDuration}
                            keyboardType="numeric"
                            placeholderTextColor={theme.placeholder}
                            color={theme.text}
                            placeholder="e.g. 45"
                        />
                    </View>
                </View>

                <View style={styles.ctaRow}>
                    <TouchableOpacity
                        style={styles.ctaEdit}
                        onPress={() => fadeTransition(() => setPhase('result'))}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.ctaEditText}>← Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.ctaCreate, saving && styles.ctaDisabled]}
                        onPress={handleSaveEdited}
                        disabled={saving}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.ctaCreateText}>{saving ? 'Saving…' : 'Save Workout'}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <ScreenWrapper title="AI Generator" showBack>
            <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
                {phase === 'prompt'  && renderPrompt()}
                {phase === 'loading' && renderLoading()}
                {phase === 'result'  && renderResult()}
                {phase === 'edit'    && renderEdit()}
            </Animated.View>
        </ScreenWrapper>
    );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const makeStyles = (theme) => StyleSheet.create({
    flex: { flex: 1 },

    // ── Prompt
    promptScroll: {
        padding: 20,
        paddingBottom: 48,
        backgroundColor: theme.background,
    },
    heroCard: {
        backgroundColor: theme.primary,
        borderRadius: 22,
        paddingVertical: 32,
        paddingHorizontal: 24,
        alignItems: 'center',
        marginBottom: 20,
    },
    heroSparkle: {
        fontSize: 38,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 10,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 0.2,
    },
    heroSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.75)',
        textAlign: 'center',
        lineHeight: 21,
    },
    inputCard: {
        backgroundColor: theme.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border,
        padding: 16,
        marginBottom: 20,
    },
    inputCardLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.textMuted,
        letterSpacing: 1,
        marginBottom: 10,
    },
    promptInput: {
        fontSize: 15,
        color: theme.text,
        minHeight: 110,
        textAlignVertical: 'top',
        lineHeight: 23,
    },
    charHint: {
        alignItems: 'flex-end',
        marginTop: 8,
    },
    charHintText: {
        fontSize: 12,
        color: theme.textMuted,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.textMuted,
        letterSpacing: 1,
        marginBottom: 10,
    },
    chipsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    chip: {
        backgroundColor: theme.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.border,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    chipActive: {
        backgroundColor: theme.primary + '18',
        borderColor: theme.primary + '55',
    },
    chipText: {
        fontSize: 13,
        color: theme.textSecondary,
        fontWeight: '500',
    },
    chipTextActive: {
        color: theme.primary,
        fontWeight: '600',
    },
    generateBtn: {
        backgroundColor: theme.primary,
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
    },
    generateBtnDisabled: {
        opacity: 0.5,
    },
    generateBtnText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    // ── Loading
    centerFill: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        backgroundColor: theme.background,
    },
    loadingCard: {
        backgroundColor: theme.card,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: theme.border,
        padding: 36,
        alignItems: 'center',
        width: '100%',
    },
    loadingSparkle: {
        fontSize: 42,
        color: theme.primary,
        marginBottom: 14,
    },
    loadingTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 10,
        textAlign: 'center',
    },
    loadingPromptText: {
        fontSize: 14,
        color: theme.textSecondary,
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 20,
        paddingHorizontal: 8,
    },
    loadingHint: {
        fontSize: 12,
        color: theme.textMuted,
        marginTop: 20,
        textAlign: 'center',
    },

    // ── Result
    resultScroll: {
        padding: 20,
        paddingBottom: 48,
        backgroundColor: theme.background,
    },
    aiBadge: {
        backgroundColor: theme.primary + '18',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.primary + '44',
        paddingHorizontal: 14,
        paddingVertical: 6,
        alignSelf: 'flex-start',
        marginBottom: 14,
    },
    aiBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.primary,
        letterSpacing: 1,
    },
    resultTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: theme.text,
        marginBottom: 14,
        lineHeight: 34,
        letterSpacing: 0.1,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    metaBadge: {
        backgroundColor: theme.backgroundSecondary,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.border,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    metaBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.textSecondary,
    },
    card: {
        backgroundColor: theme.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border,
        padding: 18,
        marginBottom: 12,
    },
    cardLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.textMuted,
        letterSpacing: 1,
        marginBottom: 10,
    },
    cardBody: {
        fontSize: 15,
        color: theme.textSecondary,
        lineHeight: 23,
    },
    exerciseRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingVertical: 10,
    },
    exerciseRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border,
    },
    exNum: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: 1,
    },
    exNumText: {
        fontSize: 12,
        fontWeight: '700',
    },
    exText: {
        flex: 1,
        fontSize: 15,
        color: theme.text,
        lineHeight: 22,
    },
    promptUsedCard: {
        backgroundColor: theme.backgroundSecondary,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
        padding: 14,
        marginBottom: 20,
    },
    promptUsedLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.textMuted,
        letterSpacing: 1,
        marginBottom: 6,
    },
    promptUsedText: {
        fontSize: 13,
        color: theme.textSecondary,
        fontStyle: 'italic',
        lineHeight: 19,
    },
    ctaRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 6,
    },
    ctaEdit: {
        flex: 1,
        backgroundColor: theme.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.border,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaEditText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.text,
    },
    ctaCreate: {
        flex: 2,
        backgroundColor: theme.primary,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaCreateText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
    ctaDisabled: {
        opacity: 0.5,
    },
    retryBtn: {
        alignItems: 'center',
        paddingVertical: 14,
    },
    retryBtnText: {
        fontSize: 14,
        color: theme.textMuted,
        fontWeight: '500',
    },

    // ── Edit
    editScroll: {
        padding: 20,
        paddingBottom: 48,
        backgroundColor: theme.background,
    },
    editHeading: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.text,
        marginTop: 8,
        marginBottom: 6,
    },
    editSubtitle: {
        fontSize: 14,
        color: theme.textSecondary,
        lineHeight: 20,
        marginBottom: 24,
    },
    fieldLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.textMuted,
        letterSpacing: 0.8,
        marginTop: 16,
        marginBottom: 6,
    },
    fieldHint: {
        fontSize: 12,
        color: theme.textMuted,
        marginBottom: 6,
        marginTop: -2,
    },
    fieldInput: {
        backgroundColor: theme.inputBackground,
        borderRadius: 12,
        padding: 13,
        fontSize: 15,
        borderColor: theme.inputBorder,
        borderWidth: 1,
        color: theme.text,
    },
    fieldMulti: {
        minHeight: 90,
        textAlignVertical: 'top',
    },
    fieldMultiXL: {
        minHeight: 180,
        textAlignVertical: 'top',
    },
    fieldRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 0,
    },
    fieldHalf: {
        flex: 1,
    },
});

export default AIWorkoutScreen;

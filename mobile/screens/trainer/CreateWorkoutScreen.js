import React, { useState } from 'react';
import {
    View, Text, TextInput, ScrollView, StyleSheet,
    TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import CustomButton from '../../components/CustomButton';
import { createWorkout } from '../../src/api/workout';
import { useTheme } from '../../src/theme';

const DIFFICULTY_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];

const CreateWorkoutScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const styles = makeStyles(theme);

    const [title, setTitle]           = useState('');
    const [description, setDescription] = useState('');
    const [workoutList, setWorkoutList] = useState('');
    const [difficulty, setDifficulty]  = useState('');
    const [duration, setDuration]      = useState('');
    const [saving, setSaving]          = useState(false);

    const handleCreate = async () => {
        if (!title.trim()) {
            Alert.alert('Missing Title', 'Please enter a workout title.');
            return;
        }
        if (saving) return;
        setSaving(true);
        try {
            await createWorkout({
                title:        title.trim(),
                description:  description.trim(),
                workout_list: workoutList.trim(),
                difficulty,
                duration:     duration ? parseInt(duration, 10) : null,
            });
            navigation.goBack();
        } catch {
            Alert.alert('Error', 'Could not create workout. Please try again.');
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

                    {/* Divider */}
                    <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or create manually</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Form */}
                    <Text style={styles.label}>WORKOUT TITLE</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Push Day A"
                        placeholderTextColor={theme.placeholder}
                        value={title}
                        onChangeText={setTitle}
                        color={theme.text}
                    />

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

                    <Text style={styles.label}>EXERCISE LIST</Text>
                    <Text style={styles.fieldHint}>One exercise per line, e.g. "3x10 Barbell Squats"</Text>
                    <TextInput
                        style={[styles.input, styles.multiLineXL]}
                        placeholder={'3x10 Bench Press\n4x8 Overhead Press\n3x12 Lateral Raises'}
                        placeholderTextColor={theme.placeholder}
                        value={workoutList}
                        onChangeText={setWorkoutList}
                        color={theme.text}
                        multiline
                    />

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

    // AI banner
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
    aiBannerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    aiSparkle: {
        fontSize: 24,
        color: '#fff',
    },
    aiBannerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 2,
    },
    aiBannerSub: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.75)',
    },
    aiBannerArrow: {
        fontSize: 24,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '300',
    },

    // Divider
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 22,
    },
    dividerLine: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.border,
    },
    dividerText: {
        fontSize: 12,
        color: theme.textMuted,
        fontWeight: '500',
    },

    // Fields
    label: {
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
    input: {
        backgroundColor: theme.inputBackground,
        borderRadius: 12,
        padding: 13,
        fontSize: 15,
        borderColor: theme.inputBorder,
        borderWidth: 1,
        color: theme.text,
    },
    multiLine: {
        minHeight: 90,
        textAlignVertical: 'top',
    },
    multiLineXL: {
        minHeight: 140,
        textAlignVertical: 'top',
    },

    // Difficulty picker
    diffRow: {
        flexDirection: 'row',
        gap: 10,
    },
    diffChip: {
        flex: 1,
        backgroundColor: theme.card,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.border,
        paddingVertical: 11,
        alignItems: 'center',
    },
    diffChipActive: {
        backgroundColor: theme.primary + '18',
        borderColor: theme.primary + '66',
    },
    diffChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.textSecondary,
    },
    diffChipTextActive: {
        color: theme.primary,
    },

    buttonRow: {
        marginTop: 28,
    },
});

export default CreateWorkoutScreen;

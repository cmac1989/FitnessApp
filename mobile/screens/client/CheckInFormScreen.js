import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { clientCompleteCheckIn } from '../../src/api/checkin';
import { useTheme } from '../../src/theme';

const formatWeek = (weekStart) => {
    const d = new Date((weekStart ?? '').slice(0, 10) + 'T12:00:00');
    return `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

const CheckInFormScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { theme } = useTheme();

    const checkIn = route.params?.checkIn;

    const [weight, setWeight]         = useState('');
    const [weightUnit, setWeightUnit] = useState('lbs');
    const [energyScore, setEnergyScore] = useState(null);
    const [notes, setNotes]           = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]           = useState(null);

    const styles = makeStyles(theme);

    const handleSubmit = async () => {
        setSubmitting(true);
        setError(null);

        try {
            await clientCompleteCheckIn(checkIn.id, {
                weight:       parseFloat(weight) || null,
                weight_unit:  weightUnit,
                energy_score: energyScore,
                client_notes: notes.trim() || null,
            });
            navigation.goBack();
        } catch (err) {
            const serverMessage = err?.response?.data?.message;
            if (err?.response?.status === 422 && serverMessage) {
                setError(serverMessage);
            } else {
                setError('Failed to submit check-in. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const renderScoreButtons = (selectedScore, onSelect) => (
        <View style={styles.scoreRow}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                const isSelected = selectedScore === num;
                return (
                    <TouchableOpacity
                        key={num}
                        style={[styles.scoreButton, isSelected && styles.scoreButtonActive]}
                        onPress={() => onSelect(isSelected ? null : num)}
                        activeOpacity={0.75}
                    >
                        <Text style={[styles.scoreButtonText, isSelected && styles.scoreButtonTextActive]}>
                            {num}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    return (
        <ScreenWrapper title="Weekly Check-in" showBack>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Week label */}
                    {checkIn?.week_start && (
                        <View style={styles.weekBadge}>
                            <Text style={styles.weekBadgeText}>📅  {formatWeek(checkIn.week_start)}</Text>
                        </View>
                    )}

                    {error ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {/* Weight */}
                    <Text style={styles.sectionLabel}>Weight (optional)</Text>
                    <View style={styles.weightRow}>
                        <TextInput
                            style={styles.weightInput}
                            value={weight}
                            onChangeText={setWeight}
                            keyboardType="decimal-pad"
                            placeholder="e.g. 175.5"
                            placeholderTextColor={theme.textMuted}
                        />
                        {['lbs', 'kg'].map(u => (
                            <TouchableOpacity
                                key={u}
                                style={[styles.unitButton, weightUnit === u && styles.unitButtonActive]}
                                onPress={() => setWeightUnit(u)}
                                activeOpacity={0.75}
                            >
                                <Text style={[styles.unitButtonText, weightUnit === u && styles.unitButtonTextActive]}>
                                    {u}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Compliance note */}
                    <View style={styles.complianceNote}>
                        <Text style={styles.complianceNoteText}>
                            Workout compliance is automatically calculated from your completed workouts this week.
                        </Text>
                    </View>

                    {/* Energy Score */}
                    <Text style={styles.sectionLabel}>How was your energy this week? (1–10)</Text>
                    {renderScoreButtons(energyScore, setEnergyScore)}

                    {/* Notes */}
                    <Text style={styles.sectionLabel}>Notes (optional)</Text>
                    <Text style={styles.sectionHint}>How did the week go? Any struggles or wins?</Text>
                    <TextInput
                        style={styles.notesInput}
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        numberOfLines={5}
                        placeholder="Share how your week went..."
                        placeholderTextColor={theme.textMuted}
                        textAlignVertical="top"
                    />

                    {/* Submit */}
                    <TouchableOpacity
                        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={submitting}
                        activeOpacity={0.8}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Submit Check-in</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    scroll: {
        flex: 1,
        backgroundColor: theme.background,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    weekBadge: {
        backgroundColor: theme.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
        paddingHorizontal: 14,
        paddingVertical: 10,
        alignSelf: 'flex-start',
        marginBottom: 20,
    },
    weekBadgeText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.textSecondary,
    },
    errorContainer: {
        backgroundColor: '#fef2f2',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#fca5a5',
    },
    errorText: {
        color: '#dc2626',
        fontSize: 14,
    },
    sectionLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.text,
        marginTop: 20,
        marginBottom: 8,
    },
    sectionHint: {
        fontSize: 13,
        color: theme.textSecondary,
        marginBottom: 8,
        marginTop: -4,
    },
    weightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    weightInput: {
        flex: 1,
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: theme.text,
    },
    unitButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.card,
    },
    unitButtonActive: {
        backgroundColor: theme.accent,
        borderColor: theme.accent,
    },
    unitButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text,
    },
    unitButtonTextActive: {
        color: '#fff',
    },
    complianceNote: {
        backgroundColor: theme.primary + '12',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.primary + '30',
        padding: 12,
        marginTop: 16,
    },
    complianceNoteText: {
        fontSize: 13,
        color: theme.primary,
        lineHeight: 18,
    },
    scoreRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    scoreButton: {
        width: 40,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.card,
    },
    scoreButtonActive: {
        backgroundColor: theme.accent,
        borderColor: theme.accent,
    },
    scoreButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text,
    },
    scoreButtonTextActive: {
        color: '#fff',
    },
    notesInput: {
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        color: theme.text,
        minHeight: 120,
    },
    submitButton: {
        backgroundColor: theme.accent,
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 28,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default CheckInFormScreen;

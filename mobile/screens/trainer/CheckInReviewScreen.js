import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getTrainerCheckIn, reviewCheckIn } from '../../src/api/checkin';
import { useTheme } from '../../src/theme';

const formatWeek = (weekStart) => {
    const d = new Date((weekStart ?? '').slice(0, 10) + 'T12:00:00');
    return `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const CheckInReviewScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { theme } = useTheme();
    const { checkIn: initialCheckIn } = route.params;

    const [checkIn, setCheckIn] = useState(initialCheckIn);
    const [weightChange, setWeightChange] = useState(null);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState('');
    const [adjustments, setAdjustments] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const styles = makeStyles(theme);

    useEffect(() => {
        let cancelled = false;

        const fetchDetail = async () => {
            try {
                const data = await getTrainerCheckIn(initialCheckIn.id);
                if (cancelled) return;
                setCheckIn(data.check_in);
                setWeightChange(data.weight_change ?? null);
                // Pre-populate feedback fields if already reviewed
                if (data.check_in.trainer_feedback) {
                    setFeedback(data.check_in.trainer_feedback);
                }
                if (data.check_in.trainer_adjustments) {
                    setAdjustments(data.check_in.trainer_adjustments);
                }
            } catch (err) {
                // Keep initial data
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchDetail();
        return () => { cancelled = true; };
    }, [initialCheckIn.id]);

    const handleSubmit = async () => {
        setSubmitting(true);
        setError(null);

        try {
            await reviewCheckIn(checkIn.id, {
                trainer_feedback: feedback.trim() || null,
                trainer_adjustments: adjustments.trim() || null,
            });
            navigation.goBack();
        } catch (err) {
            const serverMessage = err?.response?.data?.message;
            setError(serverMessage || 'Failed to submit review. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <ScreenWrapper title="Review Check-in" showBack>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            </ScreenWrapper>
        );
    }

    const isPending  = !checkIn.submitted_at;
    const isReviewed = !!checkIn.reviewed_at;
    const clientName = checkIn.client?.name || 'Unknown Client';

    if (isPending) {
        return (
            <ScreenWrapper title="Review Check-in" showBack>
                <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Pending Check-in</Text>
                        <Text style={styles.clientName}>{clientName}</Text>
                        <Text style={styles.weekLabel}>{formatWeek(checkIn.week_start)}</Text>
                        <View style={styles.pendingBanner}>
                            <Text style={styles.pendingBannerText}>
                                This check-in hasn't been submitted yet. The client will fill it in on their end.
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </ScreenWrapper>
        );
    }

    const renderWeightChange = () => {
        if (weightChange === null || weightChange === undefined) return null;
        const isDown = weightChange < 0;
        const isUp = weightChange > 0;
        const absChange = Math.abs(weightChange).toFixed(1);
        const unit = checkIn.weight_unit || 'lbs';

        if (isDown) {
            return (
                <Text style={[styles.changeText, { color: '#16a34a' }]}>
                    {'\u25BC'} {absChange} {unit} from last week
                </Text>
            );
        }
        if (isUp) {
            return (
                <Text style={[styles.changeText, { color: '#dc2626' }]}>
                    {'\u25B2'} {absChange} {unit} from last week
                </Text>
            );
        }
        return (
            <Text style={[styles.changeText, { color: theme.textSecondary }]}>
                No change from last week
            </Text>
        );
    };

    const renderScoreDisplay = (score, label) => {
        if (score == null) return null;
        return (
            <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <View style={styles.scoreDisplayRow}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                        const isSelected = num === score;
                        return (
                            <View
                                key={num}
                                style={[
                                    styles.scoreChip,
                                    isSelected
                                        ? { backgroundColor: theme.accent }
                                        : { backgroundColor: theme.card, borderColor: theme.border },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.scoreChipText,
                                        isSelected ? { color: '#fff' } : { color: theme.textSecondary },
                                    ]}
                                >
                                    {num}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    return (
        <ScreenWrapper title="Review Check-in" showBack>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Client submission card */}
                    <View style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.cardTitle}>Client Submission</Text>
                            {isReviewed && (
                                <View style={styles.reviewedBadge}>
                                    <Text style={styles.reviewedBadgeText}>Reviewed</Text>
                                </View>
                            )}
                        </View>

                        <Text style={styles.clientName}>{clientName}</Text>
                        <Text style={styles.weekLabel}>{formatWeek(checkIn.week_start)}</Text>

                        {checkIn.weight != null && (
                            <View style={styles.fieldRow}>
                                <Text style={styles.fieldLabel}>Weight</Text>
                                <Text style={styles.fieldValue}>
                                    {checkIn.weight} {checkIn.weight_unit}
                                </Text>
                                {renderWeightChange()}
                            </View>
                        )}

                        {renderScoreDisplay(checkIn.adherence_score, 'Workout Compliance (auto-calculated)')}
                        {renderScoreDisplay(checkIn.energy_score, 'Energy Score')}

                        {checkIn.client_notes ? (
                            <View style={styles.fieldRow}>
                                <Text style={styles.fieldLabel}>Client Notes</Text>
                                <Text style={styles.fieldValue}>{checkIn.client_notes}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Feedback form card */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>
                            {isReviewed ? 'Edit Feedback' : 'Your Feedback'}
                        </Text>

                        {isReviewed && (
                            <Text style={styles.reviewDate}>
                                Previously reviewed on {formatDate(checkIn.reviewed_at)}
                            </Text>
                        )}

                        {error ? (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        <Text style={styles.inputLabel}>Trainer Feedback</Text>
                        <TextInput
                            style={styles.textArea}
                            value={feedback}
                            onChangeText={setFeedback}
                            multiline
                            numberOfLines={4}
                            placeholder="Write your feedback for this week's check-in..."
                            placeholderTextColor={theme.textMuted}
                            textAlignVertical="top"
                        />

                        <Text style={styles.inputLabel}>Adjustments / Next Steps</Text>
                        <TextInput
                            style={styles.textArea}
                            value={adjustments}
                            onChangeText={setAdjustments}
                            multiline
                            numberOfLines={4}
                            placeholder="Any plan adjustments or goals for next week..."
                            placeholderTextColor={theme.textMuted}
                            textAlignVertical="top"
                        />

                        <TouchableOpacity
                            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={submitting}
                            activeOpacity={0.8}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {isReviewed ? 'Update Feedback' : 'Submit Review'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },
    card: {
        backgroundColor: theme.card,
        borderRadius: 12,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: theme.border,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: theme.text,
    },
    clientName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.accent,
        marginBottom: 2,
    },
    weekLabel: {
        fontSize: 14,
        color: theme.textSecondary,
        marginBottom: 14,
    },
    fieldRow: {
        marginBottom: 14,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    fieldValue: {
        fontSize: 15,
        color: theme.text,
        lineHeight: 22,
    },
    changeText: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 4,
    },
    scoreDisplayRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 4,
    },
    scoreChip: {
        width: 36,
        height: 36,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    scoreChipText: {
        fontSize: 13,
        fontWeight: '600',
    },
    reviewedBadge: {
        backgroundColor: '#22c55e22',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    reviewedBadgeText: {
        color: '#16a34a',
        fontSize: 12,
        fontWeight: '600',
    },
    reviewDate: {
        fontSize: 13,
        color: theme.textSecondary,
        marginBottom: 12,
    },
    errorContainer: {
        backgroundColor: '#fef2f2',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#fca5a5',
    },
    errorText: {
        color: '#dc2626',
        fontSize: 14,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 6,
        marginTop: 8,
    },
    textArea: {
        backgroundColor: theme.background,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        color: theme.text,
        minHeight: 100,
        marginBottom: 8,
    },
    submitButton: {
        backgroundColor: theme.accent,
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 16,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    pendingBanner: {
        backgroundColor: '#fef3c722',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#f59e0b44',
        padding: 12,
        marginTop: 8,
    },
    pendingBannerText: {
        fontSize: 14,
        color: '#b45309',
        lineHeight: 20,
    },
});

export default CheckInReviewScreen;

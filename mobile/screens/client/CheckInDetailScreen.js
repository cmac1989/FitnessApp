import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getClientCheckIn } from '../../src/api/checkin';
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

const CheckInDetailScreen = () => {
    const route = useRoute();
    const { theme } = useTheme();
    const { checkIn: initialCheckIn } = route.params;

    const [checkIn, setCheckIn] = useState(initialCheckIn);
    const [weightChange, setWeightChange] = useState(null);
    const [loading, setLoading] = useState(true);

    const styles = makeStyles(theme);

    useEffect(() => {
        let cancelled = false;

        const fetchDetail = async () => {
            try {
                const data = await getClientCheckIn(initialCheckIn.id);
                if (cancelled) return;
                setCheckIn(data.check_in);
                setWeightChange(data.weight_change ?? null);
            } catch (err) {
                // Keep the initial data on error
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchDetail();
        return () => { cancelled = true; };
    }, [initialCheckIn.id]);

    if (loading) {
        return (
            <ScreenWrapper title="Check-in Detail" showBack>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
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

    const isPending  = !checkIn.submitted_at;
    const isReviewed = !!checkIn.reviewed_at;

    if (isPending) {
        return (
            <ScreenWrapper title="Check-in Detail" showBack>
                <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>{formatWeek(checkIn.week_start)}</Text>
                        <View style={[styles.pendingBanner]}>
                            <Text style={styles.pendingBannerText}>
                                Your trainer has assigned this check-in. Complete it to share your progress.
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper title="Check-in Detail" showBack>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                {/* Submission card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{formatWeek(checkIn.week_start)}</Text>

                    {checkIn.weight != null && (
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabel}>Weight</Text>
                            <Text style={styles.fieldValue}>
                                {checkIn.weight} {checkIn.weight_unit}
                            </Text>
                            {renderWeightChange()}
                        </View>
                    )}

                    {checkIn.adherence_score != null && (
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabel}>Workout Compliance (auto-calculated)</Text>
                            <Text style={styles.fieldValue}>{checkIn.adherence_score}/10</Text>
                        </View>
                    )}

                    {checkIn.energy_score != null && (
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabel}>Energy Score</Text>
                            <Text style={styles.fieldValue}>{checkIn.energy_score}/10</Text>
                        </View>
                    )}

                    {checkIn.client_notes ? (
                        <View style={styles.fieldRow}>
                            <Text style={styles.fieldLabel}>Your Notes</Text>
                            <Text style={styles.fieldValue}>{checkIn.client_notes}</Text>
                        </View>
                    ) : null}
                </View>

                {/* Trainer feedback card */}
                <View style={styles.card}>
                    <View style={styles.feedbackHeader}>
                        <Text style={styles.cardTitle}>Trainer Feedback</Text>
                        {isReviewed && (
                            <View style={styles.reviewedBadge}>
                                <Text style={styles.reviewedBadgeText}>Reviewed</Text>
                            </View>
                        )}
                    </View>

                    {isReviewed ? (
                        <>
                            <Text style={styles.reviewDate}>
                                Reviewed on {formatDate(checkIn.reviewed_at)}
                            </Text>
                            {checkIn.trainer_feedback ? (
                                <View style={styles.fieldRow}>
                                    <Text style={styles.fieldLabel}>Feedback</Text>
                                    <Text style={styles.fieldValue}>{checkIn.trainer_feedback}</Text>
                                </View>
                            ) : null}
                            {checkIn.trainer_adjustments ? (
                                <View style={styles.fieldRow}>
                                    <Text style={styles.fieldLabel}>Adjustments / Next Steps</Text>
                                    <Text style={styles.fieldValue}>{checkIn.trainer_adjustments}</Text>
                                </View>
                            ) : null}
                        </>
                    ) : (
                        <Text style={styles.pendingText}>
                            Your trainer hasn't reviewed this yet.
                        </Text>
                    )}
                </View>
            </ScrollView>
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
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 12,
    },
    feedbackHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    fieldRow: {
        marginBottom: 12,
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
    pendingText: {
        fontSize: 14,
        color: theme.textMuted,
        fontStyle: 'italic',
        marginTop: 4,
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

export default CheckInDetailScreen;

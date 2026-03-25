import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getTrainerDashboard } from '../../src/api/trainer';
import { useTheme } from '../../src/theme';

// ── Mini bar sparkline (weight change direction) ──────────────────────────────
const ChangeChip = ({ value, unit = 'lbs', theme }) => {
    if (value === null || value === undefined) return null;
    const isNeg = value < 0;
    const color = isNeg ? theme.success : theme.error;
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color, fontSize: 13, fontWeight: '600' }}>
                {isNeg ? '▼' : '▲'} {Math.abs(value)} {unit}
            </Text>
        </View>
    );
};

// ── Progress bar ──────────────────────────────────────────────────────────────
const ProgressBar = ({ pct, theme }) => {
    const clamped = Math.min(100, Math.max(0, pct ?? 0));
    return (
        <View style={{ height: 6, backgroundColor: theme.border, borderRadius: 3, marginTop: 4 }}>
            <View style={{
                height: 6,
                width: `${clamped}%`,
                backgroundColor: theme.primary,
                borderRadius: 3,
            }} />
        </View>
    );
};

// ── Overview stat chip ────────────────────────────────────────────────────────
const OverviewChip = ({ value, label, theme, styles }) => (
    <View style={styles.overviewChip}>
        <Text style={styles.overviewValue}>{value ?? '—'}</Text>
        <Text style={styles.overviewLabel}>{label}</Text>
    </View>
);

// ── Client progress card ──────────────────────────────────────────────────────
const ClientCard = ({ client, theme, styles }) => {
    const dsa = client.days_since_active;
    const dsaColor = dsa === null ? theme.textMuted
        : dsa >= 14 ? theme.error
        : dsa >= 7  ? '#f59e0b'
        : theme.success;

    return (
        <View style={styles.clientCard}>
            <Text style={styles.clientName}>{client.name}</Text>

            {client.goal_type ? (
                <View style={{ marginBottom: 6 }}>
                    <Text style={styles.clientMeta}>Goal: {client.goal_type}</Text>
                    <ProgressBar pct={client.goal_progress} theme={theme} />
                    <Text style={styles.clientMeta}>{client.goal_progress ?? 0}%</Text>
                </View>
            ) : (
                <Text style={[styles.clientMeta, { fontStyle: 'italic' }]}>No active goal</Text>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <ChangeChip value={client.weight_change_7d} unit={client.weight_unit} theme={theme} />
                <Text style={[styles.clientMeta, { color: dsaColor }]}>
                    {dsa === null ? 'Never active' : dsa === 0 ? 'Active today' : `${dsa}d ago`}
                </Text>
            </View>

            <Text style={styles.clientMeta}>{client.workouts_completed} workouts completed</Text>
        </View>
    );
};

// ── Main screen ───────────────────────────────────────────────────────────────
const TrainerDashboardScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const styles = makeStyles(theme);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            const cancelled = { value: false };
            const fetch = async () => {
                try {
                    setLoading(true);
                    const res = await getTrainerDashboard();
                    if (!cancelled.value) setData(res);
                } catch (e) {
                    console.error('TrainerDashboard fetch error', e);
                } finally {
                    if (!cancelled.value) setLoading(false);
                }
            };
            fetch();
            return () => { cancelled.value = true; };
        }, [])
    );

    if (loading) {
        return (
            <ScreenWrapper title="Dashboard">
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </ScreenWrapper>
        );
    }

    const ov = data?.overview ?? {};
    const compliance = data?.compliance ?? {};
    const business = data?.business ?? {};
    const clientProgress = data?.client_progress ?? [];
    const inactiveAlerts = compliance.inactive_alerts ?? [];
    const checkIns = data?.check_ins ?? {};

    return (
        <ScreenWrapper title="Dashboard">
            <ScrollView contentContainerStyle={styles.container}>

                {/* ── Greeting ── */}
                <View style={styles.greetingCard}>
                    <Text style={styles.greetingText}>
                        Hey, {data?.trainer_name?.split(' ')[0] ?? 'Coach'}!
                    </Text>
                    <Text style={styles.greetingSubtext}>Here's your overview for today.</Text>
                </View>

                <>
                    {/* ── Overview ── */}
                        <Text style={styles.sectionTitle}>Overview</Text>
                        <View style={styles.overviewGrid}>
                            <OverviewChip value={ov.total_clients}      label="Total Clients"     theme={theme} styles={styles} />
                            <OverviewChip value={ov.active_clients}     label="Active Clients"    theme={theme} styles={styles} />
                            <OverviewChip value={ov.sessions_today}     label="Sessions Today"    theme={theme} styles={styles} />
                            <OverviewChip value={ov.sessions_this_week} label="This Week"         theme={theme} styles={styles} />
                            <OverviewChip value={ov.total_plans}        label="Workout Plans"     theme={theme} styles={styles} />
                        </View>

                        {/* ── Quick Actions ── */}
                        <View style={styles.quickActions}>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('CreateWorkout')}>
                                <Text style={styles.actionBtnText}>+ Workout</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('TrainerCheckInForm')}>
                                <Text style={styles.actionBtnText}>+ Check-in</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('MessageList')}>
                                <Text style={styles.actionBtnText}>Messages</Text>
                            </TouchableOpacity>
                        </View>

                        {/* ── Check-ins ── */}
                        <View style={styles.sectionTitleRow}>
                            <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>Check-ins</Text>
                            {checkIns.pending_review > 0 && (
                                <View style={styles.pendingBadge}>
                                    <Text style={styles.pendingBadgeText}>
                                        {checkIns.pending_review} pending
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* This week stats row */}
                        <View style={styles.checkInStatsRow}>
                            <View style={styles.checkInStat}>
                                <Text style={styles.checkInStatValue}>{checkIns.assigned_this_week ?? 0}</Text>
                                <Text style={styles.checkInStatLabel}>Assigned</Text>
                            </View>
                            <View style={[styles.checkInStat, styles.checkInStatBorder]}>
                                <Text style={styles.checkInStatValue}>{checkIns.submitted_this_week ?? 0}</Text>
                                <Text style={styles.checkInStatLabel}>Submitted</Text>
                            </View>
                            <View style={[styles.checkInStat, styles.checkInStatBorder]}>
                                <Text style={[styles.checkInStatValue, { color: theme.success }]}>
                                    {checkIns.reviewed_this_week ?? 0}
                                </Text>
                                <Text style={styles.checkInStatLabel}>Reviewed</Text>
                            </View>
                        </View>

                        {/* Pending review list */}
                        {(checkIns.pending_review_list ?? []).length > 0 ? (
                            <>
                                <Text style={styles.pendingReviewTitle}>Awaiting Review</Text>
                                {(checkIns.pending_review_list).map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={styles.pendingReviewCard}
                                        onPress={() => navigation.navigate('CheckInReview', { checkIn: item })}
                                        activeOpacity={0.75}
                                    >
                                        <View style={styles.pendingReviewLeft}>
                                            <Text style={styles.pendingReviewName}>{item.client_name}</Text>
                                            <Text style={styles.pendingReviewWeek}>
                                                Week of {new Date((item.week_start ?? '').slice(0, 10) + 'T12:00:00')
                                                    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </Text>
                                        </View>
                                        <Text style={styles.pendingReviewChevron}>›</Text>
                                    </TouchableOpacity>
                                ))}
                            </>
                        ) : (
                            <View style={styles.checkInEmptyRow}>
                                <Text style={styles.checkInEmptyText}>No check-ins awaiting review</Text>
                            </View>
                        )}

                        {/* ── Client Progress ── */}
                        <Text style={styles.sectionTitle}>Client Progress</Text>
                        {clientProgress.length === 0 ? (
                            <Text style={styles.emptyText}>No clients yet.</Text>
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                                {clientProgress.map(c => (
                                    <ClientCard key={c.id} client={c} theme={theme} styles={styles} />
                                ))}
                            </ScrollView>
                        )}

                        {/* ── Compliance ── */}
                        <Text style={styles.sectionTitle}>Compliance</Text>
                        <View style={styles.card}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                <Text style={styles.cardLabel}>Workout Completion</Text>
                                <Text style={styles.cardValue}>{compliance.workout_completion_rate ?? 0}%</Text>
                            </View>
                            <ProgressBar pct={compliance.workout_completion_rate} theme={theme} />
                            <Text style={[styles.cardMeta, { marginTop: 6 }]}>
                                {compliance.workouts_completed_this_week ?? 0} / {compliance.workouts_scheduled_this_week ?? 0} workouts completed this week
                            </Text>
                        </View>

                        {inactiveAlerts.length > 0 && (
                            <View style={styles.alertsCard}>
                                <Text style={styles.alertsTitle}>Inactive Clients ({inactiveAlerts.length})</Text>
                                {inactiveAlerts.map(a => (
                                    <View key={a.id} style={styles.alertRow}>
                                        <Text style={styles.alertName}>{a.name}</Text>
                                        <Text style={styles.alertDays}>
                                            {a.days_inactive === null ? 'Never active' : `${a.days_inactive}d inactive`}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* ── Business Metrics ── */}
                        <Text style={styles.sectionTitle}>Business Metrics</Text>
                        <View style={styles.businessGrid}>
                            <View style={styles.businessChip}>
                                <Text style={styles.businessValue}>{business.active_clients ?? '—'}</Text>
                                <Text style={styles.businessLabel}>Active</Text>
                            </View>
                            <View style={styles.businessChip}>
                                <Text style={[styles.businessValue, business.inactive_clients > 0 && { color: theme.error }]}>
                                    {business.inactive_clients ?? '—'}
                                </Text>
                                <Text style={styles.businessLabel}>Inactive</Text>
                            </View>
                            <View style={styles.businessChip}>
                                <Text style={styles.businessValue}>
                                    {business.retention_rate !== null && business.retention_rate !== undefined
                                        ? `${business.retention_rate}%`
                                        : '—'}
                                </Text>
                                <Text style={styles.businessLabel}>Retention</Text>
                            </View>
                            <View style={styles.businessChip}>
                                <Text style={[styles.businessValue,
                                    business.session_growth_pct > 0 ? { color: theme.success }
                                    : business.session_growth_pct < 0 ? { color: theme.error }
                                    : null
                                ]}>
                                    {business.session_growth_pct !== null && business.session_growth_pct !== undefined
                                        ? `${business.session_growth_pct > 0 ? '+' : ''}${business.session_growth_pct}%`
                                        : '—'}
                                </Text>
                                <Text style={styles.businessLabel}>Session Growth</Text>
                            </View>
                        </View>
                        <View style={[styles.card, { marginTop: 0 }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={styles.cardValue}>{business.sessions_this_month ?? 0}</Text>
                                    <Text style={styles.cardMeta}>This Month</Text>
                                </View>
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={styles.cardValue}>{business.sessions_last_month ?? 0}</Text>
                                    <Text style={styles.cardMeta}>Last Month</Text>
                                </View>
                            </View>
                        </View>
                    </>
            </ScrollView>
        </ScreenWrapper>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },
    container: {
        flexGrow: 1,
        padding: 16,
        backgroundColor: theme.background,
        paddingBottom: 40,
    },
    greetingCard: {
        backgroundColor: theme.primary,
        borderRadius: 14,
        padding: 20,
        marginBottom: 20,
    },
    greetingText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    greetingSubtext: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 12,
        marginTop: 20,
        // When inside sectionTitleRow the margin is controlled by the row
    },
    // Overview
    overviewGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 4,
    },
    overviewChip: {
        backgroundColor: theme.card,
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        minWidth: 90,
        flex: 1,
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 3,
    },
    overviewValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.statValue,
    },
    overviewLabel: {
        fontSize: 11,
        color: theme.textMuted,
        marginTop: 4,
        textAlign: 'center',
    },
    // Section title with badge
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 20,
        marginBottom: 12,
    },
    pendingBadge: {
        backgroundColor: '#f59e0b22',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: '#f59e0b55',
    },
    pendingBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#b45309',
    },

    // Check-in stats
    checkInStatsRow: {
        flexDirection: 'row',
        backgroundColor: theme.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.border,
        marginBottom: 12,
        overflow: 'hidden',
    },
    checkInStat: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
    },
    checkInStatBorder: {
        borderLeftWidth: StyleSheet.hairlineWidth,
        borderLeftColor: theme.border,
    },
    checkInStatValue: {
        fontSize: 22,
        fontWeight: '800',
        color: theme.statValue,
    },
    checkInStatLabel: {
        fontSize: 11,
        color: theme.textMuted,
        marginTop: 3,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },

    // Pending review list
    pendingReviewTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    pendingReviewCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f59e0b44',
        borderLeftWidth: 3,
        borderLeftColor: '#f59e0b',
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 8,
    },
    pendingReviewLeft: {
        flex: 1,
    },
    pendingReviewName: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 2,
    },
    pendingReviewWeek: {
        fontSize: 12,
        color: theme.textMuted,
    },
    pendingReviewChevron: {
        fontSize: 20,
        color: theme.textMuted,
        fontWeight: '300',
    },
    checkInEmptyRow: {
        paddingVertical: 12,
        paddingHorizontal: 4,
        marginBottom: 4,
    },
    checkInEmptyText: {
        fontSize: 13,
        color: theme.textMuted,
        fontStyle: 'italic',
    },

    // Quick actions
    quickActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 16,
        marginBottom: 4,
    },
    actionBtn: {
        flex: 1,
        backgroundColor: theme.card,
        borderColor: theme.border,
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
    },
    actionBtnText: {
        color: theme.primary,
        fontWeight: '600',
        fontSize: 13,
    },
    // Client cards
    clientCard: {
        backgroundColor: theme.card,
        borderRadius: 14,
        padding: 14,
        marginRight: 12,
        width: 200,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    clientName: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 8,
    },
    clientMeta: {
        fontSize: 12,
        color: theme.textMuted,
        marginTop: 2,
    },
    // Compliance / generic card
    card: {
        backgroundColor: theme.card,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 3,
    },
    cardLabel: {
        fontSize: 14,
        color: theme.textSecondary,
        fontWeight: '600',
    },
    cardValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.statValue,
    },
    cardMeta: {
        fontSize: 12,
        color: theme.textMuted,
    },
    // Alerts
    alertsCard: {
        backgroundColor: theme.card,
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: theme.error,
    },
    alertsTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.error,
        marginBottom: 8,
    },
    alertRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    alertName: {
        fontSize: 13,
        color: theme.text,
    },
    alertDays: {
        fontSize: 13,
        color: theme.error,
        fontWeight: '600',
    },
    // Business
    businessGrid: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    businessChip: {
        flex: 1,
        backgroundColor: theme.card,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 3,
    },
    businessValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.statValue,
    },
    businessLabel: {
        fontSize: 10,
        color: theme.textMuted,
        marginTop: 4,
        textAlign: 'center',
    },
    emptyText: {
        color: theme.textMuted,
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: 12,
    },
});

export default TrainerDashboardScreen;

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
                                <Text style={styles.cardLabel}>Check-in Completion</Text>
                                <Text style={styles.cardValue}>{compliance.session_completion_rate ?? 0}%</Text>
                            </View>
                            <ProgressBar pct={compliance.session_completion_rate} theme={theme} />
                            <Text style={[styles.cardMeta, { marginTop: 6 }]}>
                                {compliance.sessions_completed_this_week ?? 0} / {compliance.sessions_scheduled_this_week ?? 0} sessions this week
                            </Text>
                        </View>
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

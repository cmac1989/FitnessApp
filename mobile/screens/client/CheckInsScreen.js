import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getClientCheckIns } from '../../src/api/checkin';
import { useTheme } from '../../src/theme';

const getThisWeekStart = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10);
};

const formatWeek = (weekStart) => {
    const d = new Date((weekStart ?? '').slice(0, 10) + 'T12:00:00');
    return `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

const statusInfo = (item) => {
    if (!item.submitted_at) return { label: 'Action Required', color: '#f59e0b', bg: '#fef3c722' };
    if (item.reviewed_at)   return { label: 'Reviewed',        color: '#16a34a', bg: '#22c55e22' };
    return                         { label: 'Submitted',        color: '#3b82f6', bg: '#3b82f622' };
};

const CheckInsScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const [checkIns, setCheckIns] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            const cancelled = { value: false };

            const fetchCheckIns = async () => {
                try {
                    setLoading(true);
                    const data = await getClientCheckIns();
                    if (cancelled.value) return;
                    setCheckIns(data.check_ins || []);
                } catch {
                    if (!cancelled.value) setCheckIns([]);
                } finally {
                    if (!cancelled.value) setLoading(false);
                }
            };

            fetchCheckIns();
            return () => { cancelled.value = true; };
        }, [])
    );

    const styles = makeStyles(theme);

    if (loading) {
        return (
            <ScreenWrapper title="Check-ins">
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            </ScreenWrapper>
        );
    }

    const thisWeekStart = getThisWeekStart();
    const thisWeekCheckIn = checkIns.find(c => (c.week_start ?? '').slice(0, 10) === thisWeekStart);

    const handlePress = (item) => {
        if (!item.submitted_at) {
            navigation.navigate('CheckInForm', { checkIn: item });
        } else {
            navigation.navigate('CheckInDetail', { checkIn: item });
        }
    };

    const renderItem = ({ item }) => {
        const { label, color, bg } = statusInfo(item);
        const isPending = !item.submitted_at;

        return (
            <TouchableOpacity
                style={[styles.card, isPending && styles.cardPending]}
                onPress={() => handlePress(item)}
                activeOpacity={0.75}
            >
                <View style={styles.cardTop}>
                    <Text style={styles.cardWeek}>{formatWeek(item.week_start)}</Text>
                    <View style={[styles.badge, { backgroundColor: bg }]}>
                        <Text style={[styles.badgeText, { color }]}>{label}</Text>
                    </View>
                </View>

                {isPending ? (
                    <Text style={styles.pendingCta}>Tap to complete your check-in →</Text>
                ) : (
                    <>
                        {item.weight != null && (
                            <Text style={styles.cardDetail}>
                                Weight: {item.weight} {item.weight_unit}
                            </Text>
                        )}
                        {(item.adherence_score != null || item.energy_score != null) && (
                            <View style={styles.scoresRow}>
                                {item.adherence_score != null && (
                                    <Text style={styles.scoreText}>Compliance: {item.adherence_score}/10</Text>
                                )}
                                {item.energy_score != null && (
                                    <Text style={styles.scoreText}>Energy: {item.energy_score}/10</Text>
                                )}
                            </View>
                        )}
                    </>
                )}
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>📋</Text>
            </View>
            <Text style={styles.emptyTitle}>No Check-ins Yet</Text>
            <Text style={styles.emptySubtitle}>
                Your trainer will assign weekly check-ins here to track your progress.
            </Text>
        </View>
    );

    return (
        <ScreenWrapper title="Check-ins">
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>Check-ins</Text>
                    {thisWeekCheckIn && !thisWeekCheckIn.submitted_at && (
                        <TouchableOpacity
                            style={styles.thisWeekBtn}
                            onPress={() => navigation.navigate('CheckInForm', { checkIn: thisWeekCheckIn })}
                            activeOpacity={0.75}
                        >
                            <Text style={styles.thisWeekBtnText}>This Week</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <FlatList
                    data={checkIns}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={[styles.listContent, checkIns.length === 0 && styles.listEmpty]}
                    ListEmptyComponent={renderEmpty}
                />
            </View>
        </ScreenWrapper>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 14,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: theme.text,
    },
    thisWeekBtn: {
        backgroundColor: '#f59e0b',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    thisWeekBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    listEmpty: {
        flexGrow: 1,
    },
    card: {
        backgroundColor: theme.card,
        padding: 16,
        borderRadius: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: theme.border,
    },
    cardPending: {
        borderColor: '#f59e0b44',
        borderWidth: 1.5,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    cardWeek: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.text,
        flex: 1,
        marginRight: 8,
    },
    cardDetail: {
        fontSize: 14,
        color: theme.textSecondary,
        marginTop: 2,
    },
    pendingCta: {
        fontSize: 13,
        color: '#f59e0b',
        fontWeight: '600',
    },
    scoresRow: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 6,
    },
    scoreText: {
        fontSize: 13,
        color: theme.textSecondary,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        flexShrink: 0,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        gap: 10,
    },
    emptyIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: theme.accent + '22',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyIconText: { fontSize: 30 },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.text,
        marginTop: 6,
    },
    emptySubtitle: {
        fontSize: 14,
        color: theme.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default CheckInsScreen;

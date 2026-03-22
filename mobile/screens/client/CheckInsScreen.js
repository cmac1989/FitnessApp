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
                } catch (err) {
                    if (!cancelled.value) {
                        setCheckIns([]);
                    }
                } finally {
                    if (!cancelled.value) {
                        setLoading(false);
                    }
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
    const submittedThisWeek = checkIns.length > 0 && (checkIns[0].week_start ?? '').slice(0, 10) === thisWeekStart;

    const renderItem = ({ item }) => {
        const isReviewed = !!item.reviewed_at;
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('CheckInDetail', { checkIn: item })}
                activeOpacity={0.75}
            >
                <Text style={styles.cardWeek}>{formatWeek(item.week_start)}</Text>

                {item.weight != null && (
                    <Text style={styles.cardDetail}>
                        Weight: {item.weight} {item.weight_unit}
                    </Text>
                )}

                {(item.adherence_score != null || item.energy_score != null) && (
                    <View style={styles.scoresRow}>
                        {item.adherence_score != null && (
                            <Text style={styles.scoreText}>Adherence: {item.adherence_score}/10</Text>
                        )}
                        {item.energy_score != null && (
                            <Text style={styles.scoreText}>Energy: {item.energy_score}/10</Text>
                        )}
                    </View>
                )}

                <View style={[styles.badge, isReviewed ? styles.badgeReviewed : styles.badgePending]}>
                    <Text style={[styles.badgeText, isReviewed ? styles.badgeTextReviewed : styles.badgeTextPending]}>
                        {isReviewed ? 'Reviewed' : 'Awaiting feedback'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Check-ins Yet</Text>
            <Text style={styles.emptySubtitle}>
                Submit your first weekly check-in to get started.
            </Text>
        </View>
    );

    return (
        <ScreenWrapper title="Check-ins">
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>Check-ins</Text>
                    {submittedThisWeek ? (
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => navigation.navigate('CheckInDetail', { checkIn: checkIns[0] })}
                            activeOpacity={0.75}
                        >
                            <Text style={styles.headerButtonText}>This Week</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => navigation.navigate('CheckInForm')}
                            activeOpacity={0.75}
                        >
                            <Text style={styles.headerButtonText}>Submit Check-in</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <FlatList
                    data={checkIns}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmpty}
                />
            </View>
        </ScreenWrapper>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
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
        marginBottom: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: theme.text,
    },
    headerButton: {
        backgroundColor: theme.accent,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
    },
    headerButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    listContent: {
        paddingBottom: 20,
    },
    card: {
        backgroundColor: theme.card,
        padding: 16,
        borderRadius: 10,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: theme.border,
    },
    cardWeek: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 6,
    },
    cardDetail: {
        fontSize: 14,
        color: theme.textSecondary,
        marginTop: 2,
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
        alignSelf: 'flex-start',
        marginTop: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeReviewed: {
        backgroundColor: '#22c55e22',
    },
    badgePending: {
        backgroundColor: theme.border,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    badgeTextReviewed: {
        color: '#16a34a',
    },
    badgeTextPending: {
        color: theme.textSecondary,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
        paddingHorizontal: 30,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: theme.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default CheckInsScreen;

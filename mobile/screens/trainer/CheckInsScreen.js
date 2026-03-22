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
import { getTrainerCheckIns } from '../../src/api/checkin';
import { useTheme } from '../../src/theme';

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
                    const data = await getTrainerCheckIns();
                    if (cancelled.value) return;

                    const list = data.check_ins || [];
                    // Sort: unreviewed first, then reviewed
                    list.sort((a, b) => {
                        const aReviewed = !!a.reviewed_at;
                        const bReviewed = !!b.reviewed_at;
                        if (aReviewed === bReviewed) return 0;
                        return aReviewed ? 1 : -1;
                    });

                    setCheckIns(list);
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

    const renderItem = ({ item }) => {
        const isReviewed = !!item.reviewed_at;
        const clientName = item.client?.name || 'Unknown Client';

        return (
            <TouchableOpacity
                style={[
                    styles.card,
                    !isReviewed && styles.cardPending,
                ]}
                onPress={() => navigation.navigate('CheckInReview', { checkIn: item })}
                activeOpacity={0.75}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.clientName}>{clientName}</Text>
                    <View style={[styles.badge, isReviewed ? styles.badgeReviewed : styles.badgePending]}>
                        <Text style={[styles.badgeText, isReviewed ? styles.badgeTextReviewed : styles.badgeTextPending]}>
                            {isReviewed ? 'Reviewed' : 'Pending Review'}
                        </Text>
                    </View>
                </View>

                <Text style={styles.weekLabel}>{formatWeek(item.week_start)}</Text>

                {item.weight != null && (
                    <Text style={styles.detailText}>
                        Weight: {item.weight} {item.weight_unit}
                    </Text>
                )}

                {(item.adherence_score != null || item.energy_score != null) && (
                    <Text style={styles.detailText}>
                        {item.adherence_score != null ? `Adherence ${item.adherence_score}/10` : ''}
                        {item.adherence_score != null && item.energy_score != null ? ' · ' : ''}
                        {item.energy_score != null ? `Energy ${item.energy_score}/10` : ''}
                    </Text>
                )}
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Check-ins Yet</Text>
            <Text style={styles.emptySubtitle}>
                Your clients will submit their weekly check-ins here.
            </Text>
        </View>
    );

    return (
        <ScreenWrapper title="Check-ins">
            <View style={styles.container}>
                <Text style={styles.title}>Check-ins</Text>
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
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 20,
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
    cardPending: {
        borderLeftWidth: 4,
        borderLeftColor: theme.accent,
        backgroundColor: theme.accent + '11',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    clientName: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.text,
        flex: 1,
        marginRight: 8,
    },
    weekLabel: {
        fontSize: 14,
        color: theme.textSecondary,
        marginBottom: 4,
    },
    detailText: {
        fontSize: 13,
        color: theme.textSecondary,
        marginTop: 2,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeReviewed: {
        backgroundColor: '#22c55e22',
    },
    badgePending: {
        backgroundColor: '#f59e0b22',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    badgeTextReviewed: {
        color: '#16a34a',
    },
    badgeTextPending: {
        color: '#d97706',
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

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

const AVATAR_COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

const avatarColor = (name = '') => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase();
};

const Avatar = ({ name, size = 44 }) => {
    const bg = avatarColor(name);
    return (
        <View style={{
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.36 }}>
                {getInitials(name)}
            </Text>
        </View>
    );
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
                    list.sort((a, b) => {
                        const aReviewed = !!a.reviewed_at;
                        const bReviewed = !!b.reviewed_at;
                        if (aReviewed === bReviewed) return 0;
                        return aReviewed ? 1 : -1;
                    });

                    setCheckIns(list);
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

    const renderItem = ({ item }) => {
        const isReviewed = !!item.reviewed_at;
        const clientName = item.client?.name || 'Unknown Client';

        return (
            <TouchableOpacity
                style={[styles.card, !isReviewed && styles.cardPending]}
                onPress={() => navigation.navigate('CheckInReview', { checkIn: item })}
                activeOpacity={0.75}
            >
                <Avatar name={clientName} size={46} />

                <View style={styles.cardContent}>
                    <View style={styles.cardTop}>
                        <Text style={styles.clientName} numberOfLines={1}>{clientName}</Text>
                        <View style={[styles.badge, isReviewed ? styles.badgeReviewed : styles.badgePending]}>
                            <Text style={[styles.badgeText, isReviewed ? styles.badgeTextReviewed : styles.badgeTextPending]}>
                                {isReviewed ? 'Reviewed' : 'Pending'}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.weekLabel}>{formatWeek(item.week_start)}</Text>

                    {(item.adherence_score != null || item.energy_score != null) && (
                        <Text style={styles.metaText}>
                            {item.adherence_score != null ? `Adherence ${item.adherence_score}/10` : ''}
                            {item.adherence_score != null && item.energy_score != null ? '  ·  ' : ''}
                            {item.energy_score != null ? `Energy ${item.energy_score}/10` : ''}
                        </Text>
                    )}
                </View>
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
                Create a check-in for a client using the button above.
            </Text>
        </View>
    );

    return (
        <ScreenWrapper title="Check-ins">
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Check-ins</Text>
                    <TouchableOpacity
                        style={styles.newBtn}
                        onPress={() => navigation.navigate('TrainerCheckInForm')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.newBtnText}>+ New</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={theme.accent} />
                    </View>
                ) : (
                    <FlatList
                        data={checkIns}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={[styles.listContent, checkIns.length === 0 && styles.listEmpty]}
                        ListEmptyComponent={renderEmpty}
                    />
                )}
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
    },
    header: {
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
    newBtn: {
        backgroundColor: theme.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    newBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    listEmpty: {
        flexGrow: 1,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.border,
        padding: 14,
        marginBottom: 10,
        gap: 12,
    },
    cardPending: {
        borderColor: theme.accent + '55',
        backgroundColor: theme.accent + '08',
    },
    cardContent: {
        flex: 1,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    clientName: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.text,
        flex: 1,
        marginRight: 8,
    },
    weekLabel: {
        fontSize: 13,
        color: theme.textSecondary,
        marginBottom: 3,
    },
    metaText: {
        fontSize: 12,
        color: theme.textMuted,
        marginTop: 2,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        flexShrink: 0,
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

import React, { useState, useCallback } from 'react';
import {
    View, Text, FlatList, StyleSheet,
    TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getClients } from '../../src/api/user';
import { useTheme } from '../../src/theme';

// ── Avatar helpers ────────────────────────────────────────────────────────────

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

const Avatar = ({ name, size = 48 }) => {
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

// ── Screen ────────────────────────────────────────────────────────────────────

const ClientsListScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const styles = makeStyles(theme);

    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchClients = useCallback(async (cancelled) => {
        try {
            setLoading(true);
            const data = await getClients();
            if (!cancelled.value) setClients(data || []);
        } catch {
            if (!cancelled.value) setClients([]);
        } finally {
            if (!cancelled.value) setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            const cancelled = { value: false };
            fetchClients(cancelled);
            return () => { cancelled.value = true; };
        }, [fetchClients])
    );

    const renderClient = ({ item }) => {
        const profile = item.client_profile;
        const goal = profile?.fitness_goals;
        const age  = profile?.age;
        const gender = profile?.gender;

        const meta = [
            age    ? `${age} yrs`     : null,
            gender ? gender           : null,
        ].filter(Boolean).join('  ·  ');

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('ClientDetails', { clients: item })}
                activeOpacity={0.7}
            >
                <Avatar name={item.name} size={50} />

                <View style={styles.cardBody}>
                    <View style={styles.cardTop}>
                        <Text style={styles.clientName} numberOfLines={1}>{item.name}</Text>
                        {goal ? (
                            <View style={styles.goalBadge}>
                                <Text style={styles.goalBadgeText} numberOfLines={1}>
                                    {goal.length > 22 ? goal.slice(0, 22) + '…' : goal}
                                </Text>
                            </View>
                        ) : null}
                    </View>

                    <Text style={styles.clientEmail} numberOfLines={1}>{item.email}</Text>

                    {meta ? <Text style={styles.clientMeta}>{meta}</Text> : null}
                </View>

                <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>👥</Text>
            </View>
            <Text style={styles.emptyTitle}>No Clients Yet</Text>
            <Text style={styles.emptySubtitle}>
                Invite a client using the button above. Once they accept, they'll appear here.
            </Text>
            <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('InviteClient')}
                activeOpacity={0.8}
            >
                <Text style={styles.emptyBtnText}>+ Invite Client</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <ScreenWrapper title="Clients">
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Your Clients</Text>
                    <TouchableOpacity
                        style={styles.inviteBtn}
                        onPress={() => navigation.navigate('InviteClient')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.inviteBtnText}>+ Invite</Text>
                    </TouchableOpacity>
                </View>

                {/* Client count */}
                {!loading && clients.length > 0 && (
                    <Text style={styles.countLabel}>
                        {clients.length} {clients.length === 1 ? 'client' : 'clients'}
                    </Text>
                )}

                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={theme.accent} />
                    </View>
                ) : (
                    <FlatList
                        data={clients}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderClient}
                        contentContainerStyle={[styles.list, clients.length === 0 && styles.listEmpty]}
                        ListEmptyComponent={renderEmpty}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </ScreenWrapper>
    );
};

// ── Styles ────────────────────────────────────────────────────────────────────

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
        paddingBottom: 4,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: theme.text,
    },
    inviteBtn: {
        backgroundColor: theme.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    inviteBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    countLabel: {
        fontSize: 13,
        color: theme.textMuted,
        fontWeight: '500',
        paddingHorizontal: 20,
        marginBottom: 12,
        marginTop: 6,
    },
    list: {
        paddingHorizontal: 16,
        paddingBottom: 24,
        paddingTop: 4,
    },
    listEmpty: {
        flexGrow: 1,
    },

    // Card
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
    cardBody: {
        flex: 1,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 3,
    },
    clientName: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.text,
        flex: 1,
    },
    clientEmail: {
        fontSize: 13,
        color: theme.textSecondary,
        marginBottom: 3,
    },
    clientMeta: {
        fontSize: 12,
        color: theme.textMuted,
        marginTop: 1,
    },
    goalBadge: {
        backgroundColor: theme.primary + '18',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.primary + '33',
        paddingHorizontal: 8,
        paddingVertical: 3,
        flexShrink: 0,
        maxWidth: 120,
    },
    goalBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.primary,
    },
    chevron: {
        fontSize: 22,
        color: theme.textMuted,
        fontWeight: '300',
        marginLeft: 2,
    },

    // Empty state
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
        backgroundColor: theme.primary + '22',
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
    emptyBtn: {
        marginTop: 8,
        backgroundColor: theme.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
    },
    emptyBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
});

export default ClientsListScreen;

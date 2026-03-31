import React, { useEffect } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../src/theme';

// ── Avatar helpers ─────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

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

// ── Sub-components ─────────────────────────────────────────────────────────────

const InfoRow = ({ icon, label, value, last, theme, styles }) => (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
        <View style={[styles.infoIconWrap, { backgroundColor: theme.accent + '18' }]}>
            <Icon name={icon} size={15} color={theme.accent} />
        </View>
        <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue} numberOfLines={4}>{value || '—'}</Text>
        </View>
    </View>
);

// ── Screen ─────────────────────────────────────────────────────────────────────

const ClientDetailsScreen = () => {
    const navigation = useNavigation();
    const route      = useRoute();
    const { clients: client } = route.params;
    const { theme }  = useTheme();
    const styles     = makeStyles(theme);

    // Remove back button text on iOS; Android has no text by default
    useEffect(() => {
        navigation.setOptions({
            headerBackTitle: '',
            headerBackTitleVisible: false,
        });
    }, [navigation]);

    if (!client) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centered}>
                    <Text style={styles.errorText}>No client details available.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const bg       = avatarColor(client.name ?? '');
    const initials = getInitials(client.name ?? '');
    const profile  = client.client_profile ?? {};
    const goal     = profile.fitness_goals;

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Hero ──────────────────────────────────────────────────────
                    heroBanner.height = avatar.marginTop + avatar.height / 2
                    = 52 + 96/2 = 100  →  banner bisects the avatar vertically
                ── */}
                <View style={styles.hero}>
                    <View style={[styles.heroBanner, { backgroundColor: bg + '28' }]} />

                    <View style={[styles.avatar, { backgroundColor: bg }]}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>

                    <Text style={styles.heroName}>{client.name}</Text>
                    <Text style={styles.heroRole}>Client</Text>

                    {goal ? (
                        <View style={[styles.goalBadge, { backgroundColor: bg + '22', borderColor: bg + '44' }]}>
                            <Icon name="trophy-outline" size={12} color={bg} style={{ marginRight: 5 }} />
                            <Text style={[styles.goalBadgeText, { color: bg }]} numberOfLines={1}>
                                {goal.length > 32 ? goal.slice(0, 32) + '…' : goal}
                            </Text>
                        </View>
                    ) : null}
                </View>

                {/* ── Personal Info ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Personal Info</Text>
                    <View style={styles.card}>
                        {client.email ? (
                            <InfoRow
                                icon="mail-outline"
                                label="Email"
                                value={client.email}
                                last={!profile.age && !profile.gender}
                                theme={theme}
                                styles={styles}
                            />
                        ) : null}
                        <InfoRow
                            icon="calendar-outline"
                            label="Age"
                            value={profile.age != null ? `${profile.age} years old` : null}
                            last={!profile.gender}
                            theme={theme}
                            styles={styles}
                        />
                        <InfoRow
                            icon="person-outline"
                            label="Gender"
                            value={profile.gender}
                            last
                            theme={theme}
                            styles={styles}
                        />
                    </View>
                </View>

                {/* ── Health & Fitness ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Health & Fitness</Text>
                    <View style={styles.card}>
                        <InfoRow
                            icon="trophy-outline"
                            label="Fitness Goals"
                            value={profile.fitness_goals}
                            last={false}
                            theme={theme}
                            styles={styles}
                        />
                        <InfoRow
                            icon="medkit-outline"
                            label="Medical Conditions"
                            value={profile.medical_conditions}
                            last
                            theme={theme}
                            styles={styles}
                        />
                    </View>
                </View>

                {/* ── Actions ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Actions</Text>

                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: bg }]}
                        onPress={() => navigation.navigate('ClientAssignmentList', { client })}
                        activeOpacity={0.82}
                    >
                        <View style={styles.actionBtnInner}>
                            <View style={styles.actionIconWrap}>
                                <Icon name="calendar-outline" size={20} color="#fff" />
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={styles.actionTitle}>View Schedule</Text>
                                <Text style={styles.actionSub}>See assigned workouts and calendar</Text>
                            </View>
                            <Icon name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnOutline]}
                        onPress={() => navigation.navigate('Messages', { client })}
                        activeOpacity={0.82}
                    >
                        <View style={styles.actionBtnInner}>
                            <View style={[styles.actionIconWrap, { backgroundColor: theme.accent + '20' }]}>
                                <Icon name="chatbubble-outline" size={20} color={theme.accent} />
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={[styles.actionTitle, { color: theme.text }]}>Message Client</Text>
                                <Text style={styles.actionSub}>
                                    Send a message to {client.name?.split(' ')[0]}
                                </Text>
                            </View>
                            <Icon name="chevron-forward" size={18} color={theme.textMuted} />
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const makeStyles = (theme) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.background,
    },
    scroll: {
        paddingBottom: 40,
        backgroundColor: theme.background,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        backgroundColor: theme.background,
    },
    errorText: {
        fontSize: 16,
        color: theme.error,
        textAlign: 'center',
    },

    // ── Hero ──────────────────────────────────────────────────────────────────
    hero: {
        alignItems: 'center',
        paddingBottom: 28,
        marginBottom: 8,
    },
    heroBanner: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 100,          // ends at midpoint of avatar (marginTop 52 + half of 96)
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 52,
        borderWidth: 4,
        borderColor: theme.background,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 6,
    },
    avatarText: {
        color: '#fff',
        fontSize: 34,
        fontWeight: '800',
        letterSpacing: 1,
    },
    heroName: {
        fontSize: 26,
        fontWeight: '800',
        color: theme.text,
        marginTop: 14,
        letterSpacing: 0.2,
    },
    heroRole: {
        fontSize: 14,
        color: theme.textMuted,
        fontWeight: '500',
        marginTop: 3,
        marginBottom: 14,
    },
    goalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 6,
        maxWidth: '80%',
    },
    goalBadgeText: {
        fontSize: 13,
        fontWeight: '600',
    },

    // ── Sections ──────────────────────────────────────────────────────────────
    section: {
        marginBottom: 20,
        paddingHorizontal: 16,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
        paddingLeft: 4,
    },
    card: {
        backgroundColor: theme.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border,
        overflow: 'hidden',
    },

    // ── Info rows ─────────────────────────────────────────────────────────────
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
    },
    infoRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border,
    },
    infoIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        color: theme.text,
        fontWeight: '500',
        lineHeight: 20,
    },

    // ── Action buttons ────────────────────────────────────────────────────────
    actionBtn: {
        borderRadius: 14,
        marginBottom: 10,
    },
    actionBtnOutline: {
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: theme.border,
    },
    actionBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
    },
    actionIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 2,
    },
    actionSub: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.65)',
    },
});

export default ClientDetailsScreen;

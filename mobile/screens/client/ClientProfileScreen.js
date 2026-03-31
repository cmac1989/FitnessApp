import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ActivityIndicator,
    TouchableOpacity, ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import Avatar, { avatarColor } from '../../components/Avatar';
import { getClientProfile } from '../../src/api/client';
import { useTheme } from '../../src/theme';
import { useUser } from '../../src/context/UserContext';


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

const ClientProfileScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const { user } = useUser();
    const styles = makeStyles(theme);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getClientProfile();
            setProfile(data);
        } catch {
            setError('failed');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { fetchProfile(); }, [fetchProfile]));

    if (loading) {
        return (
            <ScreenWrapper title="Profile">
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            </ScreenWrapper>
        );
    }

    if (error) {
        return (
            <ScreenWrapper title="Profile">
                <View style={styles.centered}>
                    <Text style={styles.errorText}>Failed to load profile.</Text>
                    <TouchableOpacity
                        style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
                        onPress={fetchProfile}
                        activeOpacity={0.82}
                    >
                        <Text style={styles.primaryBtnText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    const bg      = avatarColor(profile?.name ?? '');
    const goal    = profile?.fitness_goals;
    const photoUri = user?.profile_picture ?? null;

    return (
        <ScreenWrapper title="Profile">
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* ── Hero ───────────────────────────────────────────────────── */}
                <View style={styles.hero}>
                    <View style={[styles.heroBanner, { backgroundColor: bg + '28' }]} />

                    <Avatar
                        name={profile?.name}
                        photoUri={photoUri}
                        size={96}
                        style={styles.avatar}
                        borderWidth={4}
                        borderColor={theme.background}
                    />

                    <Text style={styles.heroName}>{profile?.name}</Text>
                    <Text style={styles.heroRole}>Client</Text>

                    {goal ? (
                        <View style={[styles.goalBadge, { backgroundColor: bg + '22', borderColor: bg + '44' }]}>
                            <Icon name="trophy-outline" size={12} color={bg} style={{ marginRight: 5 }} />
                            <Text style={[styles.goalBadgeText, { color: bg }]} numberOfLines={1}>
                                {goal.length > 30 ? goal.slice(0, 30) + '…' : goal}
                            </Text>
                        </View>
                    ) : null}

                    <TouchableOpacity
                        style={[styles.editHeroBtn, { backgroundColor: bg }]}
                        onPress={() => navigation.navigate('ClientProfileEdit', { profile })}
                        activeOpacity={0.82}
                    >
                        <Icon name="pencil-outline" size={15} color="#fff" />
                        <Text style={styles.editHeroBtnText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Personal Info ──────────────────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Personal Info</Text>
                    <View style={styles.card}>
                        <InfoRow icon="mail-outline"   label="Email"  value={profile?.email}               last={false} theme={theme} styles={styles} />
                        <InfoRow icon="calendar-outline" label="Age"  value={profile?.age != null ? `${profile.age} years old` : null} last={false} theme={theme} styles={styles} />
                        <InfoRow icon="person-outline" label="Gender" value={profile?.gender}               last={true}  theme={theme} styles={styles} />
                    </View>
                </View>

                {/* ── Health & Fitness ───────────────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Health & Fitness</Text>
                    <View style={styles.card}>
                        <InfoRow icon="trophy-outline"      label="Fitness Goals"      value={profile?.fitness_goals}      last={false} theme={theme} styles={styles} />
                        <InfoRow icon="medkit-outline"      label="Medical Conditions" value={profile?.medical_conditions} last={true}  theme={theme} styles={styles} />
                    </View>
                </View>

            </ScrollView>
        </ScreenWrapper>
    );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const makeStyles = (theme) => StyleSheet.create({
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

    // Hero
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
        height: 110,
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
        fontSize: 24,
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
        marginBottom: 18,
        maxWidth: '80%',
    },
    goalBadgeText: {
        fontSize: 13,
        fontWeight: '600',
    },
    editHeroBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 22,
    },
    editHeroBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },

    // Sections
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

    // Info rows
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

    // Error
    errorText: {
        fontSize: 16,
        color: theme.error,
        marginBottom: 16,
        textAlign: 'center',
    },
    primaryBtn: {
        paddingHorizontal: 28,
        paddingVertical: 13,
        borderRadius: 22,
    },
    primaryBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
});

export default ClientProfileScreen;

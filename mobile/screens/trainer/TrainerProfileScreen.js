import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ActivityIndicator,
    TouchableOpacity, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { getTrainerProfile } from '../../src/api/trainer';
import ScreenWrapper from '../../components/ScreenWrapper';
import Avatar, { avatarColor } from '../../components/Avatar';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../src/theme';
import { useUser } from '../../src/context/UserContext';

// ── Sub-components ─────────────────────────────────────────────────────────────

const InfoRow = ({ icon, label, value, last, theme, styles }) => (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
        <View style={[styles.infoIconWrap, { backgroundColor: theme.primary + '18' }]}>
            <Icon name={icon} size={15} color={theme.primary} />
        </View>
        <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue} numberOfLines={3}>{value || '—'}</Text>
        </View>
    </View>
);

// ── Screen ─────────────────────────────────────────────────────────────────────

const TrainerProfileScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { user } = useUser();
    const [trainer, setTrainer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTrainerProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (!token) { setError('not_setup'); return; }
            const response = await getTrainerProfile(token);
            const profileData = response.data || response;
            setTrainer({
                ...profileData,
                specialties: Array.isArray(profileData.specialties)
                    ? profileData.specialties
                    : (profileData.specialties
                        ? profileData.specialties.split(',').map(s => s.trim()).filter(Boolean)
                        : []),
            });
        } catch (err) {
            setError(err.response?.status === 404 ? 'not_setup' : 'failed');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchTrainerProfile(); }, []));

    const styles = makeStyles(theme);

    if (loading) {
        return (
            <ScreenWrapper title="Profile">
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            </ScreenWrapper>
        );
    }

    if (error === 'not_setup') {
        return (
            <ScreenWrapper title="Profile">
                <View style={styles.centered}>
                    <View style={[styles.emptyAvatar, { backgroundColor: theme.primary + '22' }]}>
                        <Icon name="person-outline" size={40} color={theme.primary} />
                    </View>
                    <Text style={styles.emptyTitle}>Profile Not Set Up</Text>
                    <Text style={styles.emptySubtitle}>
                        Complete your trainer profile so clients can find you.
                    </Text>
                    <TouchableOpacity
                        style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
                        onPress={() => navigation.navigate('ProfileEdit')}
                        activeOpacity={0.82}
                    >
                        <Text style={styles.primaryBtnText}>Set Up Profile</Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    if (error === 'failed') {
        return (
            <ScreenWrapper title="Profile">
                <View style={styles.centered}>
                    <Text style={styles.errorText}>Failed to load profile.</Text>
                    <TouchableOpacity
                        style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
                        onPress={fetchTrainerProfile}
                        activeOpacity={0.82}
                    >
                        <Text style={styles.primaryBtnText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    const bg   = avatarColor(trainer.name ?? '');
    const tags = trainer.specialties ?? [];
    const photoUri = user?.profile_picture ?? trainer.profile_picture ?? null;

    return (
        <ScreenWrapper title="Profile">
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* ── Hero ───────────────────────────────────────────────────── */}
                <View style={styles.hero}>
                    <View style={[styles.heroBanner, { backgroundColor: bg + '28' }]} />

                    <Avatar
                        name={trainer.name}
                        photoUri={photoUri}
                        size={96}
                        style={styles.avatar}
                        borderWidth={4}
                        borderColor={theme.background}
                    />

                    <Text style={styles.heroName}>{trainer.name}</Text>
                    <Text style={styles.heroRole}>Personal Trainer</Text>

                    {tags.length > 0 && (
                        <View style={styles.tagsRow}>
                            {tags.slice(0, 4).map((tag, i) => (
                                <View key={i} style={[styles.tag, { backgroundColor: bg + '22', borderColor: bg + '44' }]}>
                                    <Text style={[styles.tagText, { color: bg }]}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.editHeroBtn, { backgroundColor: bg }]}
                        onPress={() => navigation.navigate('ProfileEdit')}
                        activeOpacity={0.82}
                    >
                        <Icon name="pencil-outline" size={15} color="#fff" />
                        <Text style={styles.editHeroBtnText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Bio ────────────────────────────────────────────────────── */}
                {trainer.bio ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>About</Text>
                        <View style={styles.card}>
                            <Text style={styles.bioText}>{trainer.bio}</Text>
                        </View>
                    </View>
                ) : null}

                {/* ── Details ────────────────────────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Details</Text>
                    <View style={styles.card}>
                        <InfoRow icon="mail-outline"     label="Email"          value={trainer.email}           last={false} theme={theme} styles={styles} />
                        <InfoRow icon="ribbon-outline"   label="Certifications" value={trainer.certifications}  last={false} theme={theme} styles={styles} />
                        <InfoRow icon="time-outline"     label="Experience"     value={trainer.years_experience ? `${trainer.years_experience} years` : null} last={false} theme={theme} styles={styles} />
                        <InfoRow icon="location-outline" label="Location"       value={trainer.location}        last={false} theme={theme} styles={styles} />
                        <InfoRow icon="calendar-outline" label="Availability"   value={trainer.availability}    last={true}  theme={theme} styles={styles} />
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
        marginTop: 52,
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
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 18,
        paddingHorizontal: 20,
    },
    tag: {
        borderRadius: 20,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    tagText: {
        fontSize: 12,
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
    bioText: {
        fontSize: 15,
        color: theme.text,
        lineHeight: 22,
        padding: 16,
    },
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
    },
    emptyAvatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: theme.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
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

export default TrainerProfileScreen;

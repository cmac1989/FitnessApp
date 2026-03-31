import React, { useEffect, useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, ScrollView,
    Alert, Switch, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { userLogout, uploadAvatar } from '../../src/api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTrainerProfile, updateTrainerProfile } from '../../src/api/trainer';
import { useTheme } from '../../src/theme';
import { useToast } from '../../src/context/ToastContext';
import { useUser } from '../../src/context/UserContext';
import Avatar from '../../components/Avatar';

// ── Field row ──────────────────────────────────────────────────────────────────

const FieldRow = ({ label, last, children, styles }) => (
    <View style={[styles.fieldRow, !last && styles.fieldRowBorder]}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {children}
    </View>
);

// ── Screen ─────────────────────────────────────────────────────────────────────

const ProfileSettingsScreen = () => {
    const navigation = useNavigation();
    const { theme, isDark, toggleTheme } = useTheme();
    const { showToast } = useToast();
    const { user, updateUser, clearUser } = useUser();

    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [profile, setProfile] = useState({
        id: '', name: '', email: '',
        certifications: '', years_experience: '',
        specialties: '', bio: '', availability: '', location: '',
        profile_picture: user?.profile_picture ?? null,
    });

    const set = (key) => (text) => setProfile(prev => ({ ...prev, [key]: text }));

    const fetchTrainerProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('auth_token');
            if (!token) return;
            const response = await getTrainerProfile(token);
            const d = response.data || response;
            setProfile({
                ...d,
                specialties: Array.isArray(d.specialties) ? d.specialties.join(', ') : d.specialties ?? '',
                years_experience: d.years_experience?.toString() ?? '',
                profile_picture: d.profile_picture ?? null,
            });
        } catch (err) {
            if (err.response?.status !== 404) {
                console.error('Error fetching profile:', err);
            }
        }
    };

    useEffect(() => { fetchTrainerProfile(); }, []);

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);
        try {
            await updateTrainerProfile(profile.id, {
                ...profile,
                years_experience: parseInt(profile.years_experience) || 0,
                specialties: profile.specialties.split(',').map(s => s.trim()).filter(Boolean),
            });
            showToast('Your profile has been updated.', 'success');
            navigation.goBack();
        } catch {
            showToast('Failed to save changes. Please try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Log Out', style: 'destructive',
                onPress: async () => {
                    try {
                        await userLogout();
                        await clearUser();
                        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                    } catch {
                        showToast('Something went wrong logging out.', 'error');
                    }
                },
            },
        ]);
    };

    const handlePickAvatar = async () => {
        const res = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 1, includeBase64: true });
        if (res.didCancel || res.errorCode) return;
        const asset = res.assets?.[0];
        if (!asset?.uri) return;

        setUploading(true);
        try {
            const result = await uploadAvatar(asset);
            const url = result.profile_picture;
            setProfile(prev => ({ ...prev, profile_picture: `${url}?t=${Date.now()}` }));
            await updateUser({ profile_picture: url });
            showToast('Profile photo updated!', 'success');
        } catch {
            showToast('Failed to upload photo. Try again.', 'error');
            setProfile(prev => ({ ...prev, profile_picture: null }));
        } finally {
            setUploading(false);
        }
    };

    const styles = makeStyles(theme);

    const inputStyle = [styles.fieldInput, { color: theme.text }];
    const multiStyle = [styles.fieldInput, styles.fieldInputMulti, { color: theme.text }];

    return (
        <ScreenWrapper title="Edit Profile" showBack>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Avatar header ──────────────────────────────────────── */}
                    <View style={styles.avatarHeader}>
                        <Avatar
                            name={profile.name}
                            photoUri={profile.profile_picture}
                            size={80}
                            editable
                            uploading={uploading}
                            onPress={handlePickAvatar}
                        />
                        <Text style={[styles.avatarName, { marginTop: 12 }]}>{profile.name || 'Your Name'}</Text>
                        <Text style={styles.avatarSub}>Personal Trainer</Text>
                    </View>

                    {/* ── Personal ───────────────────────────────────────────── */}
                    <Text style={styles.sectionLabel}>Personal</Text>
                    <View style={styles.card}>
                        <FieldRow label="Name" last={false} styles={styles}>
                            <TextInput
                                style={inputStyle}
                                value={profile.name}
                                onChangeText={set('name')}
                                placeholderTextColor={theme.placeholder}
                                returnKeyType="next"
                            />
                        </FieldRow>
                        <FieldRow label="Email" last={false} styles={styles}>
                            <TextInput
                                style={[...inputStyle, styles.fieldInputDisabled]}
                                value={profile.email}
                                editable={false}
                                placeholderTextColor={theme.placeholder}
                                keyboardType="email-address"
                            />
                        </FieldRow>
                        <FieldRow label="Location" last={true} styles={styles}>
                            <TextInput
                                style={inputStyle}
                                value={profile.location}
                                onChangeText={set('location')}
                                placeholder="City, State"
                                placeholderTextColor={theme.placeholder}
                                returnKeyType="next"
                            />
                        </FieldRow>
                    </View>

                    {/* ── Professional ───────────────────────────────────────── */}
                    <Text style={styles.sectionLabel}>Professional</Text>
                    <View style={styles.card}>
                        <FieldRow label="Certifications" last={false} styles={styles}>
                            <TextInput
                                style={inputStyle}
                                value={profile.certifications}
                                onChangeText={set('certifications')}
                                placeholder="e.g. CPT, CSCS"
                                placeholderTextColor={theme.placeholder}
                                returnKeyType="next"
                            />
                        </FieldRow>
                        <FieldRow label="Years Exp." last={false} styles={styles}>
                            <TextInput
                                style={inputStyle}
                                value={profile.years_experience}
                                onChangeText={set('years_experience')}
                                keyboardType="number-pad"
                                placeholderTextColor={theme.placeholder}
                            />
                        </FieldRow>
                        <FieldRow label="Specialties" last={false} styles={styles}>
                            <TextInput
                                style={inputStyle}
                                value={profile.specialties}
                                onChangeText={set('specialties')}
                                placeholder="Weight Loss, Strength…"
                                placeholderTextColor={theme.placeholder}
                                returnKeyType="next"
                            />
                        </FieldRow>
                        <FieldRow label="Availability" last={true} styles={styles}>
                            <TextInput
                                style={inputStyle}
                                value={profile.availability}
                                onChangeText={set('availability')}
                                placeholder="Mon–Fri 6am–8pm"
                                placeholderTextColor={theme.placeholder}
                                returnKeyType="next"
                            />
                        </FieldRow>
                    </View>

                    {/* ── Bio ────────────────────────────────────────────────── */}
                    <Text style={styles.sectionLabel}>Bio</Text>
                    <View style={styles.card}>
                        <TextInput
                            style={[styles.bioInput, { color: theme.text }]}
                            value={profile.bio}
                            onChangeText={set('bio')}
                            placeholder="Tell clients about yourself…"
                            placeholderTextColor={theme.placeholder}
                            multiline
                            textAlignVertical="top"
                        />
                    </View>

                    {/* ── Save ───────────────────────────────────────────────── */}
                    <TouchableOpacity
                        style={[styles.saveBtn, saving && styles.saveBtnDisabled, { backgroundColor: theme.primary }]}
                        onPress={handleSave}
                        disabled={saving}
                        activeOpacity={0.82}
                    >
                        <Icon name="checkmark-outline" size={18} color="#fff" />
                        <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
                    </TouchableOpacity>

                    {/* ── Preferences ────────────────────────────────────────── */}
                    <Text style={styles.sectionLabel}>Preferences</Text>
                    <View style={styles.card}>
                        <View style={styles.toggleRow}>
                            <View style={styles.toggleInfo}>
                                <Icon name={isDark ? 'moon' : 'sunny-outline'} size={18} color={theme.textSecondary} style={{ marginRight: 10 }} />
                                <Text style={styles.toggleLabel}>Dark Mode</Text>
                            </View>
                            <Switch
                                value={isDark}
                                onValueChange={toggleTheme}
                                trackColor={{ false: theme.border, true: theme.primary }}
                                thumbColor="#fff"
                            />
                        </View>
                    </View>

                    {/* ── Danger zone ────────────────────────────────────────── */}
                    <Text style={styles.sectionLabel}>Account</Text>
                    <TouchableOpacity
                        style={styles.logoutBtn}
                        onPress={handleLogout}
                        activeOpacity={0.78}
                    >
                        <Icon name="log-out-outline" size={18} color="#ef4444" />
                        <Text style={styles.logoutBtnText}>Log Out</Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const makeStyles = (theme) => StyleSheet.create({
    scroll: {
        padding: 16,
        paddingBottom: 48,
        backgroundColor: theme.background,
    },

    // Avatar header
    avatarHeader: {
        alignItems: 'center',
        paddingVertical: 24,
        marginBottom: 8,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    avatarText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '800',
    },
    avatarName: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
    },
    avatarSub: {
        fontSize: 13,
        color: theme.textMuted,
        marginTop: 2,
    },

    // Section label
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
        marginTop: 20,
        paddingLeft: 4,
    },

    // Card
    card: {
        backgroundColor: theme.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border,
        overflow: 'hidden',
    },

    // Field rows
    fieldRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 4,
        minHeight: 52,
    },
    fieldRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border,
    },
    fieldLabel: {
        width: 100,
        fontSize: 14,
        fontWeight: '600',
        color: theme.textSecondary,
        flexShrink: 0,
    },
    fieldInput: {
        flex: 1,
        fontSize: 15,
        paddingVertical: 10,
        textAlign: 'right',
    },
    fieldInputDisabled: {
        opacity: 0.5,
    },
    fieldInputMulti: {
        textAlign: 'left',
        minHeight: 60,
        textAlignVertical: 'top',
    },

    // Bio
    bioInput: {
        padding: 16,
        fontSize: 15,
        minHeight: 100,
        textAlignVertical: 'top',
    },

    // Save button
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 24,
        paddingVertical: 15,
        borderRadius: 14,
    },
    saveBtnDisabled: {
        opacity: 0.6,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },

    // Toggle row
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    toggleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    toggleLabel: {
        fontSize: 15,
        color: theme.text,
        fontWeight: '500',
    },

    // Logout
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 15,
        borderRadius: 14,
        backgroundColor: '#ef444418',
        borderWidth: 1,
        borderColor: '#ef444430',
    },
    logoutBtnText: {
        color: '#ef4444',
        fontSize: 15,
        fontWeight: '700',
    },
});

export default ProfileSettingsScreen;

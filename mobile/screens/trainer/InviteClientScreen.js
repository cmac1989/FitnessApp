import React, { useState, useCallback } from 'react';
import {
    View, Text, TextInput, StyleSheet, FlatList,
    TouchableOpacity, ActivityIndicator, Alert,
    KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import CustomButton from '../../components/CustomButton';
import { sendInvitation, getTrainerInvitations, cancelInvitation } from '../../src/api/invitations';
import { useTheme } from '../../src/theme';

const InviteClientScreen = () => {
    const { theme } = useTheme();
    const styles = makeStyles(theme);

    const [email, setEmail]         = useState('');
    const [sending, setSending]     = useState(false);
    const [pending, setPending]     = useState([]);
    const [loadingList, setLoadingList] = useState(true);

    const fetchPending = useCallback(async (cancelled) => {
        try {
            setLoadingList(true);
            const data = await getTrainerInvitations();
            if (!cancelled?.value) setPending(data);
        } catch (err) {
            console.error('Failed to load invitations', err);
        } finally {
            if (!cancelled?.value) setLoadingList(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            const cancelled = { value: false };
            fetchPending(cancelled);
            return () => { cancelled.value = true; };
        }, [fetchPending])
    );

    const handleSend = async () => {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed) {
            Alert.alert('Required', 'Please enter the client\'s email address.');
            return;
        }
        try {
            setSending(true);
            const res = await sendInvitation(trimmed);
            setEmail('');
            Alert.alert('Invite Sent', res.message);
            fetchPending({});
        } catch (err) {
            const msg = err.response?.data?.error ?? 'Failed to send invitation. Please try again.';
            Alert.alert('Error', msg);
        } finally {
            setSending(false);
        }
    };

    const handleCancel = (id, name) => {
        Alert.alert(
            'Cancel Invitation',
            `Cancel the invitation for ${name}?`,
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Cancel Invite',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await cancelInvitation(id);
                            setPending(prev => prev.filter(i => i.id !== id));
                        } catch (err) {
                            Alert.alert('Error', 'Could not cancel invitation.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <ScreenWrapper title="Invite Client" showBack>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.flex}
            >
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

                    {/* ── Send invite ── */}
                    <Text style={styles.sectionTitle}>Invite by Email</Text>
                    <Text style={styles.hint}>
                        The client must already have an account. They'll receive a notification to accept or decline.
                    </Text>

                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="client@example.com"
                        placeholderTextColor={theme.placeholder}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        color={theme.text}
                        editable={!sending}
                    />

                    <CustomButton
                        title={sending ? 'Sending…' : 'Send Invitation'}
                        onPress={handleSend}
                        disabled={sending}
                    />

                    {/* ── Pending invites ── */}
                    <View style={styles.divider} />
                    <Text style={styles.sectionTitle}>Pending Invitations</Text>

                    {loadingList ? (
                        <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
                    ) : pending.length === 0 ? (
                        <Text style={styles.emptyText}>No pending invitations.</Text>
                    ) : (
                        pending.map(item => (
                            <View key={item.id} style={styles.inviteCard}>
                                <View style={styles.inviteInfo}>
                                    <Text style={styles.inviteName}>{item.client_name}</Text>
                                    <Text style={styles.inviteMeta}>{item.client_email}</Text>
                                    <Text style={styles.inviteMeta}>Expires {item.expires_at}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => handleCancel(item.id, item.client_name)}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    flex: { flex: 1 },
    container: {
        padding: 20,
        backgroundColor: theme.background,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 8,
    },
    hint: {
        fontSize: 13,
        color: theme.textMuted,
        marginBottom: 16,
        lineHeight: 19,
    },
    input: {
        backgroundColor: theme.inputBackground,
        borderWidth: 1,
        borderColor: theme.inputBorder,
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        color: theme.text,
        marginBottom: 14,
    },
    divider: {
        height: 1,
        backgroundColor: theme.divider,
        marginVertical: 28,
    },
    emptyText: {
        color: theme.textMuted,
        fontStyle: 'italic',
        marginTop: 8,
    },
    inviteCard: {
        backgroundColor: theme.card,
        borderRadius: 10,
        padding: 14,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border,
    },
    inviteInfo: {
        flex: 1,
    },
    inviteName: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.text,
    },
    inviteMeta: {
        fontSize: 12,
        color: theme.textMuted,
        marginTop: 2,
    },
    cancelBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.error,
    },
    cancelBtnText: {
        color: theme.error,
        fontSize: 13,
        fontWeight: '600',
    },
});

export default InviteClientScreen;

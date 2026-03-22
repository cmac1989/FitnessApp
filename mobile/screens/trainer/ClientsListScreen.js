import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getClients } from '../../src/api/user';
import { useTheme } from '../../src/theme';

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
            if (!cancelled.value) setClients(data);
        } catch (error) {
            console.error('There was a problem fetching clients', error);
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

    if (loading) {
        return (
            <ScreenWrapper title="Clients">
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            </ScreenWrapper>
        );
    }

    const renderClient = ({ item }) => (
        <Pressable
            style={({ pressed }) => [styles.clientCard, pressed && styles.pressed]}
            onPress={() => navigation.navigate('ClientDetails', { clients: item })}
        >
            <Text style={styles.clientName}>{item.name}</Text>
            <Text style={styles.clientMeta}>{item.email}</Text>
        </Pressable>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Clients Yet</Text>
            <Text style={styles.emptySubtitle}>
                Invite a client using the button above. Once they accept, they'll appear here.
            </Text>
        </View>
    );

    return (
        <ScreenWrapper title="Clients">
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Your Clients</Text>
                    <TouchableOpacity
                        style={styles.inviteBtn}
                        onPress={() => navigation.navigate('InviteClient')}
                    >
                        <Text style={styles.inviteBtnText}>+ Invite</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={clients}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderClient}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmpty}
                />
            </View>
        </ScreenWrapper>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: theme.background,
    },
    header: {
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
    listContent: {
        paddingBottom: 20,
    },
    clientCard: {
        backgroundColor: theme.card,
        padding: 16,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.border,
    },
    pressed: {
        opacity: 0.75,
    },
    clientName: {
        fontSize: 17,
        fontWeight: '600',
        color: theme.text,
    },
    clientMeta: {
        fontSize: 14,
        color: theme.textMuted,
        marginTop: 3,
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

export default ClientsListScreen;

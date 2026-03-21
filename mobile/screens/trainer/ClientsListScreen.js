import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getClients } from '../../src/api/user';
import { useTheme } from '../../src/theme';

const ClientsListScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const [clients, setClients] = useState([]);

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const data = await getClients();
                setClients(data);
            } catch (error) {
                console.error('There was a problem fetching clients', error);
            }
        };
        fetchClients();
    }, []);

    const styles = makeStyles(theme);

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
            <Text style={styles.emptySubtitle}>Clients who sign up with you will appear here.</Text>
        </View>
    );

    return (
        <ScreenWrapper title="Clients">
            <View style={styles.container}>
                <Text style={styles.title}>Your Clients</Text>
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
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: theme.background,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        color: theme.text,
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

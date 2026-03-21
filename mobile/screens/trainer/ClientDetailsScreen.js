import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import CustomButton from '../../components/CustomButton';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../src/theme';

const ClientDetailsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { clients: client } = route.params;
    const { theme } = useTheme();

    const styles = makeStyles(theme);

    if (!client) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.errorText}>No client details available.</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Client Details</Text>

                <View style={styles.detailCard}>
                    <DetailRow label="Name" value={client.name} theme={theme} />
                    <DetailRow label="Age" value={client.client_profile?.age} theme={theme} />
                    <DetailRow label="Gender" value={client.client_profile?.gender} theme={theme} />
                    <DetailRow label="Goals" value={client.client_profile?.fitness_goals} theme={theme} />
                    <DetailRow label="Medical Conditions" value={client.client_profile?.medical_conditions} theme={theme} />
                </View>

                <CustomButton
                    title="Message Client"
                    onPress={() => navigation.navigate('Messages', { client })}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

const DetailRow = ({ label, value, theme }) => {
    const styles = makeStyles(theme);
    return (
        <View style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value ?? 'N/A'}</Text>
        </View>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.background,
    },
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: theme.background,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        color: theme.text,
    },
    detailCard: {
        backgroundColor: theme.card,
        padding: 20,
        borderRadius: 12,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
    },
    row: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    value: {
        fontSize: 16,
        color: theme.text,
        marginTop: 4,
    },
    errorText: {
        fontSize: 17,
        color: theme.error,
        textAlign: 'center',
        margin: 20,
    },
});

export default ClientDetailsScreen;

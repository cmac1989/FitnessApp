import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Toast from '../../components/Toast';

const ToastContext = createContext({ showToast: () => {} });

export const ToastProvider = ({ children }) => {
    const [state, setState] = useState({ visible: false, message: '', type: 'success' });

    const showToast = useCallback((message, type = 'success') => {
        setState({ visible: true, message, type });
    }, []);

    const hideToast = useCallback(() => {
        setState(prev => ({ ...prev, visible: false }));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            <View style={styles.root}>
                {children}
                <Toast
                    visible={state.visible}
                    message={state.message}
                    type={state.type}
                    onHide={hideToast}
                />
            </View>
        </ToastContext.Provider>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1 },
});

export const useToast = () => useContext(ToastContext);

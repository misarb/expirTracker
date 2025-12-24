import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator
} from 'react-native';
import { useSpaceStore } from '../store/spaceStore';
import { colors } from '../theme/colors';

interface JoinSpaceModalProps {
    visible: boolean;
    onClose: () => void;
    initialCode?: string; // For deep linking
    onSuccess?: (spaceName: string) => void;
}

export default function JoinSpaceModal({
    visible,
    onClose,
    initialCode,
    onSuccess
}: JoinSpaceModalProps) {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<TextInput>(null);

    const { joinSpaceWithCode } = useSpaceStore();

    // Reset state when modal opens
    useEffect(() => {
        if (visible) {
            setCode(initialCode || '');
            setIsLoading(false);
            // Focus input after a short delay
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [visible, initialCode]);

    const handleJoin = () => {
        const trimmedCode = code.trim().toUpperCase();

        if (!trimmedCode) {
            Alert.alert('Required', 'Please enter an invite code');
            return;
        }

        if (trimmedCode.length < 6) {
            Alert.alert('Invalid Code', 'Invite codes are 6 characters long');
            return;
        }

        setIsLoading(true);

        // Simulate network delay for better UX
        setTimeout(() => {
            const result = joinSpaceWithCode(trimmedCode);
            setIsLoading(false);

            if (result.success) {
                if (result.error === 'Already a member') {
                    Alert.alert(
                        'Already a Member',
                        `You're already a member of "${result.space?.name}". Switching to this space now.`,
                        [{ text: 'OK', onPress: onClose }]
                    );
                } else {
                    Alert.alert(
                        '🎉 Welcome!',
                        `You've joined "${result.space?.name}"! You can now view and manage shared products.`,
                        [{
                            text: 'Great!', onPress: () => {
                                onSuccess?.(result.space?.name || '');
                                onClose();
                            }
                        }]
                    );
                }
            } else {
                let title = 'Cannot Join';
                let message = result.error || 'Something went wrong';

                if (result.error?.includes('expired')) {
                    title = 'Invite Expired';
                    message = 'This invite has expired. Please ask the space owner for a new invite code.';
                } else if (result.error?.includes('Invalid')) {
                    title = 'Invalid Code';
                    message = 'This invite code is not valid. Please check the code and try again.';
                } else if (result.error?.includes('maximum')) {
                    title = 'Invite Limit Reached';
                    message = 'This invite has reached its maximum number of uses. Please ask for a new invite.';
                } else if (result.error?.includes('no longer exists')) {
                    title = 'Space Not Found';
                    message = 'This Family Space no longer exists.';
                }

                Alert.alert(title, message);
            }
        }, 500);
    };

    const formatCode = (text: string) => {
        // Remove any non-alphanumeric characters and uppercase
        return text.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.overlay}>
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>Join Family Space</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Text style={styles.closeText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Illustration */}
                        <View style={styles.illustration}>
                            <Text style={styles.illustrationIcon}>🔗</Text>
                        </View>

                        <Text style={styles.subtitle}>
                            Enter the 6-character invite code shared with you to join
                            a Family Space.
                        </Text>

                        {/* Code Input */}
                        <Text style={styles.label}>Invite Code</Text>
                        <TextInput
                            ref={inputRef}
                            style={styles.codeInput}
                            placeholder="ABC123"
                            placeholderTextColor="#c7d2fe"
                            value={code}
                            onChangeText={(text) => setCode(formatCode(text))}
                            maxLength={6}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            keyboardType="default"
                            textAlign="center"
                        />

                        <Text style={styles.hint}>
                            💡 Ask the Family Space owner to share their invite code with you.
                        </Text>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.joinBtn,
                                    (code.length < 6 || isLoading) && styles.joinBtnDisabled
                                ]}
                                onPress={handleJoin}
                                disabled={code.length < 6 || isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.joinText}>Join Space</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    keyboardView: {
        flex: 1
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#171717',
    },
    closeBtn: {
        padding: 4,
    },
    closeText: {
        fontSize: 20,
        color: '#9ca3af',
    },

    illustration: {
        alignItems: 'center',
        marginVertical: 16,
    },
    illustrationIcon: {
        fontSize: 56,
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },

    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#171717',
        marginBottom: 8,
    },
    codeInput: {
        borderWidth: 2,
        borderColor: '#e0e7ff',
        borderRadius: 16,
        padding: 20,
        fontSize: 32,
        fontWeight: 'bold',
        color: '#6366f1',
        backgroundColor: '#f5f3ff',
        letterSpacing: 8,
        textAlign: 'center',
    },

    hint: {
        fontSize: 13,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 8,
        lineHeight: 18,
    },

    footer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    cancelBtn: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelText: {
        fontWeight: '600',
        color: '#374151',
    },
    joinBtn: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#10b981',
        alignItems: 'center',
        justifyContent: 'center',
    },
    joinBtnDisabled: {
        backgroundColor: '#a7f3d0',
    },
    joinText: {
        fontWeight: 'bold',
        color: '#fff',
    },
});

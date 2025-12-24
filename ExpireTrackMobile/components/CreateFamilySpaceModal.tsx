import React, { useState, useEffect } from 'react';
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
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { useSpaceStore } from '../store/spaceStore';
import { colors, spacing } from '../theme/colors';

// Family space icons
const FAMILY_ICONS = [
    '👨‍👩‍👧‍👦', '👪', '🏠', '🏡', '💕', '🤝', '👨‍👩‍👧', '👨‍👩‍👦',
    '👨‍👨‍👧', '👩‍👩‍👦', '🏘️', '🌟', '💫', '🎯', '📦', '🗄️'
];

interface CreateFamilySpaceModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess?: (spaceId: string, spaceName: string) => void;
}

export default function CreateFamilySpaceModal({
    visible,
    onClose,
    onSuccess
}: CreateFamilySpaceModalProps) {
    const [name, setName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('👨‍👩‍👧‍👦');
    const [isCreating, setIsCreating] = useState(false);

    const { createFamilySpace } = useSpaceStore();

    // Reset state when modal opens
    useEffect(() => {
        if (visible) {
            setName('');
            setSelectedIcon('👨‍👩‍👧‍👦');
        }
    }, [visible]);

    const handleCreate = async () => {
        if (!name.trim()) {
            Alert.alert('Required', 'Please enter a name for your Family Space');
            return;
        }

        setIsCreating(true);
        try {
            const result = await createFamilySpace(name.trim(), selectedIcon);
            if (result.success && result.space) {
                onClose();
                // Call onSuccess with spaceId so parent can show invite modal
                onSuccess?.(result.space.id, result.space.name);
            } else {
                Alert.alert('Creation Failed', result.error || 'Failed to create Family Space. Please check your connection.');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'An unexpected error occurred');
        } finally {
            setIsCreating(false);
        }
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
                            <Text style={styles.title}>Create Family Space</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Text style={styles.closeText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Illustration */}
                            <View style={styles.illustration}>
                                <Text style={styles.illustrationIcon}>{selectedIcon}</Text>
                            </View>

                            <Text style={styles.subtitle}>
                                Share your inventory with family members. Everyone can add, edit,
                                and track products together.
                            </Text>

                            {/* Name Input */}
                            <Text style={styles.label}>Space Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Smith Family, Home, Parents"
                                placeholderTextColor="#9ca3af"
                                value={name}
                                onChangeText={setName}
                                autoFocus
                                maxLength={30}
                            />
                            <Text style={styles.charCount}>{name.length}/30</Text>

                            {/* Icon Selector */}
                            <Text style={styles.label}>Choose an Icon</Text>
                            <View style={styles.iconGrid}>
                                {FAMILY_ICONS.map((icon) => (
                                    <TouchableOpacity
                                        key={icon}
                                        style={[
                                            styles.iconOption,
                                            selectedIcon === icon && styles.iconOptionSelected
                                        ]}
                                        onPress={() => setSelectedIcon(icon)}
                                    >
                                        <Text style={styles.iconText}>{icon}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.createBtn,
                                    (!name.trim() || isCreating) && styles.createBtnDisabled
                                ]}
                                onPress={handleCreate}
                                disabled={!name.trim() || isCreating}
                            >
                                {isCreating ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.createText}>Create Space</Text>
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
        maxHeight: '85%',
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
        fontSize: 64,
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
        marginTop: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: '#171717',
        backgroundColor: '#f9fafb',
    },
    charCount: {
        fontSize: 12,
        color: '#9ca3af',
        textAlign: 'right',
        marginTop: 4,
    },

    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 8,
    },
    iconOption: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconOptionSelected: {
        backgroundColor: '#e0e7ff',
        borderWidth: 2,
        borderColor: '#6366f1',
    },
    iconText: {
        fontSize: 24,
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
    createBtn: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#6366f1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    createBtnDisabled: {
        backgroundColor: '#c7d2fe',
    },
    createText: {
        fontWeight: 'bold',
        color: '#fff',
    },
});

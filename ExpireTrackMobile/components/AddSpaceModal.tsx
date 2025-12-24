import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, Dimensions } from 'react-native';
import { useProductStore } from '../store/productStore';
import { useSpaceStore } from '../store/spaceStore';
import { useUserStore } from '../store/userStore';
import { colors, spacing, borderRadius, fontSize } from '../theme/colors';
import { Svg, Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Common emojis used in the app
const SPACE_ICONS = [
    "📦", "🗄️", "📂", "🗃️", "🏠", "🛁", "🧴", "💊", "🧊", "🥫", "🥦", "🍎", "🧺", "🚗", "🪴", "🧸", "📚", "✏️", "🔧", "🧳"
];

interface AddSpaceModalProps {
    visible: boolean;
    onClose: () => void;
    defaultParentId?: string | null;
}

export default function AddSpaceModal({ visible, onClose, defaultParentId }: AddSpaceModalProps) {
    const { addLocation, locations } = useProductStore();
    const { currentSpaceId } = useSpaceStore();
    const { getUserId } = useUserStore();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('📦');
    const [parentId, setParentId] = useState<string | null>(defaultParentId || null);

    // Reset when opening
    React.useEffect(() => {
        if (visible) {
            setName('');
            setDescription('');
            setIcon('📦');
            setParentId(defaultParentId || null);
        }
    }, [visible, defaultParentId]);

    const handleSubmit = () => {
        if (!name.trim()) {
            Alert.alert('Required', 'Please enter a space name');
            return;
        }
        const userId = getUserId();
        const spaceId = currentSpaceId;

        if (!spaceId) {
            Alert.alert('Error', 'No space selected. Please select a space first.');
            return;
        }

        addLocation({
            name,
            description: description || undefined,
            icon,
            color: '#8B5CF6',
            parentId: parentId || undefined,
            spaceId: spaceId,
            createdBy: userId
        });
        onClose();
    };

    const parentSpace = locations.find(l => l.id === parentId);

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
                <View style={styles.overlay}>
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.title}>{parentId ? 'Add Sub-Space' : 'Add New Space'}</Text>
                                {parentId && (
                                    <Text style={styles.subtitle}>Inside {parentSpace?.icon} {parentSpace?.name}</Text>
                                )}
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Text style={styles.closeText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

                            {/* Name */}
                            <Text style={styles.label}>Space Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Pantry, Freezer, Closet"
                                placeholderTextColor="#9ca3af"
                                value={name}
                                onChangeText={setName}
                            />

                            {/* Parent Selector */}
                            <Text style={styles.label}>Create inside (optional)</Text>
                            <View style={styles.pickerContainer}>
                                <TouchableOpacity
                                    style={styles.pickerButton}
                                    onPress={() => {
                                        Alert.alert(
                                            'Select Parent Space',
                                            'Choose where to create this space',
                                            [
                                                {
                                                    text: '📂 Top Level (no parent)',
                                                    onPress: () => setParentId(null)
                                                },
                                                ...locations.map(loc => ({
                                                    text: `${loc.icon} ${loc.name}`,
                                                    onPress: () => setParentId(loc.id)
                                                })),
                                                { text: 'Cancel', style: 'cancel' }
                                            ]
                                        );
                                    }}
                                >
                                    <Text style={styles.pickerText}>
                                        {parentId
                                            ? `${parentSpace?.icon} ${parentSpace?.name}`
                                            : '📂 Top Level (no parent)'}
                                    </Text>
                                    <Text style={styles.pickerArrow}>▼</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.helperText}>Create as a sub-space inside another space</Text>

                            {/* Icon Grid */}
                            <Text style={styles.label}>Icon</Text>
                            <View style={styles.iconGrid}>
                                {SPACE_ICONS.map((emoji) => (
                                    <TouchableOpacity
                                        key={emoji}
                                        style={[styles.iconOption, icon === emoji && styles.iconOptionSelected]}
                                        onPress={() => setIcon(emoji)}
                                    >
                                        <Text style={{ fontSize: 24 }}>{emoji}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Description */}
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="What's stored here?"
                                placeholderTextColor="#9ca3af"
                                value={description}
                                onChangeText={setDescription}
                            />

                        </ScrollView>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.addBtn} onPress={handleSubmit}>
                                <Text style={styles.addText}>Add Space</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    keyboardView: { flex: 1 },
    overlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff', borderRadius: 24, padding: 24, maxHeight: '85%',
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10,
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#171717' },
    subtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
    closeBtn: { padding: 4 },
    closeText: { fontSize: 20, color: '#9ca3af' },

    label: { fontSize: 14, fontWeight: '600', color: '#171717', marginBottom: 8, marginTop: 12 },
    input: {
        borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 16, color: '#171717', backgroundColor: '#f9fafb'
    },

    pickerContainer: { marginBottom: 4 },
    pickerButton: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 14,
        backgroundColor: '#f9fafb',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    pickerText: {
        fontSize: 16,
        color: '#171717',
        flex: 1
    },
    pickerArrow: {
        fontSize: 12,
        color: '#9ca3af'
    },
    helperText: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 4,
        marginBottom: 8
    },

    iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    iconOption: {
        width: 44, height: 44, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center',
    },
    iconOptionSelected: {
        backgroundColor: '#e0e7ff', borderWidth: 2, borderColor: '#6366f1',
    },

    footer: { flexDirection: 'row', gap: 12, marginTop: 24 },
    cancelBtn: {
        flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center'
    },
    cancelText: { fontWeight: '600', color: '#374151' },
    addBtn: {
        flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center'
    },
    addText: { fontWeight: 'bold', color: '#fff' },
});

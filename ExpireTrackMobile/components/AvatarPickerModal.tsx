import React from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { colors } from '../theme/colors';

interface AvatarPickerModalProps {
    visible: boolean;
    onClose: () => void;
    currentAvatar: string;
    onSelectAvatar: (emoji: string) => void;
}

const AVATAR_EMOJIS = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
    '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
    '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
    '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
    '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕',
    '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯',
    '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁',
    '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨',
    '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞',
    '😓', '😩', '😫', '😤', '😡', '😠', '🤬', '😈',
    '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻',
    '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼',
    '😽', '🙀', '😿', '😾', '🐶', '🐱', '🐭', '🐹',
    '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮',
    '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐔', '🐧',
    '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗',
    '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜',
    '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕',
    '🐙', '🦑', '🦐', '🦀', '🐡', '🐠', '🐟', '🐬',
    '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍',
    '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘',
];

export default function AvatarPickerModal({
    visible,
    onClose,
    currentAvatar,
    onSelectAvatar,
}: AvatarPickerModalProps) {
    const handleSelect = (emoji: string) => {
        onSelectAvatar(emoji);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Choose Your Avatar</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.subtitle}>Select an emoji to represent you</Text>

                    {/* Avatar Grid */}
                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                        <View style={styles.emojiGrid}>
                            {AVATAR_EMOJIS.map((emoji, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.emojiButton,
                                        currentAvatar === emoji && styles.emojiButtonSelected,
                                    ]}
                                    onPress={() => handleSelect(emoji)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.emojiText}>{emoji}</Text>
                                    {currentAvatar === emoji && (
                                        <View style={styles.checkMark}>
                                            <Text style={styles.checkMarkText}>✓</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1f2937',
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeText: {
        fontSize: 18,
        color: '#6b7280',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 20,
    },
    scrollView: {
        maxHeight: 400,
    },
    emojiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingBottom: 20,
    },
    emojiButton: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#f9fafb',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    emojiButtonSelected: {
        borderColor: '#6366f1',
        backgroundColor: '#eef2ff',
    },
    emojiText: {
        fontSize: 32,
    },
    checkMark: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#6366f1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkMarkText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '700',
    },
});

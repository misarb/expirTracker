import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { colors } from '../theme/colors';
import { useSpaceStore, MY_SPACE_ID } from '../store/spaceStore';
import { useSettingsStore } from '../store/settingsStore';
import { useColorScheme } from 'react-native';

const { height } = Dimensions.get('window');

interface SpaceSelectModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (spaceId: string) => void;
    title?: string;
}

export default function SpaceSelectModal({ visible, onClose, onSelect, title = "Move to Space" }: SpaceSelectModalProps) {
    const { spaces, currentSpaceId } = useSpaceStore();
    const { theme: themeSetting } = useSettingsStore();
    const systemTheme = useColorScheme();
    const isDark = themeSetting === 'system' ? systemTheme === 'dark' : themeSetting === 'dark';
    const theme = isDark ? 'dark' : 'light';
    const styles = getStyles(theme);

    const availableSpaces = [
        { id: MY_SPACE_ID, name: 'My Personal Space', icon: '👤' },
        ...spaces.map(s => ({ id: s.id, name: s.name, icon: s.icon || '🏠' }))
    ].filter(s => s.id !== currentSpaceId);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.dismissArea} onPress={onClose} />
                <View style={styles.content}>
                    <Text style={styles.title}>{title}</Text>
                    <ScrollView style={styles.scrollView}>
                        {availableSpaces.map(space => (
                            <TouchableOpacity
                                key={space.id}
                                style={styles.spaceItem}
                                onPress={() => {
                                    onSelect(space.id);
                                    onClose();
                                }}
                            >
                                <Text style={styles.spaceIcon}>{space.icon}</Text>
                                <Text style={styles.spaceName}>{space.name}</Text>
                                <Text style={styles.arrow}>→</Text>
                            </TouchableOpacity>
                        ))}
                        {availableSpaces.length === 0 && (
                            <Text style={styles.emptyText}>No other spaces available to move items to.</Text>
                        )}
                    </ScrollView>
                    <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const getStyles = (theme: 'light' | 'dark') => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    dismissArea: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        backgroundColor: colors.card[theme],
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxHeight: height * 0.7,
        borderWidth: 1,
        borderColor: colors.border[theme],
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.foreground[theme],
        marginBottom: 20,
        textAlign: 'center',
    },
    scrollView: {
        marginBottom: 8,
    },
    spaceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        backgroundColor: colors.secondary[theme],
        marginBottom: 12,
    },
    spaceIcon: {
        fontSize: 24,
        marginRight: 16,
    },
    spaceName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground[theme],
    },
    arrow: {
        fontSize: 18,
        color: colors.muted[theme],
    },
    emptyText: {
        textAlign: 'center',
        color: colors.muted[theme],
        padding: 20,
    },
    cancelBtn: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtnText: {
        color: colors.primary[theme],
        fontSize: 16,
        fontWeight: '600',
    },
});

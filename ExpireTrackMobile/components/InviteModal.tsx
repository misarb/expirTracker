import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    Share,
    Alert,
    ActivityIndicator,
    ScrollView
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { useSpaceStore } from '../store/spaceStore';
import { Invite } from '../types/spaces';
import { colors } from '../theme/colors';
import QRCodeModal from './QRCodeModal';

interface InviteModalProps {
    visible: boolean;
    onClose: () => void;
    spaceId: string;
}

export default function InviteModal({ visible, onClose, spaceId }: InviteModalProps) {
    const [invite, setInvite] = useState<Invite | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showQr, setShowQr] = useState(false); // Controls QR modal visibility
    const [showQrModal, setShowQrModal] = useState(false); // New state for dedicated QR modal

    const { getActiveInvite, createInvite, regenerateInvite, getSpaceById, getMemberCount } = useSpaceStore();
    const space = getSpaceById(spaceId);

    useEffect(() => {
        const fetchInvite = async () => {
            if (visible && spaceId) {
                setIsLoading(true);
                try {
                    let activeInvite = await getActiveInvite(spaceId);

                    // If no active invite exists, create one
                    if (!activeInvite) {
                        console.log('📨 [InviteModal] No active invite found, creating new one...');
                        activeInvite = await createInvite(spaceId);
                    }

                    setInvite(activeInvite);
                    setCopied(false);
                    setShowQr(false);
                } catch (error) {
                    console.error('❌ [InviteModal] Error fetching/creating invite:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchInvite();
    }, [visible, spaceId]);

    const handleCopyCode = async () => {
        if (!invite) return;

        await Clipboard.setStringAsync(invite.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (!invite || !space) return;

        try {
            await Share.share({
                message: `Join my Family Space "${space.name}" on ExpireTrack!\n\nUse invite code: ${invite.code}\n\nDownload ExpireTrack and enter this code to start sharing our inventory.`,
            });
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    const handleRegenerate = () => {
        Alert.alert(
            'Regenerate Invite',
            'This will invalidate the current invite code. Anyone with the old code won\'t be able to join. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Regenerate',
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            const newInvite = await regenerateInvite(spaceId);
                            setInvite(newInvite);
                        } catch (error) {
                            console.error('❌ [InviteModal] Regenerate error:', error);
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const formatExpiryDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) return 'Expired';
        if (diffDays === 1) return 'Expires tomorrow';
        return `Expires in ${diffDays} days`;
    };

    // Generate QR code value (in a real app, this would be a deep link)
    const getQRValue = () => {
        if (!invite || !space) return '';
        return `expiretrack://join?code=${invite.code}&space=${encodeURIComponent(space.name)}`;
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Invite Members</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {space && (
                            <View style={styles.spaceInfo}>
                                <Text style={styles.spaceIcon}>{space.icon}</Text>
                                <View>
                                    <Text style={styles.spaceName}>{space.name}</Text>
                                    <Text style={styles.memberCount}>
                                        {getMemberCount(spaceId)} member{getMemberCount(spaceId) !== 1 ? 's' : ''}
                                    </Text>
                                </View>
                            </View>
                        )}

                        <Text style={styles.subtitle}>
                            Share this QR code or invite code with people you want to invite.
                        </Text>

                        {/* Invite Code Display */}
                        {invite ? (
                            <>
                                {/* Invite Code - Always visible */}
                                <TouchableOpacity
                                    style={styles.codeContainer}
                                    onPress={handleCopyCode}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.codeLabel}>INVITE CODE</Text>
                                    <Text style={styles.code}>{invite.code}</Text>
                                    <Text style={styles.tapToCopy}>
                                        {copied ? '✓ Copied!' : 'Tap to copy'}
                                    </Text>
                                </TouchableOpacity>

                                {/* Show QR Code Button */}
                                <TouchableOpacity
                                    style={styles.showQrBtn}
                                    onPress={() => setShowQrModal(true)}
                                >
                                    <Text style={styles.showQrIcon}>📱</Text>
                                    <Text style={styles.showQrText}>Show QR Code</Text>
                                </TouchableOpacity>

                                <View style={styles.inviteInfo}>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoLabel}>⏱️ {formatExpiryDate(invite.expiresAt)}</Text>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoLabel}>
                                            👥 {invite.usedCount}/{invite.maxUses} uses
                                        </Text>
                                    </View>
                                </View>

                                {/* Actions */}
                                <View style={styles.actions}>
                                    <TouchableOpacity
                                        style={styles.shareBtn}
                                        onPress={handleShare}
                                    >
                                        <Text style={styles.shareIcon}>📤</Text>
                                        <Text style={styles.shareBtnText}>Share Invite</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={styles.regenerateBtn}
                                    onPress={handleRegenerate}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#6366f1" size="small" />
                                    ) : (
                                        <Text style={styles.regenerateBtnText}>🔄 Generate New Code</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={styles.noInvite}>
                                <Text style={styles.noInviteText}>No active invite</Text>
                                <TouchableOpacity
                                    style={styles.createInviteBtn}
                                    onPress={handleRegenerate}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={styles.createInviteBtnText}>Create Invite Code</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>

                    {/* Close Button */}
                    <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                        <Text style={styles.doneBtnText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Dedicated QR Code Modal */}
            {invite && (
                <QRCodeModal
                    visible={showQrModal}
                    onClose={() => setShowQrModal(false)}
                    qrValue={getQRValue()}
                    title="Scan to Join Space"
                />
            )}
        </Modal>
    );
}

const styles = StyleSheet.create({
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

    spaceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f3ff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        gap: 12,
    },
    spaceIcon: {
        fontSize: 32,
    },
    spaceName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#171717',
    },
    memberCount: {
        fontSize: 13,
        color: '#6b7280',
    },

    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 20,
        lineHeight: 20,
        textAlign: 'center',
    },

    // QR Code styles
    qrSection: {
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 8,
    },
    qrContainer: {
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    qrHint: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 12,
    },
    hideQrText: {
        fontSize: 13,
        color: '#6366f1',
        marginTop: 4,
    },
    showQrBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f3ff',
        borderRadius: 12,
        padding: 12,
        marginTop: 12,
        gap: 8,
    },
    showQrIcon: {
        fontSize: 16,
    },
    showQrText: {
        fontSize: 14,
        color: '#6366f1',
        fontWeight: '500',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e5e7eb',
    },
    dividerText: {
        fontSize: 12,
        color: '#9ca3af',
        paddingHorizontal: 12,
    },

    codeContainer: {
        backgroundColor: '#f5f3ff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e0e7ff',
        borderStyle: 'dashed',
    },
    codeLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6366f1',
        letterSpacing: 1,
        marginBottom: 8,
    },
    code: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#6366f1',
        letterSpacing: 6,
    },
    tapToCopy: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 8,
    },

    inviteInfo: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginTop: 16,
    },
    infoItem: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    infoLabel: {
        fontSize: 12,
        color: '#6b7280',
    },

    actions: {
        marginTop: 20,
    },
    shareBtn: {
        backgroundColor: '#6366f1',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        gap: 8,
    },
    shareIcon: {
        fontSize: 18,
    },
    shareBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },

    regenerateBtn: {
        alignItems: 'center',
        padding: 12,
        marginTop: 8,
    },
    regenerateBtnText: {
        color: '#6366f1',
        fontWeight: '500',
        fontSize: 14,
    },

    noInvite: {
        alignItems: 'center',
        padding: 20,
    },
    noInviteText: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 16,
    },
    createInviteBtn: {
        backgroundColor: '#6366f1',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
    },
    createInviteBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },

    doneBtn: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    doneBtnText: {
        color: '#374151',
        fontWeight: '600',
    },
});

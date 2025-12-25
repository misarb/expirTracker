import React from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface QRCodeModalProps {
    visible: boolean;
    onClose: () => void;
    qrValue: string;
    title?: string;
}

export default function QRCodeModal({ visible, onClose, qrValue, title = "Scan to Join" }: QRCodeModalProps) {
    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    {/* Close Button */}
                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={onClose}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.closeIcon}>✕</Text>
                    </TouchableOpacity>

                    {/* QR Code */}
                    <View style={styles.qrContainer}>
                        <QRCode
                            value={qrValue}
                            size={220}
                            color="#6366f1"
                            backgroundColor="#ffffff"
                        />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.subtitle}>Have them scan this code with their camera</Text>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        width: '90%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    closeIcon: {
        fontSize: 20,
        color: '#6b7280',
        fontWeight: '600',
    },
    qrContainer: {
        padding: 24,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        marginBottom: 24,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
    },
});

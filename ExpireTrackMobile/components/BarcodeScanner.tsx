import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Button, Modal } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors, borderRadius, spacing } from '../theme/colors';

interface BarcodeScannerProps {
    onScan: (data: string) => void;
    onClose: () => void;
    visible: boolean;
}

export default function BarcodeScanner({ onScan, onClose, visible }: BarcodeScannerProps) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        if (visible) {
            setScanned(false);
        }
    }, [visible]);

    if (!permission) {
        // Camera permissions are still loading
        return <View />;
    }

    if (!permission.granted) {
        return (
            <Modal visible={visible} animationType="slide">
                <View style={styles.container}>
                    <Text style={{ textAlign: 'center', marginBottom: 20, color: '#fff' }}>
                        We need your permission to show the camera
                    </Text>
                    <Button onPress={requestPermission} title="grant permission" />
                    <Button onPress={onClose} title="Cancel" color="red" />
                </View>
            </Modal>
        );
    }

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);
        // Vibrate/Sound could be added here
        onScan(data);
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
            <View style={styles.container}>
                <CameraView
                    style={styles.camera}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e"],
                    }}
                >
                    <View style={styles.overlay}>
                        <View style={styles.topOverlay}>
                            <Text style={styles.title}>Scan Barcode</Text>
                        </View>

                        <View style={styles.centerRow}>
                            <View style={styles.sideOverlay} />
                            <View style={styles.scanFrame}>
                                <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 }]} />
                                <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 }]} />
                                <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 }]} />
                                <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 }]} />
                            </View>
                            <View style={styles.sideOverlay} />
                        </View>

                        <View style={styles.bottomOverlay}>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Text style={styles.closeText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </CameraView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    topOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerRow: {
        flexDirection: 'row',
        height: 250,
    },
    sideOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    scanFrame: {
        width: 250,
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    title: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 40,
    },
    closeBtn: {
        padding: 15,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 30,
        width: 120,
        alignItems: 'center',
    },
    closeText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    corner: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderColor: '#6366F1', // Indigo primary
    }
});

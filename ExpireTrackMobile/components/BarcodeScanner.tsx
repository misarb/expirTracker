import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors } from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Path, Circle } from 'react-native-svg';

interface BarcodeScannerProps {
    onScan: (data: string) => void;
    onClose: () => void;
    visible: boolean;
}

// Camera Icon
const CameraIcon = ({ size = 64, color = "#fff" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <Circle cx="12" cy="13" r="4" />
    </Svg>
);

// Close Icon
const CloseIcon = ({ size = 24, color = "#fff" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M18 6L6 18" />
        <Path d="M6 6l12 12" />
    </Svg>
);

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

    // Beautiful Permission Request UI
    if (!permission.granted) {
        return (
            <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
                <LinearGradient
                    colors={['#1a1a2e', '#16213e', '#0f0f23']}
                    style={styles.permissionContainer}
                >
                    {/* Close Button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <CloseIcon />
                    </TouchableOpacity>

                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <LinearGradient
                            colors={['#6366F1', '#8B5CF6']}
                            style={styles.iconGradient}
                        >
                            <CameraIcon size={48} color="#fff" />
                        </LinearGradient>
                    </View>

                    {/* Title */}
                    <Text style={styles.permissionTitle}>Camera Access Required</Text>

                    {/* Description */}
                    <Text style={styles.permissionText}>
                        To scan barcodes and capture product photos, ExpireTrack needs access to your camera.
                    </Text>

                    {/* Features */}
                    <View style={styles.featureList}>
                        <View style={styles.featureItem}>
                            <View style={styles.featureDot} />
                            <Text style={styles.featureText}>Scan product barcodes instantly</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <View style={styles.featureDot} />
                            <Text style={styles.featureText}>Take photos of your products</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <View style={styles.featureDot} />
                            <Text style={styles.featureText}>Auto-fill product information</Text>
                        </View>
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            onPress={async () => {
                                const result = await requestPermission();
                                if (!result.granted && result.canAskAgain === false) {
                                    // Permission permanently denied, open settings
                                    Linking.openSettings();
                                }
                            }}
                            style={styles.grantButton}
                        >
                            <LinearGradient
                                colors={['#6366F1', '#8B5CF6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.grantButtonGradient}
                            >
                                <Text style={styles.grantButtonText}>Allow Camera Access</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                            <Text style={styles.cancelButtonText}>Maybe Later</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Privacy Note */}
                    <Text style={styles.privacyNote}>
                        🔒 Your camera is only used locally. We never upload photos without your consent.
                    </Text>
                </LinearGradient>
            </Modal>
        );
    }

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);
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
                        barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e", "code128", "code39"],
                    }}
                >
                    <View style={styles.overlay}>
                        <View style={styles.topOverlay}>
                            {/* Close Button */}
                            <TouchableOpacity style={styles.headerCloseButton} onPress={onClose}>
                                <CloseIcon />
                            </TouchableOpacity>
                            <Text style={styles.title}>Scan Barcode</Text>
                            <Text style={styles.subtitle}>Position barcode within the frame</Text>
                        </View>

                        <View style={styles.centerRow}>
                            <View style={styles.sideOverlay} />
                            <View style={styles.scanFrame}>
                                {/* Animated corners */}
                                <View style={[styles.corner, styles.cornerTL]} />
                                <View style={[styles.corner, styles.cornerTR]} />
                                <View style={[styles.corner, styles.cornerBL]} />
                                <View style={[styles.corner, styles.cornerBR]} />

                                {/* Scan line animation would go here */}
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
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
    },
    headerCloseButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
    },
    bottomOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerRow: {
        flexDirection: 'row',
        height: 280,
    },
    sideOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    scanFrame: {
        width: 280,
        height: 280,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    title: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    subtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        marginTop: 8,
    },
    closeBtn: {
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 30,
        width: 140,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    closeText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#6366F1',
    },
    cornerTL: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 8,
    },
    cornerTR: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 8,
    },
    cornerBL: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 8,
    },
    cornerBR: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 8,
    },

    // Permission UI Styles
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
    },
    iconContainer: {
        marginBottom: 30,
    },
    iconGradient: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    permissionTitle: {
        color: '#fff',
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    permissionText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    featureList: {
        alignSelf: 'stretch',
        marginBottom: 40,
        paddingHorizontal: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    featureDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#6366F1',
        marginRight: 12,
    },
    featureText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 15,
    },
    buttonContainer: {
        width: '100%',
        paddingHorizontal: 20,
    },
    grantButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 12,
    },
    grantButtonGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    grantButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
    cancelButton: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 16,
    },
    privacyNote: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 30,
        paddingHorizontal: 40,
    },
});

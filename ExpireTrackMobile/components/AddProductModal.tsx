import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, TextInput, ScrollView, Switch, KeyboardAvoidingView, Platform, Alert, Image, useColorScheme, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Product, Category, Location } from '../types';
import { colors, spacing, borderRadius, fontSize } from '../theme/colors';
import { ScanIcon } from './Icons';
import BarcodeScanner from './BarcodeScanner';
import { useProductStore } from '../store/productStore';
import { useI18n } from '../lib/i18n';
import BarcodeService from '../lib/barcodeService';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useUIStore } from '../store/uiStore';
import { useSettingsStore } from '../store/settingsStore';

interface AddProductModalProps {
    visible: boolean;
    onClose: () => void;
    editingProduct?: Product | null;
    // defaultLocationId removed from props, read from store
}

export default function AddProductModal({ visible, onClose, editingProduct }: AddProductModalProps) {
    const { theme: themeSetting } = useSettingsStore();
    const systemTheme = useColorScheme();
    const isDark = themeSetting === 'system' ? systemTheme === 'dark' : themeSetting === 'dark';
    const theme = isDark ? 'dark' : 'light';
    const insets = useSafeAreaInsets();
    const styles = getStyles(theme, insets.bottom);

    const { locations, addProduct, updateProduct } = useProductStore();
    const { defaultLocationId } = useUIStore();

    // Form State
    const [name, setName] = useState('');
    const [locationId, setLocationId] = useState('');
    const [expirationDate, setExpirationDate] = useState(new Date().toISOString().split('T')[0]);
    const [purchaseDate, setPurchaseDate] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [notes, setNotes] = useState('');
    const [image, setImage] = useState('');

    // Logic Flags
    const [hasExpirationDate, setHasExpirationDate] = useState(true);
    const [useShelfLife, setUseShelfLife] = useState(false);
    const [shelfLifeDays, setShelfLifeDays] = useState('');
    const [openedDate, setOpenedDate] = useState('');

    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringDays, setRecurringDays] = useState('7');
    const [notifyTiming, setNotifyTiming] = useState('');
    const [criticalDays, setCriticalDays] = useState('7'); // Days before expiry to mark as "expiring soon"
    const [expandedLocationId, setExpandedLocationId] = useState<string | null>(null); // Track expanded parent location

    // Scanner State
    const [showScanner, setShowScanner] = useState(false);
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [scanMessage, setScanMessage] = useState('');

    // Date Picker State
    // iOS: Inline expansion tracker
    const [activeDateField, setActiveDateField] = useState<'expiration' | 'purchase' | 'opened' | null>(null);

    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (selectedDate) {
            const dateStr = selectedDate.toISOString().split('T')[0];
            if (activeDateField === 'expiration') setExpirationDate(dateStr);
            if (activeDateField === 'purchase') setPurchaseDate(dateStr);
            if (activeDateField === 'opened') setOpenedDate(dateStr);
        }

        // On Android, close immediately. On iOS, keep open (inline) or user closes it.
        // Actually, for inline iOS, we don't close it automatically on change.
        if (Platform.OS === 'android') {
            setActiveDateField(null);
        }
    };

    const toggleDatePicker = (field: 'expiration' | 'purchase' | 'opened') => {
        if (activeDateField === field && Platform.OS === 'ios') {
            setActiveDateField(null); // Collapse on toggle (iOS)
        } else {
            setActiveDateField(field);
        }
    };

    // Reset form when opening/editing
    useEffect(() => {
        if (visible) {
            if (editingProduct) {
                setName(editingProduct.name);
                setLocationId(editingProduct.locationId);
                setExpirationDate(editingProduct.expirationDate);
                setPurchaseDate(editingProduct.purchaseDate || '');
                setQuantity(editingProduct.quantity?.toString() || '1');
                setNotes(editingProduct.notes || '');
                setImage(editingProduct.image || '');
                setHasExpirationDate(editingProduct.hasExpirationDate !== false);
                setUseShelfLife(editingProduct.useShelfLife || false);
                setShelfLifeDays(editingProduct.shelfLifeDays?.toString() || '');
                setOpenedDate(editingProduct.openedDate || '');
                setIsRecurring(editingProduct.isRecurring || false);
                setRecurringDays(editingProduct.recurringDays?.toString() || '7');
                setNotifyTiming(editingProduct.notifyTiming?.toString() || '');
                setCriticalDays(editingProduct.notifyTiming?.toString() || '7');
            } else {
                // New Product defaults
                setName('');
                setLocationId(defaultLocationId || locations[0]?.id || '');
                setExpirationDate(new Date().toISOString().split('T')[0]);
                setPurchaseDate('');
                setQuantity('1');
                setNotes('');
                setImage('');
                setHasExpirationDate(true);
                setUseShelfLife(false);
                setShelfLifeDays('');
                setOpenedDate('');
                setIsRecurring(false);
                setRecurringDays('7');
                setNotifyTiming('');
                setCriticalDays('7');
            }
        }
    }, [visible, editingProduct, locations]);

    const { t } = useI18n();

    // ... (keep state)

    const handleScan = async (barcode: string) => {
        setShowScanner(false);
        setIsLookingUp(true);
        setScanMessage(t('lookingUp'));

        try {
            const info = await BarcodeService.lookupBarcode(barcode);
            if (info && info.productName) {
                setName(info.productName);
                if (info.imageUrl) setImage(info.imageUrl);
                setScanMessage(t('scanFound').replace('{{name}}', info.productName));
            } else {
                setScanMessage(t('scanNotFound'));
            }
        } catch {
            setScanMessage(t('scanFailed'));
        }
        setIsLookingUp(false);
        setTimeout(() => setScanMessage(''), 3000);
    };

    const pickImage = async () => {
        Alert.alert(t('image'), t('selectImage'), [
            {
                text: "Camera",
                onPress: async () => {
                    // ... keep logic
                    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
                    if (permissionResult.granted === false) {
                        alert(t('permissionCamera'));
                        return;
                    }
                    const result = await ImagePicker.launchCameraAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        aspect: [4, 3],
                        quality: 0.5,
                    });
                    if (!result.canceled) {
                        setImage(result.assets[0].uri);
                    }
                }
            },
            {
                text: "Gallery",
                onPress: async () => {
                    // ... keep logic
                    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (permissionResult.granted === false) {
                        alert(t('permissionGallery'));
                        return;
                    }
                    const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        aspect: [4, 3],
                        quality: 0.5,
                    });
                    if (!result.canceled) {
                        setImage(result.assets[0].uri);
                    }
                }
            },
            { text: t('cancel'), style: "cancel" }
        ]);
    };

    const handleSubmit = () => {
        if (!name.trim()) {
            Alert.alert(t('requiredField'), t('enterProductName'));
            return;
        }
        // ... (keep logic)
        let effectiveExpDate = expirationDate;
        if (hasExpirationDate && useShelfLife && openedDate && shelfLifeDays) {
            const opened = new Date(openedDate);
            const days = parseInt(shelfLifeDays);
            if (!isNaN(days)) {
                opened.setDate(opened.getDate() + days);
                effectiveExpDate = opened.toISOString().split('T')[0];
            }
        }
        if (!hasExpirationDate) {
            effectiveExpDate = '2099-12-31';
        }

        const data = {
            name,
            locationId,
            expirationDate: effectiveExpDate,
            purchaseDate: purchaseDate || undefined,
            quantity: quantity ? parseInt(quantity) : undefined,
            notes: notes || undefined,
            image: image || undefined,
            hasExpirationDate,
            useShelfLife,
            shelfLifeDays: shelfLifeDays ? parseInt(shelfLifeDays) : undefined,
            openedDate: openedDate || undefined,
            isRecurring,
            recurringDays: isRecurring && recurringDays ? parseInt(recurringDays) : undefined,
            notifyTiming: criticalDays ? parseInt(criticalDays) : 7, // Use criticalDays for threshold
        };

        if (editingProduct) {
            updateProduct(editingProduct.id, data);
        } else {
            addProduct(data);
        }
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
                <View style={styles.overlay}>
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>{editingProduct ? t('editProduct') : t('addProduct')}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Text style={styles.closeText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                            {/* Name & Scan */}
                            <View style={styles.field}>
                                <Text style={styles.label}>{t('productName')}</Text>
                                <View style={styles.inputRow}>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        value={name}
                                        onChangeText={setName}
                                        placeholder={t('productNamePlaceholder')}
                                        placeholderTextColor={colors.muted[isDark ? 'dark' : 'light']}
                                    />
                                    <TouchableOpacity style={styles.scanBtn} onPress={() => setShowScanner(true)}>
                                        <ScanIcon size={20} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                                {isLookingUp && <Text style={styles.helperText}>{t('lookingUp')}</Text>}
                                {scanMessage ? <Text style={styles.helperText}>{scanMessage}</Text> : null}
                            </View>

                            {/* Image Picker */}
                            <View style={styles.field}>
                                <Text style={styles.label}>{t('image')}</Text>
                                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                                    {image ? (
                                        <Image source={{ uri: image }} style={styles.imagePreview} />
                                    ) : (
                                        <Text style={{ color: colors.muted[isDark ? 'dark' : 'light'] }}>{t('selectImage')}</Text>
                                    )}
                                </TouchableOpacity>
                                {image ? (
                                    <TouchableOpacity onPress={() => setImage('')} style={{ marginTop: 4 }}>
                                        <Text style={{ fontSize: 12, color: colors.destructive }}>{t('removeImage')}</Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>

                            {/* Space */}
                            <View style={styles.field}>
                                <Text style={styles.label}>Space</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                                    {(() => {
                                        // Organize locations hierarchically
                                        const parentLocations = locations.filter(loc => !loc.parentId);
                                        const allChips: JSX.Element[] = [];

                                        parentLocations.forEach(parent => {
                                            const children = locations.filter(loc => loc.parentId === parent.id);
                                            const hasChildren = children.length > 0;
                                            const isExpanded = expandedLocationId === parent.id;
                                            const isParentActive = locationId === parent.id;

                                            // Add parent chip (with integrated expand button if has children)
                                            allChips.push(
                                                <TouchableOpacity
                                                    key={parent.id}
                                                    style={[
                                                        styles.locationChip,
                                                        styles.parentChip,
                                                        isParentActive && styles.locationChipActive
                                                    ]}
                                                    onPress={() => {
                                                        setLocationId(parent.id);
                                                        if (hasChildren) {
                                                            setExpandedLocationId(isExpanded ? null : parent.id);
                                                        }
                                                    }}
                                                >
                                                    <Text style={styles.locationChipIcon}>{parent.icon}</Text>
                                                    <Text style={[
                                                        styles.locationChipText,
                                                        styles.parentChipText,
                                                        isParentActive && styles.locationChipTextActive
                                                    ]}>
                                                        {parent.name}
                                                    </Text>
                                                    {hasChildren && (
                                                        <Text style={[
                                                            styles.expandIcon,
                                                            isParentActive && { color: colors.primary[isDark ? 'dark' : 'light'] }
                                                        ]}>
                                                            {isExpanded ? '▲' : '▼'}
                                                        </Text>
                                                    )}
                                                    {isParentActive && !hasChildren && (
                                                        <Text style={styles.checkIcon}>✓</Text>
                                                    )}
                                                </TouchableOpacity>
                                            );

                                            // Add children if expanded
                                            if (hasChildren && isExpanded) {
                                                children.forEach(child => {
                                                    const isChildActive = locationId === child.id;
                                                    allChips.push(
                                                        <TouchableOpacity
                                                            key={child.id}
                                                            style={[
                                                                styles.locationChip,
                                                                styles.childChip,
                                                                isChildActive && styles.locationChipActive,
                                                                isChildActive && styles.childChipActive
                                                            ]}
                                                            onPress={() => setLocationId(child.id)}
                                                        >
                                                            <Text style={styles.childConnectorLine}>└</Text>
                                                            <Text style={[styles.locationChipIcon, { fontSize: 14 }]}>
                                                                {child.icon}
                                                            </Text>
                                                            <Text style={[
                                                                styles.locationChipText,
                                                                styles.childChipText,
                                                                isChildActive && styles.locationChipTextActive
                                                            ]}>
                                                                {child.name}
                                                            </Text>
                                                            {isChildActive && (
                                                                <Text style={styles.checkIcon}>✓</Text>
                                                            )}
                                                        </TouchableOpacity>
                                                    );
                                                });
                                            }
                                        });

                                        return allChips;
                                    })()}
                                </ScrollView>
                            </View>

                            {/* Expiration Logic */}
                            <View style={styles.section}>
                                <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
                                    <Text style={styles.label}>{t('hasExpirationDate')}</Text>
                                    <Switch value={hasExpirationDate} onValueChange={setHasExpirationDate} trackColor={{ true: colors.primary.light }} />
                                </View>

                                {hasExpirationDate && (
                                    <View style={{ marginTop: 10 }}>
                                        <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }]}>
                                            <Text style={styles.label}>{t('expiresAfterOpening')}</Text>
                                            <Switch value={useShelfLife} onValueChange={setUseShelfLife} trackColor={{ true: colors.primary.light }} />
                                        </View>

                                        {useShelfLife ? (
                                            <View style={styles.row}>
                                                <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                                                    <Text style={styles.label}>{t('days')}</Text>
                                                    <TextInput style={styles.input} value={shelfLifeDays} onChangeText={setShelfLifeDays} keyboardType="numeric" placeholder="12" placeholderTextColor="#999" />
                                                </View>
                                                <View style={[styles.field, { flex: 1 }]}>
                                                    <Text style={styles.label}>{t('openedDate')}</Text>
                                                    <TouchableOpacity onPress={() => toggleDatePicker('opened')}>
                                                        <View style={[styles.input, { justifyContent: 'center' }]}>
                                                            <Text style={{ color: openedDate ? colors.foreground[theme] : '#999' }}>
                                                                {openedDate || 'YYYY-MM-DD'}
                                                            </Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                    {activeDateField === 'opened' && Platform.OS === 'ios' && (
                                                        <DateTimePicker
                                                            value={openedDate ? new Date(openedDate) : new Date()}
                                                            mode="date"
                                                            display="inline"
                                                            onChange={handleDateChange}
                                                            style={{ marginTop: 10 }}
                                                        />
                                                    )}
                                                </View>
                                            </View>
                                        ) : (
                                            <View style={styles.field}>
                                                <Text style={styles.label}>{t('expirationDate')}</Text>
                                                <TouchableOpacity onPress={() => toggleDatePicker('expiration')}>
                                                    <View style={[styles.input, { justifyContent: 'center', borderColor: activeDateField === 'expiration' ? colors.primary[theme] : colors.border[theme] }]}>
                                                        <Text style={{ color: colors.foreground[theme] }}>{expirationDate}</Text>
                                                    </View>
                                                </TouchableOpacity>
                                                {activeDateField === 'expiration' && Platform.OS === 'ios' && (
                                                    <DateTimePicker
                                                        value={new Date(expirationDate)}
                                                        mode="date"
                                                        display="inline"
                                                        onChange={handleDateChange}
                                                        style={{ marginTop: 10 }}
                                                    />
                                                )}
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>

                            {/* Critical Days - Expiry Threshold */}
                            <View style={styles.field}>
                                <Text style={styles.label}>⚠️ Critical Date (days before expiry)</Text>
                                <Text style={[styles.label, { fontSize: 12, color: colors.muted[theme], marginTop: 2 }]}>
                                    Products will be marked as "expiring soon" this many days before expiry
                                </Text>
                                <TextInput
                                    style={styles.input}
                                    value={criticalDays}
                                    onChangeText={setCriticalDays}
                                    keyboardType="numeric"
                                    placeholder="7"
                                />
                            </View>

                            {/* Purchase Date */}
                            <View style={styles.field}>
                                <Text style={styles.label}>{t('purchaseDate')}</Text>
                                <TouchableOpacity onPress={() => toggleDatePicker('purchase')}>
                                    <View style={[styles.input, { justifyContent: 'center', borderColor: activeDateField === 'purchase' ? colors.primary[theme] : colors.border[theme] }]}>
                                        <Text style={{ color: purchaseDate ? colors.foreground[theme] : '#999' }}>
                                            {purchaseDate || 'YYYY-MM-DD'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                {activeDateField === 'purchase' && Platform.OS === 'ios' && (
                                    <DateTimePicker
                                        value={purchaseDate ? new Date(purchaseDate) : new Date()}
                                        mode="date"
                                        display="inline"
                                        onChange={handleDateChange}
                                        style={{ marginTop: 10 }}
                                    />
                                )}
                            </View>

                            {/* Quantity & Notes */}
                            <View style={styles.row}>
                                <View style={[styles.field, { width: 100, marginRight: 10 }]}>
                                    <Text style={styles.label}>{t('qty')}</Text>
                                    <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
                                </View>
                                <View style={[styles.field, { flex: 1 }]}>
                                    <Text style={styles.label}>{t('notes')}</Text>
                                    <TextInput style={styles.input} value={notes} onChangeText={setNotes} placeholder="..." />
                                </View>
                            </View>

                            {/* Recurring */}
                            <View style={[styles.section, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                                <Text style={styles.label}>{t('recurringItem')}</Text>
                                <Switch value={isRecurring} onValueChange={setIsRecurring} trackColor={{ true: colors.primary.light }} />
                            </View>

                            <View style={{ height: 100 }} />
                        </ScrollView>

                        {/* Footer Buttons */}
                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                                <Text style={styles.cancelText}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
                                <Text style={styles.saveText}>{editingProduct ? t('saveChanges') : t('addProduct')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* Scanner Modal */}
            <BarcodeScanner
                visible={showScanner}
                onClose={() => setShowScanner(false)}
                onScan={handleScan}
            />

            {/* Android Picker */}
            {Platform.OS === 'android' && activeDateField && (
                <DateTimePicker
                    value={
                        activeDateField === 'expiration' ? new Date(expirationDate) :
                            activeDateField === 'purchase' ? (purchaseDate ? new Date(purchaseDate) : new Date()) :
                                (openedDate ? new Date(openedDate) : new Date())
                    }
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date(2100, 0, 1)}
                    minimumDate={new Date(1900, 0, 1)}
                />
            )}
        </Modal>
    );
}

const getStyles = (theme: 'light' | 'dark', bottomInset: number = 0) => StyleSheet.create({
    keyboardView: { flex: 1 },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.card[theme],
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '92%',
        padding: spacing.lg,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    title: {
        fontSize: fontSize.xl,
        fontWeight: 'bold',
        color: colors.foreground[theme],
    },
    closeBtn: {
        padding: 5,
    },
    closeText: {
        fontSize: 24,
        color: colors.muted[theme],
    },
    form: {
        flex: 1,
    },
    field: {
        marginBottom: spacing.md,
    },
    label: {
        fontSize: fontSize.sm,
        fontWeight: '600',
        color: colors.foreground[theme],
        marginBottom: 8,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 8,
    },
    input: {
        backgroundColor: colors.background[theme],
        borderWidth: 1,
        borderColor: colors.border[theme],
        borderRadius: borderRadius.md,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: fontSize.md,
        color: colors.foreground[theme],
    },
    imagePicker: {
        height: 120,
        backgroundColor: colors.background[theme],
        borderWidth: 1,
        borderColor: colors.border[theme],
        borderRadius: borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        borderStyle: 'dashed',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: borderRadius.md,
    },
    scanBtn: {
        backgroundColor: colors.primary[theme],
        borderRadius: borderRadius.md,
        width: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    helperText: {
        fontSize: fontSize.xs,
        color: colors.muted[theme],
        marginTop: 4,
    },
    row: {
        flexDirection: 'row',
    },
    chipRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    locationChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 22,
        backgroundColor: colors.secondary[theme],
        marginRight: 8,
        borderWidth: 2,
        borderColor: 'transparent',
        minHeight: 40,
    },
    parentChip: {
        paddingHorizontal: 16,
        paddingVertical: 11,
        borderWidth: 2,
        borderColor: colors.border[theme],
        backgroundColor: colors.card[theme],
    },
    locationChipActive: {
        backgroundColor: colors.primary[theme] + '15',
        borderColor: colors.primary[theme],
        shadowColor: colors.primary[theme],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    locationChipIcon: {
        fontSize: 16,
        marginRight: 7,
    },
    locationChipText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.foreground[theme],
    },
    parentChipText: {
        fontSize: 14,
        fontWeight: '600',
    },
    locationChipTextActive: {
        color: colors.primary[theme],
        fontWeight: '700',
    },
    childChip: {
        backgroundColor: colors.muted[theme] + '12',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: colors.border[theme] + '40',
        borderStyle: 'dashed',
    },
    childChipActive: {
        borderStyle: 'solid',
        backgroundColor: colors.primary[theme] + '12',
    },
    childChipText: {
        fontSize: 13,
        fontWeight: '500',
    },
    childConnectorLine: {
        fontSize: 12,
        marginRight: 4,
        color: colors.muted[theme],
        opacity: 0.5,
    },
    expandIcon: {
        fontSize: 10,
        marginLeft: 8,
        color: colors.muted[theme],
        fontWeight: '600',
    },
    checkIcon: {
        fontSize: 12,
        marginLeft: 6,
        color: colors.primary[theme],
        fontWeight: '700',
    },
    expandBtn: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: colors.secondary[theme],
        marginRight: 8,
        borderWidth: 1,
        borderColor: colors.border[theme],
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        backgroundColor: colors.secondary[theme],
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: spacing.md,
        paddingBottom: Math.max(bottomInset, 24), // Ensure minimum padding + safe area
        backgroundColor: colors.card[theme],
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.border[theme],
        alignItems: 'center',
    },
    cancelText: {
        fontWeight: '600',
        color: colors.foreground[theme],
    },
    saveBtn: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: borderRadius.xl,
        backgroundColor: colors.primary[theme],
        alignItems: 'center',
    },
    saveText: {
        fontWeight: 'bold',
        color: '#fff',
    },
});

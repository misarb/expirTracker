'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

export type Language = 'en' | 'fr' | 'ar';

type TranslationKey =
    | 'appName'
    | 'neverWaste'
    | 'addProduct'
    | 'editProduct'
    | 'productName'
    | 'category'
    | 'location'
    | 'expirationDate'
    | 'purchaseDate'
    | 'quantity'
    | 'notes'
    | 'cancel'
    | 'save'
    | 'delete'
    | 'settings'
    | 'notifications'
    | 'categories'
    | 'about'
    | 'total'
    | 'safe'
    | 'expiring'
    | 'expired'
    | 'quickAdd'
    | 'statistics'
    | 'support'
    | 'back'
    | 'noProducts'
    | 'addFirst'
    | 'recurring'
    | 'repeatEvery'
    | 'days'
    | 'enableNotifications'
    | 'testNotification'
    | 'disable'
    | 'addCategory'
    | 'categoryName'
    | 'icon'
    | 'color'
    | 'language'
    | 'allProducts'
    | 'locations'
    | 'search'
    | 'sortBy'
    | 'date'
    | 'name'
    | 'status'
    | 'productImage'
    | 'hasExpirationDate'
    | 'noExpiration'
    | 'expiresAfterOpening'
    | 'shelfLifeDays'
    | 'openedDate'
    | 'notOpened'
    | 'notifyTiming';

const translations: Record<Language, Record<TranslationKey, string>> = {
    en: {
        appName: 'ExpireTrack',
        neverWaste: 'Never waste again',
        addProduct: 'Add Product',
        editProduct: 'Edit Product',
        productName: 'Product Name',
        category: 'Category',
        location: 'Location',
        expirationDate: 'Expiration Date',
        purchaseDate: 'Purchase Date',
        quantity: 'Quantity',
        notes: 'Notes',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        settings: 'Settings',
        notifications: 'Notifications',
        categories: 'Categories',
        about: 'About',
        total: 'Total',
        safe: 'Safe',
        expiring: 'Expiring',
        expired: 'Expired',
        quickAdd: 'Quick Add',
        statistics: 'Statistics',
        support: 'Support',
        back: 'Back',
        noProducts: 'No products yet',
        addFirst: 'Add your first product',
        recurring: 'Recurring Product',
        repeatEvery: 'Repeat every',
        days: 'days',
        enableNotifications: 'Enable Notifications',
        testNotification: 'Test',
        disable: 'Disable',
        addCategory: 'Add Category',
        categoryName: 'Category name',
        icon: 'Icon',
        color: 'Color',
        language: 'Language',
        allProducts: 'All Products',
        locations: 'Locations',
        search: 'Search...',
        sortBy: 'Sort by',
        date: 'Date',
        name: 'Name',
        status: 'Status',
        productImage: 'Product Image (optional)',
        hasExpirationDate: 'Has expiration date?',
        noExpiration: 'No Expiration Date',
        expiresAfterOpening: 'Expires after opening (PAO)?',
        shelfLifeDays: 'Shelf Life (Days)',
        openedDate: 'Date Opened',
        notOpened: 'Not Opened',
        notifyTiming: 'Notify me (days before)',
    },
    fr: {
        appName: 'ExpireTrack',
        neverWaste: 'Ne gaspillez plus',
        addProduct: 'Ajouter',
        editProduct: 'Modifier',
        productName: 'Nom du produit',
        category: 'Catégorie',
        location: 'Emplacement',
        expirationDate: 'Date d\'expiration',
        purchaseDate: 'Date d\'achat',
        quantity: 'Quantité',
        notes: 'Notes',
        cancel: 'Annuler',
        save: 'Enregistrer',
        delete: 'Supprimer',
        settings: 'Paramètres',
        notifications: 'Notifications',
        categories: 'Catégories',
        about: 'À propos',
        total: 'Total',
        safe: 'OK',
        expiring: 'Bientôt',
        expired: 'Expiré',
        quickAdd: 'Ajout rapide',
        statistics: 'Statistiques',
        support: 'Soutenir',
        back: 'Retour',
        noProducts: 'Aucun produit',
        addFirst: 'Ajoutez votre premier produit',
        recurring: 'Produit récurrent',
        repeatEvery: 'Répéter tous les',
        days: 'jours',
        enableNotifications: 'Activer les notifications',
        testNotification: 'Tester',
        disable: 'Désactiver',
        addCategory: 'Ajouter catégorie',
        categoryName: 'Nom de catégorie',
        icon: 'Icône',
        color: 'Couleur',
        language: 'Langue',
        allProducts: 'Tous les produits',
        locations: 'Emplacements',
        search: 'Rechercher...',
        sortBy: 'Trier par',
        date: 'Date',
        name: 'Nom',
        status: 'Statut',
        productImage: 'Image du produit (optionnel)',
        hasExpirationDate: 'A une date d\'expiration ?',
        noExpiration: 'Pas de date d\'expiration',
        expiresAfterOpening: 'Expire après ouverture (PAO) ?',
        shelfLifeDays: 'Durée de vie (Jours)',
        openedDate: 'Date d\'ouverture',
        notOpened: 'Non ouvert',
        notifyTiming: 'Me notifier (jours avant)',
    },
    ar: {
        appName: 'ExpireTrack',
        neverWaste: 'لا تهدر أبداً',
        addProduct: 'إضافة',
        editProduct: 'تعديل',
        productName: 'اسم المنتج',
        category: 'الفئة',
        location: 'الموقع',
        expirationDate: 'تاريخ الانتهاء',
        purchaseDate: 'تاريخ الشراء',
        quantity: 'الكمية',
        notes: 'ملاحظات',
        cancel: 'إلغاء',
        save: 'حفظ',
        delete: 'حذف',
        settings: 'الإعدادات',
        notifications: 'الإشعارات',
        categories: 'الفئات',
        about: 'حول',
        total: 'المجموع',
        safe: 'آمن',
        expiring: 'قريب',
        expired: 'منتهي',
        quickAdd: 'إضافة سريعة',
        statistics: 'الإحصائيات',
        support: 'الدعم',
        back: 'رجوع',
        noProducts: 'لا توجد منتجات',
        addFirst: 'أضف منتجك الأول',
        recurring: 'منتج متكرر',
        repeatEvery: 'كرر كل',
        days: 'أيام',
        enableNotifications: 'تفعيل الإشعارات',
        testNotification: 'اختبار',
        disable: 'تعطيل',
        addCategory: 'إضافة فئة',
        categoryName: 'اسم الفئة',
        icon: 'أيقونة',
        color: 'لون',
        language: 'اللغة',
        allProducts: 'كل المنتجات',
        locations: 'المواقع',
        search: 'بحث...',
        sortBy: 'ترتيب',
        date: 'التاريخ',
        name: 'الاسم',
        status: 'الحالة',
        productImage: 'صورة المنتج (اختياري)',
        hasExpirationDate: 'هل له تاريخ انتهاء؟',
        noExpiration: 'لا يوجد تاريخ انتهاء',
        expiresAfterOpening: 'ينتهي بعد الفتح (PAO)؟',
        shelfLifeDays: 'فترة الصلاحية (أيام)',
        openedDate: 'تاريخ الفتح',
        notOpened: 'غير مفتوح',
        notifyTiming: 'تنبيه (أيام قبل)',
    },
};

interface I18nContextType {
    t: (key: TranslationKey) => string;
    lang: Language;
    setLang: (lang: Language) => void;
    isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
    const { language, setLanguage } = useSettingsStore();

    const t = (key: TranslationKey): string => {
        return translations[language]?.[key] || translations.en[key] || key;
    };

    const isRTL = language === 'ar';

    return (
        <I18nContext.Provider value={{ t, lang: language, setLang: setLanguage, isRTL }}>
            <div dir={isRTL ? 'rtl' : 'ltr'}>
                {children}
            </div>
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within I18nProvider');
    }
    return context;
}

export const LANGUAGE_OPTIONS = [
    { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
    { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
    { code: 'ar' as Language, name: 'العربية', flag: '🇸🇦' },
];

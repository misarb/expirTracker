'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

export type Language = 'en' | 'fr' | 'ar';


export type TranslationKey =
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
    | 'list'
    | 'status'
    | 'productImage'
    | 'hasExpirationDate'
    | 'noExpiration'
    | 'expiresAfterOpening'
    | 'shelfLifeDays'
    | 'openedDate'
    | 'notOpened'
    | 'notifyTiming'
    | 'manageLocations'
    // Support
    | 'supportTitle'
    | 'supportSubtitle'
    | 'waysToSupport'
    | 'buyMeCoffee'
    | 'crypto'
    | 'donate'
    | 'contributionThanks'
    // New keys
    | 'expiringSoon'
    | 'totalProducts'
    | 'scanBarcode'
    | 'addLocation'
    | 'quickActions'
    | 'searchPlaceholder'
    | 'allCategories'
    | 'allLocations'
    | 'noProductsFound'
    | 'home'
    // Categories
    | 'cat_medicine'
    | 'cat_food'
    | 'cat_makeup'
    | 'cat_baby'
    | 'cat_household'
    | 'cat_other'
    // Locations
    | 'loc_kitchen'
    | 'loc_bathroom'
    | 'loc_medicine_cabinet'
    | 'loc_bedroom'
    | 'loc_garage'
    | 'loc_office'
    // Data Management
    | 'dataManagement'
    | 'exportData'
    | 'importData'
    | 'importWarning'
    | 'exportSuccess'
    | 'importSuccess'
    | 'invalidFile';

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
        list: 'Inventory',
        status: 'Status',
        productImage: 'Product Image (optional)',
        hasExpirationDate: 'Has expiration date?',
        noExpiration: 'No Expiration Date',
        expiresAfterOpening: 'Expires after opening (PAO)?',
        shelfLifeDays: 'Shelf Life (Days)',
        openedDate: 'Date Opened',
        notOpened: 'Not Opened',
        notifyTiming: 'Notify me (days before)',
        manageLocations: 'Manage Locations',
        // Support & Donation
        supportTitle: 'Support ExpireTrack',
        supportSubtitle: 'Help me continue building and improving this app!',
        waysToSupport: 'Ways to Support',
        buyMeCoffee: 'Buy me a coffee',
        crypto: 'Crypto',
        donate: 'Donate',
        contributionThanks: 'Every contribution, no matter how small, means the world to me! 💕',
        // New Keys
        expiringSoon: 'Expiring Soon',
        totalProducts: 'Total Products',
        scanBarcode: 'Scan Barcode',
        addLocation: 'Add Location',
        quickActions: 'Quick Actions',
        searchPlaceholder: 'Search products...',
        allCategories: 'All Categories',
        allLocations: 'All Locations',
        noProductsFound: 'No products found.',
        home: 'Home',

        // Categories
        cat_medicine: 'Medicine',
        cat_food: 'Food',
        cat_makeup: 'Makeup / Skincare',
        cat_baby: 'Baby Products',
        cat_household: 'Household',
        cat_other: 'Other',
        // Locations
        loc_kitchen: 'Kitchen',
        loc_bathroom: 'Bathroom',
        loc_medicine_cabinet: 'Medicine Cabinet',
        loc_bedroom: 'Bedroom',
        loc_garage: 'Garage',
        loc_office: 'Office',
        // Data Management
        dataManagement: 'Data Management',
        exportData: 'Export Data',
        importData: 'Import Data',
        importWarning: 'Warning: Importing data will overwrite all current products, categories, and locations. Are you sure?',
        exportSuccess: 'Data exported successfully!',
        importSuccess: 'Data imported successfully!',
        invalidFile: 'Invalid backup file.',
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
        list: 'Inventaire',
        status: 'Statut',
        productImage: 'Image du produit (optionnel)',
        hasExpirationDate: 'A une date d\'expiration ?',
        noExpiration: 'Pas de date d\'expiration',
        expiresAfterOpening: 'Expire après ouverture (PAO) ?',
        shelfLifeDays: 'Durée de vie (Jours)',
        openedDate: 'Date d\'ouverture',
        notOpened: 'Non ouvert',
        notifyTiming: 'Me notifier (jours avant)',
        manageLocations: 'Gérer les emplacements',
        // Support
        supportTitle: 'Soutenir ExpireTrack',
        supportSubtitle: 'Aidez-moi à continuer à améliorer cette application !',
        waysToSupport: 'Façons de soutenir',
        buyMeCoffee: 'M\'offrir un café',
        crypto: 'Crypto',
        donate: 'Faire un don',
        contributionThanks: 'Chaque contribution, aussi petite soit-elle, signifie beaucoup pour moi ! 💕',
        // New Keys
        expiringSoon: 'Expire Bientôt',
        totalProducts: 'Total Produits',
        scanBarcode: 'Scanner Code-barres',
        addLocation: 'Ajouter Lieu',
        quickActions: 'Actions Rapides',
        searchPlaceholder: 'Rechercher un produit...',
        allCategories: 'Toutes Catégories',
        allLocations: 'Tous Lieux',
        noProductsFound: 'Aucun produit trouvé.',
        home: 'Accueil',

        // Categories
        cat_medicine: 'Médicaments',
        cat_food: 'Nourriture',
        cat_makeup: 'Maquillage / Soins',
        cat_baby: 'Produits bébé',
        cat_household: 'Produits ménagers',
        cat_other: 'Autre',
        // Locations
        loc_kitchen: 'Cuisine',
        loc_bathroom: 'Salle de bain',
        loc_medicine_cabinet: 'Armoire à pharmacie',
        loc_bedroom: 'Chambre',
        loc_garage: 'Garage',
        loc_office: 'Bureau',
        // Data Management
        dataManagement: 'Gestion des données',
        exportData: 'Exporter les données',
        importData: 'Importer les données',
        importWarning: 'Attention : L\'importation de données écrasera tous les produits, catégories et lieux actuels. Êtes-vous sûr ?',
        exportSuccess: 'Données exportées avec succès !',
        importSuccess: 'Données importées avec succès !',
        invalidFile: 'Fichier de sauvegarde invalide.',
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
        list: 'المخزون',
        status: 'الحالة',
        productImage: 'صورة المنتج (اختياري)',
        hasExpirationDate: 'هل له تاريخ انتهاء؟',
        noExpiration: 'لا يوجد تاريخ انتهاء',
        expiresAfterOpening: 'ينتهي بعد الفتح (PAO)؟',
        shelfLifeDays: 'فترة الصلاحية (أيام)',
        openedDate: 'تاريخ الفتح',
        notOpened: 'غير مفتوح',
        notifyTiming: 'تنبيه (أيام قبل)',
        manageLocations: 'إدارة المواقع',
        // Support
        supportTitle: 'دعم ExpireTrack',
        supportSubtitle: 'ساعدني في الاستمرار في تطوير وتحسين هذا التطبيق!',
        waysToSupport: 'طرق الدعم',
        buyMeCoffee: 'اشتري لي قهوة',
        crypto: 'عملات رقمية',
        donate: 'تبرع',
        contributionThanks: 'كل مساهمة، مهما كانت صغيرة، تعني لي الكثير! 💕',
        // New Keys
        expiringSoon: 'ينتهي قريباً',
        totalProducts: 'إجمالي المنتجات',
        scanBarcode: 'مسح الباركود',
        addLocation: 'إضافة موقع',
        quickActions: 'إجراءات سريعة',
        searchPlaceholder: 'بحث عن منتج...',
        allCategories: 'كل الفئات',
        allLocations: 'كل المواقع',
        noProductsFound: 'لا توجد نتائج.',
        home: 'الرئيسية',

        // Categories
        cat_medicine: 'الأدوية',
        cat_food: 'الطعام',
        cat_makeup: 'مكياج / عناية بالبشرة',
        cat_baby: 'منتجات الأطفال',
        cat_household: 'أدوات منزلية',
        cat_other: 'أخرى',
        // Locations
        loc_kitchen: 'المطبخ',
        loc_bathroom: 'الحمام',
        loc_medicine_cabinet: 'خزانة الأدوية',
        loc_bedroom: 'غرفة النوم',
        loc_garage: 'الجراج',
        loc_office: 'المكتب',
        // Data Management
        dataManagement: 'إدارة البيانات',
        exportData: 'تصدير البيانات',
        importData: 'استيراد البيانات',
        importWarning: 'تحذير: استيراد البيانات سيؤدي إلى استبدال جميع المنتجات والفئات والمواقع الحالية. هل أنت متأكد؟',
        exportSuccess: 'تم تصدير البيانات بنجاح!',
        importSuccess: 'تم استيراد البيانات بنجاح!',
        invalidFile: 'ملف نسخ احتياطي غير صالح.',
    }
};

interface I18nContextType {
    t: (key: TranslationKey) => string;
    lang: Language;
    setLang: (lang: Language) => void;
    // Aliases for compatibility
    language: Language;
    setLanguage: (lang: Language) => void;
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
        <I18nContext.Provider value={{
            t,
            lang: language,
            setLang: setLanguage,
            language,  // Alias
            setLanguage, // Alias
            isRTL
        }}>
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

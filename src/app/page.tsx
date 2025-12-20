'use client';

import { useState, useEffect } from 'react';
import { useProductStore } from '@/store/productStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Product, Category, Location } from '@/types';
import { notificationService } from '@/lib/notifications';
import { useI18n, TranslationKey } from '@/lib/i18n';
import { compressImage } from '@/lib/imageUtils';

// Icons as SVG components
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const SunIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const HeartIcon = () => (
  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FolderIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const GridIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PayPalIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19a.803.803 0 0 0-.795.68l-.942 5.984a.642.642 0 0 1-.633.542z" />
  </svg>
);

// Donation platform data
const DONATION_PLATFORMS = [
  {
    name: 'Ko-fi',
    icon: HeartIcon,
    description: 'One-time or monthly support ❤️',
    color: 'from-pink-500 to-rose-500',
    url: 'https://ko-fi.com/misarb',
    placeholder: false,
  },
  {
    name: 'PayPal',
    icon: PayPalIcon,
    description: 'Direct PayPal donation 💰',
    color: 'from-blue-500 to-indigo-600',
    url: 'https://paypal.me/LBoulbalah',
    placeholder: false,
  },
];

// Status Badge Component
function StatusBadge({ status }: { status: Product['status'] }) {
  const config = {
    'safe': { label: 'Safe', emoji: '🟢', className: 'status-safe' },
    'expiring-soon': { label: 'Expiring Soon', emoji: '🟡', className: 'status-expiring' },
    'expired': { label: 'Expired', emoji: '🔴', className: 'status-expired' },
  };

  const { label, emoji, className } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
      <span>{emoji}</span>
      {label}
    </span>
  );
}

// Product Card Component
function ProductCard({ product, category, onEdit, onDelete }: {
  product: Product;
  category: Category | undefined;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();
  const expirationDate = new Date(product.expirationDate);
  const today = new Date();
  const daysUntil = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-[rgb(var(--card))] rounded-2xl overflow-hidden shadow-sm border border-[rgb(var(--border))] hover:shadow-md transition-all duration-300 animate-fade-in group">
      {product.image && (
        <div className="h-32 w-full relative bg-[rgb(var(--muted))]">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-2xl">{category?.icon || '📦'}</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[rgb(var(--secondary))] text-[rgb(var(--muted-foreground))]">
                {category ? (t(`cat_${category.id}` as TranslationKey) !== `cat_${category.id}` ? t(`cat_${category.id}` as TranslationKey) : category.name) : 'Unknown'}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-[rgb(var(--foreground))] truncate mb-1">
              {product.name}
            </h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              {product.hasExpirationDate === false ? (
                <span className="text-green-600 font-medium">✨ {t('noExpiration')}</span>
              ) : product.useShelfLife && !product.openedDate ? (
                <span className="text-blue-600 font-medium">📦 {t('notOpened')} ({product.shelfLifeDays} {t('days')})</span>
              ) : (
                daysUntil < 0
                  ? `${t('expired')} ${Math.abs(daysUntil)} ${t('days')} ago`
                  : daysUntil === 0
                    ? t('expiring')
                    : `${t('expiring')} in ${daysUntil} ${t('days')}`
              )}
            </p>
            {product.hasExpirationDate !== false && (
              <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                {expirationDate.toLocaleDateString()}
              </p>
            )}
            {product.quantity && (
              <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                {t('quantity')}: {product.quantity}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={product.status} />
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={onEdit}
                className="p-2 rounded-lg hover:bg-[rgb(var(--secondary))] text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] transition-colors"
              >
                <EditIcon />
              </button>
              <button
                onClick={onDelete}
                className="p-2 rounded-lg hover:bg-[rgb(var(--destructive)/0.1)] text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--destructive))] transition-colors"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Location Card Component
function LocationCard({
  location,
  productCount,
  expiringCount,
  expiredCount,
  onClick
}: {
  location: Location;
  productCount: number;
  expiringCount: number;
  expiredCount: number;
  onClick: () => void;
}) {
  const { t } = useI18n();
  return (
    <button
      onClick={onClick}
      className="bg-[rgb(var(--card))] rounded-2xl p-6 shadow-sm border border-[rgb(var(--border))] hover:shadow-lg hover:scale-[1.02] transition-all duration-300 text-left w-full group"
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-4xl">{location.icon}</span>
        {(expiringCount > 0 || expiredCount > 0) && (
          <div className="flex gap-1">
            {expiredCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                {expiredCount} 🔴
              </span>
            )}
            {expiringCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
                {expiringCount} 🟡
              </span>
            )}
          </div>
        )}
      </div>
      <h3 className="text-lg font-bold text-[rgb(var(--foreground))] mb-1 group-hover:text-[rgb(var(--primary))] transition-colors">
        {t(`loc_${location.id}` as TranslationKey) !== `loc_${location.id}` ? t(`loc_${location.id}` as TranslationKey) : location.name}
      </h3>
      <p className="text-sm text-[rgb(var(--muted-foreground))] mb-2">
        {location.description}
      </p>
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-[rgb(var(--foreground))]">{productCount}</span>
        <span className="text-[rgb(var(--muted-foreground))]">
          {productCount === 1 ? 'product' : 'products'}
        </span>
      </div>
    </button>
  );
}

// Add/Edit Product Modal
function ProductModal({
  isOpen,
  onClose,
  editingProduct,
  categories,
  locations,
  defaultLocationId
}: {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: Product | null;
  categories: Category[];
  locations: Location[];
  defaultLocationId?: string;
}) {
  const { t } = useI18n();
  const { addProduct, updateProduct } = useProductStore();
  const [formData, setFormData] = useState({
    name: '',
    categoryId: categories[0]?.id || '',
    locationId: defaultLocationId || locations[0]?.id || '',
    expirationDate: '',
    purchaseDate: '',
    quantity: '',
    notes: '',
    isRecurring: false,
    recurringDays: 7,
    image: '',
    hasExpirationDate: true,
    useShelfLife: false,
    shelfLifeDays: '',
    openedDate: '',
    notifyTiming: '',
  });

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        categoryId: editingProduct.categoryId,
        locationId: editingProduct.locationId,
        expirationDate: editingProduct.expirationDate,
        purchaseDate: editingProduct.purchaseDate || '',
        quantity: editingProduct.quantity?.toString() || '',
        notes: editingProduct.notes || '',
        isRecurring: editingProduct.isRecurring || false,
        recurringDays: editingProduct.recurringDays || 7,
        image: editingProduct.image || '',
        hasExpirationDate: editingProduct.hasExpirationDate !== false, // Default true
        useShelfLife: editingProduct.useShelfLife || false,
        shelfLifeDays: editingProduct.shelfLifeDays?.toString() || '',
        openedDate: editingProduct.openedDate || '',
        notifyTiming: editingProduct.notifyTiming?.toString() || '',
      });
    } else {
      setFormData({
        name: '',
        categoryId: categories[0]?.id || '',
        locationId: defaultLocationId || locations[0]?.id || '',
        expirationDate: '',
        purchaseDate: '',
        quantity: '',
        notes: '',
        isRecurring: false,
        recurringDays: 7,
        image: '',
        hasExpirationDate: true,
        useShelfLife: false,
        shelfLifeDays: '',
        openedDate: '',
        notifyTiming: '',
      });
    }
  }, [editingProduct, categories, locations, isOpen, defaultLocationId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Compress image before saving
        const compressedImage = await compressImage(file);
        setFormData(prev => ({ ...prev, image: compressedImage }));
      } catch (error) {
        console.error("Error compressing image:", error);
        alert("Failed to process image. Please try another one.");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Determine effective expiration date
    let expirationDate = formData.expirationDate;

    // If using Shelf Life (PAO), calculate expiration if opened
    if (formData.hasExpirationDate && formData.useShelfLife && formData.openedDate && formData.shelfLifeDays) {
      const opened = new Date(formData.openedDate);
      const days = parseInt(formData.shelfLifeDays);
      if (!isNaN(days)) {
        const exp = new Date(opened);
        exp.setDate(exp.getDate() + days);
        expirationDate = exp.toISOString().split('T')[0];
      }
    }
    // If No Expiration, set a far future date or handle in logic? 
    // We'll set a placeholder far future date for sorting, but 'hasExpirationDate: false' flag is key.
    if (!formData.hasExpirationDate) {
      expirationDate = '2099-12-31';
    }

    const productData = {
      name: formData.name,
      categoryId: formData.categoryId,
      locationId: formData.locationId,
      expirationDate: expirationDate,
      purchaseDate: formData.purchaseDate || undefined,
      quantity: formData.quantity ? parseInt(formData.quantity) : undefined,
      notes: formData.notes || undefined,
      isRecurring: formData.isRecurring,
      recurringDays: formData.isRecurring ? formData.recurringDays : undefined,
      image: formData.image || undefined,
      hasExpirationDate: formData.hasExpirationDate,
      useShelfLife: formData.useShelfLife,
      shelfLifeDays: formData.shelfLifeDays ? parseInt(formData.shelfLifeDays) : undefined,
      openedDate: formData.openedDate || undefined,
      notifyTiming: formData.notifyTiming ? parseInt(formData.notifyTiming) : undefined,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
    } else {
      addProduct(productData);
    }

    onClose();
  };

  const handleIncrement = () => {
    const current = parseInt(formData.quantity) || 0;
    setFormData({ ...formData, quantity: (current + 1).toString() });
  };

  const handleDecrement = () => {
    const current = parseInt(formData.quantity) || 0;
    if (current > 1) {
      setFormData({ ...formData, quantity: (current - 1).toString() });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[rgb(var(--card))] rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Header with Close Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[rgb(var(--foreground))]">
            {editingProduct ? `✏️ ${t('editProduct')}` : `➕ ${t('addProduct')}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[rgb(var(--secondary))] transition-colors text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-semibold text-[rgb(var(--foreground))] mb-2">
              {t('productName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--background))] text-[rgb(var(--foreground))] focus:ring-2 focus:ring-[rgb(var(--primary))] focus:border-transparent outline-none transition-all text-base"
              placeholder="e.g., Milk, Aspirin"
            />
          </div>

          {/* Product Image */}
          <div>
            <label className="block text-sm font-semibold text-[rgb(var(--foreground))] mb-2">
              {t('productImage')}
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[rgb(var(--secondary))] text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))] cursor-pointer transition-colors w-full justify-center sm:w-auto font-medium">
                <span className="text-xl">📷</span>
                <span>{t('productImage')}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              {formData.image && (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-[rgb(var(--border))] shrink-0 bg-gray-100">
                  <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: '' })}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Expiration Configuration */}
          <div className="p-5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--secondary))/30] space-y-5">

            {/* Has Expiration Checkbox */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hasExp"
                checked={formData.hasExpirationDate}
                onChange={(e) => setFormData({ ...formData, hasExpirationDate: e.target.checked })}
                className="w-5 h-5 rounded border-[rgb(var(--border))] text-[rgb(var(--primary))] focus:ring-[rgb(var(--primary))]"
              />
              <label htmlFor="hasExp" className="font-semibold text-[rgb(var(--foreground))] cursor-pointer select-none">
                {t('hasExpirationDate')}
              </label>
            </div>

            {formData.hasExpirationDate && (
              <div className="space-y-4 animate-fade-in pt-2">
                {/* PAO Checkbox */}
                <div className="flex items-center gap-3 pl-8">
                  <input
                    type="checkbox"
                    id="usePAO"
                    checked={formData.useShelfLife}
                    onChange={(e) => setFormData({ ...formData, useShelfLife: e.target.checked })}
                    className="w-5 h-5 rounded border-[rgb(var(--border))] text-[rgb(var(--primary))] focus:ring-[rgb(var(--primary))]"
                  />
                  <label htmlFor="usePAO" className="text-sm font-medium text-[rgb(var(--foreground))] cursor-pointer select-none">
                    {t('expiresAfterOpening')}
                  </label>
                </div>

                {formData.useShelfLife ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">{t('shelfLifeDays')}</label>
                      <input type="number" required={formData.useShelfLife} value={formData.shelfLifeDays} onChange={e => setFormData({ ...formData, shelfLifeDays: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]" placeholder="e.g. 12" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">{t('openedDate')}</label>
                      <input type="date" value={formData.openedDate} onChange={e => setFormData({ ...formData, openedDate: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]" />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold mb-1">{t('expirationDate')} <span className="text-red-500">*</span></label>
                    <input type="date" required value={formData.expirationDate} onChange={e => setFormData({ ...formData, expirationDate: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]" />
                  </div>
                )}

                {/* Notification Timing */}
                <div>
                  <label className="block text-sm font-semibold mb-1">{t('notifyTiming')}</label>
                  <input type="number" min="0" value={formData.notifyTiming} onChange={e => setFormData({ ...formData, notifyTiming: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]" placeholder="Default: 7" />
                </div>
              </div>
            )}
          </div>

          {/* Category & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[rgb(var(--foreground))] mb-2">
                {t('category')} <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--background))] text-[rgb(var(--foreground))] focus:ring-2 focus:ring-[rgb(var(--primary))] focus:border-transparent outline-none transition-all text-base appearance-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {t(`cat_${cat.id}` as TranslationKey) !== `cat_${cat.id}` ? t(`cat_${cat.id}` as TranslationKey) : cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[rgb(var(--foreground))] mb-2">
                {t('location')} <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--background))] text-[rgb(var(--foreground))] focus:ring-2 focus:ring-[rgb(var(--primary))] focus:border-transparent outline-none transition-all text-base appearance-none cursor-pointer"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {t(`loc_${loc.id}` as TranslationKey) !== `loc_${loc.id}` ? t(`loc_${loc.id}` as TranslationKey) : loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
            {/* Quantity Stepper */}
            <div>
              <label className="block text-sm font-semibold text-[rgb(var(--foreground))] mb-2">
                {t('quantity')}
              </label>
              <div className="flex items-center shadow-sm rounded-xl overflow-hidden border border-[rgb(var(--border))] h-[50px]">
                <button
                  type="button"
                  onClick={handleDecrement}
                  className="w-14 h-full bg-[rgb(var(--secondary))] hover:bg-[rgb(var(--muted))] active:bg-[rgb(var(--border))] transition-colors flex items-center justify-center text-xl font-bold text-[rgb(var(--foreground))]"
                >
                  −
                </button>
                <div className="flex-1 h-full bg-[rgb(var(--background))] flex items-center justify-center border-x border-[rgb(var(--border))]">
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full h-full bg-transparent text-center font-bold text-lg outline-none appearance-none px-2"
                    placeholder="1"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="w-14 h-full bg-[rgb(var(--secondary))] hover:bg-[rgb(var(--muted))] active:bg-[rgb(var(--border))] transition-colors flex items-center justify-center text-xl font-bold text-[rgb(var(--foreground))]"
                >
                  +
                </button>
              </div>
            </div>

            {/* Purchase Date */}
            <div>
              <label className="block text-sm font-semibold text-[rgb(var(--foreground))] mb-2">
                {t('purchaseDate')}
              </label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--background))] text-[rgb(var(--foreground))] focus:ring-2 focus:ring-[rgb(var(--primary))] focus:border-transparent outline-none transition-all text-base h-[50px]"
              />
            </div>
          </div>

          {/* Recurring Option */}
          <div className="p-4 rounded-xl border border-[rgb(var(--border))] space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="recurring"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="w-5 h-5 rounded border-[rgb(var(--border))] text-[rgb(var(--primary))] focus:ring-[rgb(var(--primary))]"
              />
              <label htmlFor="recurring" className="font-semibold text-[rgb(var(--foreground))] cursor-pointer select-none">
                {t('recurring')}
              </label>
            </div>

            {formData.isRecurring && (
              <div className="pl-8 animate-fade-in">
                <label className="block text-sm font-medium mb-1 text-[rgb(var(--muted-foreground))]">{t('repeatEvery')} ({t('days')})</label>
                <input
                  type="number"
                  min="1"
                  value={formData.recurringDays}
                  onChange={(e) => setFormData({ ...formData, recurringDays: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]"
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-[rgb(var(--foreground))] mb-2">
              {t('notes')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--background))] text-[rgb(var(--foreground))] focus:ring-2 focus:ring-[rgb(var(--primary))] focus:border-transparent outline-none transition-all resize-none text-base"
              rows={2}
              placeholder="..."
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3.5 rounded-xl border border-[rgb(var(--border))] text-[rgb(var(--foreground))] hover:bg-[rgb(var(--secondary))] transition-colors font-bold text-base"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3.5 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] hover:opacity-90 transition-opacity font-bold text-base shadow-lg shadow-[rgb(var(--primary))/25]"
            >
              {editingProduct ? t('save') : t('addProduct')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Location Modal
function AddLocationModal({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { addLocation } = useProductStore();
  const [formData, setFormData] = useState({
    name: '',
    icon: '📍',
    color: '#6366F1',
    description: '',
  });

  const emojiOptions = [
    // Rooms & Spaces
    '🏠', '🍳', '🚿', '💊', '🛏️', '🏢', '🚗', '🏡', '🛋️', '🪴',
    // Storage & Organization
    '📦', '🗄️', '📍', '🧊', '❄️', '🗃️', '📚', '🧰', '🎒', '👜',
    // Food & Kitchen Related
    '🍽️', '🥘', '☕', '🍞', '🧊', '🥗', '🍱', '🧃',
    // General Useful
    '⭐', '🔵', '🟢', '🟡', '🟣', '🟠', '⚫', '⚪'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addLocation(formData);
    setFormData({ name: '', icon: '📍', color: '#6366F1', description: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[rgb(var(--card))] rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in">
        {/* Header with Close Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[rgb(var(--foreground))]">
            Add New Location
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[rgb(var(--secondary))] transition-colors text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">
              Location Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--background))] text-[rgb(var(--foreground))] focus:ring-2 focus:ring-[rgb(var(--primary))] focus:border-transparent outline-none transition-all"
              placeholder="e.g., Pantry, Freezer, Closet"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">
              Icon
            </label>
            <div className="max-h-32 overflow-y-auto border border-[rgb(var(--border))] rounded-xl p-2">
              <div className="grid grid-cols-6 gap-2">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: emoji })}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${formData.icon === emoji
                      ? 'bg-[rgb(var(--primary))] ring-2 ring-[rgb(var(--primary))] ring-offset-2 scale-110'
                      : 'bg-[rgb(var(--secondary))] hover:bg-[rgb(var(--muted))] hover:scale-105'
                      }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--background))] text-[rgb(var(--foreground))] focus:ring-2 focus:ring-[rgb(var(--primary))] focus:border-transparent outline-none transition-all"
              placeholder="What's stored here?"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[rgb(var(--border))] text-[rgb(var(--foreground))] hover:bg-[rgb(var(--secondary))] transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] hover:opacity-90 transition-opacity font-medium"
            >
              Add Location
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Settings Modal with Notifications
function SettingsModal({
  isOpen,
  onClose,
  inline = false
}: {
  isOpen: boolean;
  onClose: () => void;
  inline?: boolean;
}) {
  const { t } = useI18n();
  const { notifications, setNotificationsEnabled, setNotificationDays, importSettings, ...settingsState } = useSettingsStore();
  const { locations, deleteLocation, products, categories, importData } = useProductStore();
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && notificationService.isSupported()) {
      setPermissionStatus(notificationService.getPermission());
    }
  }, [isOpen]);

  const handleEnableNotifications = async () => {
    const permission = await notificationService.requestPermission();
    setPermissionStatus(permission);
    if (permission === 'granted') {
      setNotificationsEnabled(true);
    }
  };

  const handleDisableNotifications = () => {
    setNotificationsEnabled(false);
  };

  if (!isOpen) return null;

  const content = (
    <div className={`space-y-8 ${inline ? '' : 'p-6'}`}>
      {!inline && (
        <h2 className="text-xl font-bold text-[rgb(var(--foreground))] mb-6 flex items-center gap-2">
          <SettingsIcon />
          {t('settings')}
        </h2>
      )}

      {/* Notifications Section */}
      <div>
        <h3 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-3 flex items-center gap-2">
          <BellIcon />
          {t('notifications')}
        </h3>

        {!notificationService.isSupported() ? (
          <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl text-yellow-800 dark:text-yellow-200 text-sm">
            ⚠️ Your browser doesn&apos;t support notifications.
          </div>
        ) : permissionStatus === 'denied' ? (
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-800 dark:text-red-200 text-sm">
            ❌ Notifications are blocked.
          </div>
        ) : permissionStatus === 'granted' && notifications.enabled ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-800 dark:text-green-200 text-sm flex items-center gap-2">
              ✅ Notifications are enabled!
            </div>
            {/* Days before setting */}
            <div className="pl-2">
              <label className="text-sm font-medium text-[rgb(var(--muted-foreground))] mb-2 block">
                Notify me before expiration (days):
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 5, 7].map(days => (
                  <button
                    key={days}
                    onClick={() => {
                      const current = notifications.daysBefore;
                      const newDays = current.includes(days)
                        ? current.filter(d => d !== days)
                        : [...current, days];
                      setNotificationDays(newDays);
                    }}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${notifications.daysBefore.includes(days)
                      ? 'bg-[rgb(var(--primary))] text-white shadow'
                      : 'bg-[rgb(var(--secondary))] text-[rgb(var(--foreground))]'
                      }`}
                  >
                    {days}d
                  </button>
                ))}
              </div>
            </div>

            <div>
              <button
                onClick={handleDisableNotifications}
                className="w-full px-4 py-2.5 rounded-xl border border-[rgb(var(--border))] text-[rgb(var(--foreground))] hover:bg-[rgb(var(--secondary))] transition-colors font-medium"
              >
                {t('disable')}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              Enable notifications to get reminders.
            </p>

            <button
              onClick={handleEnableNotifications}
              className="w-full px-4 py-3 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] hover:opacity-90 transition-opacity font-medium flex items-center justify-center gap-2"
            >
              <BellIcon />
              {t('enableNotifications')}
            </button>
          </div>
        )}
      </div>

      {/* Manage Locations */}
      <div>
        <h3 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-3 flex items-center gap-2">
          <span className="text-xl">📍</span>
          {t('manageLocations')}
        </h3>
        <div className="space-y-2">
          {locations.map(loc => (
            <div key={loc.id} className="flex items-center justify-between p-3 bg-[rgb(var(--secondary))] rounded-xl border border-[rgb(var(--border))]">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl">{loc.icon}</span>
                <h3 className="font-medium text-[rgb(var(--foreground))]">
                  {t(`loc_${loc.id}` as TranslationKey) !== `loc_${loc.id}` ? t(`loc_${loc.id}` as TranslationKey) : loc.name}
                </h3>
              </div>
              {locations.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Delete button clicked for:', loc.name, loc.id);
                    setLocationToDelete(loc.id);
                  }}
                  className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  title={t('delete')}
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          ))}
          {locations.length <= 1 && (
            <p className="text-xs text-[rgb(var(--muted-foreground))] italic px-1">Cannot delete the last location.</p>
          )}
        </div>
      </div>

      {/* Data Management */}
      <div>
        <h3 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-3 flex items-center gap-2">
          <span className="text-xl">💾</span>
          {t('dataManagement')}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              const data = {
                products,
                categories,
                locations,
                settings: { notifications, ...settingsState }
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `expiretrack-backup-${new Date().toISOString().split('T')[0]}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              alert(t('exportSuccess'));
            }}
            className="p-3 bg-[rgb(var(--secondary))] hover:bg-[rgb(var(--muted))] rounded-xl border border-[rgb(var(--border))] flex flex-col items-center gap-2 transition-colors"
          >
            <span className="text-2xl">⬇️</span>
            <span className="font-medium text-sm text-[rgb(var(--foreground))]">{t('exportData')}</span>
          </button>
          <label className="p-3 bg-[rgb(var(--secondary))] hover:bg-[rgb(var(--muted))] rounded-xl border border-[rgb(var(--border))] flex flex-col items-center gap-2 transition-colors cursor-pointer">
            <span className="text-2xl">⬆️</span>
            <span className="font-medium text-sm text-[rgb(var(--foreground))]">{t('importData')}</span>
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (!confirm(t('importWarning'))) {
                  e.target.value = '';
                  return;
                }
                const reader = new FileReader();
                reader.onload = (event) => {
                  try {
                    const data = JSON.parse(event.target?.result as string);
                    if (data.products && data.categories && data.locations) {
                      importData(data);
                      if (data.settings) importSettings(data.settings);
                      alert(t('importSuccess'));
                      if (onClose) onClose();
                    } else {
                      alert(t('invalidFile'));
                    }
                  } catch {
                    alert(t('invalidFile'));
                  }
                };
                reader.readAsText(file);
                e.target.value = '';
              }}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Support & Donation Section */}
      <div className="bg-[rgb(var(--card))] rounded-2xl p-5 shadow-sm border border-[rgb(var(--border))] mt-6">
        <h3 className="text-sm font-semibold text-[rgb(var(--muted-foreground))] uppercase tracking-wider mb-4 flex items-center gap-2">
          ❤️ {t('supportTitle')}
        </h3>
        <div className="space-y-3">
          <p className="text-sm text-[rgb(var(--foreground))] mb-2">
            {t('supportSubtitle')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {DONATION_PLATFORMS.map((platform) => (
              <a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-[rgb(var(--secondary))] hover:bg-[rgb(var(--muted))] transition-colors gap-2 text-center"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br ${platform.color} text-white`}>
                  <platform.icon />
                </div>
                <span className="text-xs font-semibold text-[rgb(var(--foreground))]">{platform.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="pt-4 border-t border-[rgb(var(--border))] mt-6">
        <h3 className="text-sm font-medium text-[rgb(var(--muted-foreground))] mb-2">{t('about')}</h3>
        <p className="text-xs text-[rgb(var(--muted-foreground))]">
          ExpireTrack v1.1.0 • {t('neverWaste')}
        </p>
      </div>

      {!inline && (
        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2.5 rounded-xl border border-[rgb(var(--border))] text-[rgb(var(--foreground))] hover:bg-[rgb(var(--secondary))] transition-colors font-medium"
        >
          {t('back')}
        </button>
      )}

      {/* Custom Delete Confirmation Modal */}
      {locationToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setLocationToDelete(null)} />
          <div className="relative bg-[rgb(var(--card))] rounded-2xl shadow-xl w-full max-w-sm p-6 animate-fade-in border border-[rgb(var(--border))]">
            <h3 className="text-lg font-bold text-[rgb(var(--foreground))] mb-3">
              {t('delete')} {locations.find(l => l.id === locationToDelete)?.name}?
            </h3>
            <p className="text-sm text-[rgb(var(--muted-foreground))] mb-6">
              This action cannot be undone. Products in this location will be moved to another location.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setLocationToDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[rgb(var(--secondary))] hover:bg-[rgb(var(--muted))] text-[rgb(var(--foreground))] font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log('User confirmed deletion via custom modal');
                  deleteLocation(locationToDelete);
                  setLocationToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (inline) return content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[rgb(var(--card))] rounded-2xl shadow-xl w-full max-w-md animate-fade-in max-h-[90vh] overflow-y-auto">
        {content}
      </div>
    </div>
  );
}

// Stats Card Component - Interactive
function StatsCard({ title, count, icon, color, onClick, gradientFrom, gradientTo }: {
  title: string;
  count: number;
  icon: string;
  color: string;
  onClick?: () => void;
  gradientFrom?: string;
  gradientTo?: string;
}) {
  const hasGradient = gradientFrom && gradientTo;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full text-left rounded-2xl p-4 shadow-sm border border-[rgb(var(--border))] cursor-pointer hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200 hover:border-[rgb(var(--primary))]/30 ${hasGradient ? 'relative overflow-hidden' : 'bg-[rgb(var(--card))]'
          }`}
        style={hasGradient ? {
          background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`
        } : undefined}
      >
        {hasGradient && <div className="absolute inset-0 bg-white/10 dark:bg-black/10" />}
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className={`text-xs font-medium mb-1 ${hasGradient ? 'text-white/90' : 'text-[rgb(var(--muted-foreground))]'}`}>{title}</p>
            <p className="text-2xl font-bold mt-0.5" style={{ color: hasGradient ? 'white' : color }}>{count}</p>
          </div>
          <span className="text-2xl">{icon}</span>
        </div>
      </button>
    );
  }

  return (
    <div className="bg-[rgb(var(--card))] rounded-2xl p-4 shadow-sm border border-[rgb(var(--border))]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[rgb(var(--muted-foreground))]">{title}</p>
          <p className="text-2xl font-bold mt-0.5" style={{ color }}>{count}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}


export default function Home() {
  const { t, language, setLanguage } = useI18n();
  const { products, categories, locations, deleteProduct } = useProductStore();
  const { theme, setTheme, notifications } = useSettingsStore();

  const [currentView, setCurrentView] = useState<'home' | 'inventory' | 'settings' | 'support'>('home');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'expiring-soon' | 'expired' | 'safe'>('all');
  const [inventoryViewMode, setInventoryViewMode] = useState<'grid' | 'list'>('grid');
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [sortBy] = useState<'date' | 'name' | 'status'>('date');

  // Hydration check and splash screen
  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Hide splash screen after 2 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Notifications
  useEffect(() => {
    if (mounted && notifications.enabled) {
      const checkNotifications = async () => {
        const expiringItems = products.filter(p => p.status === 'expiring-soon');
        if (expiringItems.length > 0 && notificationService.isSupported() && notificationService.getPermission() === 'granted') {
          notificationService.sendNotification({
            title: t('expiringSoon'),
            body: `${expiringItems.length} products expiring soon`
          });
        }
      };
      // Check once on mount/change, practically we might want a timer or logic to not spam
      // For now, simple check
      checkNotifications();
    }
  }, [mounted, products, notifications]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--background))]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(var(--primary))]"></div>
      </div>
    );
  }

  // Splash Screen
  if (showSplash) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-700 text-white">
        {/* Logo */}
        <div className="animate-bounce mb-6">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center shadow-2xl border border-white/30">
            <span className="text-5xl">📦</span>
          </div>
        </div>

        {/* App Name */}
        <h1 className="text-4xl font-bold tracking-tight mb-2 animate-fade-in">
          ExpireTrack
        </h1>

        {/* Tagline */}
        <p className="text-white/80 text-lg mb-8 animate-fade-in">
          Never waste again
        </p>

        {/* Loading dots */}
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
  }

  // Filter Logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesLocation = selectedLocation === 'all' || p.locationId === selectedLocation;
    const matchesStatus = selectedStatus === 'all' ||
      (selectedStatus === 'expiring-soon' && p.status === 'expiring-soon') ||
      (selectedStatus === 'expired' && p.status === 'expired') ||
      (selectedStatus === 'safe' && p.status === 'safe');
    return matchesSearch && matchesCategory && matchesLocation && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'status') return a.status.localeCompare(b.status);
    return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
  });

  // Stats Logic
  const totalProducts = products.length;
  const expiredProducts = products.filter(p => p.status === 'expired').length;
  const expiringSoonProducts = products.filter(p => p.status === 'expiring-soon').length;
  const safeProducts = products.filter(p => p.status === 'safe').length;

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="space-y-6 pb-24 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">ExpireTrack</h1>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">{new Date().toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full bg-[rgb(var(--secondary))] text-[rgb(var(--foreground))]">
                  {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                </button>
                <button onClick={() => setLanguage(language === 'en' ? 'fr' : language === 'fr' ? 'ar' : 'en')} className="px-3 py-1 rounded-full bg-[rgb(var(--secondary))] text-[rgb(var(--foreground))] text-sm font-bold uppercase">
                  {language}
                </button>
              </div>
            </div>

            {/* Stats Grid - Interactive */}
            <div className="grid grid-cols-2 gap-4">
              <StatsCard
                title={t('totalProducts')}
                count={totalProducts}
                icon="📦"
                color="#3b82f6"
                gradientFrom="#3b82f6"
                gradientTo="#1d4ed8"
                onClick={() => {
                  setCurrentView('inventory');
                  setInventoryViewMode('list');
                  setActiveLocationId(null);
                  setSelectedLocation('all');
                  setSelectedStatus('all');
                }}
              />
              <StatsCard
                title={t('expired')}
                count={expiredProducts}
                icon="🔴"
                color="#ef4444"
                gradientFrom="#ef4444"
                gradientTo="#dc2626"
                onClick={() => {
                  setCurrentView('inventory');
                  setInventoryViewMode('list');
                  setActiveLocationId(null);
                  setSelectedLocation('all');
                  setSelectedStatus('expired');
                }}
              />
              <StatsCard
                title={t('expiringSoon')}
                count={expiringSoonProducts}
                icon="🟡"
                color="#f59e0b"
                gradientFrom="#f59e0b"
                gradientTo="#d97706"
                onClick={() => {
                  setCurrentView('inventory');
                  setInventoryViewMode('list');
                  setActiveLocationId(null);
                  setSelectedLocation('all');
                  setSelectedStatus('expiring-soon');
                }}
              />
              <StatsCard
                title={t('safe')}
                count={safeProducts}
                icon="🟢"
                color="#22c55e"
                gradientFrom="#22c55e"
                gradientTo="#16a34a"
                onClick={() => {
                  setCurrentView('inventory');
                  setInventoryViewMode('list');
                  setActiveLocationId(null);
                  setSelectedLocation('all');
                  setSelectedStatus('safe');
                }}
              />
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-lg font-bold mb-3 text-[rgb(var(--foreground))]">{t('quickActions')}</h2>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                <button onClick={() => { setIsProductModalOpen(true); setEditingProduct(null); }} className="flex flex-col items-center gap-2 p-4 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl min-w-[100px] hover:bg-[rgb(var(--secondary))] transition-colors">
                  <div className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 p-3 rounded-xl"><PlusIcon /></div>
                  <span className="text-xs font-medium">{t('addProduct')}</span>
                </button>
                <button onClick={() => setIsLocationModalOpen(true)} className="flex flex-col items-center gap-2 p-4 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl min-w-[100px] hover:bg-[rgb(var(--secondary))] transition-colors">
                  <div className="bg-purple-100 text-purple-600 dark:bg-purple-900/30 p-3 rounded-xl"><span className="text-lg">📍</span></div>
                  <span className="text-xs font-medium">{t('addLocation')}</span>
                </button>

              </div>
            </div>

            {/* Recent Activity / Expiring Soon List */}
            {expiringSoonProducts > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-3 text-[rgb(var(--foreground))]">{t('expiringSoon')}</h2>
                <div className="space-y-3">
                  {products.filter(p => p.status === 'expiring-soon').slice(0, 3).map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      category={categories.find(c => c.id === product.categoryId)}
                      onEdit={() => { setEditingProduct(product); setIsProductModalOpen(true); }}
                      onDelete={() => deleteProduct(product.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'inventory':
        return (
          <div className="space-y-4 pb-24 animate-fade-in">
            {/* Navigation / Header for Inventory */}
            <div className="sticky top-0 z-10 bg-[rgb(var(--background))/80] backdrop-blur-md pb-2 pt-2 transition-all flex items-center justify-between">
              {inventoryViewMode === 'list' && activeLocationId ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setInventoryViewMode('grid');
                      setActiveLocationId(null);
                      setSelectedLocation('all'); // Reset filter
                      setSelectedStatus('all'); // Also reset status filter
                    }}
                    className="p-2 rounded-xl bg-[rgb(var(--secondary))] text-[rgb(var(--foreground))]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div>
                    <h2 className="text-lg font-bold">
                      {locations.find(l => l.id === activeLocationId)?.name}
                    </h2>
                    <p className="text-xs text-[rgb(var(--muted-foreground))]">{products.filter(p => p.locationId === activeLocationId).length} items</p>
                  </div>
                </div>
              ) : inventoryViewMode === 'list' ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setInventoryViewMode('grid');
                      setActiveLocationId(null);
                      setSelectedLocation('all');
                      setSelectedStatus('all');
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgb(var(--secondary))] hover:bg-[rgb(var(--muted))] text-[rgb(var(--foreground))] font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back
                  </button>
                  <div>
                    <h2 className="text-lg font-bold">
                      {selectedStatus === 'expired' ? '🔴 Expired' :
                        selectedStatus === 'expiring-soon' ? '🟡 Expiring Soon' :
                          selectedStatus === 'safe' ? '🟢 Safe' :
                            '📦 ' + t('allProducts')}
                    </h2>
                    <p className="text-xs text-[rgb(var(--muted-foreground))]">{filteredProducts.length} items</p>
                  </div>
                </div>
              ) : (
                <h2 className="text-xl font-bold px-1">{t('locations')}</h2>
              )}

              {/* Search Bar - Only show in list mode or maybe always? keeping simple for now */}
              {inventoryViewMode === 'list' && (
                <div className="relative flex-1 ml-4">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted-foreground))]">
                    <SearchIcon />
                  </div>
                  <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-[rgb(var(--secondary))] border-none text-[rgb(var(--foreground))] focus:ring-2 focus:ring-[rgb(var(--primary))] outline-none placeholder-[rgb(var(--muted-foreground))]"
                  />
                </div>
              )}
            </div>

            {/* Content Switcher */}
            {inventoryViewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* All Products Card */}
                <button
                  onClick={() => {
                    setInventoryViewMode('list');
                    setActiveLocationId(null); // Null means ALL
                    setSelectedLocation('all');
                    setSelectedStatus('all'); // Reset status filter too
                  }}
                  className="bg-[rgb(var(--card))] rounded-2xl p-6 shadow-sm border border-[rgb(var(--border))] hover:shadow-lg hover:scale-[1.02] transition-all duration-300 text-left w-full group relative overflow-hidden"
                >
                  <div className="absolute right-0 top-0 opacity-10 blur-xl w-32 h-32 bg-blue-500 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <span className="text-4xl">🏢</span>
                    <div className="flex gap-1">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[rgb(var(--secondary))] text-[rgb(var(--foreground))]">
                        {products.length}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-[rgb(var(--foreground))] mb-1 group-hover:text-[rgb(var(--primary))] transition-colors relative z-10">
                    {t('allProducts')}
                  </h3>
                  <p className="text-sm text-[rgb(var(--muted-foreground))] mb-2 relative z-10">View Global Inventory</p>
                </button>

                {locations.map(loc => {
                  const locProducts = products.filter(p => p.locationId === loc.id);
                  const expiring = locProducts.filter(p => p.status === 'expiring-soon').length;
                  const expired = locProducts.filter(p => p.status === 'expired').length;

                  return (
                    <LocationCard
                      key={loc.id}
                      location={loc}
                      productCount={locProducts.length}
                      expiringCount={expiring}
                      expiredCount={expired}
                      onClick={() => {
                        setInventoryViewMode('list');
                        setActiveLocationId(loc.id);
                        setSelectedLocation(loc.id); // Set the filter for list
                      }}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {/* List View */}
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-20 opacity-50">
                    <p className="text-4xl mb-4">🔍</p>
                    <p>{t('noProductsFound')}</p>
                    <button onClick={() => { setIsProductModalOpen(true); setEditingProduct(null); }} className="mt-4 text-[rgb(var(--primary))] font-medium">{t('addProduct')}</button>
                  </div>
                ) : (
                  filteredProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      category={categories.find(c => c.id === product.categoryId)}
                      onEdit={() => { setEditingProduct(product); setIsProductModalOpen(true); }}
                      onDelete={() => deleteProduct(product.id)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        );

      case 'support':
        return (
          <div className="space-y-6 pb-24 animate-fade-in">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white mb-6 shadow-lg shadow-pink-500/30">
                <HeartIcon />
              </div>
              <h1 className="text-3xl font-bold text-[rgb(var(--foreground))] mb-3">
                {t('supportTitle')}
              </h1>
              <p className="text-lg text-[rgb(var(--muted-foreground))] max-w-sm mx-auto">
                {t('supportSubtitle')}
              </p>
            </div>

            {/* Story Section */}
            <div className="bg-[rgb(var(--card))] rounded-2xl p-6 shadow-sm border border-[rgb(var(--border))]">
              <h2 className="text-xl font-bold text-[rgb(var(--foreground))] mb-3">
                👋 Hi, I&apos;m the creator!
              </h2>
              <div className="space-y-3 text-sm text-[rgb(var(--muted-foreground))] text-left">
                <p>
                  I built ExpireTrack to solve a common problem: <strong className="text-[rgb(var(--foreground))]">wasted products</strong>.
                </p>
                <p>
                  My goal is to make this the <strong className="text-[rgb(var(--foreground))]">simplest</strong> way to track everything in your home.
                  I&apos;m working on features like:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>📱 Mobile app (iOS/Android)</li>
                  <li>📷 Barcode scanning</li>
                  <li>👨‍👩‍👧‍👦 Family sharing</li>
                </ul>
                <p className="pt-2">
                  Your support helps me keep the app <strong className="text-[rgb(var(--foreground))]">free</strong> and developing new features!
                </p>
              </div>
            </div>

            {/* Donation Platforms */}
            <h2 className="text-xl font-bold text-[rgb(var(--foreground))] mb-4 text-center">
              {t('waysToSupport')}
            </h2>

            <div className="grid gap-4">
              {DONATION_PLATFORMS.map((platform) => (
                <a
                  key={platform.name}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative overflow-hidden rounded-2xl p-6 text-white transition-all hover:scale-[1.02] hover:shadow-xl`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${platform.color}`} />
                  <div className="relative flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <platform.icon />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{platform.name === 'Ko-fi' ? t('buyMeCoffee') : platform.name}</h3>
                      <p className="text-white/80 text-sm">{platform.description}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* Thank You */}
            <div className="text-center p-6 bg-[rgb(var(--card))] rounded-2xl border border-[rgb(var(--border))]">
              <p className="text-[rgb(var(--muted-foreground))] italic">
                {t('contributionThanks')}
              </p>
            </div>
          </div>
        );

      case 'settings':
        return <div className="pb-24 animate-fade-in"><SettingsModal isOpen={true} onClose={() => { }} inline={true} /></div>;
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--foreground))] transition-colors duration-300">
      <div className="max-w-md mx-auto min-h-screen relative shadow-2xl bg-[rgb(var(--background))] overflow-hidden flex flex-col">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-5 py-6 scrollbar-hide">
          {renderContent()}
        </main>

        {/* Bottom Navigation - Enhanced Design */}
        <nav className="fixed bottom-0 z-40 bg-gradient-to-t from-[rgb(var(--card))] to-[rgb(var(--card))/95] backdrop-blur-xl border-t border-[rgb(var(--border))]/50 w-full max-w-md safe-area-bottom shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-around p-3 pb-5 sm:pb-3 relative">
            {/* Active Tab Indicator - Animated Background */}
            <div
              className="absolute top-0 h-1 bg-gradient-to-r transition-all duration-300 ease-out rounded-b-full"
              style={{
                left: currentView === 'home' ? '8%' :
                  currentView === 'inventory' ? '28%' :
                    currentView === 'support' ? '62%' :
                      currentView === 'settings' ? '82%' : '50%',
                width: '12%',
                background: currentView === 'home' ? 'linear-gradient(to right, #06b6d4, #0891b2)' :
                  currentView === 'inventory' ? 'linear-gradient(to right, #a855f7, #9333ea)' :
                    currentView === 'support' ? 'linear-gradient(to right, #f43f5e, #e11d48)' :
                      currentView === 'settings' ? 'linear-gradient(to right, #64748b, #475569)' : 'transparent'
              }}
            />

            {/* Home Tab */}
            <button
              onClick={() => setCurrentView('home')}
              className={`flex flex-col items-center gap-1 transition-all duration-200 relative group ${currentView === 'home'
                ? 'text-cyan-500 scale-110'
                : 'text-[rgb(var(--muted-foreground))] hover:text-cyan-400 hover:scale-105'
                }`}
            >
              <div className={`transition-all duration-200 ${currentView === 'home' ? 'drop-shadow-[0_2px_8px_rgba(6,182,212,0.4)]' : ''}`}>
                <GridIcon />
              </div>
              <span className={`text-[10px] font-medium transition-all ${currentView === 'home' ? 'font-semibold' : ''}`}>
                {t('home')}
              </span>
              {currentView === 'home' && (
                <div className="absolute -bottom-1 w-1 h-1 bg-cyan-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* Inventory Tab */}
            <button
              onClick={() => setCurrentView('inventory')}
              className={`flex flex-col items-center gap-1 transition-all duration-200 relative group ${currentView === 'inventory'
                ? 'text-purple-500 scale-110'
                : 'text-[rgb(var(--muted-foreground))] hover:text-purple-400 hover:scale-105'
                }`}
            >
              <div className={`transition-all duration-200 ${currentView === 'inventory' ? 'drop-shadow-[0_2px_8px_rgba(168,85,247,0.4)]' : ''}`}>
                <FolderIcon />
              </div>
              <span className={`text-[10px] font-medium transition-all ${currentView === 'inventory' ? 'font-semibold' : ''}`}>
                {t('list')}
              </span>
              {currentView === 'inventory' && (
                <div className="absolute -bottom-1 w-1 h-1 bg-purple-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* Center Add Button - Enhanced */}
            <div className="relative -top-6">
              <button
                onClick={() => { setIsProductModalOpen(true); setEditingProduct(null); }}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--primary))]/80 text-white shadow-lg shadow-[rgb(var(--primary))/40] flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 hover:shadow-xl hover:shadow-[rgb(var(--primary))/50] relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <PlusIcon />
                <div className="absolute inset-0 rounded-full border-2 border-white/20" />
              </button>
            </div>

            {/* Support Tab */}
            <button
              onClick={() => setCurrentView('support')}
              className={`flex flex-col items-center gap-1 transition-all duration-200 relative group ${currentView === 'support'
                ? 'text-rose-500 scale-110'
                : 'text-[rgb(var(--muted-foreground))] hover:text-rose-400 hover:scale-105'
                }`}
            >
              <div className={`transition-all duration-200 ${currentView === 'support' ? 'drop-shadow-[0_2px_8px_rgba(244,63,94,0.4)] animate-pulse' : ''}`}>
                <HeartIcon />
              </div>
              <span className={`text-[10px] font-medium transition-all ${currentView === 'support' ? 'font-semibold' : ''}`}>
                {t('support')}
              </span>
              {currentView === 'support' && (
                <div className="absolute -bottom-1 w-1 h-1 bg-rose-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* Settings Tab */}
            <button
              onClick={() => setCurrentView('settings')}
              className={`flex flex-col items-center gap-1 transition-all duration-200 relative group ${currentView === 'settings'
                ? 'text-slate-500 scale-110'
                : 'text-[rgb(var(--muted-foreground))] hover:text-slate-400 hover:scale-105'
                }`}
            >
              <div className={`transition-all duration-200 ${currentView === 'settings' ? 'drop-shadow-[0_2px_8px_rgba(100,116,139,0.4)]' : ''}`}>
                <SettingsIcon />
              </div>
              <span className={`text-[10px] font-medium transition-all ${currentView === 'settings' ? 'font-semibold' : ''}`}>
                {t('settings')}
              </span>
              {currentView === 'settings' && (
                <div className="absolute -bottom-1 w-1 h-1 bg-slate-500 rounded-full animate-pulse" />
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        editingProduct={editingProduct}
        categories={categories}
        locations={locations}
        defaultLocationId={selectedLocation !== 'all' ? selectedLocation : undefined}
      />
      <AddLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </div>
  );
}


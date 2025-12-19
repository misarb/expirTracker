'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useProductStore } from '@/store/productStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Product, Category, Location } from '@/types';
import { notificationService } from '@/lib/notifications';

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

const HeartIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseMenuIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

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
                {category?.name || 'Unknown'}
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
        {location.name}
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5000000) { // 5MB limit
        alert("File too large (max 5MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
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
      <div className="relative bg-[rgb(var(--card))] rounded-2xl shadow-xl w-full max-w-lg p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-[rgb(var(--foreground))] mb-6 flex items-center gap-2">
          {editingProduct ? `✏️ ${t('editProduct')}` : `➕ ${t('addProduct')}`}
        </h2>

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
                    {cat.name}
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
                    {loc.name}
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

  const emojiOptions = ['🏠', '🍳', '🚿', '💊', '🛏️', '🏢', '🚗', '📦', '❄️', '🧊', '🗄️', '📍'];

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
        <h2 className="text-xl font-bold text-[rgb(var(--foreground))] mb-6">
          Add New Location
        </h2>

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
            <div className="flex flex-wrap gap-2">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: emoji })}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${formData.icon === emoji
                    ? 'bg-[rgb(var(--primary))] ring-2 ring-[rgb(var(--primary))] ring-offset-2'
                    : 'bg-[rgb(var(--secondary))] hover:bg-[rgb(var(--muted))]'
                    }`}
                >
                  {emoji}
                </button>
              ))}
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
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { notifications, setNotificationsEnabled } = useSettingsStore();
  const { locations, deleteLocation } = useProductStore();
  const [permissionStatus, setPermissionStatus] = useState<string>('default');

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[rgb(var(--card))] rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-[rgb(var(--foreground))] mb-6 flex items-center gap-2">
          <SettingsIcon />
          {t('settings')}
        </h2>

        <div className="space-y-8">
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
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{loc.icon}</span>
                    <div>
                      <p className="font-medium text-[rgb(var(--foreground))]">{loc.name}</p>
                    </div>
                  </div>
                  {locations.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`${t('delete')} ${loc.name}?`)) {
                          deleteLocation(loc.id);
                        }
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

          {/* About Section */}
          <div className="pt-4 border-t border-[rgb(var(--border))]">
            <h3 className="text-sm font-medium text-[rgb(var(--muted-foreground))] mb-2">{t('about')}</h3>
            <p className="text-xs text-[rgb(var(--muted-foreground))]">
              ExpireTrack v1.0 • {t('neverWaste')}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2.5 rounded-xl border border-[rgb(var(--border))] text-[rgb(var(--foreground))] hover:bg-[rgb(var(--secondary))] transition-colors font-medium"
        >
          {t('back')}
        </button>
      </div>
    </div>
  );
}

// Stats Card Component
function StatsCard({ title, count, icon, color }: {
  title: string;
  count: number;
  icon: string;
  color: string;
}) {
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

import { useI18n } from '@/lib/i18n';

// ... (existing imports)

// Main Page Component
export default function Home() {
  const { t, lang: language, setLang: setLanguage } = useI18n();
  const { products, categories, locations, deleteProduct, refreshStatuses } = useProductStore();
  const { theme, toggleTheme, notifications, notifiedProducts, addNotifiedProduct } = useSettingsStore();
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'locations' | 'all'>('locations');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status'>('date');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [mounted, setMounted] = useState(false);


  // Check for expiring products and send notifications
  const checkNotifications = useCallback(() => {
    if (!notifications.enabled) return;

    const notifiedSet = new Set(notifiedProducts);
    const newNotified = notificationService.checkExpiringProducts(
      products.map(p => ({
        id: p.id,
        name: p.name,
        expirationDate: p.expirationDate,
        status: p.status,
      })),
      notifiedSet
    );

    // Add any new notifications to the store
    newNotified.forEach(key => {
      if (!notifiedSet.has(key)) {
        addNotifiedProduct(key);
      }
    });
  }, [products, notifications.enabled, notifiedProducts, addNotifiedProduct]);

  useEffect(() => {
    setMounted(true);
    refreshStatuses();
  }, [refreshStatuses]);

  // Check notifications on mount and when products change
  useEffect(() => {
    if (mounted && notifications.enabled) {
      checkNotifications();
    }
  }, [mounted, notifications.enabled, products, checkNotifications]);

  // Calculate stats per location
  const locationStats = useMemo(() => {
    return locations.map(location => {
      const locationProducts = products.filter(p => p.locationId === location.id);
      return {
        location,
        total: locationProducts.length,
        expiring: locationProducts.filter(p => p.status === 'expiring-soon').length,
        expired: locationProducts.filter(p => p.status === 'expired').length,
      };
    });
  }, [locations, products]);

  // Don't render until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xl">Loading...</div>
      </div>
    );
  }

  // Calculate global stats
  const safeProducts = products.filter(p => p.status === 'safe');
  const expiringProducts = products.filter(p => p.status === 'expiring-soon');
  const expiredProducts = products.filter(p => p.status === 'expired');

  // Get products for selected location or all
  const displayProducts = selectedLocationId
    ? products.filter(p => p.locationId === selectedLocationId)
    : products;

  // Apply search and filters
  const filteredProducts = displayProducts
    .filter(p => {
      // Status filter
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const category = categories.find(c => c.id === p.categoryId);
        const location = locations.find(l => l.id === p.locationId);
        return (
          p.name.toLowerCase().includes(query) ||
          category?.name.toLowerCase().includes(query) ||
          location?.name.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          const statusOrder = { 'expired': 0, 'expiring-soon': 1, 'safe': 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        case 'date':
        default:
          return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
      }
    });

  const selectedLocation = selectedLocationId
    ? locations.find(l => l.id === selectedLocationId)
    : null;

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id);
    }
  };

  const handleCloseProductModal = () => {
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleLocationClick = (locationId: string) => {
    setSelectedLocationId(locationId);
  };

  const handleBackToLocations = () => {
    setSelectedLocationId(null);
    setViewMode('locations');
  };

  return (
    <main className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[rgb(var(--background))/80] backdrop-blur-lg border-b border-[rgb(var(--border))]">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-4 flex items-center justify-between gap-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl flex-shrink-0">📦</span>
            <h1 className="text-base sm:text-xl font-bold text-[rgb(var(--foreground))] truncate">ExpireTrack</h1>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Stats - hidden on very small */}
            <Link
              href="/stats"
              className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-[rgb(var(--secondary))] text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))] transition-colors hidden sm:flex"
              title="Statistics"
            >
              <ChartIcon />
            </Link>

            {/* Settings - hidden on mobile, in menu */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-[rgb(var(--secondary))] text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))] transition-colors relative hidden sm:flex"
              title="Settings"
            >
              <BellIcon />
              {notifications.enabled && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full"></span>
              )}
            </button>

            {/* Theme - hidden on small */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-[rgb(var(--secondary))] text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))] transition-colors hidden md:flex"
              title="Toggle theme"
            >
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>

            {/* Add Location - hidden on small */}
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-[rgb(var(--secondary))] text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))] transition-colors hidden md:flex"
              title="Add location"
            >
              <FolderIcon />
            </button>

            {/* Language Switcher - always visible */}
            <button
              onClick={() => {
                const langs: ('en' | 'fr' | 'ar')[] = ['en', 'fr', 'ar'];
                const currentIndex = langs.indexOf(language);
                const nextLang = langs[(currentIndex + 1) % langs.length];
                setLanguage(nextLang);
              }}
              className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-[rgb(var(--secondary))] text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))] transition-colors flex items-center justify-center min-w-[3rem]"
              title="Change language"
            >
              <span className="text-sm font-bold uppercase">
                {language}
              </span>
            </button>

            {/* Support - always visible */}
            <Link
              href="/support"
              className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:opacity-90 transition-opacity flex items-center justify-center"
              title="Support"
            >
              <HeartIcon />
            </Link>

            {/* Add Product - always visible, compact on mobile */}
            <button
              onClick={() => setIsProductModalOpen(true)}
              className="flex items-center gap-1 px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] hover:opacity-90 transition-opacity font-medium text-sm"
            >
              <PlusIcon />
              <span className="hidden sm:inline">Add</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg bg-[rgb(var(--secondary))] text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))] transition-colors sm:hidden"
            >
              {isMobileMenuOpen ? <CloseMenuIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t border-[rgb(var(--border))] bg-[rgb(var(--background))] animate-fade-in">
            <div className="px-4 py-3 space-y-2">
              <Link
                href="/support"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white"
              >
                <HeartIcon />
                <span className="font-medium">Support</span>
              </Link>
              <Link
                href="/stats"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl bg-[rgb(var(--secondary))] text-[rgb(var(--foreground))]"
              >
                <ChartIcon />
                <span className="font-medium">Statistics</span>
              </Link>
              <button
                onClick={() => { setIsSettingsModalOpen(true); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-3 p-3 rounded-xl bg-[rgb(var(--secondary))] text-[rgb(var(--foreground))] w-full text-left"
              >
                <BellIcon />
                <span className="font-medium">Notifications</span>
                {notifications.enabled && (
                  <span className="ml-auto text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">ON</span>
                )}
              </button>
              <button
                onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-3 p-3 rounded-xl bg-[rgb(var(--secondary))] text-[rgb(var(--foreground))] w-full text-left"
              >
                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                <span className="font-medium">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
              </button>
              <button
                onClick={() => { setIsLocationModalOpen(true); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-3 p-3 rounded-xl bg-[rgb(var(--secondary))] text-[rgb(var(--foreground))] w-full text-left"
              >
                <FolderIcon />
                <span className="font-medium">Add Location</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">


        {/* Notification Banner */}
        {!notifications.enabled && products.length > 0 && (
          <div
            onClick={() => setIsSettingsModalOpen(true)}
            className="mb-6 p-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl text-white cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <BellIcon />
              <div>
                <p className="font-semibold">{t('enableNotifications')}</p>
                <p className="text-sm opacity-90">{t('notifications')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Breadcrumb / Back button when in location view */}
        {selectedLocationId && (
          <button
            onClick={handleBackToLocations}
            className="flex items-center gap-2 text-[rgb(var(--primary))] hover:underline mb-4 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to all locations
          </button>
        )}

        {/* Global Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatsCard title={t('total')} count={products.length} icon="📦" color="rgb(var(--primary))" />
          <StatsCard title={t('safe')} count={safeProducts.length} icon="🟢" color="rgb(34, 197, 94)" />
          <StatsCard title={t('expiring')} count={expiringProducts.length} icon="🟡" color="rgb(245, 158, 11)" />
          <StatsCard title={t('expired')} count={expiredProducts.length} icon="🔴" color="rgb(239, 68, 68)" />
        </div>

        {/* Location View or Product View */}
        {!selectedLocationId ? (
          <>
            {/* View Mode Toggle */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[rgb(var(--foreground))]">
                {t('locations')}
              </h2>
              <div className="flex gap-2 bg-[rgb(var(--secondary))] p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('locations')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'locations'
                    ? 'bg-[rgb(var(--card))] shadow-sm'
                    : 'hover:bg-[rgb(var(--muted))]'
                    }`}
                  title="Locations view"
                >
                  <FolderIcon />
                </button>
                <button
                  onClick={() => setViewMode('all')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'all'
                    ? 'bg-[rgb(var(--card))] shadow-sm'
                    : 'hover:bg-[rgb(var(--muted))]'
                    }`}
                  title="All products view"
                >
                  <GridIcon />
                </button>
              </div>
            </div>

            {viewMode === 'locations' ? (
              /* Locations Grid */
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {locationStats.map(({ location, total, expiring, expired }) => (
                  <LocationCard
                    key={location.id}
                    location={location}
                    productCount={total}
                    expiringCount={expiring}
                    expiredCount={expired}
                    onClick={() => handleLocationClick(location.id)}
                  />
                ))}

                {/* Add Location Card */}
                <button
                  onClick={() => setIsLocationModalOpen(true)}
                  className="border-2 border-dashed border-[rgb(var(--border))] rounded-2xl p-6 hover:border-[rgb(var(--primary))] hover:bg-[rgb(var(--secondary))/50] transition-all flex flex-col items-center justify-center gap-2 min-h-[160px]"
                >
                  <div className="w-12 h-12 rounded-xl bg-[rgb(var(--secondary))] flex items-center justify-center">
                    <PlusIcon />
                  </div>
                  <span className="font-medium text-[rgb(var(--muted-foreground))]">{t('location')}</span>
                </button>
              </div>
            ) : (
              /* All Products View */
              <>
                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[rgb(var(--muted-foreground))]">
                      <SearchIcon />
                    </div>
                    <input
                      type="text"
                      placeholder={t('search')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--foreground))] focus:ring-2 focus:ring-[rgb(var(--primary))] focus:border-transparent outline-none placeholder:text-[rgb(var(--muted-foreground))]"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"
                      >
                        <CloseIcon />
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Filter Chips & Sort */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <div className="flex flex-wrap gap-2 flex-1">
                    {[
                      { value: 'all', label: t('allProducts'), count: displayProducts.length },
                      { value: 'expiring-soon', label: `🟡 ${t('expiring')}`, count: displayProducts.filter(p => p.status === 'expiring-soon').length },
                      { value: 'expired', label: `🔴 ${t('expired')}`, count: displayProducts.filter(p => p.status === 'expired').length },
                      { value: 'safe', label: `🟢 ${t('safe')}`, count: displayProducts.filter(p => p.status === 'safe').length },
                    ].map((filter) => (
                      <button
                        key={filter.value}
                        onClick={() => setFilterStatus(filter.value)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filterStatus === filter.value
                          ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]'
                          : 'bg-[rgb(var(--secondary))] text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]'
                          }`}
                      >
                        {filter.label} ({filter.count})
                      </button>
                    ))}
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'status')}
                    className="px-3 py-1.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--foreground))] text-sm focus:ring-2 focus:ring-[rgb(var(--primary))] focus:border-transparent outline-none"
                  >
                    <option value="date">{t('sortBy')}: {t('date')}</option>
                    <option value="name">{t('sortBy')}: {t('name')}</option>
                    <option value="status">{t('sortBy')}: {t('status')}</option>
                  </select>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="text-center py-16">
                    <span className="text-6xl mb-4 block">{searchQuery || filterStatus !== 'all' ? '🔍' : '📭'}</span>
                    <h2 className="text-xl font-semibold text-[rgb(var(--foreground))] mb-2">
                      {searchQuery || filterStatus !== 'all' ? t('noProducts') : t('noProducts')}
                    </h2>
                    <p className="text-[rgb(var(--muted-foreground))] mb-6">
                      {searchQuery || filterStatus !== 'all'
                        ? ''
                        : t('addFirst')}
                    </p>
                    {searchQuery || filterStatus !== 'all' ? (
                      <button
                        onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[rgb(var(--secondary))] text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))] transition-colors font-medium"
                      >
                        Clear Filters
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsProductModalOpen(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] hover:opacity-90 transition-opacity font-medium"
                      >
                        <PlusIcon />
                        {t('addFirst')}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.map((product, index) => (
                      <div key={product.id} style={{ animationDelay: `${index * 50}ms` }}>
                        <ProductCard
                          product={product}
                          category={categories.find(c => c.id === product.categoryId)}
                          onEdit={() => handleEdit(product)}
                          onDelete={() => handleDelete(product.id)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          /* Selected Location Products View */
          <>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-4xl">{selectedLocation?.icon}</span>
              <div>
                <h2 className="text-2xl font-bold text-[rgb(var(--foreground))]">
                  {selectedLocation?.name}
                </h2>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">
                  {selectedLocation?.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--foreground))] focus:ring-2 focus:ring-[rgb(var(--primary))] focus:border-transparent outline-none"
              >
                <option value="all">All Status</option>
                <option value="safe">🟢 Safe</option>
                <option value="expiring-soon">🟡 Expiring Soon</option>
                <option value="expired">🔴 Expired</option>
              </select>

              <button
                onClick={() => setIsProductModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] hover:opacity-90 transition-opacity font-medium"
              >
                <PlusIcon />
                Add to {selectedLocation?.name}
              </button>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-6xl mb-4 block">{selectedLocation?.icon}</span>
                <h2 className="text-xl font-semibold text-[rgb(var(--foreground))] mb-2">
                  No products in {selectedLocation?.name}
                </h2>
                <p className="text-[rgb(var(--muted-foreground))] mb-6">
                  Add products to this location to track them
                </p>
                <button
                  onClick={() => setIsProductModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] hover:opacity-90 transition-opacity font-medium"
                >
                  <PlusIcon />
                  Add Product Here
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product, index) => (
                  <div key={product.id} style={{ animationDelay: `${index * 50}ms` }}>
                    <ProductCard
                      product={product}
                      category={categories.find(c => c.id === product.categoryId)}
                      onEdit={() => handleEdit(product)}
                      onDelete={() => handleDelete(product.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={handleCloseProductModal}
        editingProduct={editingProduct}
        categories={categories}
        locations={locations}
        defaultLocationId={selectedLocationId || undefined}
      />

      <AddLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </main>
  );
}

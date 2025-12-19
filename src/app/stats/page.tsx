'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useProductStore } from '@/store/productStore';
import { useSettingsStore } from '@/store/settingsStore';

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

// Animated stat card
function StatCard({ value, label, icon, gradient }: { value: number; label: string; icon: string; gradient: string }) {
    return (
        <div className={`relative overflow-hidden rounded-2xl p-5 text-white ${gradient}`}>
            <div className="relative z-10">
                <p className="text-4xl font-bold mb-1">{value}</p>
                <p className="text-white/80 text-sm font-medium">{label}</p>
            </div>
            <span className="absolute right-3 bottom-2 text-5xl opacity-30">{icon}</span>
        </div>
    );
}

// Progress ring
function ProgressRing({ percentage, size = 140 }: { percentage: number; size?: number }) {
    const strokeWidth = 14;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;
    const color = percentage >= 70 ? '#22c55e' : percentage >= 40 ? '#f59e0b' : '#ef4444';

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <span className="text-3xl font-bold">{Math.round(percentage)}%</span>
                <span className="text-xs opacity-80">healthy</span>
            </div>
        </div>
    );
}

// Horizontal bar
function HorizontalBar({ label, value, maxValue, color }: { label: string; value: number; maxValue: number; color: string }) {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="text-sm text-[rgb(var(--foreground))] w-28 truncate">{label}</span>
            <div className="flex-1 h-4 bg-[rgb(var(--secondary))] rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${percentage}%`, backgroundColor: color }}
                />
            </div>
            <span className="text-sm font-bold text-[rgb(var(--foreground))] w-8 text-right">{value}</span>
        </div>
    );
}

export default function StatsPage() {
    const { products, categories, locations } = useProductStore();
    const { theme, toggleTheme } = useSettingsStore();

    const stats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const safe = products.filter(p => p.status === 'safe');
        const expiringSoon = products.filter(p => p.status === 'expiring-soon');
        const expired = products.filter(p => p.status === 'expired');

        const oneWeekFromNow = new Date(today);
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
        const expiringThisWeek = products.filter(p => {
            const expDate = new Date(p.expirationDate);
            return expDate >= today && expDate <= oneWeekFromNow;
        });

        const byCategory = categories
            .map(cat => ({
                label: `${cat.icon} ${cat.name}`,
                value: products.filter(p => p.categoryId === cat.id).length,
                color: cat.color,
            }))
            .filter(c => c.value > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        const byLocation = locations
            .map(loc => ({
                label: `${loc.icon} ${loc.name}`,
                value: products.filter(p => p.locationId === loc.id).length,
                color: loc.color,
            }))
            .filter(l => l.value > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        const healthScore = products.length > 0 ? Math.round((safe.length / products.length) * 100) : 100;
        const maxCategoryValue = Math.max(...byCategory.map(c => c.value), 1);
        const maxLocationValue = Math.max(...byLocation.map(l => l.value), 1);

        return {
            total: products.length,
            safe: safe.length,
            expiringSoon: expiringSoon.length,
            expired: expired.length,
            expiringThisWeek: expiringThisWeek.length,
            byCategory,
            byLocation,
            healthScore,
            maxCategoryValue,
            maxLocationValue,
        };
    }, [products, categories, locations]);

    return (
        <main className="min-h-screen pb-20 bg-[rgb(var(--background))]">
            <header className="sticky top-0 z-40 bg-[rgb(var(--background))/80] backdrop-blur-lg border-b border-[rgb(var(--border))]">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <span className="text-2xl">📊</span>
                        <span className="text-lg font-bold text-[rgb(var(--foreground))]">Statistics</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-xl bg-[rgb(var(--secondary))] text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))] transition-colors"
                        >
                            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                        </button>
                        <Link
                            href="/"
                            className="px-4 py-2 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] hover:opacity-90 transition-opacity font-medium text-sm"
                        >
                            Back
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-6">
                {products.length === 0 ? (
                    <div className="text-center py-20">
                        <span className="text-6xl mb-4 block">📊</span>
                        <h2 className="text-xl font-semibold text-[rgb(var(--foreground))] mb-2">No data yet</h2>
                        <p className="text-[rgb(var(--muted-foreground))] mb-6">Add products to see statistics</p>
                        <Link
                            href="/"
                            className="inline-flex px-6 py-3 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] hover:opacity-90 transition-opacity font-medium"
                        >
                            Add Products
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Health Score Hero */}
                        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-6 sm:p-8">
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <ProgressRing percentage={stats.healthScore} />
                                <div className="text-center sm:text-left">
                                    <h2 className="text-2xl font-bold text-white mb-2">
                                        {stats.healthScore >= 70 ? '🎉 Great job!' : stats.healthScore >= 40 ? '⚡ Keep going!' : '⚠️ Needs attention'}
                                    </h2>
                                    <p className="text-white/80 text-sm">
                                        {stats.safe} of {stats.total} products are safe
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <StatCard value={stats.total} label="Total" icon="📦" gradient="bg-gradient-to-br from-slate-600 to-slate-800" />
                            <StatCard value={stats.safe} label="Safe" icon="✅" gradient="bg-gradient-to-br from-green-500 to-emerald-600" />
                            <StatCard value={stats.expiringSoon} label="Expiring" icon="⏰" gradient="bg-gradient-to-br from-amber-500 to-orange-500" />
                            <StatCard value={stats.expired} label="Expired" icon="❌" gradient="bg-gradient-to-br from-red-500 to-rose-600" />
                        </div>

                        {/* Week Alert */}
                        {stats.expiringThisWeek > 0 && (
                            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 text-white flex items-center gap-3">
                                <span className="text-2xl">⚡</span>
                                <span className="font-semibold">{stats.expiringThisWeek} expiring this week</span>
                            </div>
                        )}

                        {/* Distribution */}
                        <div className="grid md:grid-cols-2 gap-4">
                            {stats.byCategory.length > 0 && (
                                <div className="bg-[rgb(var(--card))] rounded-2xl p-5 border border-[rgb(var(--border))]">
                                    <h3 className="font-bold text-[rgb(var(--foreground))] mb-4">📂 By Category</h3>
                                    <div className="space-y-3">
                                        {stats.byCategory.map((item, i) => (
                                            <HorizontalBar key={i} label={item.label} value={item.value} maxValue={stats.maxCategoryValue} color={item.color} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {stats.byLocation.length > 0 && (
                                <div className="bg-[rgb(var(--card))] rounded-2xl p-5 border border-[rgb(var(--border))]">
                                    <h3 className="font-bold text-[rgb(var(--foreground))] mb-4">📍 By Location</h3>
                                    <div className="space-y-3">
                                        {stats.byLocation.map((item, i) => (
                                            <HorizontalBar key={i} label={item.label} value={item.value} maxValue={stats.maxLocationValue} color={item.color} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

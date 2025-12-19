'use client';

import Link from 'next/link';
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

const HeartIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
);

const CoffeeIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 1v3M10 1v3M14 1v3" />
    </svg>
);

const PayPalIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19a.803.803 0 0 0-.795.68l-.942 5.984a.642.642 0 0 1-.633.542z" />
    </svg>
);

const GithubIcon = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
);

// Donation platform data - user can customize these links
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

export default function SupportPage() {
    const { theme, toggleTheme } = useSettingsStore();

    return (
        <main className="min-h-screen pb-20">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[rgb(var(--background))/80] backdrop-blur-lg border-b border-[rgb(var(--border))]">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <span className="text-3xl">📦</span>
                        <div>
                            <h1 className="text-xl font-bold text-[rgb(var(--foreground))]">ExpireTrack</h1>
                            <p className="text-xs text-[rgb(var(--muted-foreground))]">Never waste again</p>
                        </div>
                    </Link>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 rounded-xl bg-[rgb(var(--secondary))] text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))] transition-colors"
                            title="Toggle theme"
                        >
                            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                        </button>

                        <Link
                            href="/"
                            className="px-4 py-2.5 rounded-xl bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] hover:opacity-90 transition-opacity font-medium"
                        >
                            Back to App
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white mb-6">
                        <HeartIcon className="w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-bold text-[rgb(var(--foreground))] mb-4">
                        Support ExpireTrack
                    </h1>
                    <p className="text-lg text-[rgb(var(--muted-foreground))] max-w-2xl mx-auto">
                        Help me continue building and improving this app for everyone!
                    </p>
                </div>

                {/* Story Section */}
                <div className="bg-[rgb(var(--card))] rounded-2xl p-8 shadow-sm border border-[rgb(var(--border))] mb-8">
                    <h2 className="text-2xl font-bold text-[rgb(var(--foreground))] mb-4">
                        👋 Hi, I'm the creator of ExpireTrack!
                    </h2>
                    <div className="space-y-4 text-[rgb(var(--muted-foreground))]">
                        <p>
                            I built ExpireTrack to solve a problem we all face: <strong className="text-[rgb(var(--foreground))]">wasted products due to expired dates</strong>.
                            Whether it's food, medicine, or cosmetics – we've all thrown away things we forgot about.
                        </p>
                        <p>
                            My vision is to make ExpireTrack the <strong className="text-[rgb(var(--foreground))]">smartest and simplest</strong> way to
                            track everything in your home. I'm working on features like:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>📱 Mobile app for iOS and Android</li>
                            <li>📷 Barcode scanning for quick entry</li>
                            <li>👨‍👩‍👧‍👦 Family sharing and household sync</li>
                            <li>🤖 AI-powered shelf life suggestions</li>
                            <li>📊 Waste analytics to save you money</li>
                        </ul>
                        <p>
                            Your support helps me dedicate more time to building these features and keeping the app
                            <strong className="text-[rgb(var(--foreground))]"> free for everyone</strong>.
                        </p>
                    </div>
                </div>

                {/* Donation Platforms */}
                <h2 className="text-2xl font-bold text-[rgb(var(--foreground))] mb-6 text-center">
                    Ways to Support
                </h2>

                <div className="grid gap-4 sm:grid-cols-2 mb-8">
                    {DONATION_PLATFORMS.map((platform) => (
                        <a
                            key={platform.name}
                            href={platform.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`group relative overflow-hidden rounded-2xl p-6 text-white transition-all hover:scale-[1.02] hover:shadow-xl ${platform.placeholder ? 'cursor-pointer' : ''
                                }`}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${platform.color}`} />
                            <div className="relative flex items-center gap-4">
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                    <platform.icon />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">{platform.name}</h3>
                                    <p className="text-white/80 text-sm">{platform.description}</p>
                                </div>
                            </div>
                            {platform.placeholder && (
                                <div className="absolute top-2 right-2 px-2 py-1 bg-black/30 rounded-full text-xs">
                                    Configure link
                                </div>
                            )}
                        </a>
                    ))}
                </div>

                {/* Thank You */}
                <div className="text-center">
                    <p className="text-lg text-[rgb(var(--muted-foreground))]">
                        Every contribution, no matter how small, means the world to me! 💕
                    </p>
                    <p className="text-[rgb(var(--muted-foreground))] mt-2">
                        Thank you for using and supporting ExpireTrack!
                    </p>
                </div>
            </div>
        </main>
    );
}

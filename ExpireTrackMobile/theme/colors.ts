// Exact color mapping from Web globals.css
export const colors = {
    primary: {
        light: '#6366F1', // Indigo-500
        dark: '#818CF8'   // Indigo-400
    },
    background: {
        light: '#FAFAFA', // 250 250 250
        dark: '#111827'   // 17 24 39
    },
    card: {
        light: '#FFFFFF', // 255 255 255
        dark: '#1F2937'   // 31 41 55
    },
    secondary: {
        light: '#F3F4F6', // 243 244 246
        dark: '#374151'   // 55 65 81
    },
    border: {
        light: '#E5E7EB', // 229 231 235
        dark: '#374151'   // 55 65 81
    },
    foreground: {
        light: '#171717', // 23 23 23
        dark: '#F8FAFC'   // 248 250 252
    },
    muted: {
        light: '#6B7280', // 107 114 128
        dark: '#9CA3AF'   // 156 163 175
    },
    status: {
        safe: '#22C55E',     // Green-500
        expiringSoon: '#F59E0B', // Amber-500
        expired: '#EF4444'   // Red-500
    },
    // Additional utility colors
    destructive: '#EF4444',
    gradients: {
        total: ['#10B981', '#14B8A6'], // Emerald/Teal (Kept for stats distinctness or switch to Indigo?)
        // Let's align stats closer to theme or keep them distinct. 
        // Web doesn't show gradients in cards, but mobile stats page does.
        // I'll keep stats gradients but update to match primary vibe if needed.
        // Actually, web uses plain colors for badges. Stick to pleasant mobile gradients.
    }
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const borderRadius = { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 };
export const fontSize = { xs: 12, sm: 14, md: 16, lg: 18, xl: 20, xxl: 24, xxxl: 32 };

// Browser Push Notification Service for ExpireTrack

export type NotificationPermission = 'default' | 'granted' | 'denied';

interface NotificationOptions {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    requireInteraction?: boolean;
    data?: Record<string, unknown>;
}

class NotificationService {
    private permission: NotificationPermission = 'default';
    private checkInterval: NodeJS.Timeout | null = null;

    constructor() {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            this.permission = Notification.permission as NotificationPermission;
        }
    }

    // Check if notifications are supported
    isSupported(): boolean {
        return typeof window !== 'undefined' && 'Notification' in window;
    }

    // Get current permission status
    getPermission(): NotificationPermission {
        if (!this.isSupported()) return 'denied';
        return Notification.permission as NotificationPermission;
    }

    // Request notification permission
    async requestPermission(): Promise<NotificationPermission> {
        if (!this.isSupported()) {
            console.warn('Notifications not supported in this browser');
            return 'denied';
        }

        try {
            const result = await Notification.requestPermission();
            this.permission = result as NotificationPermission;
            return this.permission;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return 'denied';
        }
    }

    // Send a notification
    async sendNotification(options: NotificationOptions): Promise<boolean> {
        if (!this.isSupported()) return false;

        if (this.permission !== 'granted') {
            const newPermission = await this.requestPermission();
            if (newPermission !== 'granted') return false;
        }

        try {
            const notification = new Notification(options.title, {
                body: options.body,
                icon: options.icon || '/icon-192.png',
                tag: options.tag,
                requireInteraction: options.requireInteraction ?? false,
                data: options.data,
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            return true;
        } catch (error) {
            console.error('Error sending notification:', error);
            return false;
        }
    }

    // Check products and send notifications for expiring ones
    checkExpiringProducts(
        products: Array<{
            id: string;
            name: string;
            expirationDate: string;
            status: string;
        }>,
        notifiedProducts: Set<string>
    ): Set<string> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const newNotified = new Set(notifiedProducts);

        products.forEach((product) => {
            const expDate = new Date(product.expirationDate);
            expDate.setHours(0, 0, 0, 0);

            const daysUntil = Math.ceil(
                (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            const notificationKey = `${product.id}-${daysUntil}`;

            // Skip if already notified for this product at this threshold
            if (newNotified.has(notificationKey)) return;

            // Notification thresholds
            if (daysUntil === 7) {
                this.sendNotification({
                    title: '⚠️ Product Expiring Soon',
                    body: `${product.name} expires in 7 days!`,
                    tag: `expire-7-${product.id}`,
                });
                newNotified.add(notificationKey);
            } else if (daysUntil === 3) {
                this.sendNotification({
                    title: '🟡 Product Expiring in 3 Days',
                    body: `${product.name} expires in 3 days!`,
                    tag: `expire-3-${product.id}`,
                });
                newNotified.add(notificationKey);
            } else if (daysUntil === 1) {
                this.sendNotification({
                    title: '🔴 Product Expires Tomorrow!',
                    body: `${product.name} expires tomorrow! Use it soon.`,
                    tag: `expire-1-${product.id}`,
                    requireInteraction: true,
                });
                newNotified.add(notificationKey);
            } else if (daysUntil === 0) {
                this.sendNotification({
                    title: '🚨 Product Expires Today!',
                    body: `${product.name} expires TODAY! Check it now.`,
                    tag: `expire-0-${product.id}`,
                    requireInteraction: true,
                });
                newNotified.add(notificationKey);
            } else if (daysUntil < 0 && daysUntil >= -1) {
                this.sendNotification({
                    title: '❌ Product Expired',
                    body: `${product.name} has expired. Consider discarding it.`,
                    tag: `expired-${product.id}`,
                });
                newNotified.add(notificationKey);
            }
        });

        return newNotified;
    }

    // Start periodic checking (every hour)
    startPeriodicCheck(
        getProducts: () => Array<{
            id: string;
            name: string;
            expirationDate: string;
            status: string;
        }>,
        getNotified: () => Set<string>,
        setNotified: (notified: Set<string>) => void
    ): void {
        // Clear any existing interval
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }

        // Check immediately
        const notified = this.checkExpiringProducts(getProducts(), getNotified());
        setNotified(notified);

        // Then check every hour
        this.checkInterval = setInterval(() => {
            const updated = this.checkExpiringProducts(getProducts(), getNotified());
            setNotified(updated);
        }, 60 * 60 * 1000); // 1 hour
    }

    // Stop periodic checking
    stopPeriodicCheck(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
}

// Singleton instance
export const notificationService = new NotificationService();

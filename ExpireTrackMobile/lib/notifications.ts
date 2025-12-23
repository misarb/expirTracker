import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Product } from '../types';

// Configure how notifications behave when the app is foregrounded
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        return null; // Permission denied
    }

    return true;
}

// Constants
const ALL_TIMING_OPTIONS = [0, 1, 2, 3, 7];

export async function scheduleProductNotification(product: Product, timings: number[]) {
    if (!product.hasExpirationDate) return;

    // Track if we've already sent an immediate notification for this product
    let immediateNotificationSent = false;

    for (const daysBefore of timings) {

        // Calculate Trigger Date
        const expirationDate = new Date(product.expirationDate);
        // Normalize expiration date to midnight for calculation transparency
        expirationDate.setHours(0, 0, 0, 0);

        const triggerDate = new Date(expirationDate);
        triggerDate.setDate(expirationDate.getDate() - daysBefore);
        triggerDate.setHours(9, 0, 0, 0); // Schedule for 9:00 AM

        let triggerInput: any = triggerDate;
        let shouldSchedule = true;

        // Determine if the product is ACTUALLY expired (past end of expiration day)
        // We set it to the very end of the day, so even if it's 11PM on the expiration day, it's not "expired" yet for notification purposes.
        const endOfExpirationDay = new Date(expirationDate);
        endOfExpirationDay.setHours(23, 59, 59, 999);

        // If preferred trigger date (9 AM) is in the past
        if (triggerDate.getTime() < Date.now()) {

            // If the product hasn't fully expired yet (until end of day)
            if (endOfExpirationDay.getTime() > Date.now()) {
                // Only send ONE immediate notification, skip others that also have passed trigger time
                if (immediateNotificationSent) {
                    console.log(`Skipping duplicate immediate notification for ${product.name} (-${daysBefore}d), already sent one.`);
                    shouldSchedule = false;
                } else {
                    triggerInput = null; // Immediate trigger
                    immediateNotificationSent = true;
                    console.log(`Preferred time passed for ${product.name} (-${daysBefore}d), sending immediate notification`);
                }
            } else {
                console.log(`Skipping notification for ${product.name}, already expired/passed (EndOfDay: ${endOfExpirationDay.toLocaleString()}).`);
                shouldSchedule = false;
            }
        }

        if (!shouldSchedule) continue;

        const identifier = `${product.id}-${daysBefore}`;

        await Notifications.scheduleNotificationAsync({
            identifier,
            content: {
                title: daysBefore === 0 ? "Product Expiring Today!" : `Expiring in ${daysBefore} day${daysBefore > 1 ? 's' : ''}!`,
                body: `${product.name} expires on ${expirationDate.toLocaleDateString()}`,
                data: { productId: product.id },
                sound: true,
            },
            trigger: triggerInput,
        });

        console.log(`Scheduled notification for ${product.name} (${daysBefore}d before) at ${triggerInput === null ? 'NOW' : triggerDate}`);
    }
}

export async function cancelProductNotification(productId: string) {
    // Attempt to cancel all potential timing variations
    for (const day of ALL_TIMING_OPTIONS) {
        await Notifications.cancelScheduledNotificationAsync(`${productId}-${day}`);
    }
}

export async function cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function rescheduleAllNotifications(products: Product[], timings: number[]) {
    await cancelAllNotifications();
    for (const product of products) {
        await scheduleProductNotification(product, timings);
    }
}

export async function sendTestNotification() {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Test Notification 🔔",
            body: "This is a test to verify your settings are correct!",
            sound: true,
        },
        trigger: null, // Immediate
    });
}

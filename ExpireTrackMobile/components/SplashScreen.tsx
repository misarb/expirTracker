import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SplashScreenProps {
    onFinish: () => void;
}

// Web-compatible gradient background
const GradientBackground = ({ children }: { children: React.ReactNode }) => {
    if (Platform.OS === 'web') {
        return (
            <View style={[styles.container, styles.webGradient]}>
                {children}
            </View>
        );
    }
    return (
        <LinearGradient
            colors={['#06b6d4', '#3b82f6', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            {children}
        </LinearGradient>
    );
};

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    const bounceAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const dot1Opacity = useRef(new Animated.Value(0.4)).current;
    const dot2Opacity = useRef(new Animated.Value(0.4)).current;
    const dot3Opacity = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        // Bounce animation for icon
        Animated.loop(
            Animated.sequence([
                Animated.timing(bounceAnim, {
                    toValue: -15,
                    duration: 400,
                    useNativeDriver: Platform.OS !== 'web',
                }),
                Animated.timing(bounceAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: Platform.OS !== 'web',
                }),
            ])
        ).start();

        // Fade in for text
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: Platform.OS !== 'web',
        }).start();

        // Pulsing dots animation
        const animateDots = () => {
            Animated.loop(
                Animated.stagger(150, [
                    Animated.sequence([
                        Animated.timing(dot1Opacity, {
                            toValue: 1,
                            duration: 300,
                            useNativeDriver: Platform.OS !== 'web',
                        }),
                        Animated.timing(dot1Opacity, {
                            toValue: 0.4,
                            duration: 300,
                            useNativeDriver: Platform.OS !== 'web',
                        }),
                    ]),
                    Animated.sequence([
                        Animated.timing(dot2Opacity, {
                            toValue: 1,
                            duration: 300,
                            useNativeDriver: Platform.OS !== 'web',
                        }),
                        Animated.timing(dot2Opacity, {
                            toValue: 0.4,
                            duration: 300,
                            useNativeDriver: Platform.OS !== 'web',
                        }),
                    ]),
                    Animated.sequence([
                        Animated.timing(dot3Opacity, {
                            toValue: 1,
                            duration: 300,
                            useNativeDriver: Platform.OS !== 'web',
                        }),
                        Animated.timing(dot3Opacity, {
                            toValue: 0.4,
                            duration: 300,
                            useNativeDriver: Platform.OS !== 'web',
                        }),
                    ]),
                ])
            ).start();
        };
        animateDots();

        // Auto-dismiss after 2.5 seconds
        const timer = setTimeout(() => {
            onFinish();
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <GradientBackground>
            {/* Logo Icon */}
            <Animated.View
                style={[
                    styles.iconContainer,
                    { transform: [{ translateY: bounceAnim }] }
                ]}
            >
                <View style={styles.iconBox}>
                    <Text style={styles.iconEmoji}>📦</Text>
                </View>
            </Animated.View>

            {/* App Name - Two-tone */}
            <Animated.View style={[styles.titleContainer, { opacity: fadeAnim }]}>
                <Text style={styles.titleExpire}>Expire</Text>
                <Text style={styles.titleTrack}>Track</Text>
            </Animated.View>

            {/* Tagline */}
            <Animated.Text style={[styles.tagline, { opacity: fadeAnim }]}>
                Never waste again
            </Animated.Text>

            {/* Loading dots */}
            <View style={styles.dotsContainer}>
                <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
                <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
                <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
            </View>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100%',
    },
    webGradient: {
        // @ts-ignore - web-specific CSS property
        background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)',
        backgroundColor: '#3b82f6', // Fallback
    },
    iconContainer: {
        marginBottom: 24,
    },
    iconBox: {
        width: 96,
        height: 96,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    iconEmoji: {
        fontSize: 48,
    },
    titleContainer: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    titleExpire: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fcd34d', // amber-300
        letterSpacing: -0.5,
    },
    titleTrack: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#ffffff',
        letterSpacing: -0.5,
    },
    tagline: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 32,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    dot: {
        width: 12,
        height: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 6,
    },
});

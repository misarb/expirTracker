import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../store/userStore';
import { colors } from '../theme/colors';
import { useSettingsStore } from '../store/settingsStore';
import { useI18n } from '../lib/i18n';
import { Svg, Path, Circle } from 'react-native-svg';

const BackIcon = ({ color }: any) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M19 12H5M12 19l-7-7 7-7" />
    </Svg>
);

const UserIcon = ({ color }: any) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <Circle cx="12" cy="7" r="4" />
    </Svg>
);

const LockIcon = ({ color }: any) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z" />
        <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
);

export default function AuthScreen({ navigation, route }: any) {
    const { mode: initialMode = 'signin' } = route.params || {};
    const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { signIn, signUp } = useUserStore();
    const { theme } = useSettingsStore();
    const { t } = useI18n();
    const isDark = theme === 'system' ? false : theme === 'dark'; // Simplified for now
    const resolvedTheme = isDark ? 'dark' : 'light';
    const activeColors = colors.foreground[resolvedTheme]; // Fix access logic below in styles

    const handleAuth = async () => {
        if (!email || !password || (mode === 'signup' && !displayName)) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setIsLoading(true);
        try {
            if (mode === 'signin') {
                console.log('🔑 [AuthScreen] Attempting signIn...');
                const result = await signIn(email, password);
                console.log('🔑 [AuthScreen] signIn result:', result);
                if (result.success) {
                    // Navigate back immediately, App.tsx handles state refresh
                    navigation.goBack();
                } else {
                    Alert.alert('Sign In Failed', result.error || 'Unknown error');
                }
            } else {
                console.log('📝 [AuthScreen] Attempting signUp...');
                const result = await signUp(email, password, displayName);
                console.log('📝 [AuthScreen] signUp result:', result);
                if (result.success) {
                    Alert.alert('Success', 'Account created! Please check your email if confirmation is required.', [
                        { text: 'OK', onPress: () => navigation.goBack() }
                    ]);
                } else {
                    Alert.alert('Sign Up Failed', result.error || 'Unknown error');
                }
            }
        } catch (error: any) {
            console.error('❌ [AuthScreen] Unexpected error:', error);
            Alert.alert('Error', error.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const styles = getStyles(isDark ? 'dark' : 'light');

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <BackIcon color={colors.foreground[resolvedTheme]} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{mode === 'signin' ? 'Welcome Back' : 'Create Account'}</Text>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoCircle}>
                            <UserIcon color="#fff" />
                        </View>
                        <Text style={styles.subtitle}>
                            {mode === 'signin'
                                ? 'Sign in to sync your pantry across all devices'
                                : 'Join Pro families and keep your products synced'}
                        </Text>
                    </View>

                    <View style={styles.form}>
                        {mode === 'signup' && (
                            <View style={styles.inputContainer}>
                                <UserIcon color={colors.muted[resolvedTheme]} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Display Name"
                                    placeholderTextColor={colors.muted[resolvedTheme]}
                                    value={displayName}
                                    onChangeText={setDisplayName}
                                    autoCapitalize="words"
                                />
                            </View>
                        )}

                        <View style={styles.inputContainer}>
                            <Text style={{ fontSize: 18, color: colors.muted[resolvedTheme] }}>@</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Email Address"
                                placeholderTextColor={colors.muted[resolvedTheme]}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <LockIcon color={colors.muted[resolvedTheme]} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor={colors.muted[resolvedTheme]}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.authButton, isLoading && styles.disabledButton]}
                            onPress={handleAuth}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.authButtonText}>
                                    {mode === 'signin' ? 'Sign In' : 'Sign Up'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                            style={styles.toggleContainer}
                        >
                            <Text style={styles.toggleText}>
                                {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                                <Text style={styles.toggleTextAction}>
                                    {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                                </Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const getStyles = (theme: 'light' | 'dark') => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background[theme],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.foreground[theme],
    },
    content: {
        padding: 24,
        flexGrow: 1,
    },
    logoContainer: {
        alignItems: 'center',
        marginVertical: 40,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primary[theme],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: colors.primary[theme],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    subtitle: {
        fontSize: 16,
        color: colors.muted[theme],
        textAlign: 'center',
        lineHeight: 24,
    },
    form: {
        marginTop: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card[theme],
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
        height: 56,
        borderWidth: 1,
        borderColor: colors.border[theme],
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: colors.foreground[theme],
    },
    authButton: {
        backgroundColor: colors.primary[theme],
        borderRadius: 12,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: colors.primary[theme],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        opacity: 0.7,
    },
    authButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    toggleContainer: {
        marginTop: 24,
        alignItems: 'center',
    },
    toggleText: {
        color: colors.muted[theme],
        fontSize: 14,
    },
    toggleTextAction: {
        color: colors.primary[theme],
        fontWeight: 'bold',
    },
});

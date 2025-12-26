import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useProductStore } from '../store/productStore';
import { colors } from '../theme/colors';

export default function SyncIndicator() {
    const pendingSyncCount = useProductStore(state => state.pendingSyncCount);
    const [fadeAnim] = React.useState(new Animated.Value(0));

    React.useEffect(() => {
        if (pendingSyncCount > 0) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }).start();
        }
    }, [pendingSyncCount]);

    if (pendingSyncCount === 0) return null;

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <View style={styles.content}>
                <View style={styles.dot} />
                <Text style={styles.text}>Syncing {pendingSyncCount} changes...</Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        alignSelf: 'center',
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fbbf24',
        marginRight: 8,
    },
    text: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
});

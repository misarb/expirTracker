import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme, Platform } from 'react-native';

import HomeScreen from './screens/HomeScreen';
import SpacesScreen from './screens/SpacesScreen';
import SupportScreen from './screens/SupportScreen';
import SettingsScreen from './screens/SettingsScreen';
import SpaceDetailScreen from './screens/SpaceDetailScreen';
import ProductListScreen from './screens/ProductListScreen';
import AddProductModal from './components/AddProductModal';
import AddSpaceModal from './components/AddSpaceModal';
import CustomTabBar from './components/CustomTabBar';
import SplashScreen from './components/SplashScreen';

import { useSettingsStore } from './store/settingsStore';
import { useUIStore } from './store/uiStore';
import { colors } from './theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Home Stack Navigator
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen
        name="ProductList"
        component={ProductListScreen}
        options={{
          animation: Platform.OS === 'android' ? 'fade' : 'default',
        }}
      />
    </Stack.Navigator>
  );
}

// Spaces Stack Navigator
function SpacesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SpacesList" component={SpacesScreen} />
      <Stack.Screen
        name="SpaceDetail"
        component={SpaceDetailScreen}
        options={{
          animation: Platform.OS === 'android' ? 'fade' : 'default',
        }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Spaces" component={SpacesStack} options={{ title: 'Inventory' }} />
      <Tab.Screen name="Support" component={SupportScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const systemTheme = useColorScheme();
  const { theme: themeSetting } = useSettingsStore();
  const { isAddModalOpen, setAddModalOpen, editingProduct, isAddSpaceModalOpen, setAddSpaceModalOpen, addSpaceParentId } = useUIStore();

  const isDark = themeSetting === 'system' ? systemTheme === 'dark' : themeSetting === 'dark';
  const theme = isDark ? 'dark' : 'light';
  const themeColors = {
    primary: colors.primary[theme],
    background: colors.background[theme],
    card: colors.card[theme],
    text: colors.foreground[theme],
    border: colors.border[theme],
  };

  // Show splash screen on first launch
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer
        theme={{
          dark: isDark,
          colors: {
            primary: themeColors.primary,
            background: themeColors.background,
            card: themeColors.card,
            text: themeColors.text,
            border: themeColors.border,
            notification: colors.status.expired,
          },
        }}
      >
        <MainTabs />

        {/* Global Modal */}
        <AddProductModal
          visible={isAddModalOpen}
          onClose={() => setAddModalOpen(false)}
          editingProduct={editingProduct}
        />

        <AddSpaceModal
          visible={isAddSpaceModalOpen}
          onClose={() => setAddSpaceModalOpen(false)}
          defaultParentId={addSpaceParentId}
        />

      </NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}

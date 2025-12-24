import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, NavigationContainerRef, ParamListBase } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme, Platform, Alert } from 'react-native';

import HomeScreen from './screens/HomeScreen';
import SpacesScreen from './screens/SpacesScreen';
import SupportScreen from './screens/SupportScreen';
import MembersScreen from './screens/MembersScreen';
import SettingsScreen from './screens/SettingsScreen';
import SpaceDetailScreen from './screens/SpaceDetailScreen';
import ProductListScreen from './screens/ProductListScreen';
import FamilySpaceSettingsScreen from './screens/FamilySpaceSettingsScreen';
import AddProductModal from './components/AddProductModal';
import AddSpaceModal from './components/AddSpaceModal';
import CreateFamilySpaceModal from './components/CreateFamilySpaceModal';
import JoinSpaceModal from './components/JoinSpaceModal';
import InviteModal from './components/InviteModal';
import CustomTabBar from './components/CustomTabBar';
import SplashScreen from './components/SplashScreen';

import { useSettingsStore } from './store/settingsStore';
import { useUIStore } from './store/uiStore';
import { useUserStore } from './store/userStore';
import { useSpaceStore } from './store/spaceStore';
import { colors } from './theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Home Stack Navigator
function HomeStack({ onCreateSpace, onJoinSpace, onOpenProUpgrade, onInviteMembers, onSpaceSettings }: {
  onCreateSpace: () => void;
  onJoinSpace: () => void;
  onOpenProUpgrade: () => void;
  onInviteMembers: (spaceId: string) => void;
  onSpaceSettings: (spaceId: string) => void;
}) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain">
        {(props) => (
          <HomeScreen
            {...props}
            onCreateSpace={onCreateSpace}
            onJoinSpace={onJoinSpace}
            onOpenProUpgrade={onOpenProUpgrade}
            onInviteMembers={onInviteMembers}
            onSpaceSettings={onSpaceSettings}
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="ProductList"
        component={ProductListScreen}
        options={{
          animation: Platform.OS === 'android' ? 'fade' : 'default',
        }}
      />
      <Stack.Screen
        name="FamilySpaceSettings"
        component={FamilySpaceSettingsScreen}
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
      <Stack.Screen
        name="FamilySpaceSettings"
        component={FamilySpaceSettingsScreen}
        options={{
          animation: Platform.OS === 'android' ? 'fade' : 'default',
        }}
      />
    </Stack.Navigator>
  );
}

function MainTabs({ onCreateSpace, onJoinSpace, onOpenProUpgrade, onInviteMembers, onSpaceSettings }: {
  onCreateSpace: () => void;
  onJoinSpace: () => void;
  onOpenProUpgrade: () => void;
  onInviteMembers: (spaceId: string) => void;
  onSpaceSettings: (spaceId: string) => void;
}) {
  const { isPro } = useUserStore();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home">
        {() => (
          <HomeStack
            onCreateSpace={onCreateSpace}
            onJoinSpace={onJoinSpace}
            onOpenProUpgrade={onOpenProUpgrade}
            onInviteMembers={onInviteMembers}
            onSpaceSettings={onSpaceSettings}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Spaces" component={SpacesStack} options={{ title: 'Inventory' }} />
      <Tab.Screen
        name="SupportOrMembers"
        component={isPro ? MembersScreen : SupportScreen}
        options={{ title: isPro ? 'Members' : 'Support' }}
      />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const systemTheme = useColorScheme();
  const { theme: themeSetting } = useSettingsStore();
  const { isAddModalOpen, setAddModalOpen, editingProduct, isAddSpaceModalOpen, setAddSpaceModalOpen, addSpaceParentId } = useUIStore();
  const { initializeUser, isPro, setIsPro } = useUserStore();
  const { initializeMySpace } = useSpaceStore();

  // Family Space modal states
  const [isCreateFamilySpaceOpen, setIsCreateFamilySpaceOpen] = useState(false);
  const [isJoinSpaceOpen, setIsJoinSpaceOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteSpaceId, setInviteSpaceId] = useState<string | null>(null);

  // Navigation ref for programmatic navigation
  const navigationRef = useRef<NavigationContainerRef<ParamListBase>>(null);

  const isDark = themeSetting === 'system' ? systemTheme === 'dark' : themeSetting === 'dark';
  const theme = isDark ? 'dark' : 'light';
  const themeColors = {
    primary: colors.primary[theme],
    background: colors.background[theme],
    card: colors.card[theme],
    text: colors.foreground[theme],
    border: colors.border[theme],
  };

  // Initialize user and space when app loads
  useEffect(() => {
    if (!showSplash) {
      initializeUser();
      initializeMySpace();
    }
  }, [showSplash]);

  const handleCreateSpace = () => {
    if (!isPro) {
      handleProUpgrade();
      return;
    }
    setIsCreateFamilySpaceOpen(true);
  };

  const handleJoinSpace = () => {
    if (!isPro) {
      handleProUpgrade();
      return;
    }
    setIsJoinSpaceOpen(true);
  };

  const handleProUpgrade = () => {
    // For now, just show an alert with option to enable Pro for testing
    Alert.alert(
      'Pro Feature',
      'Family Spaces is a Pro feature. Upgrade to Pro to create and join shared spaces with your family.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enable Pro (Demo)',
          onPress: () => {
            setIsPro(true);
            Alert.alert('Pro Enabled', 'You now have access to Pro features for testing!');
          }
        },
      ]
    );
  };

  // Show splash screen on first launch
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer
        ref={navigationRef}
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
        <MainTabs
          onCreateSpace={handleCreateSpace}
          onJoinSpace={handleJoinSpace}
          onOpenProUpgrade={handleProUpgrade}
          onInviteMembers={(spaceId) => {
            setInviteSpaceId(spaceId);
            setIsInviteModalOpen(true);
          }}
          onSpaceSettings={(spaceId) => {
            // Navigate to FamilySpaceSettingsScreen
            (navigationRef.current as any)?.navigate('Home', {
              screen: 'FamilySpaceSettings',
              params: { spaceId }
            });
          }}
        />

        {/* Global Modals */}
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

        <CreateFamilySpaceModal
          visible={isCreateFamilySpaceOpen}
          onClose={() => setIsCreateFamilySpaceOpen(false)}
          onSuccess={(spaceId, spaceName) => {
            // Show invite modal after creating space
            setInviteSpaceId(spaceId);
            setIsInviteModalOpen(true);
          }}
        />

        <JoinSpaceModal
          visible={isJoinSpaceOpen}
          onClose={() => setIsJoinSpaceOpen(false)}
          onSuccess={(spaceName) => {
            // Optionally show a toast or navigate
          }}
        />

        {inviteSpaceId && (
          <InviteModal
            visible={isInviteModalOpen}
            onClose={() => {
              setIsInviteModalOpen(false);
              setInviteSpaceId(null);
            }}
            spaceId={inviteSpaceId}
          />
        )}

      </NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}

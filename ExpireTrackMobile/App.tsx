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
import AuthScreen from './screens/AuthScreen';
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
import { useSpaceStore, MY_SPACE_ID } from './store/spaceStore';
import { useProductStore } from './store/productStore';
import { supabase } from './lib/supabase';
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

const RootStack = createNativeStackNavigator();

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const systemTheme = useColorScheme();
  const { theme: themeSetting } = useSettingsStore();
  const { isAddModalOpen, setAddModalOpen, editingProduct, isAddSpaceModalOpen, setAddSpaceModalOpen, addSpaceParentId } = useUIStore();
  const { initializeUser, isPro, setIsPro } = useUserStore();
  const { fetchSpaces } = useSpaceStore();

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

  // Initialize user and spaces when app loads
  useEffect(() => {
    const init = async () => {
      if (!showSplash) {
        await initializeUser();
        await useSpaceStore.getState().fetchSpaces();

        // Load data for all spaces
        const allSpaces = useSpaceStore.getState().getFamilySpaces();
        const spaceIds = [MY_SPACE_ID, ...allSpaces.map(s => s.id)];
        await useProductStore.getState().fetchAllSpacesData(spaceIds);
      }
    };
    init();

    // Listen for auth state changes (e.g. login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 [App] Auth Event:', event);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Initialize in background to not block UI dismissal
        (async () => {
          try {
            await initializeUser();
            await useSpaceStore.getState().fetchSpaces();

            // Load data for all spaces
            const allSpaces = useSpaceStore.getState().getFamilySpaces();
            const spaceIds = [MY_SPACE_ID, ...allSpaces.map(s => s.id)];
            await useProductStore.getState().fetchAllSpacesData(spaceIds);

            console.log('✅ [App] Background init complete');
          } catch (err) {
            console.error('❌ [App] Background init failed:', err);
          }
        })();
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 [App] User signed out');
        await initializeUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [showSplash]);

  // Fetch products when space changes
  const currentSpaceId = useSpaceStore(state => state.currentSpaceId);
  const fetchData = useProductStore(state => state.fetchData);

  useEffect(() => {
    if (currentSpaceId) {
      fetchData(currentSpaceId);
    }
  }, [currentSpaceId]);

  // Real-time subscription: Subscribe to current space
  const { subscribeToSpace, unsubscribeAll } = useProductStore();
  useEffect(() => {
    if (currentSpaceId) {
      console.log('📡 [App] Auto-subscribing to space:', currentSpaceId);
      subscribeToSpace(currentSpaceId);
    }

    // Cleanup on unmount
    return () => {
      console.log('🧼 [App] Cleaning up subscriptions on unmount');
      unsubscribeAll();
    };
  }, [currentSpaceId]);

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
    Alert.alert(
      'Pro Feature',
      'Family Spaces and Cloud Sync are Pro features. Sign in or upgrade to unlock.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign In / Sign Up',
          onPress: () => (navigationRef.current as any)?.navigate('Auth')
        },
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
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Main">
            {() => (
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
            )}
          </RootStack.Screen>
          <RootStack.Screen
            name="Auth"
            component={AuthScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom'
            }}
          />
        </RootStack.Navigator>

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

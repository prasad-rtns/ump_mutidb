import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { getCategoryById } from "./src/data/mock";
import { AboutScreen } from "./src/screens/AboutScreen";
import { AttractionsHomeScreen } from "./src/screens/AttractionsHomeScreen";
import { ContactScreen } from "./src/screens/ContactScreen";
import { DiscoverScreen } from "./src/screens/DiscoverScreen";
import { EServicesScreen } from "./src/screens/EServicesScreen";
import { EventDetailsScreen } from "./src/screens/EventDetailsScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LegalScreen } from "./src/screens/LegalScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { MoreMenuScreen } from "./src/screens/MoreMenuScreen";
import { OpenCallDetailScreen } from "./src/screens/OpenCallDetailScreen";
import { PlaceDetailScreen } from "./src/screens/PlaceDetailScreen";
import { PlaceListScreen } from "./src/screens/PlaceListScreen";
import { WhatsOnScreen } from "./src/screens/WhatsOnScreen";
import type {
  AttractionStackParamList,
  MoreStackParamList,
  WhatsOnStackParamList,
} from "./src/types";
import { fontSans, theme } from "./src/theme";

const Tab = createBottomTabNavigator();
const AttractionStack = createNativeStackNavigator<AttractionStackParamList>();
const WhatsOnStackNav = createNativeStackNavigator<WhatsOnStackParamList>();
const MoreStackNav = createNativeStackNavigator<MoreStackParamList>();

const stackScreenOptions = {
  headerStyle: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  headerTintColor: theme.colors.primary,
  headerShadowVisible: false,
  headerTitleStyle: {
    fontWeight: "700" as const,
    fontFamily: fontSans,
    color: theme.colors.text,
    fontSize: 17,
  },
};

function AttractionsNavigator() {
  return (
    <AttractionStack.Navigator screenOptions={stackScreenOptions}>
      <AttractionStack.Screen
        name="AttractionsHome"
        component={AttractionsHomeScreen}
        options={{ headerShown: false }}
      />
      <AttractionStack.Screen
        name="PlaceList"
        component={PlaceListScreen}
        options={({ route }) => ({
          title: getCategoryById(route.params.categoryId)?.title ?? "Places",
        })}
      />
      <AttractionStack.Screen
        name="PlaceDetail"
        component={PlaceDetailScreen}
        options={({ route }) => ({ title: route.params.place.name })}
      />
    </AttractionStack.Navigator>
  );
}

function WhatsOnNavigator() {
  return (
    <WhatsOnStackNav.Navigator screenOptions={stackScreenOptions}>
      <WhatsOnStackNav.Screen
        name="WhatsOnHome"
        component={WhatsOnScreen}
        options={{ headerShown: false }}
      />
      <WhatsOnStackNav.Screen
        name="EventDetails"
        component={EventDetailsScreen}
        options={{ title: "Event" }}
      />
      <WhatsOnStackNav.Screen
        name="OpenCallDetails"
        component={OpenCallDetailScreen}
        options={{ title: "Open call" }}
      />
    </WhatsOnStackNav.Navigator>
  );
}

function MoreNavigator() {
  return (
    <MoreStackNav.Navigator screenOptions={stackScreenOptions}>
      <MoreStackNav.Screen
        name="MoreMenu"
        component={MoreMenuScreen}
        options={{ headerShown: false }}
      />
      <MoreStackNav.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: "Sign in" }}
      />
      <MoreStackNav.Screen
        name="About"
        component={AboutScreen}
        options={{ title: "About us" }}
      />
      <MoreStackNav.Screen
        name="EServices"
        component={EServicesScreen}
        options={{ title: "E-Services" }}
      />
      <MoreStackNav.Screen
        name="Contact"
        component={ContactScreen}
        options={{ title: "Contact" }}
      />
      <MoreStackNav.Screen
        name="Legal"
        component={LegalScreen}
        options={{ title: "Privacy & legal" }}
      />
    </MoreStackNav.Navigator>
  );
}

function AppNavigation() {
  const { ready } = useAuth();
  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: "#8fa09e",
            tabBarStyle: {
              backgroundColor: theme.colors.tabBar,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
              height: 58,
              paddingTop: 4,
              paddingBottom: 6,
            },
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: "600",
              fontFamily: fontSans,
            },
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="home-outline" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Attractions"
            component={AttractionsNavigator}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="business-outline" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="WhatsOn"
            component={WhatsOnNavigator}
            options={{
              tabBarLabel: "What's On",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="calendar-outline" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Discover"
            component={DiscoverScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="images-outline" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="More"
            component={MoreNavigator}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="menu-outline" size={size} color={color} />
              ),
            }}
          />
        </Tab.Navigator>
        <StatusBar style="dark" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenShell } from "../components/ScreenShell";
import { SiteFooter } from "../components/SiteFooter";
import { useAuth } from "../context/AuthContext";
import { commonStyles } from "../styles/common";
import type { MoreStackParamList } from "../types";
import { theme } from "../theme";

const ROWS: {
  key: keyof MoreStackParamList;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: "About",
    label: "About us",
    subtitle: "Who we are, mission, and strategic context",
    icon: "information-circle-outline",
  },
  {
    key: "EServices",
    label: "E-Services",
    subtitle: "Memberships, forms, and digital services",
    icon: "desktop-outline",
  },
  {
    key: "Contact",
    label: "Contact",
    subtitle: "Contact centre and channels",
    icon: "call-outline",
  },
  {
    key: "Legal",
    label: "Privacy & legal",
    subtitle: "Policies and terms (links to official site)",
    icon: "document-text-outline",
  },
];

export function MoreMenuScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MoreStackParamList, "MoreMenu">>();
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={commonStyles.screen} edges={["top"]}>
      <ScreenShell>
        <ScrollView
          contentContainerStyle={commonStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={commonStyles.pageTitle}>More</Text>
          <Text style={styles.lead}>
            About, e-services, and contact — grouped like footer and utility areas on
            dubaiculture.gov.ae.
          </Text>

          {user ? (
            <View style={styles.accountCard}>
              <View style={styles.accountIcon}>
                <Ionicons name="person-circle" size={40} color={theme.colors.brandGreen} />
              </View>
              <View style={styles.accountText}>
                <Text style={styles.accountHi}>Signed in</Text>
                <Text style={styles.accountEmail}>{user.email}</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.9 }]}
                onPress={() => signOut()}
              >
                <Text style={styles.signOutText}>Sign out</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.signInCard, pressed && { opacity: 0.95 }]}
              onPress={() => navigation.navigate("Login")}
            >
              <Ionicons name="log-in-outline" size={24} color={theme.colors.brandGreen} />
              <View style={styles.signInText}>
                <Text style={styles.signInTitle}>Sign in</Text>
                <Text style={styles.signInSub}>
                  Access e-services and your profile (POC mock)
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
            </Pressable>
          )}

          {ROWS.map((row) => (
            <Pressable
              key={row.key}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}
              onPress={() => navigation.navigate(row.key)}
            >
              <View style={styles.iconBox}>
                <Ionicons name={row.icon} size={22} color={theme.colors.brandGreen} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{row.label}</Text>
                <Text style={styles.rowSub}>{row.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
            </Pressable>
          ))}
          <SiteFooter />
        </ScrollView>
      </ScreenShell>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  lead: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 21,
    marginBottom: 12,
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 14,
  },
  accountIcon: {
    marginRight: 4,
  },
  accountText: {
    flex: 1,
    gap: 2,
  },
  accountHi: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  accountEmail: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
  },
  signOutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceMuted,
  },
  signOutText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.textMuted,
  },
  signInCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 14,
  },
  signInText: {
    flex: 1,
    gap: 4,
  },
  signInTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  signInSub: {
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  rowSub: {
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
});

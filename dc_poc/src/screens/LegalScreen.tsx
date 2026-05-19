import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenShell } from "../components/ScreenShell";
import { SITE_BASE } from "../data/mock";
import { commonStyles } from "../styles/common";
import { theme } from "../theme";

const LINKS: { label: string; path: string }[] = [
  { label: "Privacy policy", path: "/en/privacy-policy" },
  { label: "Terms & conditions", path: "/en/terms-and-conditions" },
  { label: "Accessibility", path: "/en/accessibility" },
];

export function LegalScreen() {
  return (
    <SafeAreaView style={commonStyles.screen} edges={["top"]}>
      <ScreenShell>
        <ScrollView
          contentContainerStyle={commonStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.lead}>
            Legal and policy pages are hosted on the official website. The POC opens
            them in your browser.
          </Text>
          {LINKS.map((l) => (
            <Pressable
              key={l.path}
              style={({ pressed }) => [
                commonStyles.card,
                styles.row,
                pressed && { opacity: 0.92 },
              ]}
              onPress={() => Linking.openURL(`${SITE_BASE}${l.path}`)}
            >
              <Text style={commonStyles.cardTitle}>{l.label}</Text>
              <Text style={styles.chev}>›</Text>
            </Pressable>
          ))}
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    marginBottom: 8,
  },
  chev: {
    fontSize: 22,
    color: theme.colors.textMuted,
  },
});

import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenShell } from "../components/ScreenShell";
import { SITE_BASE } from "../data/mock";
import { commonStyles } from "../styles/common";
import { theme } from "../theme";

const SERVICES: { id: string; title: string; description: string; path: string }[] = [
  {
    id: "lib",
    title: "Library membership",
    description: "Apply for or renew Dubai Public Library membership.",
    path: "/en/e-services/New-Membership",
  },
  {
    id: "forms",
    title: "E-services forms",
    description: "Unified forms for programmes, shelf displays, and creative submissions.",
    path: "/en/e-services-forms",
  },
  {
    id: "booking",
    title: "Venue & programme booking",
    description: "Request visits, workshops, or space use where applicable.",
    path: "/en/e-services",
  },
];

export function EServicesScreen() {
  return (
    <SafeAreaView style={commonStyles.screen} edges={["top"]}>
      <ScreenShell>
        <ScrollView
          contentContainerStyle={commonStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.lead}>
            Digital entry points aligned with the official E-Services section — links
            open the real website in your browser (POC).
          </Text>
          {SERVICES.map((s) => (
            <Pressable
              key={s.id}
              style={({ pressed }) => [
                commonStyles.card,
                styles.card,
                pressed && { opacity: 0.92 },
              ]}
              onPress={() => Linking.openURL(`${SITE_BASE}${s.path}`)}
            >
              <Text style={commonStyles.cardTitle}>{s.title}</Text>
              <Text style={commonStyles.cardBody}>{s.description}</Text>
              <Text style={styles.link}>Open on dubaiculture.gov.ae →</Text>
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
  card: {
    padding: 16,
    gap: 8,
    marginBottom: 4,
  },
  link: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.accentDark,
  },
});

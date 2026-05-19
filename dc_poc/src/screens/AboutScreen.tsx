import { Image } from "expo-image";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenShell } from "../components/ScreenShell";
import { HERO_IMAGE, SITE_BASE } from "../data/mock";
import { commonStyles } from "../styles/common";
import { theme } from "../theme";

export function AboutScreen() {
  return (
    <SafeAreaView style={commonStyles.screen} edges={["top"]}>
      <ScreenShell>
        <ScrollView
          contentContainerStyle={commonStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandRow}>
            <Image
              source={{ uri: HERO_IMAGE }}
              style={styles.brandImage}
              contentFit="cover"
            />
            <View style={styles.brandText}>
              <Text style={commonStyles.pageTitle}>About us</Text>
              <Text style={styles.lead}>
                Dubai Culture & Arts Authority leads cultural and creative development
                through heritage, arts, libraries, and public engagement — the same
                positioning as the public website (POC copy).
              </Text>
            </View>
          </View>

          <View style={[commonStyles.card, styles.block]}>
            <Text style={commonStyles.sectionTitle}>Who we are</Text>
            <Text style={commonStyles.cardBody}>
              We enable residents and visitors to experience Dubai’s culture, safeguard
              heritage, and grow a sustainable creative economy through programmes,
              infrastructure, and partnerships.
            </Text>
          </View>

          <View style={[commonStyles.card, styles.block]}>
            <Text style={commonStyles.sectionTitle}>Strategic map</Text>
            <Text style={commonStyles.cardBody}>
              The authority publishes strategic priorities and sector maps on the
              official site — integrate PDFs or web views here for production.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.outlineBtn, pressed && { opacity: 0.9 }]}
              onPress={() => Linking.openURL(`${SITE_BASE}/en/about-us`)}
            >
              <Text style={styles.outlineBtnText}>View about section on official site</Text>
            </Pressable>
          </View>

          <View style={[commonStyles.card, styles.block]}>
            <Text style={commonStyles.sectionTitle}>Open data</Text>
            <Text style={commonStyles.cardBody}>
              Open datasets and Dubai Pulse contributions are listed on the website for
              researchers and partners.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.outlineBtn, pressed && { opacity: 0.9 }]}
              onPress={() => Linking.openURL(`${SITE_BASE}/en/about-us/open-data`)}
            >
              <Text style={styles.outlineBtnText}>Open data portal</Text>
            </Pressable>
          </View>
        </ScrollView>
      </ScreenShell>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  brandRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    marginBottom: 4,
    flexWrap: "wrap",
  },
  brandImage: {
    width: 88,
    height: 88,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.border,
  },
  brandText: {
    flex: 1,
    minWidth: 200,
    gap: 6,
  },
  lead: {
    fontSize: 15,
    color: theme.colors.textMuted,
    lineHeight: 22,
  },
  block: {
    padding: 16,
    gap: 10,
    marginBottom: 4,
  },
  outlineBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.brandGreen,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  outlineBtnText: {
    color: theme.colors.brandGreen,
    fontWeight: "700",
    fontSize: 14,
  },
});

import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenShell } from "../components/ScreenShell";
import { SITE_BASE } from "../data/mock";
import { commonStyles } from "../styles/common";
import { theme } from "../theme";

export function ContactScreen() {
  return (
    <SafeAreaView style={commonStyles.screen} edges={["top"]}>
      <ScreenShell>
        <ScrollView
          contentContainerStyle={commonStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.lead}>
            Get in touch — placeholder details for POC; replace with official contact
            centre numbers and hours.
          </Text>
          <View style={[commonStyles.card, styles.block]}>
            <Text style={commonStyles.sectionTitle}>Contact centre</Text>
            <Text style={commonStyles.cardBody}>
              Phone: +971 4 000 0000{"\n"}
              Email: info@dubaiculture.ae{"\n"}
              Hours: Sun–Thu, 8:00–16:00 (example)
            </Text>
          </View>
          <View style={[commonStyles.card, styles.block]}>
            <Text style={commonStyles.sectionTitle}>Social</Text>
            <Text style={commonStyles.cardBody}>
              Follow official channels listed on the website for announcements and
              events.
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]}
            onPress={() => Linking.openURL(`${SITE_BASE}/en/contact-us`)}
          >
            <Text style={styles.btnText}>Contact page on official site</Text>
          </Pressable>
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
  block: {
    padding: 16,
    gap: 8,
    marginBottom: 8,
  },
  btn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});

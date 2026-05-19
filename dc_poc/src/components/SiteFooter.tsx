import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { fontSans, theme } from "../theme";
import { SITE_BASE } from "../data/mock";

const FOOTER_LINKS: { label: string; path: string }[] = [
  { label: "Privacy policy", path: "/en/privacy-policy" },
  { label: "Terms & conditions", path: "/en/terms-and-conditions" },
  { label: "Site map", path: "/en/site-map" },
];

export function SiteFooter() {
  return (
    <View style={styles.wrap}>
      <View style={styles.brandLine}>
        <View style={styles.goldRule} />
        <Text style={styles.line}>Dubai Culture & Arts Authority</Text>
      </View>
      <Text style={styles.muted}>
        POC replica — official information:{" "}
        <Text style={styles.linkInline} onPress={() => Linking.openURL(SITE_BASE)}>
          dubaiculture.gov.ae
        </Text>
      </Text>
      <View style={styles.links}>
        {FOOTER_LINKS.map((l) => (
          <Pressable
            key={l.path}
            onPress={() => Linking.openURL(`${SITE_BASE}${l.path}`)}
          >
            <Text style={styles.link}>{l.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    fontFamily: fontSans,
    backgroundColor: theme.colors.footerBg,
    borderRadius: theme.radius.md,
    padding: 18,
    gap: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  brandLine: {
    gap: 10,
  },
  goldRule: {
    width: 48,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.accent,
  },
  line: {
    fontFamily: fontSans,
    color: theme.colors.footerText,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  muted: {
    fontFamily: fontSans,
    color: theme.colors.footerMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  linkInline: {
    color: theme.colors.accent,
    textDecorationLine: "underline",
    fontWeight: "600",
  },
  links: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 4,
  },
  link: {
    fontFamily: fontSans,
    color: theme.colors.footerText,
    fontSize: 13,
    textDecorationLine: "underline",
    opacity: 0.95,
  },
});

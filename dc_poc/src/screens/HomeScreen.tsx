import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../components/AppHeader";
import { ScreenShell } from "../components/ScreenShell";
import { SiteFooter } from "../components/SiteFooter";
import { EVENTS, HERO_IMAGE, NEWS, QUICK_LINKS, SECTIONS } from "../data/mock";
import { commonStyles } from "../styles/common";
import type { QuickLink, RootTabParamList } from "../types";
import { theme } from "../theme";

const ICON_MAP: Record<
  QuickLink["icon"],
  keyof typeof Ionicons.glyphMap
> = {
  calendar: "calendar-outline",
  map: "map-outline",
  images: "images-outline",
  document: "document-text-outline",
  call: "call-outline",
  globe: "globe-outline",
};

export function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();

  function handleQuickLink(q: QuickLink) {
    if (q.target.type === "url") {
      Linking.openURL(q.target.url);
      return;
    }
    if (q.target.type === "tab") {
      navigation.navigate(q.target.tab);
      return;
    }
    navigation.navigate(
      q.target.tab,
      {
        screen: q.target.screen,
        params: q.target.params,
      } as never
    );
  }

  const featured = EVENTS.slice(0, 4);

  return (
    <SafeAreaView style={commonStyles.screen} edges={["top"]}>
      <ScreenShell>
        <ScrollView
          contentContainerStyle={commonStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <AppHeader onSearchPress={() => Alert.alert("Search", "Quick search — POC (connect to CMS or API later).")} />

          <Text style={styles.quickLabel}>Quick links</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickRow}
          >
            {QUICK_LINKS.map((q) => (
              <Pressable
                key={q.id}
                style={({ pressed }) => [styles.quickChip, pressed && { opacity: 0.88 }]}
                onPress={() => handleQuickLink(q)}
              >
                <Ionicons
                  name={ICON_MAP[q.icon]}
                  size={18}
                  color={theme.colors.primary}
                />
                <Text style={styles.quickText}>{q.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.hero}>
            <Image
              source={{ uri: HERO_IMAGE }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
            />
            <LinearGradient
              colors={["rgba(13,79,71,0.25)", "rgba(8,48,43,0.92)"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroInner}>
              <Text style={styles.heroEyebrow}>Dubai Culture & Arts Authority</Text>
              <Text style={styles.heroTitle}>Culture. Heritage. Creativity.</Text>
              <Text style={styles.heroSubtitle}>
                Preserving identity, enabling artists, and connecting communities
                across Dubai.
              </Text>
            </View>
          </View>

          <View style={styles.rowHead}>
            <Text style={commonStyles.sectionTitle}>Featured — What's On</Text>
            <Pressable onPress={() => navigation.navigate("WhatsOn")}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredRow}
          >
            {featured.map((ev) => (
              <Pressable
                key={ev.id}
                style={({ pressed }) => [
                  styles.featuredCard,
                  pressed && { opacity: 0.9 },
                ]}
                onPress={() =>
                  navigation.navigate("WhatsOn", {
                    screen: "EventDetails",
                    params: { event: ev },
                  })
                }
              >
                <Image
                  source={{ uri: ev.imageUrl }}
                  style={styles.featuredImg}
                  contentFit="cover"
                />
                <View style={styles.featuredPad}>
                  <Text style={styles.featuredTitle} numberOfLines={2}>
                    {ev.title}
                  </Text>
                  <Text style={styles.featuredMeta} numberOfLines={1}>
                    {ev.date}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={commonStyles.sectionTitle}>Attractions</Text>
          <Text style={styles.sectionLead}>
            Museums, libraries, heritage sites, and cultural arts centres — browse
            by category like on the official site.
          </Text>
          <View style={styles.attrGrid}>
            {SECTIONS.map((item) => (
              <Pressable
                key={item.title}
                style={({ pressed }) => [
                  commonStyles.card,
                  styles.attrCard,
                  pressed && { opacity: 0.92 },
                ]}
                onPress={() => {
                  const map: Record<string, string> = {
                    Museums: "museums",
                    Libraries: "libraries",
                    "Heritage sites": "heritage_sites",
                    "Cultural arts & centres": "cultural_centres",
                  };
                  const categoryId = map[item.title];
                  if (categoryId) {
                    navigation.navigate("Attractions", {
                      screen: "PlaceList",
                      params: { categoryId },
                    });
                  }
                }}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.attrImg}
                  contentFit="cover"
                />
                <View style={styles.attrPad}>
                  <Text style={commonStyles.cardTitle}>{item.title}</Text>
                  <Text style={commonStyles.cardBody} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          <Text style={commonStyles.sectionTitle}>News & stories</Text>
          {NEWS.map((n) => (
            <View key={n.id} style={[commonStyles.card, styles.newsCard]}>
              <Image
                source={{ uri: n.imageUrl }}
                style={styles.newsImg}
                contentFit="cover"
              />
              <View style={styles.newsBody}>
                <Text style={styles.newsDate}>{n.date}</Text>
                <Text style={styles.newsTitle}>{n.title}</Text>
                <Text style={commonStyles.cardBody}>{n.excerpt}</Text>
              </View>
            </View>
          ))}

          <SiteFooter />
        </ScrollView>
      </ScreenShell>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  quickLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  quickRow: {
    gap: 10,
    paddingBottom: 4,
  },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    ...theme.shadow.card,
  },
  quickText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  hero: {
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    minHeight: 220,
    justifyContent: "flex-end",
    marginTop: 4,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadow.card,
  },
  heroInner: {
    padding: 18,
    gap: 6,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.accentLight,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 22,
    maxWidth: 520,
  },
  rowHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 8,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.accentDark,
  },
  featuredRow: {
    gap: 12,
    paddingVertical: 4,
  },
  featuredCard: {
    width: 220,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    overflow: "hidden",
    ...theme.shadow.card,
  },
  featuredImg: {
    width: "100%",
    height: 110,
    backgroundColor: theme.colors.border,
  },
  featuredPad: {
    padding: 10,
    gap: 4,
  },
  featuredTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
  },
  featuredMeta: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  sectionLead: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 21,
    marginBottom: 8,
    marginTop: -6,
  },
  attrGrid: {
    gap: 12,
  },
  attrCard: {
    overflow: "hidden",
  },
  attrImg: {
    width: "100%",
    height: 120,
    backgroundColor: theme.colors.border,
  },
  attrPad: {
    padding: 14,
    gap: 6,
  },
  newsCard: {
    flexDirection: "row",
    overflow: "hidden",
    gap: 0,
    padding: 0,
  },
  newsImg: {
    width: 112,
    minHeight: 100,
    backgroundColor: theme.colors.border,
  },
  newsBody: {
    flex: 1,
    padding: 12,
    gap: 4,
    justifyContent: "center",
  },
  newsDate: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: "600",
  },
  newsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
  },
});

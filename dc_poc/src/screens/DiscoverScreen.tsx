import { Image } from "expo-image";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenShell } from "../components/ScreenShell";
import { EXPLORE_TILES, GALLERY } from "../data/mock";
import { commonStyles } from "../styles/common";
import { theme } from "../theme";

export function DiscoverScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 600;
  const col = isWide ? "31%" : "47%";

  return (
    <SafeAreaView style={commonStyles.screen} edges={["top"]}>
      <ScreenShell>
        <ScrollView
          contentContainerStyle={commonStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={commonStyles.pageTitle}>Discover</Text>
          <Text style={styles.lead}>
            Gallery, stories, and highlights — mirroring the public site’s “Discover”
            area (POC content).
          </Text>

          <Text style={commonStyles.sectionTitle}>Gallery</Text>
          <View style={styles.gallery}>
            {GALLERY.map((g) => (
              <View key={g.id} style={[styles.gCell, { width: col }]}>
                <Image
                  source={{ uri: g.imageUrl }}
                  style={styles.gImg}
                  contentFit="cover"
                />
                <Text style={styles.gCap} numberOfLines={2}>
                  {g.title}
                </Text>
              </View>
            ))}
          </View>

          <Text style={commonStyles.sectionTitle}>Topics</Text>
          <View style={styles.grid}>
            {EXPLORE_TILES.map((tile) => (
              <View key={tile.id} style={[styles.tileWrap, { width: isWide ? "48%" : "100%" }]}>
                <View style={commonStyles.card}>
                  <Image
                    source={{ uri: tile.imageUrl }}
                    style={styles.tileImage}
                    contentFit="cover"
                  />
                  <View style={styles.tilePad}>
                    <Text style={commonStyles.cardTitle}>{tile.title}</Text>
                    <Text style={commonStyles.cardBody}>{tile.description}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </ScreenShell>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  lead: {
    fontSize: 15,
    color: theme.colors.textMuted,
    lineHeight: 22,
    marginBottom: 8,
  },
  gallery: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
    marginBottom: 8,
  },
  gCell: {
    borderRadius: theme.radius.md,
    overflow: "hidden",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  gImg: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: theme.colors.border,
  },
  gCap: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.text,
    padding: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  tileWrap: {
    flexGrow: 1,
    minWidth: 0,
  },
  tileImage: {
    width: "100%",
    height: 110,
    backgroundColor: theme.colors.border,
  },
  tilePad: {
    padding: 14,
    gap: 6,
  },
});

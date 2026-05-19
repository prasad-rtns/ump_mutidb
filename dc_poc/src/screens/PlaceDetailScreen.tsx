import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenShell } from "../components/ScreenShell";
import type { AttractionStackParamList } from "../types";
import { commonStyles } from "../styles/common";
import { theme } from "../theme";

type Props = NativeStackScreenProps<AttractionStackParamList, "PlaceDetail">;

export function PlaceDetailScreen({ route }: Props) {
  const { place } = route.params;

  return (
    <SafeAreaView style={commonStyles.screen} edges={["top"]}>
      <ScreenShell>
        <ScrollView
          contentContainerStyle={commonStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Image
              source={{ uri: place.imageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(10, 61, 55, 0.92)"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>{place.name}</Text>
              <Text style={styles.heroMeta}>{place.area}</Text>
            </View>
          </View>

          <View style={[commonStyles.card, styles.block]}>
            <Text style={commonStyles.sectionTitle}>Overview</Text>
            <Text style={commonStyles.cardBody}>{place.summary}</Text>
            <Text style={styles.note}>
              POC placeholder copy — replace with CMS content for production.
            </Text>
          </View>
        </ScrollView>
      </ScreenShell>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    minHeight: 220,
    justifyContent: "flex-end",
  },
  heroText: {
    padding: 16,
    gap: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
  },
  heroMeta: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
  block: {
    padding: 16,
    gap: 8,
  },
  note: {
    fontSize: 12,
    color: "#9a8a7c",
    marginTop: 6,
    fontStyle: "italic",
  },
});

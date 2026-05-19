import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenShell } from "../components/ScreenShell";
import type { WhatsOnStackParamList } from "../types";
import { commonStyles } from "../styles/common";
import { theme } from "../theme";

type Props = NativeStackScreenProps<WhatsOnStackParamList, "EventDetails">;

export function EventDetailsScreen({ route }: Props) {
  const { event } = route.params;

  return (
    <SafeAreaView style={commonStyles.screen} edges={["top"]}>
      <ScreenShell>
        <ScrollView
          contentContainerStyle={commonStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Image
              source={{ uri: event.imageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(10, 61, 55, 0.92)"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>{event.title}</Text>
              <Text style={styles.heroMeta}>
                {event.date} · {event.venue}
              </Text>
            </View>
          </View>

          <View style={[commonStyles.card, styles.detailCard]}>
            <Text style={commonStyles.sectionTitle}>About</Text>
            <Text style={commonStyles.cardBody}>{event.summary}</Text>
          </View>

          <View style={[commonStyles.card, styles.detailCard]}>
            <Text style={commonStyles.sectionTitle}>Category</Text>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{event.category}</Text>
            </View>
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
    letterSpacing: -0.3,
  },
  heroMeta: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
  detailCard: {
    padding: 16,
    gap: 8,
  },
  pill: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.accentDark,
  },
});

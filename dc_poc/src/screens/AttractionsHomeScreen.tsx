import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenShell } from "../components/ScreenShell";
import { CATEGORIES } from "../data/mock";
import { commonStyles } from "../styles/common";
import type { AttractionStackParamList } from "../types";
import { theme } from "../theme";

type Nav = NativeStackNavigationProp<AttractionStackParamList, "AttractionsHome">;

export function AttractionsHomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={commonStyles.screen} edges={["top"]}>
      <ScreenShell>
        <ScrollView
          contentContainerStyle={commonStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={commonStyles.pageTitle}>Attractions</Text>
          <Text style={styles.lead}>
            Explore museums, libraries, heritage sites, and cultural arts centres —
            the same pillars highlighted on the public website.
          </Text>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              style={({ pressed }) => [
                commonStyles.card,
                styles.card,
                pressed && { opacity: 0.92 },
              ]}
              onPress={() =>
                navigation.navigate("PlaceList", { categoryId: cat.id })
              }
            >
              <Image
                source={{ uri: cat.imageUrl }}
                style={styles.img}
                contentFit="cover"
              />
              <View style={styles.pad}>
                <Text style={commonStyles.cardTitle}>{cat.title}</Text>
                <Text style={commonStyles.cardBody}>{cat.description}</Text>
                <Text style={styles.cta}>View places →</Text>
              </View>
            </Pressable>
          ))}
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
    marginBottom: 4,
  },
  card: {
    overflow: "hidden",
    marginBottom: 0,
  },
  img: {
    width: "100%",
    height: 140,
    backgroundColor: theme.colors.border,
  },
  pad: {
    padding: 14,
    gap: 6,
  },
  cta: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.accentDark,
  },
});

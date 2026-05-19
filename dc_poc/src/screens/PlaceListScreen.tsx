import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenShell } from "../components/ScreenShell";
import { getCategoryById, getPlacesByCategory } from "../data/mock";
import { commonStyles } from "../styles/common";
import type { AttractionStackParamList, PlaceItem } from "../types";
import { theme } from "../theme";

type Props = NativeStackScreenProps<AttractionStackParamList, "PlaceList">;

export function PlaceListScreen({ route, navigation }: Props) {
  const { categoryId } = route.params;
  const category = getCategoryById(categoryId);
  const places = getPlacesByCategory(categoryId);

  const title = category?.title ?? "Places";

  const renderItem = ({ item }: { item: PlaceItem }) => (
    <Pressable
      style={({ pressed }) => [
        commonStyles.card,
        styles.row,
        pressed && { opacity: 0.92 },
      ]}
      onPress={() => navigation.navigate("PlaceDetail", { place: item })}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.thumb}
        contentFit="cover"
      />
      <View style={styles.body}>
        <Text style={commonStyles.cardTitle}>{item.name}</Text>
        <Text style={commonStyles.meta}>{item.area}</Text>
        <Text style={commonStyles.cardBody} numberOfLines={2}>
          {item.summary}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={commonStyles.screen} edges={["top"]}>
      <ScreenShell>
        <FlatList
          contentContainerStyle={commonStyles.scrollContent}
          data={places}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={commonStyles.pageTitle}>{title}</Text>
              {category ? (
                <Text style={styles.lead}>{category.description}</Text>
              ) : null}
            </View>
          }
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            <Text style={styles.empty}>No places in this category (POC).</Text>
          }
        />
      </ScreenShell>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 12,
    gap: 6,
  },
  lead: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 21,
  },
  row: {
    flexDirection: "row",
    overflow: "hidden",
    padding: 0,
  },
  thumb: {
    width: 108,
    minHeight: 100,
    backgroundColor: theme.colors.border,
  },
  body: {
    flex: 1,
    padding: 12,
    gap: 4,
    justifyContent: "center",
  },
  empty: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: "center",
    paddingVertical: 24,
  },
});

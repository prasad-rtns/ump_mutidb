import { Image } from "expo-image";
import { useMemo, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenShell } from "../components/ScreenShell";
import { EVENTS, OPEN_CALLS } from "../data/mock";
import type {
  EventItem,
  OpenCallItem,
  WhatsOnStackParamList,
} from "../types";
import { commonStyles } from "../styles/common";
import { theme } from "../theme";

type Props = NativeStackScreenProps<WhatsOnStackParamList, "WhatsOnHome">;

export function WhatsOnScreen({ navigation }: Props) {
  const [mode, setMode] = useState<"events" | "openCalls">("events");
  const [query, setQuery] = useState("");

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return EVENTS;
    return EVENTS.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q)
    );
  }, [query]);

  const filteredCalls = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return OPEN_CALLS;
    return OPEN_CALLS.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        o.summary.toLowerCase().includes(q) ||
        o.department.toLowerCase().includes(q)
    );
  }, [query]);

  function renderEvent({ item }: { item: EventItem }) {
    return (
      <Pressable
        style={({ pressed }) => [
          commonStyles.card,
          styles.eventRow,
          pressed && styles.pressed,
        ]}
        onPress={() => navigation.navigate("EventDetails", { event: item })}
      >
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.thumb}
          contentFit="cover"
        />
        <View style={styles.eventBody}>
          <Text style={commonStyles.cardTitle}>{item.title}</Text>
          <Text style={commonStyles.meta}>
            {item.date} · {item.venue}
          </Text>
          <Text style={commonStyles.cardBody} numberOfLines={2}>
            {item.summary}
          </Text>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{item.category}</Text>
          </View>
        </View>
      </Pressable>
    );
  }

  function renderOpenCall({ item }: { item: OpenCallItem }) {
    return (
      <Pressable
        style={({ pressed }) => [
          commonStyles.card,
          styles.callCard,
          pressed && styles.pressed,
        ]}
        onPress={() => navigation.navigate("OpenCallDetails", { openCall: item })}
      >
        <Text style={commonStyles.cardTitle}>{item.title}</Text>
        <Text style={commonStyles.meta}>Deadline: {item.deadline}</Text>
        <Text style={commonStyles.cardBody} numberOfLines={3}>
          {item.summary}
        </Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{item.department}</Text>
        </View>
      </Pressable>
    );
  }

  const empty =
    mode === "events"
      ? filteredEvents.length === 0
      : filteredCalls.length === 0;

  return (
    <SafeAreaView style={commonStyles.screen} edges={["top"]}>
      <ScreenShell>
        <FlatList<EventItem | OpenCallItem>
          contentContainerStyle={commonStyles.scrollContent}
          data={mode === "events" ? filteredEvents : filteredCalls}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View>
              <Text style={commonStyles.pageTitle}>What's On</Text>
              <Text style={styles.lead}>
                Events and open calls — two pillars of the public “What's On” area.
              </Text>
              <View style={styles.segment}>
                <Pressable
                  style={[styles.segBtn, mode === "events" && styles.segBtnOn]}
                  onPress={() => setMode("events")}
                >
                  <Text
                    style={[styles.segText, mode === "events" && styles.segTextOn]}
                  >
                    Events
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.segBtn, mode === "openCalls" && styles.segBtnOn]}
                  onPress={() => setMode("openCalls")}
                >
                  <Text
                    style={[
                      styles.segText,
                      mode === "openCalls" && styles.segTextOn,
                    ]}
                  >
                    Open calls
                  </Text>
                </Pressable>
              </View>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={
                  mode === "events"
                    ? "Search events..."
                    : "Search open calls..."
                }
                placeholderTextColor="#9a8a7c"
                style={commonStyles.search}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {empty ? (
                <Text style={styles.empty}>No results match your search.</Text>
              ) : null}
            </View>
          }
          renderItem={({ item }) =>
            mode === "events"
              ? renderEvent({ item: item as EventItem })
              : renderOpenCall({ item: item as OpenCallItem })
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
        />
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
  segment: {
    flexDirection: "row",
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 12,
    padding: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  segBtnOn: {
    backgroundColor: theme.colors.primaryMuted,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  segText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textMuted,
  },
  segTextOn: {
    color: theme.colors.primaryDark,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  pressed: {
    opacity: 0.92,
  },
  thumb: {
    width: 108,
    minHeight: 112,
    backgroundColor: theme.colors.border,
  },
  eventBody: {
    flex: 1,
    padding: 12,
    gap: 4,
    justifyContent: "center",
  },
  callCard: {
    padding: 14,
    gap: 6,
  },
  pill: {
    alignSelf: "flex-start",
    marginTop: 4,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.accentDark,
  },
  empty: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 8,
  },
});

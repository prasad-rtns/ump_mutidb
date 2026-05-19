import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenShell } from "../components/ScreenShell";
import type { WhatsOnStackParamList } from "../types";
import { commonStyles } from "../styles/common";
import { theme } from "../theme";

type Props = NativeStackScreenProps<WhatsOnStackParamList, "OpenCallDetails">;

export function OpenCallDetailScreen({ route }: Props) {
  const { openCall } = route.params;

  return (
    <SafeAreaView style={commonStyles.screen} edges={["top"]}>
      <ScreenShell>
        <ScrollView
          contentContainerStyle={commonStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={commonStyles.pageTitle}>{openCall.title}</Text>
          <Text style={commonStyles.meta}>Deadline: {openCall.deadline}</Text>
          <View style={[commonStyles.card, styles.block]}>
            <Text style={commonStyles.sectionTitle}>Summary</Text>
            <Text style={commonStyles.cardBody}>{openCall.summary}</Text>
          </View>
          <View style={[commonStyles.card, styles.block]}>
            <Text style={commonStyles.sectionTitle}>Department</Text>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{openCall.department}</Text>
            </View>
          </View>
          <Text style={styles.note}>
            POC only — link forms and official deadlines to production e-services when
            integrated.
          </Text>
        </ScrollView>
      </ScreenShell>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  block: {
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
  note: {
    fontSize: 12,
    color: "#9a8a7c",
    fontStyle: "italic",
    lineHeight: 18,
  },
});

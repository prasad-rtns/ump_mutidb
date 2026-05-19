import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import type { RootTabParamList } from "../types";
import { fontSans, theme } from "../theme";

type Props = {
  onSearchPress?: () => void;
};

export function AppHeader({ onSearchPress }: Props) {
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const { user } = useAuth();

  function onAccountPress() {
    navigation.navigate(
      "More",
      {
        screen: user ? "MoreMenu" : "Login",
      } as never
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.brand}>
          <View style={styles.mark}>
            <View style={styles.markGold} />
          </View>
          <View style={styles.titles}>
            <Text style={styles.title}>Dubai Culture</Text>
            <Text style={styles.ar} accessibilityRole="text">
              هيئة دبي للثقافة والفنون
            </Text>
            <Text style={styles.sub}>Dubai Culture & Arts Authority</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search"
            onPress={onSearchPress}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.75 }]}
          >
            <Ionicons name="search-outline" size={22} color={theme.colors.primary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={user ? "Account" : "Sign in"}
            onPress={onAccountPress}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.75 }]}
          >
            <Ionicons
              name={user ? "person-circle" : "person-outline"}
              size={24}
              color={theme.colors.primary}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    fontFamily: fontSans,
    backgroundColor: theme.colors.headerBg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.headerBorder,
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginHorizontal: -4,
    marginBottom: 6,
    ...theme.shadow.header,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  mark: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  markGold: {
    height: 4,
    backgroundColor: theme.colors.accent,
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fontSans,
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.primary,
    letterSpacing: -0.4,
  },
  ar: {
    fontFamily: fontSans,
    fontSize: 12,
    color: theme.colors.textMuted,
    writingDirection: "rtl",
    textAlign: "left",
    alignSelf: "flex-start",
  },
  sub: {
    fontFamily: fontSans,
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceMuted,
  },
});

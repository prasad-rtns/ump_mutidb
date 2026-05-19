import { StyleSheet } from "react-native";
import { fontSans, theme } from "../theme";

export const commonStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 28,
    gap: 14,
  },
  pageTitle: {
    fontFamily: fontSans,
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  sectionTitle: {
    fontFamily: fontSans,
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.primary,
    marginTop: 4,
  },
  card: {
    fontFamily: fontSans,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.radius.md,
    overflow: "hidden",
    ...theme.shadow.card,
  },
  cardBody: {
    fontFamily: fontSans,
    fontSize: 15,
    color: theme.colors.textMuted,
    lineHeight: 22,
  },
  cardTitle: {
    fontFamily: fontSans,
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  meta: {
    fontFamily: fontSans,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  search: {
    fontFamily: fontSans,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginVertical: 10,
    fontSize: 15,
    color: theme.colors.text,
  },
});

import type { ReactNode } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { theme } from "../theme";

type Props = {
  children: ReactNode;
  backgroundColor?: string;
};

export function ScreenShell({ children, backgroundColor }: Props) {
  const { width } = useWindowDimensions();
  const maxW = Math.min(width, theme.maxContentWidth);

  return (
    <View style={[styles.outer, backgroundColor && { backgroundColor }]}>
      <View style={[styles.inner, { maxWidth: maxW, width: "100%" }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: "center",
    width: "100%",
  },
  inner: {
    flex: 1,
    width: "100%",
  },
});

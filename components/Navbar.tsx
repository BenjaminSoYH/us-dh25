import React from "react";
import { View, Pressable, StyleSheet, Platform } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { HomeIcon, BookOpenIcon, PencilSquareIcon } from "react-native-heroicons/solid";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/AppNavigator";

// Brand colors
const COLORS = {
  white: "#FFFFFF",
  red: "#FF8781",   // primary
  green: "#95B88F", // secondary
  gray: "#8A8A8A",
  redTranslucent: "rgba(255,135,129,0.16)",
};

// Helpful hitSlop for easier taps
const HIT = { top: 12, bottom: 12, left: 12, right: 12 } as const;

export default function Navbar({ disabled = false }: { disabled?: boolean }) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();
  const current = route?.name ?? "";

  const tabs = [
    { key: "QuestionScreen", label: "Questions", Icon: BookOpenIcon, size: 26 },
    { key: "MainScreen", label: "Home", Icon: HomeIcon, size: 32 },
    { key: "JournalsScreen", label: "Journals", Icon: PencilSquareIcon, size: 26 },
  ];

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <View style={styles.bar}>
        {tabs.map(({ key, label, Icon, size }) => {
          const active = current === key;
          return (
            <Pressable
              key={key}
              hitSlop={HIT}
              android_ripple={{ color: COLORS.redTranslucent, radius: 28 }}
              style={({ pressed }) => [
                styles.item,
                active && styles.itemActive,
                pressed && styles.itemPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${label} tab`}
              accessible={!disabled}
              accessibilityState={{ disabled }}
              onPress={() => {
                if (!disabled) navigation.navigate(key as keyof RootStackParamList);
              }}
            >
              <Icon size={size} color={active ? COLORS.red : COLORS.gray} />
              <View style={[styles.indicator, active && { backgroundColor: COLORS.red }]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  bar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 18,
    height: 70,
    width: "92%",
    borderRadius: 20,
    // subtle green outline to match brand
    borderWidth: 1.5,
    borderColor: COLORS.green,
    // shadow / elevation
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    ...Platform.select({ android: { elevation: 10 } }),
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    marginHorizontal: 6,
    borderRadius: 14,
  },
  itemActive: {
    backgroundColor: COLORS.redTranslucent,
  },
  itemPressed: {
    opacity: 0.9,
  },
  indicator: {
    marginTop: 6,
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: "transparent",
  },
});
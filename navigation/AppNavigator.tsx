import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function AppNavigator() {
  return (
    <View style={styles.container}>
      {/* Question Icon */}
      <TouchableOpacity>
        <Ionicons name="chatbubbles-outline" size={28} color="#777" />
      </TouchableOpacity>

      {/* Home Icon */}
      <TouchableOpacity>
        <Ionicons name="home" size={32} color="#000" />
      </TouchableOpacity>

      {/* Journal Icon */}
      <TouchableOpacity>
        <Ionicons name="book-outline" size={28} color="#777" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});

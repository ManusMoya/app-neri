import { Redirect, Tabs } from "expo-router";

import { colors } from "@/theme";
import { getCurrentUser } from "@/services/auth.service";

export default function TabsLayout() {
  if (!getCurrentUser()) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="orders" options={{ title: "Pedidos" }} />
      <Tabs.Screen name="products" options={{ title: "Productos" }} />
      <Tabs.Screen name="providers" options={{ title: "Proveedores" }} />
      <Tabs.Screen name="clients" options={{ title: "Clientes" }} />
      <Tabs.Screen name="purchases" options={{ title: "Compras" }} />
    </Tabs>
  );
}

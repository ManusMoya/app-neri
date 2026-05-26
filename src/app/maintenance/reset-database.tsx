import { useState } from "react";
import { Alert, Platform, Text } from "react-native";
import { useRouter, type Href } from "expo-router";

import { Button, Card, Header, Screen, ScreenBody } from "@/components/ui";
import { resetApplicationDatabase } from "@/services/database.service";

export default function ResetDatabaseScreen() {
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const resetDatabase = async () => {
    setIsResetting(true);
    setMessage(null);

    try {
      await resetApplicationDatabase();
      setMessage("Base de datos limpia.");
    } catch (error) {
      const nextMessage =
        error instanceof Error ? error.message : "No se pudo limpiar la base de datos.";
      setMessage(nextMessage);

      if (Platform.OS === "web") {
        globalThis.alert(nextMessage);
      } else {
        Alert.alert("No se pudo limpiar", nextMessage);
      }
    } finally {
      setIsResetting(false);
    }
  };

  const confirmReset = () => {
    const warning =
      "Se eliminaran clientes, proveedores, productos, variantes, pedidos, compras y pagos. Esta accion no se puede deshacer.";

    if (Platform.OS === "web") {
      if (globalThis.confirm(`Limpiar base de datos\n\n${warning}`)) {
        void resetDatabase();
      }

      return;
    }

    Alert.alert("Limpiar base de datos", warning, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Limpiar",
        style: "destructive",
        onPress: () => void resetDatabase(),
      },
    ]);
  };

  return (
    <Screen>
      <Header
        title="Mantenimiento"
        subtitle="Ruta tecnica para limpiar la base local."
        rightSlot={
          <Button
            title="Salir"
            size="sm"
            variant="outline"
            onPress={() => router.replace("/dashboard" as Href)}
          />
        }
      />
      <ScreenBody>
        <Card className="gap-4">
          <Text className="text-base font-bold text-foreground">
            Limpiar base de datos
          </Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            Esta pantalla no aparece en los menus principales. Usala solo para
            resetear datos locales de prueba.
          </Text>
          {message ? (
            <Text className="text-sm font-semibold text-foreground">{message}</Text>
          ) : null}
          <Button
            title="Limpiar base"
            variant="danger"
            loading={isResetting}
            onPress={confirmReset}
          />
        </Card>
      </ScreenBody>
    </Screen>
  );
}

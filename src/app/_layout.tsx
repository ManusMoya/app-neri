import "../../global.css";

import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";

import { migrateDatabase } from "@/database";
import { LoadingSpinner } from "@/components/ui";

export default function RootLayout() {
  const [databaseReady, setDatabaseReady] = useState(Platform.OS === "web");
  const [databaseError, setDatabaseError] = useState<Error | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    let mounted = true;

    migrateDatabase()
      .then(() => {
        if (mounted) {
          setDatabaseReady(true);
        }
      })
      .catch((error: unknown) => {
        if (mounted) {
          setDatabaseError(
            error instanceof Error
              ? error
              : new Error("Database migration failed"),
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (databaseError) {
    throw databaseError;
  }

  if (!databaseReady) {
    return <LoadingSpinner className="flex-1 bg-background" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

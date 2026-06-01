import "../../global.css";

import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";

import { migrateDatabase } from "@/database";
import { LoadingSpinner } from "@/components/ui";
import { restoreStoredSession } from "@/services/auth.api.service";

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [databaseError, setDatabaseError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const prepareApp = async () => {
      if (Platform.OS !== "web") {
        await migrateDatabase();
      }

      await restoreStoredSession();
    };

    prepareApp()
      .then(() => {
        if (mounted) {
          setAppReady(true);
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

  if (!appReady) {
    return <LoadingSpinner className="flex-1 bg-background" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

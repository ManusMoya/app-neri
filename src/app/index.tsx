import { Redirect } from "expo-router";

import { LoginScreen } from "@/modules/auth";
import { getCurrentUser } from "@/services/auth.service";

export default function HomePage() {
  if (getCurrentUser()) {
    return <Redirect href="/dashboard" />;
  }

  return <LoginScreen />;
}

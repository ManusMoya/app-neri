import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useRouter, type Href } from "expo-router";

import { Button, Card, Input, Screen } from "@/components/ui";
import { login, register } from "@/services/auth.api.service";

type LoginErrors = {
  username?: string;
  password?: string;
  credentials?: string;
};

function validateLogin(username: string, password: string) {
  const errors: LoginErrors = {};

  if (!username.trim()) {
    errors.username = "Ingresa tu usuario.";
  }

  if (!password.trim()) {
    errors.password = "Ingresa tu contraseña.";
  }

  return errors;
}

export function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberSession, setRememberSession] = useState(true);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"login" | "create">("login");

  const canSubmit = useMemo(
    () => username.trim().length > 0 && password.trim().length > 0,
    [username, password],
  );

  const submitLogin = async () => {
    const nextErrors = validateLogin(username, password);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await register(username, password, { remember: rememberSession });
      } else {
        await login(username, password, { remember: rememberSession });
      }

      router.replace("/dashboard" as Href);
    } catch (error) {
      setErrors({
        credentials:
          error instanceof Error ? error.message : "No se pudo iniciar sesion.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Screen scroll={false} className="bg-background" contentClassName="px-5 py-6">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-center"
      >
        <View className="gap-6">
          <View className="gap-2">
            <View className="h-12 w-12 items-center justify-center rounded-md bg-primary">
              <Text className="text-xl font-bold text-primary-foreground">N</Text>
            </View>
            <Text className="text-3xl font-bold text-foreground">
              {mode === "create" ? "Crear usuario" : "Iniciar sesion"}
            </Text>
            <Text className="text-base text-muted-foreground">
              Accede para gestionar pedidos, clientes, compras y proveedores.
            </Text>
          </View>

          <Card className="gap-4 p-4">
            <Input
              label="Usuario"
              value={username}
              onChangeText={(value) => {
                setUsername(value);
                setErrors((current) => ({
                  ...current,
                  username: undefined,
                  credentials: undefined,
                }));
              }}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              placeholder="usuario"
              error={errors.username}
            />

            <Input
              label="Contraseña"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setErrors((current) => ({
                  ...current,
                  password: undefined,
                  credentials: undefined,
                }));
              }}
              secureTextEntry
              textContentType="password"
              placeholder="Ingresa tu contraseña"
              error={errors.password}
            />

            {errors.credentials ? (
              <Text className="text-sm font-medium text-danger">{errors.credentials}</Text>
            ) : null}

            <View className="flex-row items-center justify-between gap-3">
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: rememberSession }}
                className="min-w-0 flex-1 flex-row items-center gap-2"
                onPress={() => setRememberSession((value) => !value)}
              >
                <View
                  className={
                    rememberSession
                      ? "h-5 w-5 items-center justify-center rounded-sm bg-primary"
                      : "h-5 w-5 rounded-sm border border-border bg-surface"
                  }
                >
                  {rememberSession ? (
                    <Text className="text-[10px] font-bold text-primary-foreground">OK</Text>
                  ) : null}
                </View>
                <Text className="text-sm font-medium text-foreground">Recordar sesion</Text>
              </Pressable>

              <Pressable onPress={() => setPassword("")}>
                <Text className="text-sm font-semibold text-primary">Limpiar</Text>
              </Pressable>
            </View>

            <Button
              title={mode === "create" ? "Crear y entrar" : "Entrar"}
              size="lg"
              onPress={submitLogin}
              loading={isSubmitting}
              disabled={!canSubmit}
            />

            <Button
              title={mode === "create" ? "Ya tengo usuario" : "Crear otro usuario"}
              variant="ghost"
              onPress={() => {
                setMode((current) => (current === "login" ? "create" : "login"));
                setErrors({});
              }}
            />
          </Card>

          <View className="gap-2">
            <Text className="text-center text-xs text-muted-foreground">
              Cada usuario trabaja con sus propios proveedores, clientes, productos, compras y
              pedidos.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

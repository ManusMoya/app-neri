import React from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Card } from "@/components/ui/Card";
import { CurrencyText } from "@/components/ui/CurrencyText";
import { Badge } from "@/components/ui/Badge";
import { PurchaseListRecord } from "../types";

interface PurchaseListItemProps {
  purchase: PurchaseListRecord;
}

export function PurchaseListItem({ purchase }: PurchaseListItemProps) {
  const router = useRouter();

  return (
    <Pressable onPress={() => router.push(`/purchases/${purchase.id}`)}>
      <Card className="mb-3 p-4">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-lg font-bold text-slate-900">{purchase.provider.name}</Text>
            <Text className="text-sm text-slate-500">{new Date(purchase.purchasedAt).toLocaleDateString()}</Text>
          </View>
          <View className="items-end">
            <CurrencyText amount={purchase.totalAmount} className="text-lg font-bold text-slate-900" />
            <Badge label="Recibido" tone="success" />
          </View>
        </View>
        
        {purchase.balanceDue > 0 && (
          <View className="flex-row justify-between items-center mt-2 border-t border-slate-50 pt-2">
            <Text className="text-sm text-slate-500">Saldo Pendiente:</Text>
            <CurrencyText amount={purchase.balanceDue} className="text-sm font-bold text-error-600" />
          </View>
        )}
      </Card>
    </Pressable>
  );
}

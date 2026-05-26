import React from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Card } from "@/components/ui/Card";
import { CurrencyText } from "@/components/ui/CurrencyText";
import { OrderListRecord } from "../types";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderPaymentStatusBadge } from "./OrderPaymentStatusBadge";

interface OrderListItemProps {
  order: OrderListRecord;
}

export function OrderListItem({ order }: OrderListItemProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/orders/${order.id}`);
  };

  return (
    <Pressable onPress={handlePress}>
      <Card className="mb-3 p-4">
        <View className="flex-row justify-between items-start mb-2">
          <View>
            <View className="flex-row items-center gap-2 mb-1">
              <OrderStatusBadge status={order.status} />
              <OrderPaymentStatusBadge status={order.paymentStatus} />
            </View>
            <Text className="text-lg font-bold text-slate-900">
              {order.client.name}
            </Text>
          </View>
          <CurrencyText 
            amount={order.totalAmount}
            className="text-lg font-bold text-slate-900" 
          />
        </View>
        
        <View className="flex-row justify-between items-center">
          <Text className="text-sm text-slate-500">
            {new Date(order.orderedAt).toLocaleDateString()}
          </Text>
          {order.balanceDue > 0 && (
            <View className="flex-row gap-1">
              <Text className="text-sm text-slate-500">Deuda:</Text>
              <CurrencyText 
                amount={order.balanceDue}
                className="text-sm font-medium text-error-600" 
              />
            </View>
          )}
        </View>
      </Card>
    </Pressable>
  );
}

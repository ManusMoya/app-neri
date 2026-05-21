import { EmptyState, Header, Screen, ScreenBody } from "@/components/ui";

export function OrdersScreen() {
  return (
    <Screen>
      <Header title="Pedidos" subtitle="Flujo de pedidos, reservas, entregas y pagos." />
      <ScreenBody>
        <EmptyState
          title="Sin pedidos visibles"
          description="Aca se conectaran pedidos pendientes, reservados y entregados."
        />
      </ScreenBody>
    </Screen>
  );
}


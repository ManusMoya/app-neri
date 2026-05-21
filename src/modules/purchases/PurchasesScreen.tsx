import { EmptyState, Header, Screen, ScreenBody } from "@/components/ui";

export function PurchasesScreen() {
  return (
    <Screen>
      <Header title="Compras" subtitle="Ingreso de stock, costos reales y proveedores." />
      <ScreenBody>
        <EmptyState
          title="Sin compras registradas"
          description="Aca se conectaran compras recibidas y actualizacion de costos."
        />
      </ScreenBody>
    </Screen>
  );
}


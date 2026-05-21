import { Badge, Card, CurrencyText, Header, Screen, ScreenBody, SectionTitle } from "@/components/ui";

export function DashboardScreen() {
  return (
    <Screen>
      <Header
        title="Dashboard"
        subtitle="Resumen operativo para ventas, stock y cobros."
        rightSlot={<Badge label="Offline" tone="success" />}
      />
      <ScreenBody>
        <Card className="gap-2">
          <SectionTitle title="Estado del dia" subtitle="Base lista para conectar metricas reales." />
          <CurrencyText amount={0} className="text-3xl" />
        </Card>
        <Card className="gap-2">
          <SectionTitle title="Proximos pasos" />
          <Badge label="Pedidos" tone="info" />
          <Badge label="Stock" tone="warning" />
          <Badge label="Pagos" tone="success" />
        </Card>
      </ScreenBody>
    </Screen>
  );
}


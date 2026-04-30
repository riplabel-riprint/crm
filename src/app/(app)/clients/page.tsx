import { getOrders } from "@/lib/data/crm";
import { ClientsScreen } from "@/components/clients/ClientsScreen";

export const metadata = { title: "Klienci | Riprint" };

export default async function ClientsPage() {
  const orders = await getOrders();
  return <ClientsScreen orders={orders} />;
}

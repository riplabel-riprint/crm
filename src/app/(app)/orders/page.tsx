import { getOrders, getStages, getTasks } from "@/lib/data/crm";
import { OrdersScreen } from "@/components/orders/OrdersScreen";

export const metadata = { title: "Zlecenia | Riprint" };

export default async function OrdersPage() {
  const [seedOrders, stages, tasks] = await Promise.all([getOrders(), getStages(), getTasks()]);
  return <OrdersScreen seedOrders={seedOrders} stages={stages} tasks={tasks} />;
}

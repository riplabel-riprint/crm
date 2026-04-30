import { getOrders, getStages, getTasks } from "@/lib/data/crm";
import { OrdersScreen } from "@/components/orders/OrdersScreen";

export const metadata = { title: "Zlecenia | Riprint" };

export default async function OrdersPage() {
  const [orders, stages, tasks] = await Promise.all([
    getOrders(),
    getStages(),
    getTasks(),
  ]);
  return <OrdersScreen orders={orders} stages={stages} tasks={tasks} />;
}

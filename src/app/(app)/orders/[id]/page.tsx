import { getOrderDetail, toOrderView } from "@/lib/data/orders";
import { OrderDetailView } from "@/components/orders/OrderDetailView";
import { OrderDetailStoreSync } from "@/components/orders/OrderDetailStoreSync";

type Props = { params: Promise<{ id: string }> };

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const mockOrder = await getOrderDetail(id);

  if (mockOrder) {
    const view = toOrderView(mockOrder);
    const isOverdue =
      !!view.clientDeadline &&
      new Date(view.clientDeadline) < new Date();
    return <OrderDetailView order={mockOrder} isOverdue={isOverdue} view={view} />;
  }

  // New order created in this session — read from Zustand store client-side
  return <OrderDetailStoreSync id={id} />;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const order = await getOrderDetail(id);
  if (!order) return { title: "Zlecenie | Riprint" };
  return { title: `${order.orderNumber} — ${order.title} | Riprint` };
}

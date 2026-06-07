import { Suspense } from "react";
import { ClientsScreen } from "@/components/clients/ClientsScreen";

export const metadata = { title: "Klienci | Riprint" };

export default function ClientsPage() {
  return (
    <Suspense>
      <ClientsScreen />
    </Suspense>
  );
}

import Link from "next/link";
import { mockServices } from "@/lib/mock-data";
import { CreateOrderForm } from "@/components/orders/form/CreateOrderForm";

export const metadata = { title: "Nowe zlecenie | Riprint" };

export default function NewOrderPage() {
  return (
    <div className="min-h-full bg-[#0d0d0d]">
      <div className="border-b border-white/[0.06] bg-[#111] px-6 py-4">
        <nav className="mb-1 flex items-center gap-1.5 text-xs text-white/30">
          <Link href="/orders" className="hover:text-white/60 transition-colors">
            Zlecenia
          </Link>
          <span>/</span>
          <span className="text-white/60">Nowe zlecenie</span>
        </nav>
        <h1 className="text-xl font-semibold text-white">Nowe zlecenie</h1>
        <p className="mt-0.5 text-sm text-white/40">
          Uzupełnij formularz — zostanie utworzone zlecenie z wyceną v1 i workflow.
        </p>
      </div>

      <div className="px-6 py-6">
        <CreateOrderForm services={mockServices} />
      </div>
    </div>
  );
}

import Link from "next/link";
import { CreateOrderForm } from "@/components/orders/form/CreateOrderForm";

export const metadata = { title: "Nowe zlecenie | Riprint" };

export default function NewOrderPage() {
  return (
    <div className="min-h-full" style={{ backgroundColor: "#0f0f0f" }}>
      <div className="px-6 pt-8 pb-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5" style={{ fontSize: 12, letterSpacing: "0.5px", textTransform: "uppercase" }}>
          <Link href="/orders" className="transition-colors hover:text-[#ff6b35]" style={{ color: "#666" }}>
            Zlecenia
          </Link>
          <span style={{ color: "#444" }}>/</span>
          <span style={{ color: "#ff6b35", fontWeight: 500 }}>Nowe zlecenie</span>
        </nav>

        {/* Title */}
        <h1 style={{ fontSize: 32, fontWeight: 600, color: "#ffffff", marginBottom: 8 }}>
          Nowe zlecenie
        </h1>
        <p style={{ fontSize: 14, color: "#888888", lineHeight: 1.5, maxWidth: 600, marginBottom: 0 }}>
          Utwórz nowe zlecenie. Wybierz klienta, produkty i wyznacz wycenę oraz termin realizacji.
        </p>
      </div>

      <div className="px-6 pb-12">
        <CreateOrderForm />
      </div>
    </div>
  );
}

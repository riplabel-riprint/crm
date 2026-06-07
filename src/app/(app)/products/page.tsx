import { Suspense } from "react";
import { ProductsScreen } from "@/components/products/ProductsScreen";

export const metadata = { title: "Produkty | Riprint" };

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsScreen />
    </Suspense>
  );
}

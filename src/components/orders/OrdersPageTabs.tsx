"use client";

import { useState } from "react";
import { OrdersListClient } from "@/components/orders/OrdersListClient";
import { IntakeOrderForm } from "@/components/orders/intake/IntakeOrderForm";
import { mockServices } from "@/lib/mock-data";

const TABS = [
  { id: "list", label: "Lista zleceń" },
  { id: "intake", label: "Przyjmij zlecenie" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function OrdersPageTabs() {
  const [active, setActive] = useState<TabId>("list");

  return (
    <>
      {/* Tab bar */}
      <div className="bg-surface border-b border-[var(--border-subtle)] px-6">
        <nav className="-mb-px flex gap-1">
          {TABS.map((tab) => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                className={[
                  "relative px-4 pb-3 pt-3.5 text-sm font-medium transition-all duration-200 rounded-t-lg",
                  isActive
                    ? "text-accent after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-accent after:content-['']"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/5",
                ].join(" ")}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div className="px-6 py-6">
        {active === "list" && <OrdersListClient />}
        {active === "intake" && (
          <IntakeOrderForm
            services={mockServices}
            onCreated={() => setActive("list")}
          />
        )}
      </div>
    </>
  );
}

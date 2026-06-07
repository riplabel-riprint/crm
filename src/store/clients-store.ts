"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Client, ClientStatus, ClientType } from "@/types/crm";

export type ClientInput = Omit<Client, "id">;

type ClientsState = {
  clients: Client[];
  addClient: (input: ClientInput) => Client;
  updateClient: (id: string, input: Partial<ClientInput>) => void;
  deleteClient: (id: string) => void;
  getClientById: (id: string) => Client | undefined;
};

export const useClientsStore = create<ClientsState>()(
  persist(
    (set, get) => ({
      clients: [],

      addClient: (input) => {
        const client: Client = {
          ...input,
          id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        };
        set((state) => ({ clients: [...state.clients, client] }));
        return client;
      },

      updateClient: (id, input) =>
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === id ? { ...c, ...input } : c
          ),
        })),

      deleteClient: (id) =>
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
        })),

      getClientById: (id) => get().clients.find((c) => c.id === id),
    }),
    {
      name: "riprint-clients-store",
    }
  )
);

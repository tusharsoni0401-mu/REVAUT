import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Location } from "@/data/mockData";

interface LocationStore {
  locations: Location[];
  activeLocationId: string;
  loading: boolean;
  error: string | null;

  fetchLocations: () => Promise<void>;
  setActiveLocation: (id: string) => void;
  activeLocation: () => Location | undefined;
  updateLocation: (id: string, updates: Partial<Location>) => Promise<void>;
}

export const useLocationStore = create<LocationStore>((set, get) => ({
  locations: [],
  activeLocationId: "",
  loading: false,
  error: null,

  fetchLocations: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("created_at");

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    // Map snake_case DB columns → camelCase frontend interface
    const locations: Location[] = (data ?? []).map((row) => ({
      id:           row.id,
      name:         row.name,
      address:      row.address,
      cuisineType:  row.cuisine_type,
      gbpConnected: row.gbp_connected,
    }));

    set({
      locations,
      activeLocationId: locations[0]?.id ?? "",
      loading: false,
    });
  },

  setActiveLocation: (id) => set({ activeLocationId: id }),

  activeLocation: () => {
    const { locations, activeLocationId } = get();
    return locations.find((l) => l.id === activeLocationId) ?? locations[0];
  },

  updateLocation: async (id, updates) => {
    // Map camelCase → snake_case for DB
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name         !== undefined) dbUpdates.name          = updates.name;
    if (updates.address      !== undefined) dbUpdates.address       = updates.address;
    if (updates.cuisineType  !== undefined) dbUpdates.cuisine_type  = updates.cuisineType;
    if (updates.gbpConnected !== undefined) dbUpdates.gbp_connected = updates.gbpConnected;

    const { error } = await supabase
      .from("locations")
      .update(dbUpdates)
      .eq("id", id);

    if (error) throw new Error(error.message);

    // Optimistic update in local state
    set((state) => ({
      locations: state.locations.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    }));
  },
}));

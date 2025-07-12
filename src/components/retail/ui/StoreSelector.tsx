'use client';

import { Store, MapPin } from 'lucide-react';

interface StoreData {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  location?: string;
}

interface StoreSelectorProps {
  stores: StoreData[];
  selectedStore: string;
  onStoreChange: (storeId: string) => void;
}

export function StoreSelector({ stores, selectedStore, onStoreChange }: StoreSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Store className="h-5 w-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">Select Store</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stores.map((store) => (
          <button
            key={store.id}
            onClick={() => onStoreChange(store.id)}
            className={`p-4 rounded-lg border transition-all duration-200 text-left ${
              selectedStore === store.id
                ? 'bg-purple-500/20 border-purple-500/50 text-white'
                : 'bg-white/[0.02] border-white/[0.05] text-gray-300 hover:bg-white/[0.05] hover:border-white/[0.1]'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="font-medium">{store.code}</div>
                <div className="text-sm opacity-80">{store.name}</div>
                {store.location && (
                  <div className="flex items-center space-x-1 text-xs opacity-60">
                    <MapPin className="h-3 w-3" />
                    <span>{store.location}</span>
                  </div>
                )}
              </div>
              
              <div className={`h-2 w-2 rounded-full ${
                store.is_active ? 'bg-green-500' : 'bg-red-500'
              }`} />
            </div>
          </button>
        ))}
      </div>

      {stores.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No stores available</p>
        </div>
      )}
    </div>
  );
}
import { create } from 'zustand';
import { Product } from '../types';

interface UIStore {
    isAddModalOpen: boolean;
    setAddModalOpen: (open: boolean) => void;
    editingProduct: Product | null;
    setEditingProduct: (product: Product | null) => void;
    defaultLocationId: string | null;
    setDefaultLocationId: (id: string | null) => void;
    isAddSpaceModalOpen: boolean;
    setAddSpaceModalOpen: (open: boolean) => void;
    addSpaceParentId: string | null;
    setAddSpaceParentId: (id: string | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
    isAddModalOpen: false,
    setAddModalOpen: (open) => set({ isAddModalOpen: open }),
    editingProduct: null,
    setEditingProduct: (product) => set({ editingProduct: product }),
    defaultLocationId: null,
    setDefaultLocationId: (id) => set({ defaultLocationId: id }),
    isAddSpaceModalOpen: false,
    setAddSpaceModalOpen: (open) => set({ isAddSpaceModalOpen: open }),
    addSpaceParentId: null,
    setAddSpaceParentId: (id) => set({ addSpaceParentId: id }),
}));

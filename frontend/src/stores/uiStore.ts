import { create } from 'zustand';

interface UIState {
  // Dialog states
  deleteDialogOpen: boolean;
  deleteDialogItemId: number | null;
  deleteDialogType: 'car' | 'client' | 'rental' | 'penalty' | 'user' | null;
  
  // Form states
  carFormOpen: boolean;
  clientFormOpen: boolean;
  rentalFormOpen: boolean;
  penaltyFormOpen: boolean;
  bookingDialogOpen: boolean;
  
  // Selected items
  selectedCarId: number | null;
  selectedClientId: number | null;
  selectedRentalId: number | null;
  
  // Filters
  carFilters: {
    searchTerm: string;
    type: string;
    status: string;
  };
  
  // Actions
  openDeleteDialog: (id: number, type: 'car' | 'client' | 'rental' | 'penalty' | 'user') => void;
  closeDeleteDialog: () => void;
  setCarFormOpen: (open: boolean) => void;
  setClientFormOpen: (open: boolean) => void;
  setRentalFormOpen: (open: boolean) => void;
  setPenaltyFormOpen: (open: boolean) => void;
  setBookingDialogOpen: (open: boolean) => void;
  setSelectedCarId: (id: number | null) => void;
  setSelectedClientId: (id: number | null) => void;
  setSelectedRentalId: (id: number | null) => void;
  setCarFilters: (filters: Partial<UIState['carFilters']>) => void;
  reset: () => void;
}

const initialState = {
  deleteDialogOpen: false,
  deleteDialogItemId: null,
  deleteDialogType: null,
  carFormOpen: false,
  clientFormOpen: false,
  rentalFormOpen: false,
  penaltyFormOpen: false,
  bookingDialogOpen: false,
  selectedCarId: null,
  selectedClientId: null,
  selectedRentalId: null,
  carFilters: {
    searchTerm: '',
    type: '',
    status: '',
  },
};

export const useUIStore = create<UIState>((set) => ({
  ...initialState,
  
  openDeleteDialog: (id, type) => set({
    deleteDialogOpen: true,
    deleteDialogItemId: id,
    deleteDialogType: type,
  }),
  
  closeDeleteDialog: () => set({
    deleteDialogOpen: false,
    deleteDialogItemId: null,
    deleteDialogType: null,
  }),
  
  setCarFormOpen: (open) => set({ carFormOpen: open }),
  setClientFormOpen: (open) => set({ clientFormOpen: open }),
  setRentalFormOpen: (open) => set({ rentalFormOpen: open }),
  setPenaltyFormOpen: (open) => set({ penaltyFormOpen: open }),
  setBookingDialogOpen: (open) => set({ bookingDialogOpen: open }),
  
  setSelectedCarId: (id) => set({ selectedCarId: id }),
  setSelectedClientId: (id) => set({ selectedClientId: id }),
  setSelectedRentalId: (id) => set({ selectedRentalId: id }),
  
  setCarFilters: (filters) => set((state) => ({
    carFilters: { ...state.carFilters, ...filters },
  })),
  
  reset: () => set(initialState),
}));


import { create } from 'zustand';

interface NavigationState {
  history: string[];
  pushRoute: (route: string) => void;
  getBackRoute: () => string | null;
  clearHistory: () => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  history: [],
  
  pushRoute: (route: string) => {
    const { history } = get();
    // Don't add the same route consecutively
    if (history[history.length - 1] !== route) {
      set({ history: [...history, route] });
    }
  },
  
  getBackRoute: () => {
    const { history } = get();
    if (history.length <= 1) return null;
    // Return the previous route (second to last)
    return history[history.length - 2];
  },
  
  clearHistory: () => {
    set({ history: [] });
  },
}));
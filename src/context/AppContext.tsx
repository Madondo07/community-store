/**
 * Community Store — Global App Context
 *
 * Manages auth state, cart, and provides access to mock data.
 * In production, this would connect to Supabase for real-time data.
 */

import React, { createContext, useContext, useMemo, useReducer } from "react";

import {
  MOCK_CART,
  MOCK_CURRENT_USER,
  MOCK_LISTINGS,
  MOCK_NOTIFICATIONS,
  MOCK_ORDERS,
} from "@/data/mockData";
import type {
  CartItem,
  Listing,
  Notification,
  Order,
  UserProfile,
} from "@/types";

// ─── State Shape ────────────────────────────────────────────────────────────

interface AppState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  cart: CartItem[];
  orders: Order[];
  notifications: Notification[];
  listings: Listing[];
  wishlist: string[]; // listing IDs
}

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  cart: [],
  orders: [],
  notifications: [],
  listings: MOCK_LISTINGS,
  wishlist: [],
};

// ─── Actions ────────────────────────────────────────────────────────────────

type AppAction =
  | { type: "SIGN_IN"; payload: UserProfile }
  | { type: "SIGN_OUT" }
  | { type: "UPDATE_PROFILE"; payload: Partial<UserProfile> }
  | { type: "ADD_TO_CART"; payload: Listing }
  | { type: "REMOVE_FROM_CART"; payload: string }
  | { type: "UPDATE_CART_QTY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "ADD_ORDER"; payload: Order }
  | { type: "ADD_LISTING"; payload: Listing }
  | {
      type: "UPDATE_LISTING";
      payload: { id: string; updates: Partial<Listing> };
    }
  | { type: "DELETE_LISTING"; payload: string }
  | { type: "MARK_NOTIFICATION_READ"; payload: string }
  | { type: "MARK_ALL_NOTIFICATIONS_READ" }
  | { type: "TOGGLE_WISHLIST"; payload: string }
  | { type: "LOAD_MOCK_DATA" };

// ─── Reducer ────────────────────────────────────────────────────────────────

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SIGN_IN":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        cart: MOCK_CART,
        orders: MOCK_ORDERS,
        notifications: MOCK_NOTIFICATIONS,
      };

    case "SIGN_OUT":
      return { ...initialState };

    case "UPDATE_PROFILE":
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };

    case "ADD_TO_CART": {
      const existing = state.cart.find(
        (item) => item.listing.id === action.payload.id,
      );
      if (existing) {
        return {
          ...state,
          cart: state.cart.map((item) =>
            item.listing.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        };
      }
      return {
        ...state,
        cart: [
          ...state.cart,
          { id: `c${Date.now()}`, listing: action.payload, quantity: 1 },
        ],
      };
    }

    case "REMOVE_FROM_CART":
      return {
        ...state,
        cart: state.cart.filter((item) => item.id !== action.payload),
      };

    case "UPDATE_CART_QTY":
      return {
        ...state,
        cart: state.cart
          .map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: action.payload.quantity }
              : item,
          )
          .filter((item) => item.quantity > 0),
      };

    case "CLEAR_CART":
      return { ...state, cart: [] };

    case "ADD_ORDER":
      return {
        ...state,
        orders: [action.payload, ...state.orders],
        cart: [],
      };

    case "ADD_LISTING":
      return {
        ...state,
        listings: [action.payload, ...state.listings],
      };

    case "UPDATE_LISTING":
      return {
        ...state,
        listings: state.listings.map((l) =>
          l.id === action.payload.id ? { ...l, ...action.payload.updates } : l,
        ),
      };

    case "DELETE_LISTING":
      return {
        ...state,
        listings: state.listings.filter((l) => l.id !== action.payload),
      };

    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, is_read: true } : n,
        ),
      };

    case "MARK_ALL_NOTIFICATIONS_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({
          ...n,
          is_read: true,
        })),
      };

    case "TOGGLE_WISHLIST": {
      const id = action.payload;
      const exists = state.wishlist.includes(id);
      return {
        ...state,
        wishlist: exists
          ? state.wishlist.filter((wid) => wid !== id)
          : [...state.wishlist, id],
      };
    }

    case "LOAD_MOCK_DATA":
      return {
        ...state,
        user: MOCK_CURRENT_USER,
        isAuthenticated: true,
        cart: MOCK_CART,
        orders: MOCK_ORDERS,
        notifications: MOCK_NOTIFICATIONS,
        listings: MOCK_LISTINGS,
      };

    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Convenience selectors
  cartItemCount: number;
  cartTotal: number;
  unreadNotificationCount: number;
  userListings: Listing[];
  isWishlisted: (listingId: string) => boolean;
  wishlistListings: Listing[];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const value = useMemo<AppContextValue>(() => {
    const cartItemCount = state.cart.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const cartTotal = state.cart.reduce(
      (sum, item) => sum + item.listing.price * item.quantity,
      0,
    );
    const unreadNotificationCount = state.notifications.filter(
      (n) => !n.is_read,
    ).length;
    const userListings = state.listings.filter(
      (l) => l.seller_id === state.user?.id,
    );
    const isWishlisted = (listingId: string) =>
      state.wishlist.includes(listingId);
    const wishlistListings = state.listings.filter((l) =>
      state.wishlist.includes(l.id),
    );

    return {
      state,
      dispatch,
      cartItemCount,
      cartTotal,
      unreadNotificationCount,
      userListings,
      isWishlisted,
      wishlistListings,
    };
  }, [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

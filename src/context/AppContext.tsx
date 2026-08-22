/**
 * Community Store — Global App Context
 *
 * Session/UI-only state: the signed-in user, cart, and wishlist. There are
 * no `orders`/`listings` tables backing wishlist, and cart is intentionally
 * client-only until checkout creates a real order — everything else
 * (listings, orders, notifications, bulletin posts, reports) is fetched
 * directly from Supabase by the screens that need it, via `src/lib/api/*`.
 *
 * Also owns session lifecycle: restoring `user`/`isAuthenticated` from the
 * Supabase-persisted auth token on app start (the Supabase client already
 * persists the token to AsyncStorage, but nothing previously read it back
 * into app state, so every reload silently bounced an already-signed-in
 * user back to the sign-in screen), reacting to sign-out from elsewhere
 * (token expiry, another tab), and — on web only — signing out after a
 * period of inactivity (mobile intentionally stays signed in indefinitely).
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";

import { supabase } from "@/lib/supabase";
import type { CartItem, Listing, UserProfile } from "@/types";

const WEB_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;

async function fetchProfileAsUser(authUser: {
  id: string;
  email?: string | null;
  created_at: string;
}): Promise<UserProfile> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();

  return {
    id: authUser.id,
    email: profile?.email ?? authUser.email ?? "",
    full_name: profile?.full_name ?? "User",
    role: profile?.role ?? "student",
    avatar_url: profile?.avatar_url ?? null,
    is_verified: profile?.is_verified ?? false,
    created_at: profile?.created_at ?? authUser.created_at,
    business_name: profile?.business_name,
    registration_number: profile?.registration_number,
    vendor_status: profile?.vendor_status,
  };
}

// ─── State Shape ────────────────────────────────────────────────────────────

interface AppState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  cart: CartItem[];
  wishlist: string[]; // listing IDs
}

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  cart: [],
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
  | { type: "TOGGLE_WISHLIST"; payload: string };

// ─── Reducer ────────────────────────────────────────────────────────────────

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SIGN_IN":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
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

    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // True until the initial Supabase session check completes — gates the
  // root redirect so an already-signed-in user isn't bounced to sign-in.
  initializing: boolean;
  // Convenience selectors
  cartItemCount: number;
  cartTotal: number;
  isWishlisted: (listingId: string) => boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [initializing, setInitializing] = useState(true);

  // ── Restore session on app start, react to sign-out elsewhere ──────────
  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data }) => {
      const authUser = data.session?.user;
      if (authUser && !cancelled) {
        const userProfile = await fetchProfileAsUser(authUser);
        if (!cancelled) dispatch({ type: "SIGN_IN", payload: userProfile });
      }
      if (!cancelled) setInitializing(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        dispatch({ type: "SIGN_OUT" });
      }
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  // ── Web-only inactivity logout (mobile stays signed in indefinitely) ───
  const isAuthenticatedRef = useRef(state.isAuthenticated);
  useEffect(() => {
    isAuthenticatedRef.current = state.isAuthenticated;
  }, [state.isAuthenticated]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    if (!state.isAuthenticated) return;

    let timer: ReturnType<typeof setTimeout>;
    const handleTimeout = () => {
      if (!isAuthenticatedRef.current) return;
      supabase.auth.signOut();
      dispatch({ type: "SIGN_OUT" });
    };
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(handleTimeout, WEB_INACTIVITY_TIMEOUT_MS);
    };

    resetTimer();
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, resetTimer));

    return () => {
      clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [state.isAuthenticated]);

  const value = useMemo<AppContextValue>(() => {
    const cartItemCount = state.cart.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const cartTotal = state.cart.reduce(
      (sum, item) => sum + item.listing.price * item.quantity,
      0,
    );
    const isWishlisted = (listingId: string) =>
      state.wishlist.includes(listingId);

    return {
      state,
      dispatch,
      initializing,
      cartItemCount,
      cartTotal,
      isWishlisted,
    };
  }, [state, initializing]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

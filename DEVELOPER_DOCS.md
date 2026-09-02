# Community Store / Swych — Technical Documentation

> **For the development team.** This document explains how the app works, how the codebase is structured, the patterns used, and what needs to happen next (database, auth, real API integration).

---

## 1. Project Overview

**Swych** (codenamed "Community Store") is a campus marketplace app for CPUT (Cape Peninsula University of Technology). Think of it as a Gumtree/Facebook Marketplace scoped to a university — students, staff, and vendors can buy/sell items, communicate, and stay updated via a bulletin board.

| Property | Value |
|---|---|
| **App Name** | Swych |
| **Package** | `com.dumisanemm.communitystore` |
| **Slug** | `community-store` |
| **Version** | 1.0.0 |
| **EAS Project ID** | `ae1634d1-0c86-46d5-9211-2f0e5ed47520` |

### User Roles

| Role | Badge | Verification Method | Permissions |
|---|---|---|---|
| **Student** | "Student" (blue) | Email `@mycput.ac.za` | Full: browse, buy, sell, message, bulletin |
| **Faculty/Staff** | "Staff" (teal) | Email `@cput.ac.za` | Same as student |
| **Vendor** | "Verified Seller" (green) | Admin approval required | Full after approval; **pending = browse-only** (no sell, no message) |
| **Resident** | None | No auto-verification | Browse + buy |
| **Admin** | "Staff" (teal) | `@cput.ac.za` email | Full + admin dashboard |

---

## 2. Tech Stack

### Core

| Technology | Version | Purpose |
|---|---|---|
| **Expo SDK** | 56 | App framework (managed workflow) |
| **React Native** | 0.85.3 | Cross-platform UI |
| **React** | 19.2.3 | Component model |
| **TypeScript** | 6.0.3 | Type safety |
| **expo-router** | 56.2.11 | File-based routing (like Next.js) |

### UI & Navigation

| Package | Purpose |
|---|---|
| `lucide-react-native` | All icons (NO emoji anywhere — strict rule) |
| `react-native-svg` | SVG support for Lucide |
| `react-native-safe-area-context` | Safe area insets |
| `react-native-screens` | Native screen containers |
| `react-native-gesture-handler` | Touch handling |
| `react-native-reanimated` | Animations |
| `react-native-web` | Web platform support |

### Data & Backend (Planned)

| Package | Purpose |
|---|---|
| `@supabase/supabase-js` | Backend-as-a-service (auth, DB, storage, realtime) |
| `@react-native-async-storage/async-storage` | Local session persistence |

> [!IMPORTANT]
> **Supabase is installed but NOT connected yet.** The app currently runs entirely on mock data. See [Section 8: Database Plan](#8-database-plan-supabase) for the full schema.

### Dev Tooling

| Tool | Purpose |
|---|---|
| `@expo/ngrok` | Tunnel for device testing |
| React Compiler | Enabled via `experiments.reactCompiler` |
| Typed Routes | Enabled via `experiments.typedRoutes` |

### NPM Scripts

```bash
npm run start        # expo start --tunnel (for device testing)
npm run start:local  # expo start (local network)
npm run web          # expo start --web --port 19006
npm run android      # expo start --android --tunnel
npm run ios          # expo start --ios --tunnel
```

> **Always use `npx expo start`** — never the deprecated global `expo-cli`.

---

## 3. Project Structure

```
community-store/
├── app.json                    # Expo config
├── package.json
├── tsconfig.json
├── assets/images/              # Splash, icons, etc.
└── src/
    ├── app/                    # 📱 Screens (file-based routing)
    │   ├── _layout.tsx         #   Root Stack navigator
    │   ├── index.tsx           #   Auth redirect (→ tabs or auth)
    │   ├── (auth)/             #   Auth group
    │   │   ├── _layout.tsx     #     Stack layout
    │   │   ├── index.tsx       #     Sign In (DEFAULT first screen)
    │   │   ├── sign-up.tsx     #     Sign Up with role select
    │   │   └── vendor-verification.tsx
    │   ├── (tabs)/             #   Main tabbed screens
    │   │   ├── _layout.tsx     #     Tab navigator (5 tabs)
    │   │   ├── index.tsx       #     Home / Marketplace
    │   │   ├── browse.tsx      #     Browse categories
    │   │   ├── bulletin-board.tsx  # CPUT Newsflash
    │   │   ├── messages.tsx    #     Messages (hidden on mobile tabs)
    │   │   └── profile.tsx     #     User profile
    │   ├── listing-detail.tsx  #   Listing detail page
    │   ├── new-listing.tsx     #   Create listing form
    │   ├── cart.tsx            #   Shopping cart
    │   ├── checkout.tsx        #   Checkout flow
    │   ├── order-confirmed.tsx #   Order success
    │   ├── rate-purchase.tsx   #   Review seller
    │   ├── seller-profile.tsx  #   Public seller profile
    │   ├── search-results.tsx  #   Search results grid
    │   ├── notifications.tsx   #   Notification center
    │   ├── admin-dashboard.tsx #   Admin panel
    │   └── settings.tsx        #   Full settings (profile, password, prefs)
    ├── components/ui/          # 🧩 Reusable UI components (12)
    │   ├── index.ts            #   Barrel export
    │   ├── Avatar.tsx
    │   ├── AuthInput.tsx
    │   ├── Button.tsx
    │   ├── CategoryChip.tsx
    │   ├── ContentContainer.tsx
    │   ├── ListingCard.tsx     #   With wishlist heart icon
    │   ├── ResponsiveTabBar.tsx #  Sidebar (web) / bottom tabs (mobile)
    │   ├── RoleSelectCard.tsx
    │   ├── SearchBar.tsx
    │   ├── SellerCard.tsx      #   With VerifiedBadge
    │   ├── StarRating.tsx
    │   ├── StatCard.tsx
    │   ├── StatusBadge.tsx
    │   └── VerifiedBadge.tsx   #   Tap/hover badge component
    ├── constants/
    │   └── theme.ts            # 🎨 Design system tokens
    ├── context/
    │   └── AppContext.tsx       # 📦 Global state (React Context + useReducer)
    ├── data/
    │   └── mockData.ts         # 🧪 All mock/seed data (536 lines)
    ├── hooks/
    │   └── useResponsive.ts    # 📐 Responsive breakpoints & layout
    ├── lib/
    │   └── supabase.ts         # 🔌 Supabase client (placeholder)
    ├── types/
    │   └── index.ts            # 📋 All TypeScript type definitions
    └── utils/
        └── verification.ts     # ✅ Badge derivation + posting restrictions
```

---

## 4. Architecture & Patterns

### 4.1 Navigation (expo-router)

The app uses **file-based routing** via `expo-router`. The file structure in `src/app/` directly maps to routes:

```
src/app/index.tsx           → / (redirects to auth or tabs)
src/app/(auth)/index.tsx    → /auth (sign-in)
src/app/(auth)/sign-up.tsx  → /auth/sign-up
src/app/(tabs)/index.tsx    → /tabs (home)
src/app/listing-detail.tsx  → /listing-detail?id=xxx
```

**Route Groups:**
- `(auth)` — Auth screens (Stack layout, no header)
- `(tabs)` — Main app (Tab layout with 5 screens)
- All other screens are in the root Stack

**Navigation flow:**
```
App Launch → index.tsx → isAuthenticated?
  ├─ YES → /(tabs)  (Home)
  └─ NO  → /(auth)  (Sign In)
```

### 4.2 State Management

State is managed via **React Context + `useReducer`** in [`AppContext.tsx`](file:///c:/Users/DELL/community-store/src/context/AppContext.tsx).

**State shape:**
```typescript
interface AppState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  cart: CartItem[];
  orders: Order[];
  notifications: Notification[];
  listings: Listing[];
  wishlist: string[];  // listing IDs
}
```

**Available actions:**
| Action | Payload | Effect |
|---|---|---|
| `SIGN_IN` | `UserProfile` | Sets user, loads mock cart/orders/notifications |
| `SIGN_OUT` | — | Resets to initial state |
| `UPDATE_PROFILE` | `Partial<UserProfile>` | Merges profile fields |
| `ADD_TO_CART` | `Listing` | Adds or increments quantity |
| `REMOVE_FROM_CART` | `string` (cart item ID) | Removes item |
| `UPDATE_CART_QTY` | `{id, quantity}` | Updates qty, removes if 0 |
| `CLEAR_CART` | — | Empties cart |
| `ADD_ORDER` | `Order` | Prepends order, clears cart |
| `ADD_LISTING` | `Listing` | Adds new listing |
| `UPDATE_LISTING` | `{id, updates}` | Partial update listing |
| `DELETE_LISTING` | `string` (listing ID) | Removes listing |
| `MARK_NOTIFICATION_READ` | `string` (notification ID) | Marks single as read |
| `MARK_ALL_NOTIFICATIONS_READ` | — | Marks all as read |
| `TOGGLE_WISHLIST` | `string` (listing ID) | Adds/removes from wishlist |
| `LOAD_MOCK_DATA` | — | Loads all mock data |

**Convenience selectors** (from `useApp()` hook):
- `cartItemCount` — total items in cart
- `cartTotal` — sum of item prices × quantities
- `unreadNotificationCount`
- `userListings` — current user's listings
- `isWishlisted(listingId)` — check if listing is saved
- `wishlistListings` — full listing objects for wishlisted IDs

### 4.3 Responsive Layout System

The app supports **mobile (iOS/Android) + web (desktop/tablet)** from a single codebase using the [`useResponsive`](file:///c:/Users/DELL/community-store/src/hooks/useResponsive.ts) hook.

**Breakpoints:**
| Breakpoint | Width | Grid Cols | Nav Style |
|---|---|---|---|
| `mobile` | < 768px | 2 columns | Bottom tabs (4 visible) |
| `tablet` | 768–1023px | 3 columns | Sidebar (260px, fixed) |
| `desktop` | ≥ 1024px | 4 columns | Sidebar (260px, fixed) |

**Key values from `useResponsive()`:**
- `useSidebarNav` — `true` on web tablet/desktop
- `sidebarOffset` — `260` on web (for content padding), `0` on mobile
- `contentMaxWidth` — constrains content width for readability
- `isWeb` — platform check

**Navigation:**
- **Mobile**: 4 bottom tabs (Home, Browse, Bulletin, Profile). Messages accessible via header icon.
- **Web/Desktop**: Fixed sidebar with all 5 items including Messages. Content pushed right by `sidebarOffset`.

### 4.4 Verification System

Handled by [`src/utils/verification.ts`](file:///c:/Users/DELL/community-store/src/utils/verification.ts):

```typescript
getVerifiedBadge(user) → { label, color } | null
// Derives badge from email domain or vendor approval status

canPostListings(user) → boolean
// Returns false for pending vendors
```

The [`VerifiedBadge`](file:///c:/Users/DELL/community-store/src/components/ui/VerifiedBadge.tsx) component renders:
- **Mobile**: Tap the badge icon → `Alert` showing "Verified Student/Staff/Seller"
- **Web**: Hover → tooltip (via HTML `title` attribute)
- `showLabel` prop: renders full pill with label text (used in SellerCard)

---

## 5. UI Components Reference

All components live in `src/components/ui/` and are exported from [`index.ts`](file:///c:/Users/DELL/community-store/src/components/ui/index.ts).

| Component | Props | Description |
|---|---|---|
| `Avatar` | `uri, name, size('sm'\|'md'\|'lg'\|'xl')` | Image or colored initials fallback |
| `AuthInput` | `icon, placeholder, secureTextEntry, hint, error` | Styled input for auth forms |
| `Button` | `variant('primary'\|'secondary'\|'danger'), size, title, loading, disabled, fullWidth, icon` | Multi-variant button |
| `CategoryChip` | `label, selected, onPress, removable, onRemove` | Filter chip pill |
| `ListingCard` | `listing, onPress` | Product card with image, price, stars, **wishlist heart** |
| `SearchBar` | `value, onChangeText, onSubmit, placeholder, onFilter` | Search input with icons |
| `SellerCard` | `seller, compact, onPress` | Seller info with avatar + **VerifiedBadge** |
| `StarRating` | `rating, size, interactive, onRate, showCount, count` | Star display/input |
| `StatusBadge` | `status('confirmed'\|'pending'\|'flagged')` | Color-coded status pill |
| `StatCard` | `label, value, color` | Admin dashboard stat card |
| `RoleSelectCard` | `icon, label, selected, onPress` | Role selection card (auth) |
| `VerifiedBadge` | `user, showLabel, size` | Tap/hover verified badge |
| `ResponsiveTabBar` | `(tab bar props)` | Sidebar on web, bottom tabs on mobile |

### Design Rules (STRICT)

> [!CAUTION]
> 1. **NO emoji anywhere in the UI** — use `lucide-react-native` icons exclusively
> 2. **Use `Pressable`** — never `TouchableOpacity`
> 3. **Use `StyleSheet.create`** — no inline style objects
> 4. **Import design tokens** — colors, spacing, typography from `@/constants/theme`
> 5. **Use `SafeAreaView`** from `react-native-safe-area-context`, not the RN one

---

## 6. Design System Tokens

All tokens are in [`src/constants/theme.ts`](file:///c:/Users/DELL/community-store/src/constants/theme.ts).

### Colors
| Token | Hex | Usage |
|---|---|---|
| `navy` | `#003C71` | Primary buttons, active nav, headers |
| `blue` | `#0072CE` | Links, selected chips, focus borders |
| `teal` | `#0198CD` | Staff badges, accents |
| `background` | `#F5F6F8` | Page background |
| `surface` | `#FFFFFF` | Cards, inputs |
| `surfaceAlt` | `#EEF0F4` | Unselected chips, secondary surfaces |
| `success` / `successLight` | `#059669` / `#D1FAE5` | Verified, confirmed |
| `warning` / `warningLight` | `#D97706` / `#FEF3C7` | Pending states |
| `danger` / `dangerLight` | `#DC2626` / `#FEE2E2` | Errors, delete, flagged |
| `textPrimary` | `#1A1D23` | Main text |
| `textSecondary` | `#6B7280` | Supporting text |
| `textTertiary` | `#9CA3AF` | Placeholder, meta |

### Typography Scale
| Token | Size/Weight | Usage |
|---|---|---|
| `displayLg` | 28/700 | Page titles |
| `displayMd` | 24/700 | Section headers |
| `titleLg` | 20/600 | Screen titles |
| `titleMd` | 17/600 | Card titles |
| `titleSm` | 15/600 | Small titles |
| `body` | 15/400 | Body text |
| `bodySmall` | 13/400 | Captions, meta |
| `caption` | 11/500/UPPERCASE | Labels |
| `price` | 22/800 | Main price display |
| `priceSm` | 16/700 | Card price |

### Spacing
`xs:4 sm:8 md:12 lg:16 xl:20 2xl:24 3xl:32 4xl:48 5xl:64`

### Radii
`sm:8 md:12 lg:16 xl:20 full:9999`

---

## 7. Type Definitions

All types are in [`src/types/index.ts`](file:///c:/Users/DELL/community-store/src/types/index.ts). Key interfaces:

```typescript
// User Roles
type UserRole = 'student' | 'vendor' | 'admin';

interface UserProfile {
  id: string;
  email: string;
  password?: string;           // Test-only mock field
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  is_verified: boolean;
  created_at: string;
  business_name?: string;      // Vendor-only
  registration_number?: string; // Vendor-only
  vendor_status?: 'pending' | 'verified' | 'rejected'; // Vendor-only — named to match the live DB column, see supabase/README.md "Schema drift"
}

interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: ListingCategory;   // 'textbooks'|'electronics'|'furniture'|'clothing'|'services'|'other'
  condition: 'new' | 'used';
  status: 'active' | 'sold' | 'flagged' | 'removed';
  images: string[];
  created_at: string;
  updated_at: string;
  seller?: UserProfile;        // Joined
  avg_rating?: number;
  review_count?: number;
}

// Also: CartItem, Order, OrderItem, Review, Notification,
//        BulletinPost, Conversation, Message, AdminStats, FlaggedItem
```

---

## 8. Database Plan (Supabase)

> [!IMPORTANT]
> **Superseded.** This section is the original pre-implementation plan and no longer matches the live schema in several places (role/vendor-status naming, `updated_at`, etc.). The actual, current source of truth is [`supabase/migrations/`](file:///c:/Users/DELL/community-store/supabase/migrations/) plus [`supabase/README.md`](file:///c:/Users/DELL/community-store/supabase/README.md) — read that file's "Schema drift" section before touching the DB. Kept below for historical context only.
>
> The app currently uses mock data in [`src/data/mockData.ts`](file:///c:/Users/DELL/community-store/src/data/mockData.ts) (536 lines, 8 users, 10 listings, reviews, orders, notifications, conversations, bulletin posts). The Supabase client is [installed and configured](file:///c:/Users/DELL/community-store/src/lib/supabase.ts) but pointing to placeholder credentials.

### Recommended Supabase Setup

#### 8.1 Authentication
Use **Supabase Auth** with email/password. The email domain determines the badge:
- `@mycput.ac.za` → Student
- `@cput.ac.za` → Staff/Admin
- Other → Resident or Vendor (vendor requires admin approval)

#### 8.2 Database Schema

```sql
-- ═══════════════════════════════════════════════════
-- USERS / PROFILES
-- ═══════════════════════════════════════════════════

-- Extends Supabase auth.users
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('student','faculty','vendor','resident','admin')),
  avatar_url      TEXT,
  is_verified     BOOLEAN DEFAULT FALSE,
  -- Vendor-specific
  business_name   TEXT,
  registration_number TEXT,
  verification_status TEXT CHECK (verification_status IN ('pending','approved','rejected')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    CASE
      WHEN NEW.email LIKE '%@mycput.ac.za' THEN TRUE
      WHEN NEW.email LIKE '%@cput.ac.za' THEN TRUE
      ELSE FALSE
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ═══════════════════════════════════════════════════
-- LISTINGS
-- ═══════════════════════════════════════════════════

CREATE TABLE public.listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  price           NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  category        TEXT NOT NULL CHECK (category IN ('textbooks','electronics','furniture','clothing','services','other')),
  condition       TEXT NOT NULL CHECK (condition IN ('new','used')),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold','flagged','removed')),
  images          TEXT[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listings_seller ON public.listings(seller_id);
CREATE INDEX idx_listings_category ON public.listings(category);
CREATE INDEX idx_listings_status ON public.listings(status);


-- ═══════════════════════════════════════════════════
-- REVIEWS
-- ═══════════════════════════════════════════════════

CREATE TABLE public.reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id     UUID NOT NULL REFERENCES public.profiles(id),
  seller_id       UUID NOT NULL REFERENCES public.profiles(id),
  listing_id      UUID NOT NULL REFERENCES public.listings(id),
  rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reviewer_id, listing_id)  -- one review per purchase
);


-- ═══════════════════════════════════════════════════
-- CART
-- ═══════════════════════════════════════════════════

CREATE TABLE public.cart_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id      UUID NOT NULL REFERENCES public.listings(id),
  quantity        SMALLINT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);


-- ═══════════════════════════════════════════════════
-- ORDERS
-- ═══════════════════════════════════════════════════

CREATE TABLE public.orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id        UUID NOT NULL REFERENCES public.profiles(id),
  subtotal        NUMERIC(10,2) NOT NULL,
  delivery_fee    NUMERIC(10,2) NOT NULL DEFAULT 0,
  total           NUMERIC(10,2) NOT NULL,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('campus_pickup','vendor_delivery')),
  payment_method  TEXT NOT NULL CHECK (payment_method IN ('payfast','snapchat')),
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('confirmed','pending','processing','delivered','cancelled')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  listing_id      UUID NOT NULL REFERENCES public.listings(id),
  title           TEXT NOT NULL,
  price           NUMERIC(10,2) NOT NULL,
  quantity        SMALLINT NOT NULL,
  image           TEXT
);


-- ═══════════════════════════════════════════════════
-- NOTIFICATIONS
-- ═══════════════════════════════════════════════════

CREATE TABLE public.notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('order','message','review','system')),
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  target_screen   TEXT,
  target_id       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);


-- ═══════════════════════════════════════════════════
-- MESSAGES / CONVERSATIONS
-- ═══════════════════════════════════════════════════

CREATE TABLE public.conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids UUID[] NOT NULL,  -- exactly 2 user IDs
  listing_id      UUID REFERENCES public.listings(id),
  last_message    TEXT,
  last_message_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES public.profiles(id),
  content         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at);


-- ═══════════════════════════════════════════════════
-- BULLETIN BOARD
-- ═══════════════════════════════════════════════════

CREATE TABLE public.bulletin_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL REFERENCES public.profiles(id),
  category        TEXT NOT NULL CHECK (category IN ('events','services','lost_and_found')),
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  location        TEXT,
  date            TEXT,  -- event date display string
  created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════
-- WISHLIST
-- ═══════════════════════════════════════════════════

CREATE TABLE public.wishlists (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id      UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);


-- ═══════════════════════════════════════════════════
-- FLAGGED ITEMS (Admin)
-- ═══════════════════════════════════════════════════

CREATE TABLE public.flagged_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      UUID NOT NULL REFERENCES public.listings(id),
  reason          TEXT NOT NULL,
  reported_by     UUID NOT NULL REFERENCES public.profiles(id),
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','reviewed','approved','removed')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### 8.3 Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
-- ... (all tables)

-- Example policies:

-- Profiles: anyone can read, only own user can update
CREATE POLICY "Public profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Listings: anyone can read active, only seller can update/delete
CREATE POLICY "Read active listings" ON public.listings FOR SELECT USING (status = 'active');
CREATE POLICY "Seller manages own" ON public.listings FOR ALL USING (auth.uid() = seller_id);

-- Cart: only own items
CREATE POLICY "Own cart" ON public.cart_items FOR ALL USING (auth.uid() = user_id);

-- Notifications: only own
CREATE POLICY "Own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Messages: only participants
CREATE POLICY "Conversation participant" ON public.messages FOR ALL
  USING (
    auth.uid() IN (
      SELECT unnest(participant_ids) FROM public.conversations WHERE id = conversation_id
    )
  );
```

#### 8.4 Storage Buckets

| Bucket | Purpose | Access |
|---|---|---|
| `avatars` | User profile photos | Public read, authenticated upload |
| `listing-images` | Listing photos | Public read, authenticated upload |
| `vendor-documents` | KYC verification docs | Private (admin only) |

#### 8.5 Realtime Subscriptions

Enable Supabase Realtime for:
- `messages` — live chat
- `notifications` — push updates
- `listings` — new listing feed

#### 8.6 Migration Path

To replace mock data with Supabase:

1. **Create Supabase project** → get URL + anon key
2. **Update `src/lib/supabase.ts`** with real credentials
3. **Run the SQL above** in Supabase SQL editor
4. **Create a `src/lib/api.ts`** service layer:
   ```typescript
   // Example:
   export async function getListings(category?: string) {
     let query = supabase.from('listings').select('*, seller:profiles(*)');
     if (category) query = query.eq('category', category);
     return query.eq('status', 'active').order('created_at', { ascending: false });
   }
   ```
5. **Replace `dispatch` calls** in screens with Supabase API calls
6. **Replace mock data imports** with `useEffect` + API calls
7. **Add auth flow** using `supabase.auth.signInWithPassword()` / `signUp()`

---

## 9. Mock Data (Test Accounts)

All mock users have password `"password"` (test-only).

| ID | Name | Email | Role | Badge |
|---|---|---|---|---|
| `u1` | Dumisane Madondo | `dumisane.m@mycput.ac.za` | Student | Student ✓ |
| `u2` | Thandi Nkosi | `thandi.n@mycput.ac.za` | Student | Student ✓ |
| `u3` | Prof. Johan van Wyk | `prof.vanwyk@cput.ac.za` | Faculty | Staff ✓ |
| `u4` | Campus Tech Solutions | `campus.tech@gmail.com` | Vendor (approved) | Verified Seller ✓ |
| `u5` | Sipho Dlamini | `sipho.d@gmail.com` | Resident | None |
| `u6` | Admin User | `admin@cput.ac.za` | Admin | Staff ✓ |
| `u7` | Lerato Mokoena | `lerato.m@mycput.ac.za` | Student | Student ✓ |
| `u8` | Fresh Print Co. | `freshprint@gmail.com` | Vendor (pending) | None — **browse only** |

The default signed-in user is `u1` (Dumisane Madondo).

---

## 10. Development Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd community-store

# 2. Install dependencies
npm install

# 3. Start for web
npx expo start --web

# 4. Start for mobile (scan QR with Expo Go)
npx expo start

# 5. Type-check
npx tsc --noEmit

# 6. Check for outdated Expo packages
npx expo install --check
```

### Environment
- **Node.js**: 18+ required
- **Expo Go**: Install on your phone from App Store / Play Store
- **Never use** `expo start` (global CLI is deprecated) — always `npx expo start`

---

*Last updated: August 2026*

/**
 * Community Store — TypeScript type definitions
 */

// ─── User / Auth Types ──────────────────────────────────────────────────────

export type UserRole = 'student' | 'faculty' | 'vendor' | 'resident' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  is_verified: boolean;
  created_at: string;
  // Vendor-specific
  business_name?: string;
  registration_number?: string;
  verification_status?: 'pending' | 'approved' | 'rejected';
}

// ─── Listing Types ──────────────────────────────────────────────────────────

export type ListingCategory =
  | 'textbooks'
  | 'electronics'
  | 'furniture'
  | 'clothing'
  | 'services'
  | 'other';

export type ListingCondition = 'new' | 'used';

export type ListingStatus = 'active' | 'sold' | 'flagged' | 'removed';

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  condition: ListingCondition;
  status: ListingStatus;
  images: string[];
  created_at: string;
  updated_at: string;
  // Joined data
  seller?: UserProfile;
  avg_rating?: number;
  review_count?: number;
}

// ─── Review Types ───────────────────────────────────────────────────────────

export interface Review {
  id: string;
  reviewer_id: string;
  seller_id: string;
  listing_id: string;
  rating: number; // 1-5
  comment: string | null;
  created_at: string;
  // Joined
  reviewer?: UserProfile;
}

// ─── Cart Types ─────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  listing: Listing;
  quantity: number;
}

// ─── Order Types ────────────────────────────────────────────────────────────

export type DeliveryMethod = 'campus_pickup' | 'vendor_delivery';
export type PaymentMethod = 'payfast' | 'snapchat';
export type OrderStatus = 'confirmed' | 'pending' | 'processing' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  buyer_id: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_method: DeliveryMethod;
  payment_method: PaymentMethod;
  status: OrderStatus;
  created_at: string;
}

export interface OrderItem {
  listing_id: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

// ─── Notification Types ─────────────────────────────────────────────────────

export type NotificationType = 'order' | 'message' | 'review' | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  // Optional navigation target
  target_screen?: string;
  target_id?: string;
}

// ─── Bulletin Board Types ───────────────────────────────────────────────────

export type BulletinCategory = 'events' | 'services' | 'lost_and_found';

export interface BulletinPost {
  id: string;
  author_id: string;
  category: BulletinCategory;
  title: string;
  body: string;
  location?: string;
  date?: string;
  created_at: string;
  // Joined
  author?: UserProfile;
}

// ─── Message Types ──────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  participant_ids: string[];
  listing_id?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  // Joined
  other_user?: UserProfile;
  listing?: Listing;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

// ─── Admin Types ────────────────────────────────────────────────────────────

export interface AdminStats {
  flagged_listings: number;
  reported_users: number;
  active_listings: number;
  active_users: number;
}

export interface FlaggedItem {
  id: string;
  listing: Listing;
  reason: string;
  reported_by: string;
  created_at: string;
  status: 'pending' | 'reviewed' | 'approved' | 'removed';
}

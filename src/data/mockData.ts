/**
 * Community Store — Mock Data
 *
 * Realistic sample data for all screens. In production, this data
 * lives in Supabase tables. During development, this serves as
 * the data layer until the Supabase backend is connected.
 */

import type {
  AdminStats,
  BulletinPost,
  CartItem,
  Conversation,
  FlaggedItem,
  Listing,
  Notification,
  Order,
  Review,
  UserProfile,
} from '@/types';

// ─── Users ──────────────────────────────────────────────────────────────────

export const MOCK_CURRENT_USER: UserProfile = {
  id: 'u1',
  email: 'dumisane.m@cput.ac.za',
  full_name: 'Dumisane Madondo',
  role: 'student',
  avatar_url: null,
  is_verified: true,
  created_at: '2025-02-15T10:00:00Z',
};

export const MOCK_USERS: UserProfile[] = [
  MOCK_CURRENT_USER,
  {
    id: 'u2',
    email: 'thandi.n@cput.ac.za',
    full_name: 'Thandi Nkosi',
    role: 'student',
    avatar_url: null,
    is_verified: true,
    created_at: '2025-01-10T08:00:00Z',
  },
  {
    id: 'u3',
    email: 'prof.vanwyk@cput.ac.za',
    full_name: 'Prof. Johan van Wyk',
    role: 'faculty',
    avatar_url: null,
    is_verified: true,
    created_at: '2024-08-01T09:00:00Z',
  },
  {
    id: 'u4',
    email: 'campus.tech@gmail.com',
    full_name: 'Campus Tech Solutions',
    role: 'vendor',
    avatar_url: null,
    is_verified: true,
    business_name: 'Campus Tech Solutions',
    registration_number: 'REG-2024-00123',
    verification_status: 'approved',
    created_at: '2024-06-15T12:00:00Z',
  },
  {
    id: 'u5',
    email: 'sipho.d@gmail.com',
    full_name: 'Sipho Dlamini',
    role: 'resident',
    avatar_url: null,
    is_verified: false,
    created_at: '2025-03-20T14:00:00Z',
  },
  {
    id: 'u6',
    email: 'admin@cput.ac.za',
    full_name: 'Admin User',
    role: 'admin',
    avatar_url: null,
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'u7',
    email: 'lerato.m@cput.ac.za',
    full_name: 'Lerato Mokoena',
    role: 'student',
    avatar_url: null,
    is_verified: true,
    created_at: '2025-04-05T11:00:00Z',
  },
];

// ─── Listings ───────────────────────────────────────────────────────────────

export const MOCK_LISTINGS: Listing[] = [
  {
    id: 'l1',
    seller_id: 'u2',
    title: 'Calculus: Early Transcendentals 8th Ed',
    description:
      'James Stewart textbook in excellent condition. Minimal highlighting, no torn pages. Covers all first and second year calculus modules. Collection at Bellville campus.',
    price: 450,
    category: 'textbooks',
    condition: 'used',
    status: 'active',
    images: ['https://placehold.co/400x400/003C71/FFFFFF?text=Calculus'],
    created_at: '2026-07-10T09:00:00Z',
    updated_at: '2026-07-10T09:00:00Z',
    seller: MOCK_USERS[1],
    avg_rating: 4.5,
    review_count: 12,
  },
  {
    id: 'l2',
    seller_id: 'u4',
    title: 'iPhone 13 Pro — 128GB Space Grey',
    description:
      'Gently used iPhone 13 Pro. Battery health at 89%. Comes with original box, charger, and a free case. Screen protector already applied. No cracks or scratches.',
    price: 8500,
    category: 'electronics',
    condition: 'used',
    status: 'active',
    images: ['https://placehold.co/400x400/0072CE/FFFFFF?text=iPhone+13'],
    created_at: '2026-07-08T14:30:00Z',
    updated_at: '2026-07-08T14:30:00Z',
    seller: MOCK_USERS[3],
    avg_rating: 4.8,
    review_count: 34,
  },
  {
    id: 'l3',
    seller_id: 'u3',
    title: 'Engineering Drawing Board A2',
    description:
      'Professional A2 drawing board with parallel ruler. Perfect for architecture and engineering students. Used for one semester only.',
    price: 350,
    category: 'other',
    condition: 'used',
    status: 'active',
    images: ['https://placehold.co/400x400/059669/FFFFFF?text=Drawing+Board'],
    created_at: '2026-07-05T11:00:00Z',
    updated_at: '2026-07-05T11:00:00Z',
    seller: MOCK_USERS[2],
    avg_rating: 5.0,
    review_count: 3,
  },
  {
    id: 'l4',
    seller_id: 'u5',
    title: 'IKEA Study Desk — White',
    description:
      'Compact study desk, perfect for res rooms. 120cm x 60cm. Easy to disassemble for transport. Minor scuff on one leg — barely visible.',
    price: 600,
    category: 'furniture',
    condition: 'used',
    status: 'active',
    images: ['https://placehold.co/400x400/D97706/FFFFFF?text=Study+Desk'],
    created_at: '2026-07-12T16:00:00Z',
    updated_at: '2026-07-12T16:00:00Z',
    seller: MOCK_USERS[4],
    avg_rating: 4.0,
    review_count: 7,
  },
  {
    id: 'l5',
    seller_id: 'u4',
    title: 'HP LaserJet Printer — Wireless',
    description:
      'Brand new, sealed in box. HP LaserJet M110we. WiFi enabled, works with HP Smart app. Perfect for printing assignments and notes.',
    price: 1800,
    category: 'electronics',
    condition: 'new',
    status: 'active',
    images: ['https://placehold.co/400x400/003C71/FFFFFF?text=HP+Printer'],
    created_at: '2026-07-14T08:00:00Z',
    updated_at: '2026-07-14T08:00:00Z',
    seller: MOCK_USERS[3],
    avg_rating: 4.8,
    review_count: 34,
  },
  {
    id: 'l6',
    seller_id: 'u7',
    title: 'Organic Chemistry Lab Coat — Size M',
    description:
      'White lab coat, medium size. Worn twice — switched to a large. Still looks brand new. Required for all chemistry and biology practicals.',
    price: 150,
    category: 'clothing',
    condition: 'used',
    status: 'active',
    images: ['https://placehold.co/400x400/0198CD/FFFFFF?text=Lab+Coat'],
    created_at: '2026-07-13T10:00:00Z',
    updated_at: '2026-07-13T10:00:00Z',
    seller: MOCK_USERS[6],
    avg_rating: 4.2,
    review_count: 5,
  },
  {
    id: 'l7',
    seller_id: 'u2',
    title: 'Python Programming Tutoring',
    description:
      'One-on-one Python tutoring sessions. I cover PYT101 and PYT201 modules. R120/hour at Bellville campus library or online via Teams. 90% pass rate with my students!',
    price: 120,
    category: 'services',
    condition: 'new',
    status: 'active',
    images: ['https://placehold.co/400x400/0072CE/FFFFFF?text=Python+Tutor'],
    created_at: '2026-07-11T12:00:00Z',
    updated_at: '2026-07-11T12:00:00Z',
    seller: MOCK_USERS[1],
    avg_rating: 4.5,
    review_count: 12,
  },
  {
    id: 'l8',
    seller_id: 'u3',
    title: 'Scientific Calculator — Casio fx-991EX',
    description:
      'Advanced scientific calculator. Allowed in all CPUT exams. Natural textbook display, spreadsheet function, QR code link. Comes with protective case.',
    price: 280,
    category: 'electronics',
    condition: 'used',
    status: 'active',
    images: ['https://placehold.co/400x400/003C71/FFFFFF?text=Calculator'],
    created_at: '2026-07-09T15:00:00Z',
    updated_at: '2026-07-09T15:00:00Z',
    seller: MOCK_USERS[2],
    avg_rating: 5.0,
    review_count: 3,
  },
  {
    id: 'l9',
    seller_id: 'u5',
    title: 'Acoustic Guitar — Yamaha F310',
    description:
      'Great starter guitar. Spruce top, meranti back and sides. Comes with soft case, capo, and picks. Perfect condition — just no time to play anymore.',
    price: 1200,
    category: 'other',
    condition: 'used',
    status: 'active',
    images: ['https://placehold.co/400x400/D97706/FFFFFF?text=Guitar'],
    created_at: '2026-07-06T13:00:00Z',
    updated_at: '2026-07-06T13:00:00Z',
    seller: MOCK_USERS[4],
    avg_rating: 4.0,
    review_count: 7,
  },
  {
    id: 'l10',
    seller_id: 'u7',
    title: 'Introduction to Business Management 5th Ed',
    description:
      'Prescribed textbook for BMS101. Clean pages, no highlighting. Previous edition but content is 95% the same as the 6th — confirmed by the lecturer.',
    price: 200,
    category: 'textbooks',
    condition: 'used',
    status: 'active',
    images: ['https://placehold.co/400x400/059669/FFFFFF?text=Business+Mgmt'],
    created_at: '2026-07-15T07:00:00Z',
    updated_at: '2026-07-15T07:00:00Z',
    seller: MOCK_USERS[6],
    avg_rating: 4.2,
    review_count: 5,
  },
];

// ─── Reviews ────────────────────────────────────────────────────────────────

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'r1',
    reviewer_id: 'u1',
    seller_id: 'u2',
    listing_id: 'l1',
    rating: 5,
    comment: 'Textbook was exactly as described. Thandi was super helpful and even met me at the library. Highly recommend!',
    created_at: '2026-07-12T10:00:00Z',
    reviewer: MOCK_USERS[0],
  },
  {
    id: 'r2',
    reviewer_id: 'u7',
    seller_id: 'u4',
    listing_id: 'l2',
    rating: 4,
    comment: 'Phone works great, delivery was a bit slow but the seller communicated well throughout.',
    created_at: '2026-07-10T14:00:00Z',
    reviewer: MOCK_USERS[6],
  },
  {
    id: 'r3',
    reviewer_id: 'u2',
    seller_id: 'u3',
    listing_id: 'l3',
    rating: 5,
    comment: 'Prof. van Wyk is a legend. Drawing board was in perfect condition. Thank you!',
    created_at: '2026-07-08T09:00:00Z',
    reviewer: MOCK_USERS[1],
  },
  {
    id: 'r4',
    reviewer_id: 'u1',
    seller_id: 'u4',
    listing_id: 'l5',
    rating: 5,
    comment: 'Brand new as promised. Campus Tech is legit — fast delivery and great packaging.',
    created_at: '2026-07-15T16:00:00Z',
    reviewer: MOCK_USERS[0],
  },
  {
    id: 'r5',
    reviewer_id: 'u5',
    seller_id: 'u2',
    listing_id: 'l7',
    rating: 4,
    comment: 'Good tutoring session, really helped me understand recursion. Will book again.',
    created_at: '2026-07-13T18:00:00Z',
    reviewer: MOCK_USERS[4],
  },
];

// ─── Cart ───────────────────────────────────────────────────────────────────

export const MOCK_CART: CartItem[] = [
  { id: 'c1', listing: MOCK_LISTINGS[0], quantity: 1 },
  { id: 'c2', listing: MOCK_LISTINGS[5], quantity: 1 },
];

// ─── Orders ─────────────────────────────────────────────────────────────────

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-2026-001',
    buyer_id: 'u1',
    items: [
      {
        listing_id: 'l1',
        title: 'Calculus: Early Transcendentals 8th Ed',
        price: 450,
        quantity: 1,
        image: 'https://placehold.co/400x400/003C71/FFFFFF?text=Calculus',
      },
    ],
    subtotal: 450,
    delivery_fee: 0,
    total: 450,
    delivery_method: 'campus_pickup',
    payment_method: 'payfast',
    status: 'confirmed',
    created_at: '2026-07-14T10:00:00Z',
  },
];

// ─── Notifications ──────────────────────────────────────────────────────────

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    user_id: 'u1',
    type: 'order',
    title: 'Order Confirmed',
    body: 'Your order ORD-2026-001 has been confirmed. Pick up at Bellville campus.',
    is_read: false,
    created_at: '2026-07-14T10:05:00Z',
    target_screen: 'order-confirmed',
    target_id: 'ORD-2026-001',
  },
  {
    id: 'n2',
    user_id: 'u1',
    type: 'message',
    title: 'New message from Thandi',
    body: 'Hi! The textbook is ready for collection at the library entrance.',
    is_read: false,
    created_at: '2026-07-14T09:30:00Z',
    target_screen: 'messages',
    target_id: 'conv1',
  },
  {
    id: 'n3',
    user_id: 'u1',
    type: 'review',
    title: 'New review on your listing',
    body: 'Lerato left a 5-star review on your Python notes.',
    is_read: true,
    created_at: '2026-07-13T15:00:00Z',
    target_screen: 'seller-profile',
    target_id: 'u1',
  },
  {
    id: 'n4',
    user_id: 'u1',
    type: 'system',
    title: 'Welcome to Community Store!',
    body: 'Your account has been verified. Start buying and selling on campus.',
    is_read: true,
    created_at: '2025-02-15T10:00:00Z',
  },
];

// ─── Bulletin Board ─────────────────────────────────────────────────────────

export const MOCK_BULLETIN_POSTS: BulletinPost[] = [
  {
    id: 'bp1',
    author_id: 'u3',
    category: 'events',
    title: 'Engineering Open Day — July 25',
    body: 'Join us for the annual Engineering Faculty Open Day. Demonstrations, lab tours, and networking with industry partners. All students welcome!',
    location: 'Bellville Campus — Engineering Building',
    date: '2026-07-25',
    created_at: '2026-07-10T08:00:00Z',
    author: MOCK_USERS[2],
  },
  {
    id: 'bp2',
    author_id: 'u7',
    category: 'lost_and_found',
    title: 'Lost: Blue Lenovo Laptop Charger',
    body: 'Left my charger in the 3rd floor computer lab (Room 3.12) on Monday afternoon. It has a white sticker with my initials "LM" on it. Please DM if found!',
    location: 'Bellville Campus — Room 3.12',
    created_at: '2026-07-14T16:00:00Z',
    author: MOCK_USERS[6],
  },
  {
    id: 'bp3',
    author_id: 'u4',
    category: 'services',
    title: 'Free Laptop Diagnostics This Week',
    body: 'Campus Tech Solutions is offering free laptop diagnostics all week. Slow laptop? Virus issues? Bring it to our stall at the student centre.',
    location: 'Student Centre — Ground Floor',
    date: '2026-07-16',
    created_at: '2026-07-13T09:00:00Z',
    author: MOCK_USERS[3],
  },
  {
    id: 'bp4',
    author_id: 'u2',
    category: 'events',
    title: 'Study Group: MAT201 Exam Prep',
    body: 'Starting a study group for the upcoming MAT201 exam. We meet Tuesdays and Thursdays 16:00-18:00 at the library. Bring your textbook and past papers.',
    location: 'Bellville Campus Library',
    date: '2026-07-22',
    created_at: '2026-07-15T12:00:00Z',
    author: MOCK_USERS[1],
  },
];

// ─── Conversations ──────────────────────────────────────────────────────────

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv1',
    participant_ids: ['u1', 'u2'],
    listing_id: 'l1',
    last_message: 'Hi! The textbook is ready for collection at the library entrance.',
    last_message_at: '2026-07-14T09:30:00Z',
    unread_count: 1,
    other_user: MOCK_USERS[1],
    listing: MOCK_LISTINGS[0],
  },
  {
    id: 'conv2',
    participant_ids: ['u1', 'u4'],
    listing_id: 'l5',
    last_message: 'Thank you! The printer arrived in perfect condition.',
    last_message_at: '2026-07-15T16:30:00Z',
    unread_count: 0,
    other_user: MOCK_USERS[3],
    listing: MOCK_LISTINGS[4],
  },
  {
    id: 'conv3',
    participant_ids: ['u1', 'u3'],
    listing_id: 'l3',
    last_message: 'Is the drawing board still available?',
    last_message_at: '2026-07-12T11:00:00Z',
    unread_count: 0,
    other_user: MOCK_USERS[2],
    listing: MOCK_LISTINGS[2],
  },
];

// ─── Admin ──────────────────────────────────────────────────────────────────

export const MOCK_ADMIN_STATS: AdminStats = {
  flagged_listings: 3,
  reported_users: 1,
  active_listings: 47,
  active_users: 156,
};

export const MOCK_FLAGGED_ITEMS: FlaggedItem[] = [
  {
    id: 'f1',
    listing: MOCK_LISTINGS[3],
    reason: 'Suspected counterfeit product',
    reported_by: 'u7',
    created_at: '2026-07-15T08:00:00Z',
    status: 'pending',
  },
  {
    id: 'f2',
    listing: MOCK_LISTINGS[8],
    reason: 'Price seems too low — possible scam',
    reported_by: 'u2',
    created_at: '2026-07-14T14:00:00Z',
    status: 'pending',
  },
];

// ─── Categories ─────────────────────────────────────────────────────────────

export const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'textbooks', label: 'Textbooks' },
  { key: 'electronics', label: 'Electronics' },
  { key: 'furniture', label: 'Furniture' },
  { key: 'clothing', label: 'Clothing' },
  { key: 'services', label: 'Services' },
  { key: 'other', label: 'Other' },
] as const;

export const BULLETIN_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'events', label: 'Events' },
  { key: 'services', label: 'Services' },
  { key: 'lost_and_found', label: 'Lost & Found' },
] as const;

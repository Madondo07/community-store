/**
 * Shared seed data — used by both scripts/seed.js and
 * scripts/update-seed-images.js so they can't drift apart.
 */

const SEED_PASSWORD = "SeedUser123!";

// ─── Personas ───────────────────────────────────────────────────────────────

const PERSONAS = [
  {
    email: "thandi.n.seed@mycput.ac.za",
    full_name: "Thandi Nkosi",
    role: "student",
    listings: [
      {
        title: "Calculus: Early Transcendentals 8th Ed",
        description: "James Stewart textbook in excellent condition. Minimal highlighting, no torn pages. Covers all first and second year calculus modules. Collection at Bellville campus.",
        price: 450, category: "textbooks", condition: "used",
        images: ["https://commons.wikimedia.org/wiki/Special:FilePath/Stacks_of_Books.JPG?width=500"],
      },
      {
        title: "Python Programming Tutoring",
        description: "One-on-one Python tutoring sessions. I cover PYT101 and PYT201 modules. R120/hour at Bellville campus library or online via Teams. 90% pass rate with my students!",
        price: 120, category: "services", condition: "new",
        images: ["https://commons.wikimedia.org/wiki/Special:FilePath/Laptop_coding_programs_(Unsplash).jpg?width=500"],
      },
    ],
  },
  {
    email: "campus.tech.seed@gmail.com",
    full_name: "Campus Tech Solutions",
    role: "vendor",
    business_name: "Campus Tech Solutions",
    registration_number: "REG-2024-00123",
    listings: [
      {
        title: "iPhone 13 Pro — 128GB Space Grey",
        description: "Gently used iPhone 13 Pro. Battery health at 89%. Comes with original box, charger, and a free case. Screen protector already applied. No cracks or scratches.",
        price: 8500, category: "electronics", condition: "used",
        images: ["https://commons.wikimedia.org/wiki/Special:FilePath/Back_of_the_iPhone_13_Pro.jpg?width=500"],
      },
      {
        title: "HP LaserJet Printer — Wireless",
        description: "Brand new, sealed in box. HP LaserJet M110we. WiFi enabled, works with HP Smart app. Perfect for printing assignments and notes.",
        price: 1800, category: "electronics", condition: "new",
        images: ["https://commons.wikimedia.org/wiki/Special:FilePath/HP_LaserJet_1020_printer.jpg?width=500"],
      },
    ],
  },
  {
    email: "prof.vanwyk.seed@cput.ac.za",
    full_name: "Prof. Johan van Wyk",
    role: "student",
    listings: [
      {
        title: "Engineering Drawing Board A2",
        description: "Professional A2 drawing board with parallel ruler. Perfect for architecture and engineering students. Used for one semester only.",
        price: 350, category: "other", condition: "used",
        images: ["https://commons.wikimedia.org/wiki/Special:FilePath/Drafting_board_with_T_square_and_drawingtools.jpg?width=500"],
      },
      {
        title: "Scientific Calculator — Casio fx-991EX",
        description: "Advanced scientific calculator. Allowed in all CPUT exams. Natural textbook display, spreadsheet function, QR code link. Comes with protective case.",
        price: 280, category: "electronics", condition: "used",
        images: ["https://commons.wikimedia.org/wiki/Special:FilePath/Casio_fx-180P_scientific_calculator.jpg?width=500"],
      },
    ],
  },
  {
    email: "sipho.d.seed@gmail.com",
    full_name: "Sipho Dlamini",
    role: "student",
    listings: [
      {
        title: "IKEA Study Desk — White",
        description: "Compact study desk, perfect for res rooms. 120cm x 60cm. Easy to disassemble for transport. Minor scuff on one leg — barely visible.",
        price: 600, category: "furniture", condition: "used",
        images: ["https://commons.wikimedia.org/wiki/Special:FilePath/Laptop_on_a_neat_desk_(Unsplash).jpg?width=500"],
      },
      {
        title: "Acoustic Guitar — Yamaha F310",
        description: "Great starter guitar. Spruce top, meranti back and sides. Comes with soft case, capo, and picks. Perfect condition — just no time to play anymore.",
        price: 1200, category: "other", condition: "used",
        images: ["https://commons.wikimedia.org/wiki/Special:FilePath/Yamaha_FG403S_Dreadnought_Style_Acoustic_Guitar_(2002).jpg?width=500"],
      },
    ],
  },
  {
    email: "lerato.m.seed@mycput.ac.za",
    full_name: "Lerato Mokoena",
    role: "student",
    listings: [
      {
        title: "Introduction to Business Management 5th Ed",
        description: "Prescribed textbook for BMS101. Clean pages, no highlighting. Previous edition but content is 95% the same as the 6th — confirmed by the lecturer.",
        price: 200, category: "textbooks", condition: "used",
        images: ["https://commons.wikimedia.org/wiki/Special:FilePath/Stacks_of_Books.JPG?width=500"],
      },
      {
        title: "Organic Chemistry Lab Coat — Size M",
        description: "White lab coat, medium size. Worn twice — switched to a large. Still looks brand new. Required for all chemistry and biology practicals.",
        price: 150, category: "clothing", condition: "used",
        images: ["https://commons.wikimedia.org/wiki/Special:FilePath/Lab_coats.jpg?width=500"],
      },
    ],
  },
  {
    email: "freshprint.seed@gmail.com",
    full_name: "Fresh Print Co.",
    role: "vendor",
    business_name: "Fresh Print Co.",
    registration_number: "REG-2025-00456",
    listings: [
      {
        title: "Custom Society T-Shirts — Bulk Order",
        description: "Screen printing for student societies and res events. Minimum order 20 shirts. Fast turnaround, competitive rates. DM for a quote.",
        price: 90, category: "clothing", condition: "new",
        images: ["https://commons.wikimedia.org/wiki/Special:FilePath/Tee_shirts_(18352359122).jpg?width=500"],
      },
    ],
  },
];

const BULLETIN_POSTS = [
  {
    authorEmail: "prof.vanwyk.seed@cput.ac.za",
    category: "events",
    title: "Engineering Open Day — 25 July",
    body: "Join us for the annual Engineering Faculty Open Day. Demonstrations, lab tours, and networking with industry partners. All students welcome!",
    location: "Bellville Campus — Engineering Building",
  },
  {
    authorEmail: "lerato.m.seed@mycput.ac.za",
    category: "lost_and_found",
    title: "Lost: Blue Lenovo Laptop Charger",
    body: 'Left my charger in the 3rd floor computer lab (Room 3.12) on Monday afternoon. It has a white sticker with my initials "LM" on it. Please DM if found!',
    location: "Bellville Campus — Room 3.12",
  },
  {
    authorEmail: "campus.tech.seed@gmail.com",
    category: "services",
    title: "Free Laptop Diagnostics This Week",
    body: "Campus Tech Solutions is offering free laptop diagnostics all week. Slow laptop? Virus issues? Bring it to our stall at the student centre.",
    location: "Student Centre — Ground Floor",
  },
];

// Cross-reviews: reviewerEmail leaves a review on a listing published by
// another persona (matched by listing title, resolved after listings exist).
const REVIEWS = [
  { reviewerEmail: "sipho.d.seed@gmail.com", listingTitle: "Calculus: Early Transcendentals 8th Ed", rating: 5, comment: "Textbook was exactly as described. Thandi was super helpful. Highly recommend!" },
  { reviewerEmail: "lerato.m.seed@mycput.ac.za", listingTitle: "iPhone 13 Pro — 128GB Space Grey", rating: 4, comment: "Phone works great, delivery was a bit slow but the seller communicated well throughout." },
  { reviewerEmail: "thandi.n.seed@mycput.ac.za", listingTitle: "Engineering Drawing Board A2", rating: 5, comment: "Prof. van Wyk is a legend. Drawing board was in perfect condition. Thank you!" },
  { reviewerEmail: "campus.tech.seed@gmail.com", listingTitle: "IKEA Study Desk — White", rating: 4, comment: "Good desk, easy to assemble. Would buy from Sipho again." },
];


module.exports = { SEED_PASSWORD, PERSONAS, BULLETIN_POSTS, REVIEWS };

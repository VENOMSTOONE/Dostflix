export const memories = [
  {
    id: "mem-video-call-1",
    title: "That night",
    description: "Distance is just details. Sharing laughs and stories over a late-night video call, making the screen disappear.",
    date: "2026-06-15",
    mediaType: "mixed",
    assets: [
      "/WhatsApp Image 2026-07-30 at 6.42.18 PM.jpeg",
      "/WhatsApp Image 2026-07-30 at 6.42.15 PM.jpeg",
      "/WhatsApp Image 2026-07-30 at 6.42.15 PM (1).jpeg",
      "/WhatsApp Video 2026-07-30 at 6.42.10 PM.mp4",
      "/WhatsApp Video 2026-07-30 at 6.42.17 PM.mp4"
    ],
    thumbnail: "/WhatsApp Image 2026-07-30 at 6.42.18 PM.jpeg",
    tags: ["Long Distance", "Late Nights", "Video Call"],
    people: ["Stuti", "Vaibhav"],
    location: "Home",
    mood: "emotional",
    collectionId: "coll-distance",
    featured: true,
    favorite: true
  },
  {
    id: "mem-ice-cream",
    title: "The Ice Cream Date",
    description: "Indulging in our favorite scoops at Naturals. Sweet moments, colder treats, warmer hearts.",
    date: "2026-07-10",
    mediaType: "mixed",
    assets: [
      "/WhatsApp Image 2026-07-30 at 6.42.16 PM.jpeg",
      "/WhatsApp Image 2026-07-30 at 6.42.17 PM.jpeg",
      "/WhatsApp Video 2026-07-30 at 6.42.16 PM.mp4"
    ],
    thumbnail: "/WhatsApp Image 2026-07-30 at 6.42.16 PM.jpeg",
    tags: ["Date Night", "Naturals", "Sweet Tooth"],
    people: ["Stuti", "Vaibhav"],
    location: "Ice Cream Parlor",
    mood: "happy",
    collectionId: "coll-dates",
    featured: false,
    favorite: true
  },
  {
    id: "mem-postcards",
    title: "Postcards from Udaipur",
    description: "Collecting memories one postcard at a time. Tracing the beautiful heritage architecture of Jagat Niwas and lake palaces.",
    date: "2026-05-20",
    mediaType: "image",
    assets: [
      "/WhatsApp Image 2026-07-30 at 6.42.13 PM.jpeg"
    ],
    thumbnail: "/WhatsApp Image 2026-07-30 at 6.42.13 PM.jpeg",
    tags: ["Travel", "Heritage", "Udaipur", "Postcards"],
    people: ["Lakshay"],
    location: "Udaipur",
    mood: "peaceful",
    collectionId: "coll-keepsakes",
    featured: false,
    favorite: false
  },
  {
    id: "mem-photobooth",
    title: "Retro Photo Booth Loops",
    description: "Strike a pose! Black and white memories from the retro booth. Making silly faces, laughing until it hurts.",
    date: "2026-06-30",
    mediaType: "mixed",
    assets: [
      "/WhatsApp Image 2026-07-30 at 6.42.12 PM.jpeg",
      "/WhatsApp Video 2026-07-30 at 6.42.03 PM.mp4",
      "/WhatsApp Video 2026-07-30 at 6.42.18 PM.mp4"
    ],
    thumbnail: "/WhatsApp Image 2026-07-30 at 6.42.12 PM.jpeg",
    tags: ["Polaroid", "Retro", "Best Friends", "Giggles"],
    people: ["Stuti", "Vaibhav", "Lakshay"],
    location: "Retro Arcade",
    mood: "funny",
    collectionId: "coll-keepsakes",
    featured: false,
    favorite: true
  },
  {
    id: "mem-restaurant",
    title: "Food, Menus & Deep Chats",
    description: "Dinner night outs. Sharing hearty South Indian Dosas and checking out desserts together.",
    date: "2026-07-18",
    mediaType: "mixed",
    assets: [
      "/WhatsApp Image 2026-07-30 at 6.42.14 PM.jpeg",
      "/WhatsApp Image 2026-07-30 at 6.42.19 PM.jpeg",
      "/WhatsApp Video 2026-07-30 at 6.42.11 PM.mp4",
      "/WhatsApp Video 2026-07-30 at 6.42.12 PM.mp4",
      "/WhatsApp Video 2026-07-30 at 6.42.11 PM (1).mp4",
      "/WhatsApp Video 2026-07-30 at 6.42.11 PM (2).mp4"
    ],
    thumbnail: "/WhatsApp Image 2026-07-30 at 6.42.14 PM.jpeg",
    tags: ["Dosa", "Date Night", "Foodie", "Dinner"],
    people: ["Vaibhav", "Lakshay"],
    location: "Dosa Cafe",
    mood: "happy",
    collectionId: "coll-dates",
    featured: false,
    favorite: false
  },
  {
    id: "mem-time-lapse",
    title: "Virtual Projects & Work sessions",
    description: "Setting up time-lapse frames, debugging code, and working in parallel across oceans.",
    date: "2026-07-02",
    mediaType: "mixed",
    assets: [
      "/WhatsApp Image 2026-07-30 at 6.42.14 PM (1).jpeg",
      "/WhatsApp Video 2026-07-30 at 6.41.58 PM.mp4",
      "/WhatsApp Video 2026-07-30 at 6.42.19 PM.mp4"
    ],
    thumbnail: "/WhatsApp Image 2026-07-30 at 6.42.14 PM (1).jpeg",
    tags: ["Time-lapse", "Coding", "Focus Mode"],
    people: ["Vaibhav"],
    location: "Home Office",
    mood: "peaceful",
    collectionId: "coll-distance",
    featured: false,
    favorite: false
  }
];

export const collections = [
  {
    id: "coll-distance",
    title: "Virtual Beats & Distance",
    description: "Late nights, screen glows, and parallel worlds.",
    accentColor: "from-sky-700 to-indigo-900"
  },
  {
    id: "coll-dates",
    title: "Cafe Hangovers & Dates",
    description: "Scoops, dosas, and long dinner table talks.",
    accentColor: "from-amber-600 to-rose-900"
  },
  {
    id: "coll-keepsakes",
    title: "Keepsakes & Ephemera",
    description: "Polaroids, postcards, and tangible footprints.",
    accentColor: "from-emerald-600 to-teal-900"
  }
];

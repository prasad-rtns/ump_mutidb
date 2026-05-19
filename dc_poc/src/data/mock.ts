import type {
  AttractionCategory,
  EventItem,
  ExploreTile,
  GalleryItem,
  NewsItem,
  OpenCallItem,
  PlaceItem,
  QuickLink,
  ServiceSection,
} from "../types";

/** Placeholder imagery — Dubai / culture themed (Unsplash). */
export const HERO_IMAGE =
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1400&q=80";

export const SITE_BASE = "https://dubaiculture.gov.ae";

export const QUICK_LINKS: QuickLink[] = [
  {
    id: "whats-on",
    label: "What's On",
    icon: "calendar",
    target: { type: "tab", tab: "WhatsOn" },
  },
  {
    id: "attractions",
    label: "Attractions",
    icon: "map",
    target: { type: "tab", tab: "Attractions" },
  },
  {
    id: "discover",
    label: "Discover",
    icon: "images",
    target: { type: "tab", tab: "Discover" },
  },
  {
    id: "e-services",
    label: "E-Services",
    icon: "document",
    target: { type: "nested", tab: "More", screen: "EServices" },
  },
  {
    id: "contact",
    label: "Contact",
    icon: "call",
    target: { type: "nested", tab: "More", screen: "Contact" },
  },
  {
    id: "open-data",
    label: "Open Data",
    icon: "globe",
    target: { type: "url", url: `${SITE_BASE}/en/about-us/open-data` },
  },
];

export const NEWS: NewsItem[] = [
  {
    id: "n1",
    title: "Heritage-led activations across Al Fahidi Historical Neighbourhood",
    date: "12 Apr 2026",
    excerpt:
      "Seasonal workshops and walking tours spotlight Emirati craft, storytelling, and neighbourhood history.",
    imageUrl:
      "https://images.unsplash.com/photo-1582672060674-2c8a1d1b8934?w=800&q=80",
  },
  {
    id: "n2",
    title: "Public library membership: new digital services",
    date: "05 Apr 2026",
    excerpt:
      "Borrowing, reservations, and community programmes are easier to access online for residents.",
    imageUrl:
      "https://images.unsplash.com/photo-1521587760476-6c12a4b0da34?w=800&q=80",
  },
  {
    id: "n3",
    title: "Creative programmes for youth and emerging artists",
    date: "28 Mar 2026",
    excerpt:
      "Open calls and mentorship tracks support stage, visual arts, and interdisciplinary projects.",
    imageUrl:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80",
  },
];

export const OPEN_CALLS: OpenCallItem[] = [
  {
    id: "oc1",
    title: "Creative Shelf — summer showcase",
    deadline: "30 Apr 2026",
    summary:
      "Submit proposals for community-led displays in selected library branches across Dubai.",
    department: "Libraries",
  },
  {
    id: "oc2",
    title: "Public art commission — waterfront route",
    deadline: "15 May 2026",
    summary:
      "Artists and collectives are invited to propose large-scale installations for a new cultural corridor.",
    department: "Public Art",
  },
  {
    id: "oc3",
    title: "Heritage documentation volunteers",
    deadline: "01 Jun 2026",
    summary:
      "Support oral history interviews and archival digitisation for neighbourhood heritage projects.",
    department: "Heritage",
  },
];

export const EVENTS: EventItem[] = [
  {
    id: "1",
    title: "Heritage Walk - Al Fahidi",
    date: "22 Apr 2026",
    venue: "Al Fahidi Historical District",
    summary:
      "Guided walk through heritage houses, wind towers, and cultural spaces in the historic district.",
    category: "Heritage",
    imageUrl:
      "https://images.unsplash.com/photo-1582672060674-2c8a1d1b8934?w=800&q=80",
  },
  {
    id: "2",
    title: "Dubai Public Art Talks",
    date: "28 Apr 2026",
    venue: "Jameel Arts Centre",
    summary:
      "Short talks with artists and curators across the city's public art programme.",
    category: "Art",
    imageUrl:
      "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=800&q=80",
  },
  {
    id: "3",
    title: "Youth Theatre Workshop",
    date: "03 May 2026",
    venue: "Al Jalila Cultural Centre",
    summary:
      "Hands-on workshop introducing stage presence, voice, and storytelling basics.",
    category: "Education",
    imageUrl:
      "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80",
  },
  {
    id: "4",
    title: "Museum Nights — extended hours",
    date: "10 May 2026",
    venue: "Etihad Museum",
    summary:
      "Evening access to galleries, curator introductions, and family-friendly activities.",
    category: "Museums",
    imageUrl:
      "https://images.unsplash.com/photo-1566127444979-b3d2badd0f44?w=800&q=80",
  },
];

export const SECTIONS: ServiceSection[] = [
  {
    title: "Museums",
    description:
      "Discover Dubai museums, exhibitions, and seasonal cultural programmes.",
    imageUrl:
      "https://images.unsplash.com/photo-1566127444979-b3d2badd0f44?w=800&q=80",
  },
  {
    title: "Libraries",
    description:
      "Find libraries, memberships, digital collections, and community learning.",
    imageUrl:
      "https://images.unsplash.com/photo-1521587760476-6c12a4b0da34?w=800&q=80",
  },
  {
    title: "Heritage sites",
    description:
      "Explore historic districts, houses, and protected landmarks across the emirate.",
    imageUrl:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
  },
  {
    title: "Cultural arts & centres",
    description:
      "Theatre, music, and multidisciplinary programmes in dedicated cultural venues.",
    imageUrl:
      "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80",
  },
];

export const CATEGORIES: AttractionCategory[] = [
  {
    id: "museums",
    title: "Museums",
    description: "Museum collections, exhibitions, and learning programmes.",
    imageUrl:
      "https://images.unsplash.com/photo-1566127444979-b3d2badd0f44?w=800&q=80",
  },
  {
    id: "libraries",
    title: "Libraries",
    description: "Branches, memberships, digital services, and events.",
    imageUrl:
      "https://images.unsplash.com/photo-1521587760476-6c12a4b0da34?w=800&q=80",
  },
  {
    id: "heritage_sites",
    title: "Heritage sites",
    description: "Historic neighbourhoods, houses, and protected landmarks.",
    imageUrl:
      "https://images.unsplash.com/photo-1582672060674-2c8a1d1b8934?w=800&q=80",
  },
  {
    id: "cultural_centres",
    title: "Cultural arts & centres",
    description: "Performing arts, workshops, and community cultural venues.",
    imageUrl:
      "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80",
  },
];

export const PLACES: PlaceItem[] = [
  {
    id: "p1",
    categoryId: "museums",
    name: "Etihad Museum",
    area: "Jumeirah",
    summary: "National museum narrating the UAE formation story with immersive galleries.",
    imageUrl:
      "https://images.unsplash.com/photo-1566127444979-b3d2badd0f44?w=800&q=80",
  },
  {
    id: "p2",
    categoryId: "museums",
    name: "Al Shindagha Museum",
    area: "Al Shindagha",
    summary: "Living heritage museum celebrating Dubai Creek, pearl diving, and Emirati life.",
    imageUrl:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
  },
  {
    id: "p3",
    categoryId: "libraries",
    name: "Al Twar Library",
    area: "Al Twar",
    summary: "Community library with study spaces, children's programmes, and digital lending.",
    imageUrl:
      "https://images.unsplash.com/photo-1521587760476-6c12a4b0da34?w=800&q=80",
  },
  {
    id: "p4",
    categoryId: "libraries",
    name: "Hatta Public Library",
    area: "Hatta",
    summary: "Mountain library serving residents with reading rooms and cultural activities.",
    imageUrl:
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80",
  },
  {
    id: "p5",
    categoryId: "heritage_sites",
    name: "Al Fahidi Historical Neighbourhood",
    area: "Bur Dubai",
    summary: "Wind towers, lanes, and cultural spaces in one of Dubai's oldest districts.",
    imageUrl:
      "https://images.unsplash.com/photo-1582672060674-2c8a1d1b8934?w=800&q=80",
  },
  {
    id: "p6",
    categoryId: "heritage_sites",
    name: "Sheikh Saeed Al Maktoum House",
    area: "Al Shindagha",
    summary: "Historic residence showcasing architecture, photographs, and royal heritage.",
    imageUrl:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
  },
  {
    id: "p7",
    categoryId: "cultural_centres",
    name: "Al Jalila Cultural Centre",
    area: "Al Wasl",
    summary: "Performing arts, youth programmes, and multidisciplinary cultural workshops.",
    imageUrl:
      "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80",
  },
  {
    id: "p8",
    categoryId: "cultural_centres",
    name: "Dubai Opera (cultural programme)",
    area: "Downtown",
    summary: "Flagship venue hosting theatre, music, and cultural collaborations.",
    imageUrl:
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80",
  },
];

export function getCategoryById(id: string): AttractionCategory | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getPlacesByCategory(categoryId: string): PlaceItem[] {
  return PLACES.filter((p) => p.categoryId === categoryId);
}

export const GALLERY: GalleryItem[] = [
  {
    id: "g1",
    title: "Creek at dusk",
    imageUrl:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
  },
  {
    id: "g2",
    title: "Heritage lane",
    imageUrl:
      "https://images.unsplash.com/photo-1582672060674-2c8a1d1b8934?w=800&q=80",
  },
  {
    id: "g3",
    title: "Public sculpture",
    imageUrl:
      "https://images.unsplash.com/photo-1561214115-f2f134728491?w=800&q=80",
  },
  {
    id: "g4",
    title: "Library reading room",
    imageUrl:
      "https://images.unsplash.com/photo-1521587760476-6c12a4b0da34?w=800&q=80",
  },
  {
    id: "g5",
    title: "Museum gallery",
    imageUrl:
      "https://images.unsplash.com/photo-1566127444979-b3d2badd0f44?w=800&q=80",
  },
  {
    id: "g6",
    title: "Cultural performance",
    imageUrl:
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80",
  },
];

export const EXPLORE_TILES: ExploreTile[] = [
  {
    id: "gallery",
    title: "Gallery",
    description: "Visual stories from programmes, sites, and community moments.",
    imageUrl:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
  },
  {
    id: "in-pictures",
    title: "In pictures",
    description: "Highlights from festivals, exhibitions, and neighbourhood activations.",
    imageUrl:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
  },
  {
    id: "stories",
    title: "Stories",
    description: "Articles and features on artists, heritage, and creative Dubai.",
    imageUrl:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80",
  },
  {
    id: "initiatives",
    title: "Initiatives",
    description: "Programmes supporting talent, youth, and cultural participation.",
    imageUrl:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80",
  },
];

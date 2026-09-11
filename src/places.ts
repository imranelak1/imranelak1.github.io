export type Place = {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  range: number;
  address: string;
  description: string;
  precision: "campus" | "listed" | "area" | "city";
  source: string;
};

export const places: Place[] = [
  {
    id: "marrakech",
    name: "Marrakech",
    category: "Home base",
    latitude: 31.6295,
    longitude: -7.9811,
    range: 22000,
    address: "Marrakech, Morocco",
    description:
      "Where I study and build. Explore the places behind my education and work.",
    precision: "city",
    source: "https://www.google.com/maps/search/?api=1&query=Marrakech+Morocco",
  },
  {
    id: "emsi-centre",
    name: "EMSI · Centre",
    category: "Education",
    latitude: 31.653786654689917,
    longitude: -8.021462028856424,
    range: 1100,
    address: "5 Lot Bouzgaren, Route de Safi, Marrakech",
    description:
      "One of the two EMSI Marrakech campuses where I study in my final year of engineering.",
    precision: "campus",
    source: "https://emsi.ma/campus/",
  },
  {
    id: "emsi-gueliz",
    name: "EMSI · Guéliz",
    category: "Education",
    latitude: 31.631419236936743,
    longitude: -8.012794757722151,
    range: 1000,
    address: "Avenue Hassan II & Rue Yougoslavie, Marrakech",
    description: "My second EMSI Marrakech campus, in Guéliz.",
    precision: "campus",
    source: "https://emsi.ma/campus/",
  },
  {
    id: "sensthings-benguerir",
    name: "Sensthings · Benguerir",
    category: "Internships",
    latitude: 32.2333,
    longitude: -7.95,
    range: 17000,
    address: "Benguerir, Morocco · area view",
    description:
      "One of Sensthings’ locations. I completed two internships with the company, in summer 2025 and summer 2026. Exact office pin and year-to-office assignment are still to be confirmed.",
    precision: "area",
    source: "https://www.linkedin.com/company/sensthings/",
  },
  {
    id: "sensthings-skhirat",
    name: "Sensthings · Skhirat",
    category: "Internships",
    latitude: 33.85,
    longitude: -7.03,
    range: 24000,
    address: "Skhirat–Ain Atig, Rabat region · area view",
    description:
      "Sensthings’ Skhirat–Ain Atig site. Exact office pin and year-to-office assignment are still to be confirmed.",
    precision: "area",
    source:
      "https://www.linkedin.com/posts/youness-zaarour_join-our-team-embedded-systems-development-activity-7434633741764968448-zHa-/",
  },
  {
    id: "monstergarage",
    name: "MonsterGarage",
    category: "Freelance",
    latitude: 31.6669637,
    longitude: -8.0426037,
    range: 1500,
    address: "N° 534 bis 2, Sidi Ghanem industrial district, Marrakech",
    description:
      "Freelance garage-management application for Monster Garage / WIDINE MOTORS SERVICES. Customer and vehicle records, repair jobs, quotes, invoices, and staff workflows.",
    precision: "listed",
    source: "https://www.goafricaonline.com/ma/848042-monster-garage",
  },
];
export const findPlace = (id: string) =>
  places.find((place) => place.id === id) ?? places[0];
export function directionsUrl(place: Place) {
  const query =
    place.precision === "area"
      ? `${place.name} Morocco`
      : `${place.latitude},${place.longitude}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

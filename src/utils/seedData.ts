import { config } from "./config";

// Seed venue data
export async function seedVenues() {
  const venues = [
    {
      id: "venue-1",
      name: "The Golden Gate Lounge",
      type: "bar",
      address: "123 Market St, San Francisco, CA",
      coordinates: { lat: 37.7749, lng: -122.4194 },
      image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800",
      rating: 4.5,
      priceRange: "$$",
    },
    {
      id: "venue-2",
      name: "Blue Note Jazz Club",
      type: "nightclub",
      address: "456 Valencia St, San Francisco, CA",
      coordinates: { lat: 37.7699, lng: -122.4210 },
      image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800",
      rating: 4.7,
      priceRange: "$$$",
    },
    {
      id: "venue-3",
      name: "Cafe Noir",
      type: "cafe",
      address: "789 Mission St, San Francisco, CA",
      coordinates: { lat: 37.7815, lng: -122.4170 },
      image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
      rating: 4.3,
      priceRange: "$",
    },
    {
      id: "venue-4",
      name: "Sunset Grill & Bar",
      type: "restaurant",
      address: "321 Embarcadero, San Francisco, CA",
      coordinates: { lat: 37.7955, lng: -122.3937 },
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
      rating: 4.6,
      priceRange: "$$$",
    },
    {
      id: "venue-5",
      name: "Electric Avenue",
      type: "nightclub",
      address: "555 Folsom St, San Francisco, CA",
      coordinates: { lat: 37.7867, lng: -122.3989 },
      image: "https://images.unsplash.com/photo-1571266028243-d220c6c2f174?w=800",
      rating: 4.4,
      priceRange: "$$",
    },
    {
      id: "venue-6",
      name: "Morning Brew Coffee",
      type: "cafe",
      address: "234 Haight St, San Francisco, CA",
      coordinates: { lat: 37.7711, lng: -122.4287 },
      image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800",
      rating: 4.2,
      priceRange: "$",
    },
  ];

  const API_BASE = config.api.baseUrl;

  for (const venue of venues) {
    try {
      await fetch(`${API_BASE}/venues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(venue),
      });
      console.log(`Seeded venue: ${venue.name}`);
    } catch (error) {
      console.error(`Error seeding venue ${venue.name}:`, error);
    }
  }
}

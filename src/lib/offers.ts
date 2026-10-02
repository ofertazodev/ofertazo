export type Offer = {
  id: string;
  title: string;
  destination: string;
  category: "Alojamiento" | "Tour" | "Paquete";
  price: number;
  previousPrice: number;
  duration: string;
  rating: number;
  reviews: number;
  includes: string;
  image: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  featured?: boolean;
  flash?: boolean;
};

export const offers: Offer[] = [
  {
    id: "uyuni-salar",
    title: "Salar de Uyuni al amanecer",
    destination: "Uyuni, Potosi",
    category: "Tour",
    price: 690,
    previousPrice: 920,
    duration: "2 dias / 1 noche",
    rating: 4.9,
    reviews: 128,
    includes: "Transporte 4x4, guia y desayuno",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=85",
    featured: true
  },
  {
    id: "copacabana-lago",
    title: "Fin de semana frente al Titicaca",
    destination: "Copacabana, La Paz",
    category: "Paquete",
    price: 980,
    previousPrice: 1320,
    duration: "3 dias / 2 noches",
    rating: 4.8,
    reviews: 84,
    includes: "Hotel, desayuno y paseo en lancha",
    image: "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=1200&q=85",
    featured: true
  },
  {
    id: "samaipata-refugio",
    title: "Refugio entre montanas",
    destination: "Samaipata, Santa Cruz",
    category: "Alojamiento",
    price: 420,
    previousPrice: 560,
    duration: "Por noche",
    rating: 4.7,
    reviews: 61,
    includes: "Cabanita privada y desayuno local",
    image: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1200&q=85",
    flash: true
  },
  {
    id: "torotoro-canon",
    title: "Cañon y huellas de Torotoro",
    destination: "Torotoro, Potosi",
    category: "Tour",
    price: 540,
    previousPrice: 700,
    duration: "2 dias / 1 noche",
    rating: 4.9,
    reviews: 43,
    includes: "Entradas, guia y movilidad",
    image: "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1200&q=85"
  },
  {
    id: "la-paz-altura",
    title: "La Paz desde las alturas",
    destination: "La Paz, Bolivia",
    category: "Alojamiento",
    price: 360,
    previousPrice: 480,
    duration: "Por noche",
    rating: 4.6,
    reviews: 97,
    includes: "Hotel boutique y desayuno",
    image: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=85"
  },
  {
    id: "madidi-verde",
    title: "Amazonia esencial",
    destination: "Rurrenabaque, Beni",
    category: "Paquete",
    price: 1480,
    previousPrice: 1890,
    duration: "4 dias / 3 noches",
    rating: 4.9,
    reviews: 38,
    includes: "Lodge, comidas y navegacion",
    image: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=85",
    flash: true
  }
];

export function getOffer(id: string) {
  return offers.find((offer) => offer.id === id);
}

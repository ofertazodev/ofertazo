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
  },
  {
    id: "paquete-uyuni-completo",
    title: "Uyuni y lagunas de colores",
    destination: "Uyuni, Potosi",
    category: "Paquete",
    price: 2150,
    previousPrice: 2790,
    duration: "4 dias / 3 noches",
    rating: 4.9,
    reviews: 152,
    includes: "Hotel de sal, 4x4, guia, comidas y entradas a la reserva Eduardo Avaroa",
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=85",
    featured: true
  },
  {
    id: "paquete-sucre-potosi",
    title: "Sucre y Potosi coloniales",
    destination: "Sucre, Chuquisaca",
    category: "Paquete",
    price: 1290,
    previousPrice: 1650,
    duration: "4 dias / 3 noches",
    rating: 4.7,
    reviews: 69,
    includes: "Hoteles boutique, traslado Sucre-Potosi, city tour y visita al Cerro Rico",
    image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=85"
  },
  {
    id: "paquete-chiquitania",
    title: "Misiones de la Chiquitania",
    destination: "San Jose de Chiquitos, Santa Cruz",
    category: "Paquete",
    price: 1750,
    previousPrice: 2240,
    duration: "5 dias / 4 noches",
    rating: 4.8,
    reviews: 41,
    includes: "Transporte desde Santa Cruz, hoteles, desayunos y guia de misiones jesuiticas",
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=85",
    flash: true
  },
  {
    id: "paquete-coroico-yungas",
    title: "Escapada a los Yungas",
    destination: "Coroico, La Paz",
    category: "Paquete",
    price: 790,
    previousPrice: 1050,
    duration: "3 dias / 2 noches",
    rating: 4.6,
    reviews: 77,
    includes: "Transporte desde La Paz, hotel con piscina, desayuno y tour de cafe",
    image: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1200&q=85"
  },
  {
    id: "estadia-santa-cruz-resort",
    title: "Resort con piscina en Urubo",
    destination: "Santa Cruz de la Sierra",
    category: "Alojamiento",
    price: 680,
    previousPrice: 890,
    duration: "Por noche",
    rating: 4.8,
    reviews: 213,
    includes: "Habitacion doble, desayuno buffet, piscina y spa",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=85",
    featured: true
  },
  {
    id: "estadia-sucre-casona",
    title: "Casona colonial en el centro",
    destination: "Sucre, Chuquisaca",
    category: "Alojamiento",
    price: 310,
    previousPrice: 420,
    duration: "Por noche",
    rating: 4.7,
    reviews: 88,
    includes: "Habitacion con patio interior y desayuno",
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=85"
  },
  {
    id: "estadia-uyuni-hotel-sal",
    title: "Hotel de sal frente al salar",
    destination: "Colchani, Potosi",
    category: "Alojamiento",
    price: 750,
    previousPrice: 980,
    duration: "Por noche",
    rating: 4.9,
    reviews: 104,
    includes: "Habitacion doble, cena, desayuno y calefaccion",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=85",
    flash: true
  },
  {
    id: "estadia-cochabamba-hotel",
    title: "Hotel jardin en Cochabamba",
    destination: "Cochabamba, Bolivia",
    category: "Alojamiento",
    price: 290,
    previousPrice: 380,
    duration: "Por noche",
    rating: 4.5,
    reviews: 132,
    includes: "Habitacion superior, desayuno y estacionamiento",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85"
  }
];

export function getOffer(id: string) {
  return offers.find((offer) => offer.id === id);
}

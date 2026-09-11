export interface CatalogRestaurant {
  id: string;
  slug: string;
  name: string;
  cuisine: string;
  neighborhood: string;
  city: string;
  address: string | null;
  priceBand: string | null;
  menuEnabled: boolean;
}

export interface RestaurantVisitOption {
  id: string;
  slug: string;
  visitedAt: string;
}

import { permanentRedirect } from 'next/navigation';

export default function LegacyAddRestaurantPage(): never {
  permanentRedirect('/visitas/nova');
}

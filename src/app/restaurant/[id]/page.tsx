import { permanentRedirect } from 'next/navigation';

export default function LegacyRestaurantPage(): never {
  permanentRedirect('/registros');
}

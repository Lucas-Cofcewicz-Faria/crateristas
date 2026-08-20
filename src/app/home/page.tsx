import { permanentRedirect } from 'next/navigation';

export default function LegacyHomePage(): never {
  permanentRedirect('/registros');
}

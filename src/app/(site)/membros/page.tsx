import { permanentRedirect } from 'next/navigation';

export default function MembersRedirect(): never {
  permanentRedirect('/historia#integrantes');
}

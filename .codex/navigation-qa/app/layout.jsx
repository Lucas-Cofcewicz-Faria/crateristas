import '../../../src/app/globals.css';
import SiteLayout from '../../../src/app/(site)/layout';
export const metadata = { title: 'QA local · navegação sintética' };
export default function Layout({ children }) {
  return <html lang="pt-BR"><body><SiteLayout>{children}</SiteLayout></body></html>;
}

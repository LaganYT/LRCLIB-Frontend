import { useRouter } from 'next/router';
import Link from 'next/link';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const isHomePage = router.pathname === '/';

  return (
    <div className="layout">
      {!isHomePage && (
        <nav className="navbar">
          <div className="navbar-left">
            <Link href="/" className="navbar-brand">
              LRCLIB-Frontend
            </Link>
          </div>
          <div className="navbar-center">
            <Link href="/search" className="navbar-link">
              Search
            </Link>
            <Link href="/publish" className="navbar-link">
              Publish
            </Link>
          </div>
          <div className="navbar-right">
            <a href="https://lrclib.net/" className="navbar-link" target="_blank" rel="noopener noreferrer">
              Original Site
            </a>
            <a href="https://github.com/LaganYT/LRCLIB-Frontend" className="navbar-link" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </div>
        </nav>
      )}
      
      <main className={isHomePage ? 'main-home' : 'main-content'}>
        {children}
      </main>
      
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>LRCLIB-Frontend</h4>
            <p>A TypeScript-based website to publish lyrics to LRCLib.net</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <div className="footer-links">
              <Link href="/">Home</Link>
              <Link href="/search">Search Lyrics</Link>
              <Link href="/publish">Publish Lyrics</Link>
            </div>
          </div>
          <div className="footer-section">
            <h4>Resources</h4>
            <div className="footer-links">
              <a href="https://lrclib.net/" target="_blank" rel="noopener noreferrer">
                Original LRCLIB
              </a>
              <a href="https://lrclib.net/docs" target="_blank" rel="noopener noreferrer">
                API Documentation
              </a>
              <a href="https://github.com/LaganYT/LRCLIB-Frontend" target="_blank" rel="noopener noreferrer">
                Source Code
              </a>
              <a href="https://github.com/tranxuanthang/lrclib" target="_blank" rel="noopener noreferrer">
                Donate to Creator
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 LRCLIB-Frontend. Licensed under the Unlicense.</p>
        </div>
      </footer>
    </div>
  );
}

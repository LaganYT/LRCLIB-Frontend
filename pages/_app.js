import '../styles/global.css';
import { useState } from 'react';

function App({ Component, pageProps }) {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <>
      <nav className="navbar">
        <div>
          <a href="/">Home</a>
          <a href="/search">Search</a>
          <a href="/publish">Publish</a>
        </div>
        <button className="toggle-theme" onClick={toggleTheme}>
          {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>
      </nav>
      <Component {...pageProps} />
      <footer className="footer">
        <p>© 2023 LRCLib. All rights reserved.</p>
      </footer>
    </>
  );
}

export default App;

import Link from 'next/link';

export default function Home() {
  return (
    <div className="container">
      <h1>Welcome to LRCLib</h1>
      <p>Discover, publish, and sync lyrics effortlessly.</p>
      <div>
        <Link href="/search">
          <button className="button">Search Lyrics</button>
        </Link>
        <Link href="/publish">
          <button className="button">Publish Lyrics</button>
        </Link>
      </div>
    </div>
  );
}

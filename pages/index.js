import Link from 'next/link';

export default function Home() {
  return (
    <div className="container">
      <h1>Welcome to LRCLib</h1>
      <p>Choose an action:</p>
      <ul>
        <li><Link href="/search">Search Lyrics</Link></li>
        <li><Link href="/view">View Lyrics</Link></li>
        <li><Link href="/publish">Publish Lyrics</Link></li>
      </ul>
    </div>
  );
}

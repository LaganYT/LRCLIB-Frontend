# LRCLib Publisher

A modern web application for publishing lyrics to [LRCLib.net](https://lrclib.net) with enhanced lyrics finding capabilities.

## Features

- **Search LRCLib Database**: Search for existing lyrics in the LRCLib database.
- **Find Lyrics from Musixmatch**: Via @mjba/lyrics with both regular and synced lyrics support.
- **Input synced lyrics**: Manually input synchronized lyrics with timestamps.
- **Upload audio client-side**: Required for publishing to LRCLib.
- **Modern UI**: Clean, responsive interface with real-time feedback.
- **URL Extraction**: Extract lyrics directly from Musixmatch URLs.
- **Search for lyrics dynamically** using `/search/{query}`.
- **View plain and synced lyrics** in a modern modal interface.

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: CSS with modern design patterns
- **Lyrics API**: @mjba/lyrics for Musixmatch integration
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/LaganYT/LRCLIBPlusPlus.git
cd LRCLIBPlusPlus
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Find Lyrics Workflow

1. **Navigate to Find Lyrics**: Go to `/find-lyrics` page
2. **Enter Song Details**: Input song name and artist
3. **Search**: The system will search both LRCLib database and Musixmatch
4. **View Results**: Browse through available lyrics with preview
5. **Accept Lyrics**: Choose lyrics to proceed to publishing

### URL Extraction Workflow

1. **Paste Musixmatch URL**: Use the URL input feature
2. **Extract**: The system will extract both regular and synced lyrics from the URL
3. **Publish Workflow**: Once you accept lyrics, you'll be redirected to the publish page with all data pre-filled

### Publish Lyrics

1. **Fill Required Fields**: Track name, artist name, album name, duration
2. **Add Lyrics**: Input plain lyrics and/or synced lyrics (LRC format)
3. **Upload Audio**: Required for LRCLib publishing
4. **Submit**: Publish to LRCLib.net

## API Endpoints

- `POST /api/lyrics` - Search for lyrics from Musixmatch
- `POST /api/extract-lyrics` - Extract lyrics from Musixmatch URLs
- `POST /api/publish` - Publish lyrics to LRCLib

## Project Structure

```
LRCLIBPlusPlus/
├── components/          # React components
├── pages/              # Next.js pages and API routes
├── styles/             # Global CSS styles
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── public/             # Static assets
```

## Key Features

- **Type Safety**: Full TypeScript support with centralized type definitions
- **Error Handling**: Comprehensive error handling across all API endpoints
- **Code Reusability**: Utility functions for common operations
- **Modern Architecture**: Clean separation of concerns and modular design
- **No API Keys Required**: Uses @mjba/lyrics for reliable lyrics fetching

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the Unlicense - see the [LICENSE](LICENSE) file for details.

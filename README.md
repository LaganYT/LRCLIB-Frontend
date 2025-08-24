# LRCLIBPlusPlus
A TypeScript-based website to publish lyrics to LRCLib.net

## Features
- Search for lyrics dynamically using `/search/{query}`.
- View plain and synced lyrics in a modern modal interface.
- **Find lyrics from Musixmatch** using the @mjba/lyrics package for reliable lyrics fetching with both regular and synced lyrics support.
- Input synced lyrics.
- Upload audio client-side (required).
- Sync lyrics line by line with the uploaded audio.
- Publish synced lyrics to lrclib.net.
- Full TypeScript support with type safety.
- API route for publishing to lrclib.net with challenge-response mechanism.

## Instructions

1. Clone the repository:
   ```
   git clone https://github.com/LaganYT/LRCLIBPlusPlus.git
   cd LRCLIBPlusPlus
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## TypeScript

This project is now fully written in TypeScript. To run type checking:

```bash
npm run type-check
```

### Project Structure

- `types/index.ts` - Type definitions for the entire project
- `pages/api/publish.ts` - API route for publishing to lrclib.net
- All React components are now `.tsx` files with proper type annotations

## Usage

### Search for Lyrics
1. Navigate to `/search`.
2. Enter your search query in the input field and click "Search".
3. View the results and click on a song to open a modal displaying plain and synced lyrics.

### Find Lyrics from Other Platforms
1. **Navigate to `/find-lyrics`** or click "Find Lyrics" from the home page.
2. Enter the song name and artist name in the search fields.
3. The system will first search the LRCLib database for existing lyrics.
4. If no results are found locally, it will automatically search Musixmatch using the @mjba/lyrics package for both regular and synced lyrics.
5. View lyrics from Musixmatch, copy them to clipboard, or use them directly.
6. No API keys required - the service uses the @mjba/lyrics package for reliable lyrics fetching.

### Publish Lyrics
1. Navigate to `/publish`.
2. Enter the track details (track name, artist name, album name, etc.).
3. Upload an audio file (required). The duration will be automatically obtained from the audio file.
4. Use the "Sync Line" button to sync each line of lyrics with the audio.
5. Once all lines are synced, click the "Publish" button to publish the synced lyrics to lrclib.net.

## API Details

### Publish a New Lyrics
**POST** `/api/publish`

Publish new lyrics to the LRCLib database. This API can be called anonymously, and no registration is required.

If both plain lyrics and synchronized lyrics are left empty, the track will be marked as instrumental.

All previous revisions of the lyrics will still be kept when publishing lyrics for a track that already has existing lyrics.

#### Obtaining the Publish Token

Every `POST /api/publish` request must include a fresh, valid Publish Token in the `X-Publish-Token` header. Each Publish Token can only be used once.

The Publish Token consists of two parts: a prefix and a nonce concatenated with a colon (`{prefix}:{nonce}`).

To obtain a prefix, you need to make a request to the `POST /api/request-challenge` API. This will provide you with a fresh prefix string and a target string.

To find a valid nonce, you must solve a proof-of-work cryptographic challenge using the provided prefix and target.

#### Request Header

| Header Name       | Required | Description                                                                 |
|-------------------|----------|-----------------------------------------------------------------------------|
| X-Publish-Token   | true     | A Publish Token that can be retrieved via solving a cryptographic challenge |

#### Request JSON Body Parameters

| Field         | Required | Type   | Description                          |
|---------------|----------|--------|--------------------------------------|
| trackName     | true     | string | Title of the track                   |
| artistName    | true     | string | Track's artist name                  |
| albumName     | true     | string | Track's album name                   |
| duration      | true     | number | Track's duration (obtained from the audio file) |
| plainLyrics   | true     | string | Plain lyrics for the track           |
| syncedLyrics  | true     | string | Synchronized lyrics for the track    |

#### Response

**Success Response**: `201 Created`

**Failed Response (Incorrect Publish Token)**:
```json
{
  "code": 400,
  "name": "IncorrectPublishTokenError",
  "message": "The provided publish token is incorrect"
}
```

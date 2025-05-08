# Lrclib-publisher
A website to publish lyrics to LRCLib.net

## Features
- Input synced lyrics
- Upload audio client-side
- Sync lyrics line by line with the uploaded audio
- Publish synced lyrics to lrclib.net

## Instructions

1. Clone the repository:
   ```
   git clone https://github.com/LaganYT/Lrclib-publisher.git
   cd Lrclib-publisher
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

5. Enter your synced lyrics in the provided textarea.

6. Upload your audio file using the file input.

7. Use the "Sync Line" button to sync each line of lyrics with the audio.

8. Once you have synced all the lines, click the "Publish" button to publish the synced lyrics to lrclib.net.

## Publish a new lyrics
POST
/api/publish
Note: This API is experimental and subject to potential changes in the future.

Publish a new lyrics to LRCLIB database. This API can be called anonymously, and no registration is required.

If BOTH plain lyrics and synchronized lyrics are left empty, the track will be marked as instrumental.

All previous revisions of the lyrics will still be kept when publishing lyrics for a track that already has existing lyrics.

### Obtaining the Publish Token

Every POST /api/publish request must include a fresh, valid Publish Token in the X-Publish-Token header. Each Publish Token can only be used once.

The Publish Token consists of two parts: a prefix and a nonce concatenated with a colon ({prefix}:{nonce}).

To obtain a prefix, you need to make a request to the POST /api/request-challenge API. This will provide you with a fresh prefix string and a target string.

To find a valid nonce, you must solve a proof-of-work cryptographic challenge using the provided prefix and target. For implementation examples, please refer to the source code of LRCGET.

### Request header

| Header name       | Required | Description                                                                 |
|-------------------|----------|-----------------------------------------------------------------------------|
| X-Publish-Token   | true     | A Publish Token that can be retrieved via solving a cryptographic challenge  |

### Request JSON body parameters

| Field         | Required | Type   | Description                          |
|---------------|----------|--------|--------------------------------------|
| trackName     | true     | string | Title of the track                   |
| artistName    | true     | string | Track's artist name                  |
| albumName     | true     | string | Track's album name                   |
| duration      | true     | number | Track's duration                     |
| plainLyrics   | true     | string | Plain lyrics for the track           |
| syncedLyrics  | true     | string | Synchronized lyrics for the track    |

### Response

Success response: 201 Created

Failed response (incorrect Publish Token):

```json
{
  "code": 400,
  "name": "IncorrectPublishTokenError",
  "message": "The provided publish token is incorrect"
}
```

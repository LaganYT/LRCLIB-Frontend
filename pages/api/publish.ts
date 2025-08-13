import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { createHash } from 'crypto';
import { LRCLibChallengeResponse, LRCLibPublishPayload, ApiResponse } from '../../types';
import https from 'https';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { trackName, artistName, albumName, duration, plainLyrics, syncedLyrics } = req.body as LRCLibPublishPayload;

    // Validate required fields
    if (!trackName || !artistName || !albumName || !duration) {
      return res.status(400).json({ 
        message: 'Missing required fields: trackName, artistName, albumName, duration' 
      });
    }

    // Per docs, instrumental is allowed when both lyrics are empty

    const stripLrcHeaders = (lrc: string): string =>
      lrc
        .split('\n')
        .filter((line) => !/^\s*\[(ti|ar|al|length)\s*:/i.test(line))
        .join('\n');

    // Create a shared axios client with keep-alive and sensible defaults
    const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 10 });
    const client = axios.create({
      baseURL: 'https://lrclib.net',
      httpsAgent,
      headers: {
        'User-Agent': 'LRCLIB-Frontend/1.0 (+https://github.com/LaganYT/LRCLIB-Frontend)'
      }
    });

    const postWithRetry = async <T = any>(url: string, data?: any, extraConfig?: any): Promise<{ data: T; status: number; headers: any; }> => {
      const maxAttempts = 3;
      let lastErr: any;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const resp = await client.post<T>(url, data, { ...extraConfig });
          return resp as any;
        } catch (err: any) {
          const code = err?.code;
          const transient = !err.response && (code === 'ECONNRESET' || code === 'ETIMEDOUT' || code === 'EAI_AGAIN');
          if (transient && attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, 500 * attempt));
            lastErr = err;
            continue;
          }
          throw err;
        }
      }
      throw lastErr;
    };

    // Step 1: Obtain publish token (challenge-response)
    const solveChallenge = async (): Promise<string> => {
      const challengeResp = await postWithRetry<LRCLibChallengeResponse>(
        '/api/request-challenge',
        '',
        { headers: { 'Content-Length': '0' } }
      );
      const { prefix, target } = challengeResp.data;

      const targetBuf = Buffer.from(target, 'hex');
      let nonceLocal = 0;
      const chunkSize = 10000;
      while (true) {
        for (let i = 0; i < chunkSize; i++) {
          const candidate = prefix + (nonceLocal++).toString();
          const hashBuf = createHash('sha256').update(candidate).digest();
          // Accept when SHA256(prefix + nonce) <= target (byte-wise)
          if (hashBuf.compare(targetBuf) <= 0) {
            return `${prefix}${nonceLocal - 1}`;
          }
        }
        // yield to event loop to avoid starving the server
        await new Promise((r) => setImmediate(r));
      }
    };
    // Solve challenge without artificial time budget
    const publishToken = await solveChallenge();

    // Step 2: Publish lyrics to lrclib
    // Build payload following docs: omit empty lyrics fields; keep duration in seconds
    const sanitizedPlain = typeof plainLyrics === 'string' ? plainLyrics.trim() : undefined;
    const sanitizedSynced = typeof syncedLyrics === 'string' ? stripLrcHeaders(syncedLyrics.trim()) : undefined;

    const payload: any = {
      trackName,
      artistName,
      albumName,
      duration: Number(duration),
    };
    if (sanitizedPlain) payload.plainLyrics = sanitizedPlain;
    if (sanitizedSynced) payload.syncedLyrics = sanitizedSynced;

    // Basic validation mirroring LRCLIB rules
    if (!payload.plainLyrics && !payload.syncedLyrics) {
      // Instrumental is allowed; send empty strings explicitly per docs
      payload.plainLyrics = '';
      payload.syncedLyrics = '';
    }

    const publishResponse = await postWithRetry('/api/publish', payload, {
      headers: {
        'X-Publish-Token': publishToken,
        'x-user-agent': 'LRCLIB-Frontend v1.0.0 (https://github.com/LaganYT/LRCLIB-Frontend)',
        'User-Agent': 'LRCLIB-Frontend/1.0 (+https://github.com/LaganYT/LRCLIB-Frontend)',
        'Content-Type': 'application/json',
      },
    });

    if (publishResponse.status === 201) {
      return res.status(201).json({ 
        message: 'Lyrics published successfully!',
        data: publishResponse.data 
      });
    } else {
      return res.status(publishResponse.status).json({ 
        message: 'Unexpected response from lrclib' 
      });
    }

  } catch (error: any) {
    // Log useful error details for diagnosis
    if (error?.response) {
      console.error('Publish API error response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else {
      console.error('Publish API error:', error);
    }
    
    if (error.response) {
      // Error from lrclib API
      const { status, data } = error.response;
      return res.status(status).json({ 
        message: data?.message || 'Error from lrclib API',
        error: data,
      });
    } else if (error.request) {
      // Network error
      return res.status(500).json({ 
        message: 'Network error - unable to reach lrclib API' 
      });
    } else {
      // Other error
      return res.status(500).json({ 
        message: 'Internal server error',
        error: error.message 
      });
    }
  }
}

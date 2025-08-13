import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { createHash } from 'crypto';
import { LRCLibChallengeResponse, LRCLibPublishPayload, ApiResponse } from '../../types';

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

    if (!plainLyrics && !syncedLyrics) {
      return res.status(400).json({ 
        message: 'At least one of plainLyrics or syncedLyrics must be provided' 
      });
    }

    // Step 1: Obtain publish token (challenge-response)
    const challengeResponse = await axios.post<LRCLibChallengeResponse>(
      'https://lrclib.net/api/request-challenge',
      undefined,
      { timeout: 45000 }
    );
    const { prefix, target } = challengeResponse.data;

    // Solve the challenge
    let nonce = 0;
    while (true) {
      const hash = createHash('sha256').update(`${prefix}:${nonce}`).digest('hex');
      if (hash <= target) break;
      nonce++;
    }

    const publishToken = `${prefix}:${nonce}`;

    // Step 2: Publish lyrics to lrclib
    const payload: LRCLibPublishPayload = {
      trackName,
      artistName,
      albumName,
      duration,
      plainLyrics,
      syncedLyrics: syncedLyrics || undefined,
    };

    const publishResponse = await axios.post('https://lrclib.net/api/publish', payload, {
      headers: {
        'X-Publish-Token': publishToken,
        'x-user-agent': 'LRCLIB-Frontend v1.0.0 (https://github.com/LaganYT/LRCLIB-Frontend)',
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
    console.error('Publish API error:', error);
    
    if (error.response) {
      // Error from lrclib API
      const { status, data } = error.response;
      return res.status(status).json({ 
        message: data.message || 'Error from lrclib API',
        error: data 
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

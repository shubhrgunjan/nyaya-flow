import { Router, Request, Response } from 'express';
import { config } from '../config';
import { authMiddleware } from '../middleware/auth';

export const youtubeRouter = Router();
youtubeRouter.use(authMiddleware);

// In-memory cache to avoid burning YouTube quota
const searchCache = new Map<string, { data: any; cachedAt: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

youtubeRouter.post('/search', async (req: Request, res: Response): Promise<void> => {
  const { query, language = 'en', maxResults = 3 } = req.body;

  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'query is required' });
    return;
  }

  const cacheKey = `${query}_${language}_${maxResults}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    console.log(`[YouTube] Cache hit for: "${query.slice(0, 40)}..."`);
    res.json({ success: true, videos: cached.data, source: 'cache' });
    return;
  }

  if (!config.youtubeApiKey) {
    console.log('[YouTube] No API key configured, returning curated fallback');
    const fallback = getCuratedVideos(query, language);
    res.json({ success: true, videos: fallback, source: 'curated-fallback' });
    return;
  }

  try {
    const langParam = language === 'hi' || language === 'hinglish' ? 'hi' : 'en';
    const searchQuery = `${query} process procedure step by step India ${langParam === 'hi' ? 'Hindi' : ''}`;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults}&q=${encodeURIComponent(
      searchQuery
    )}&type=video&regionCode=IN&relevanceLanguage=${langParam}&key=${config.youtubeApiKey}`;

    console.log(`[YouTube] Searching: "${searchQuery.slice(0, 60)}..."`);

    const response = await fetch(url);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[YouTube] API error (${response.status}):`, errorBody.slice(0, 200));

      // If quota exceeded or other API error, fall back to curated
      const fallback = getCuratedVideos(query, language);
      res.json({
        success: true,
        videos: fallback,
        source: 'curated-fallback',
        warning: `YouTube API returned ${response.status}, using curated results`,
      });
      return;
    }

    const data: any = await response.json();
    const videos = (data.items || []).map((item: any, idx: number) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnailUrl: item.snippet.thumbnails?.medium?.url || '',
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      language: langParam,
      relevanceScore: 1 - idx * 0.1,
    }));

    searchCache.set(cacheKey, { data: videos, cachedAt: Date.now() });

    res.json({ success: true, videos, source: 'youtube-live' });
  } catch (err: any) {
    console.error('[YouTube] Search error:', err.message);
    const fallback = getCuratedVideos(query, language);
    res.json({
      success: true,
      videos: fallback,
      source: 'curated-fallback',
      warning: `YouTube search failed: ${err.message}`,
    });
  }
});

function getCuratedVideos(query: string, language: string): any[] {
  const q = query.toLowerCase();
  const isHindi = language === 'hi' || language === 'hinglish';

  if (q.includes('deposit') || q.includes('landlord') || q.includes('rent') || q.includes('tenant')) {
    return [
      {
        videoId: 'curated_rent_1',
        title: isHindi
          ? 'मकान मालिक सिक्योरिटी डिपॉजिट ना दे तो क्या करें | Legal Rights'
          : 'How to Recover Security Deposit from Landlord in India',
        channelTitle: 'Legal Guidance India',
        thumbnailUrl: '',
        publishedAt: '2025-01-10T00:00:00Z',
        url: 'https://www.youtube.com/results?search_query=landlord+security+deposit+refund+process+india',
        language: isHindi ? 'hi' : 'en',
        relevanceScore: 0.95,
      },
    ];
  }

  if (q.includes('cyber') || q.includes('upi') || q.includes('fraud') || q.includes('scam')) {
    return [
      {
        videoId: 'curated_cyber_1',
        title: isHindi
          ? 'UPI Fraud हो जाए तो तुरंत क्या करें | 1930 Helpline | cybercrime.gov.in'
          : 'UPI Fraud: Immediate Steps & How to Report on cybercrime.gov.in',
        channelTitle: 'Cyber Safety India',
        thumbnailUrl: '',
        publishedAt: '2025-03-01T00:00:00Z',
        url: 'https://www.youtube.com/results?search_query=upi+fraud+complaint+1930+cybercrime+india',
        language: isHindi ? 'hi' : 'en',
        relevanceScore: 0.98,
      },
    ];
  }

  if (q.includes('salary') || q.includes('wages') || q.includes('employment') || q.includes('employer')) {
    return [
      {
        videoId: 'curated_salary_1',
        title: isHindi
          ? 'कंपनी ने सैलरी नहीं दी तो कैसे करें शिकायत | Labour Commissioner'
          : 'How to File Complaint for Unpaid Salary in India | Labour Commissioner',
        channelTitle: 'Workers Rights India',
        thumbnailUrl: '',
        publishedAt: '2025-02-15T00:00:00Z',
        url: 'https://www.youtube.com/results?search_query=unpaid+salary+complaint+labour+commissioner+india',
        language: isHindi ? 'hi' : 'en',
        relevanceScore: 0.93,
      },
    ];
  }

  return [
    {
      videoId: 'curated_gen_1',
      title: 'How to File RTI Online Step by Step | Central & State RTI',
      channelTitle: 'Legal Guidance India',
      thumbnailUrl: '',
      publishedAt: '2025-01-01T00:00:00Z',
      url: 'https://www.youtube.com/results?search_query=how+to+file+rti+online+india',
      language: 'en',
      relevanceScore: 0.85,
    },
  ];
}

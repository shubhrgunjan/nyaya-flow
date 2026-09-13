import { ResourceLink } from '../../types/legal';
import { apiCall, checkServerHealth } from '../../lib/apiClient';

export interface YouTubeVideoItem {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
  url: string;
  language: string;
  relevanceScore: number;
}

export class YouTubeProvider {
  private cache: Map<string, ResourceLink[]> = new Map();

  async searchProceduralVideos(query: string, language: string = 'en'): Promise<ResourceLink[]> {
    const cacheKey = `${query}_${language}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Try the backend YouTube search
    try {
      const health = await checkServerHealth();
      if (health.ok) {
        const response = await apiCall<{
          success: boolean;
          videos: YouTubeVideoItem[];
          source: string;
        }>('/api/youtube/search', {
          query,
          language,
          maxResults: 3,
        });

        if (response.success && response.videos?.length > 0) {
          const links = this.mapToResourceLinks(response.videos);
          this.cache.set(cacheKey, links);
          return links;
        }
      }
    } catch (err) {
      console.warn('[YouTubeProvider] Backend search failed, using curated fallback:', err);
    }

    // Curated fallback (always available, no API needed)
    const fallback = this.getCuratedVideos(query, language);
    const links = this.mapToResourceLinks(fallback);
    this.cache.set(cacheKey, links);
    return links;
  }

  private getCuratedVideos(query: string, language: string): YouTubeVideoItem[] {
    const isHindi = language === 'hi' || language === 'hinglish';
    const q = query.toLowerCase();

    if (q.includes('deposit') || q.includes('landlord') || q.includes('rent') || q.includes('tenant')) {
      return [
        {
          videoId: 'curated_rent_1',
          title: isHindi ? 'मकान मालिक सिक्योरिटी डिपॉजिट ना दे तो क्या करें | Legal Rights' : 'How to Recover Security Deposit from Landlord in India',
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
          title: isHindi ? 'UPI Fraud हो जाए तो तुरंत क्या करें | 1930 Helpline' : 'UPI Fraud: How to Report on cybercrime.gov.in',
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
          title: isHindi ? 'कंपनी ने सैलरी नहीं दी तो कैसे करें शिकायत' : 'How to File Complaint for Unpaid Salary | Labour Commissioner',
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

  private mapToResourceLinks(videos: YouTubeVideoItem[]): ResourceLink[] {
    return videos.map((v) => ({
      title: v.title,
      url: v.url,
      description: `Video guide by ${v.channelTitle} (${v.language.toUpperCase()})`,
    }));
  }
}

export const youtubeProvider = new YouTubeProvider();

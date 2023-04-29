import axios from 'axios';

export interface NavigationNotice {
  headline: string;
  startDate: string;
  endDate: string | null;
  startAt: string | null;
  endAt: string | null;
  noticeType: number;
  path: string;
}


const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getNoticeType = (type: number): string => {
  switch (type) {
    case 1:
      return 'Navigation Closure';
    case 2:
      return 'Navigation Restriction';
    default:
      return 'Unknown';
  }
};

const formatTweet = (
  title: string,
  startDate: string | null,
  endDate: string | null,
  startAt: string | null,
  endAt: string | null,
  noticeType: number,
  url: string,
): string => {
  let tweet = `${title.trim()}\n${getNoticeType(noticeType)}\n`;
  if (startDate) {
    tweet += `Starts: ${formatDate(startDate)} `;
  }
  if (endDate) {
    tweet += `Ends: ${formatDate(endDate)} `;
  }
  tweet = tweet.trim();
  if (startAt) {
    tweet += `\nFrom: ${startAt.trim()}`;
  }
  if (endAt) {
    tweet += `\nTo: ${endAt.trim()}`;
  }
  tweet += `\nMore info: ${url}`;
  return tweet.length > 265 ? tweet.slice(0, 262) + '...' : tweet;
};

const extractJsonData = (html: string): any[] => {
  const regex = /window\.crt\.component\[\d+\]\['data'\] = (\[.*?\}\])/s;
  const match = html.match(regex);
  if (match) {
    const jsonData = JSON.parse(match[1]);
    return jsonData;
  }
  return [];
};

const filterNotices = (notices: NavigationNotice[], baseUrl: string): [NavigationNotice, string][] => {
  const tweets = notices
    .filter((notice) => notice.startDate)
    .map<[NavigationNotice, string]>((notice) => { // Explicitly type the tuple here
      const title = notice.headline;
      const startDate = notice.startDate;
      const endDate = notice.endDate;
      const startAt = notice.startAt;
      const endAt = notice.endAt;
      const noticeType = notice.noticeType;
      const path = notice.path;
      const url = `${baseUrl}${path}`;
      return [notice, formatTweet(title, startDate, endDate, startAt, endAt, noticeType, url)];
    });
  return tweets;
};

export const scrapeWebPage = async (url: string, debugMode: boolean = false): Promise<[NavigationNotice, string][]> => {
  try {
    const response = await axios.get(url);
    const jsonData = extractJsonData(response.data);
    if (debugMode) {
      console.log('[DEBUG] JSON data:', jsonData);
    }
    const tweets = filterNotices(jsonData, 'https://canalrivertrust.org.uk');
    return tweets;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error scraping the web page: ${error.message}`);
    } else {
      console.error('An unknown error occurred while scraping the web page.');
    }
  }
  return [];
};

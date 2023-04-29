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

const formatSkeet = (
  title: string,
  startDate: string | null,
  endDate: string | null,
  startAt: string | null,
  endAt: string | null,
  noticeType: number,
  url: string,
): string => {
  let skeet = `${title.trim()}\n${getNoticeType(noticeType)}\n`;
  if (startDate) {
    skeet += `Starts: ${formatDate(startDate)} `;
  }
  if (endDate) {
    skeet += `Ends: ${formatDate(endDate)} `;
  }
  skeet = skeet.trim();
  if (startAt) {
    skeet += `\nFrom: ${startAt.trim()}`;
  }
  if (endAt) {
    skeet += `\nTo: ${endAt.trim()}`;
  }
  skeet += `\nMore info: ${url}`;
  return skeet.length > 265 ? skeet.slice(0, 262) + '...' : skeet;
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
  const skeets = notices
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
      return [notice, formatSkeet(title, startDate, endDate, startAt, endAt, noticeType, url)];
    });
  return skeets;
};

export const scrapeWebPage = async (url: string, debugMode: boolean = false): Promise<[NavigationNotice, string][]> => {
  try {
    const response = await axios.get(url);
    const jsonData = extractJsonData(response.data);
    if (debugMode) {
      console.log('[DEBUG] JSON data:', jsonData);
    }
    const skeets = filterNotices(jsonData, 'https://canalrivertrust.org.uk');
    return skeets;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error scraping the web page: ${error.message}`);
    } else {
      console.error('An unknown error occurred while scraping the web page.');
    }
  }
  return [];
};

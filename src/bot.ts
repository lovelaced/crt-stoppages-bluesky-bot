// bot.ts
import * as dotenv from 'dotenv';
import { scrapeWebPage, NavigationNotice } from './navigationNoticesScraper';
import { createBlueskyAgent, postToBluesky } from './blueskyAgent';
import { getLastCheckpoint, setLastCheckpoint } from './checkpoint';
import { waterways } from './waterways';

dotenv.config();

const DEBUG_MODE = process.env.DEBUG_MODE === 'true';
const LAST_CHECKPOINT_FILE = 'last_checkpoint.txt';
const BASE_URL = process.env.BASE_URL || "https://canalrivertrust.org.uk/notices";

const getTargetUrl = (baseUrl: string, daysAhead: number): string => {
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + daysAhead);

  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}%2F${month}%2F${year}`;
  };

  const waterwayParams = waterways.map((code) => `waterway%5B%5D=${code}`).join('&');
  const typeParams = 'type%5B%5D=1&type%5B%5D=2';
  const startDateParam = `start-date=${formatDate(today)}&start-date_submit=${formatDate(today)}`;
  const endDateParam = `end-date=${formatDate(endDate)}&end-date_submit=${formatDate(endDate)}`;
  const orderParams = 'order-field=startDateTime&order-direction=descending';

  return `${baseUrl}?${waterwayParams}&${startDateParam}&${endDateParam}&${typeParams}&${orderParams}#form`;
};


const postNavigationNoticesToBluesky = async () => {
  const agent = await createBlueskyAgent(DEBUG_MODE);
  let lastPoll = getLastCheckpoint(LAST_CHECKPOINT_FILE, DEBUG_MODE);

  let targetUrl = getTargetUrl(BASE_URL, 14);

  const checkForNewNotices = async () => {
    const notices = await scrapeWebPage(targetUrl, DEBUG_MODE);
    const reversedNotices = notices.reverse();

    for (const [originalNotice, skeetText] of reversedNotices as [NavigationNotice, string][]) {
      const postText = skeetText;
      const noticeCreated = new Date(originalNotice.startDate);

      if (isNaN(noticeCreated.getTime())) {
        console.error(`[-] Invalid date value for originalNotice.startDate: ${originalNotice.startDate}`);
        continue;
      }

      lastPoll = noticeCreated;
      setLastCheckpoint(LAST_CHECKPOINT_FILE, lastPoll);

      if (DEBUG_MODE) {
        console.log('[DEBUG] Navigation notice:', originalNotice);
        console.log(postText);
      } else {
        await postToBluesky(agent, postText, DEBUG_MODE);

        // Sleep for 30 minutes to space out posts
        console.log('[+] Waiting 30 minutes before posting the next notice');
        await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 30));
      }
    }
  };

  checkForNewNotices();
  setInterval(checkForNewNotices, 1000 * 60 * 60);
};

postNavigationNoticesToBluesky();


// bot.ts
import * as dotenv from 'dotenv';
import { scrapeWebPage, NavigationNotice } from './navigationNoticesScraper';
import { createBlueskyAgent, postToBluesky } from './blueskyAgent';
import { getLastCheckpoint, setLastCheckpoint } from './checkpoint';

dotenv.config();

const DEBUG_MODE = process.env.DEBUG_MODE === 'true';
const LAST_CHECKPOINT_FILE = 'last_checkpoint.txt';
const TARGET_URL = process.env.TARGET_URL || "https://canalrivertrust.org.uk/notices";

const postNavigationNoticesToBluesky = async () => {
  const agent = await createBlueskyAgent(DEBUG_MODE);
  let lastPoll = getLastCheckpoint(LAST_CHECKPOINT_FILE, DEBUG_MODE);

  const checkForNewNotices = async () => {
    const notices = await scrapeWebPage(TARGET_URL, DEBUG_MODE);
    const reversedNotices = notices.reverse();

    for (const [originalNotice, tweetText] of reversedNotices as [NavigationNotice, string][]) {
      const postText = tweetText;
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


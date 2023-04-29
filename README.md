# Navigation Notices to Bluesky Bot

This bot is designed to scrape navigation notices from the Canal & River Trust website, format the notices, and post them to Bluesky. The bot uses the Bluesky API to post the notices and stores the last checkpoint in a file to avoid reposting the same notices.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Setup

1. Clone the repository:

```bash
git clone https://github.com/lovelaced/crt-stoppages-bluesky-bot.git
cd crt-stoppages-bluesky-bot
```

2. Install the dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory of the project with the following content:

```ini
BLUESKY_IDENTIFIER=your_bluesky_identifier
BLUESKY_PASSWORD=your_bluesky_password
DEBUG_MODE=false
BASE_URL=https://canalrivertrust.org.uk/notices
```

Replace `your_bluesky_identifier` and `your_bluesky_password` with your actual Bluesky credentials.

4. Build the TypeScript project:

```bash
npm run build
```

5. Run the bot:

```bash
node dist/bot.js
```

The bot will now start posting navigation notices to Bluesky. By default, the bot will check for new notices every hour.

## Debugging

If you need to debug the bot, set the `DEBUG_MODE` variable in the `.env` file to `true`. This will enable debug logging and prevent the bot from actually posting to Bluesky:

```ini
DEBUG_MODE=true
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
```

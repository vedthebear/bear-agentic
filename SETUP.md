# Bear Dashboard Scraper with Stagehand

This script uses Stagehand to scrape brand visibility percentage and prompt count from the Bear dashboard at app.usebear.ai using natural language automation.

## What is Stagehand?

Stagehand is a browser automation tool that allows you to control browsers with natural language commands. It's much simpler and more reliable than traditional web scraping tools like Selenium. Stagehand is truly goated for this kind of automation!

## Prerequisites

1. Python 3.7 or higher
2. Node.js (for Stagehand CLI)
3. Bear dashboard account credentials

## Installation

1. Install the required Python dependencies:
```bash
pip install -r requirements.txt
```

2. Install Stagehand CLI:
```bash
npm install -g @stagehand/cli
```

3. Create a `.env` file in the project root with the following variables:
```env
# Bear Dashboard Credentials
BEAR_DASHBOARD_EMAIL=your_email@example.com
BEAR_DASHBOARD_PASSWORD=your_password_here
```

## Usage

### Run a new scrape (default action):
```bash
python bear_dashboard_scraper.py
```

### List previous scrape data files:
```bash
python bear_dashboard_scraper.py --list
```

### View the most recent scrape data:
```bash
python bear_dashboard_scraper.py --view-latest
```

### Run a new scrape explicitly:
```bash
python bear_dashboard_scraper.py --scrape
```

## How it works

1. **Natural Language Automation**: Stagehand uses natural language commands like "Type 'email@example.com' into the email field" and "Click the login button"
2. **Intelligent Data Extraction**: Uses natural language instructions to find and extract the brand visibility percentage and prompt count
3. **Resilient**: Stagehand is designed to be resilient to UI changes, unlike traditional CSS selector-based scraping
4. **Data Storage**: Extracted data is saved to JSON files in `app/storage/data/` with timestamps

## Code Example

The core scraping logic is incredibly simple with Stagehand:

```python
# Navigate to the dashboard
await page.goto("https://app.usebear.ai")

# Login using natural language
await page.act(f"Type '{email}' into the email field")
await page.act(f"Type '{password}' into the password field")
await page.act("Click the login button")

# Extract data using natural language
visibility_data = await page.extract({
    "instruction": "Find the brand visibility percentage displayed on this page",
    "schema": {"brand_visibility_percentage": "number or null"}
})
```

## Data Structure

The scraped data is stored in JSON format with the following structure:
```json
{
  "timestamp": "2024-01-01T12:00:00",
  "data": {
    "brand_visibility_percentage": 85.5,
    "prompt_count": 1250,
    "extraction_method": "stagehand_natural_language",
    "scrape_url": "https://app.usebear.ai/dashboard",
    "scrape_timestamp": "2024-01-01T12:00:00"
  }
}
```

## Why Stagehand?

- **Natural Language**: Write automation in plain English instead of complex CSS selectors
- **Resilient**: Automatically adapts to UI changes
- **Simple**: Much less code than traditional web scraping
- **Reliable**: Built-in retry mechanisms and error handling
- **AI-Powered**: Uses AI to understand page structure and find elements

## Troubleshooting

### Common Issues:

1. **Stagehand not installed**: Make sure you've installed the Stagehand CLI with `npm install -g @stagehand/cli`
2. **Login failures**: Verify your Bear dashboard credentials in the .env file
3. **Data not found**: Stagehand uses AI to find elements, so it's much more reliable than traditional scraping

### Debug Mode:
To see more detailed logging, you can modify the logging level in the script.

## Security Notes

- Never commit your `.env` file to version control
- The script stores data locally in JSON files
- Credentials are only used for login and not stored in the output files 
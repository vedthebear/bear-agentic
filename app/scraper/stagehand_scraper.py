import os
import asyncio
import logging
from typing import Dict, Any
from dotenv import load_dotenv
from stagehand import Stagehand, StagehandConfig
# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BearDashboardScraper:
    def __init__(self):
        self.stagehand = None
        self.page = None
    
    async def setup_stagehand(self):
        """Initialize Stagehand browser automation with Browserbase."""
        try:
            # Check if we have OpenAI API key
            openai_key = os.getenv("MODEL_API_KEY")
            if not openai_key:
                raise Exception("MODEL_API_KEY not found in environment variables")
            logger.info(f"OpenAI API key found: {openai_key[:10]}...")
            
            # Check if we have Browserbase credentials
            if not os.getenv("BROWSERBASE_API_KEY") or not os.getenv("BROWSERBASE_PROJECT_ID"):
                logger.warning("Browserbase credentials not found, falling back to local browser")
                config = StagehandConfig(
                    env="LOCAL",
                    model_name="gpt-4o",
                    model_client_options={"apiKey": os.getenv("MODEL_API_KEY")}
                )
                self.stagehand = Stagehand(config=config)
                await self.stagehand.init()
                self.page = self.stagehand.page
                if self.page is None:
                    raise Exception("Stagehand failed to initialize page")
                logger.info("Stagehand initialized with local browser")
                return

            # Configure Stagehand with Browserbase
            logger.info("Initializing Stagehand with Browserbase...")
            config = StagehandConfig(
                env="BROWSERBASE",
                api_key=os.getenv("BROWSERBASE_API_KEY"),
                project_id=os.getenv("BROWSERBASE_PROJECT_ID"),
                model_name="gpt-4o",
                model_client_options={"apiKey": os.getenv("MODEL_API_KEY")}
            )
            
            self.stagehand = Stagehand(config=config)
            await self.stagehand.init()
            self.page = self.stagehand.page
            if self.page is None:
                raise Exception("Stagehand failed to initialize page")
            logger.info("Stagehand initialized successfully with Browserbase and GPT-4o")
            
        except Exception as e:
            logger.error(f"Failed to initialize Stagehand: {str(e)}")
            # Fallback to local browser
            logger.info("Falling back to local browser...")
            config = StagehandConfig(
                env="LOCAL",
                model_name="gpt-4o",
                model_client_options={"apiKey": os.getenv("MODEL_API_KEY")}
            )
            self.stagehand = Stagehand(config=config)
            await self.stagehand.init()
            self.page = self.stagehand.page
            if self.page is None:
                raise Exception("Stagehand failed to initialize page in fallback")
            logger.info("Stagehand initialized with local browser (fallback)")
    
    async def login_to_bear(self) -> bool:
        """Login to Bear dashboard using natural language commands."""
        try:
            email = os.getenv('BEAR_DASHBOARD_EMAIL')
            password = os.getenv('BEAR_DASHBOARD_PASSWORD')
            
            if not email or not password:
                logger.error("Bear dashboard credentials not found in .env file")
                return False
            
            logger.info("Navigating to Bear dashboard...")
            await self.page.goto("https://app.usebear.ai")
            
            logger.info("Logging in to Bear dashboard...")
            
            # Use natural language to fill in email
            await self.page.act(f"Type '{email}' into the email field")
            await asyncio.sleep(5)  # Wait 5 seconds between API calls
            
            # Use natural language to fill in password
            await self.page.act(f"Type '{password}' into the password field")
            await asyncio.sleep(5)  # Wait 5 seconds between API calls
            
            # Submit the login form
            await self.page.act("Click the login button")
            await asyncio.sleep(5)  # Wait 5 seconds after login
            
            # Wait for successful login
            await self.page.wait_for_timeout(3000)
            
            logger.info("Successfully logged into Bear dashboard")
            return True
            
        except Exception as e:
            logger.error(f"Login failed: {str(e)}")
            return False
    
    async def extract_brand_visibility_data(self) -> Dict[str, Any]:
        """Extract brand visibility percentage and prompt count using Playwright selectors."""
        try:
            logger.info("Extracting brand visibility data...")
            
            # Wait for dashboard to load
            await self.page.wait_for_timeout(2000)
            
            # Try to find brand visibility percentage using various selectors
            logger.info("Looking for brand visibility percentage...")
            brand_visibility = None
            
            # Try different selectors that might contain the brand visibility
            selectors = [
                "[data-testid*='visibility']",
                "[class*='visibility']", 
                "text=/.*visibility.*%/i",
                "text=/.*brand.*visibility.*/i",
                "[class*='percentage']",
                "[class*='metric']"
            ]
            
            for selector in selectors:
                try:
                    element = await self.page.wait_for_selector(selector, timeout=1000)
                    if element:
                        text = await element.text_content()
                        if text and ('%' in text or 'visibility' in text.lower()):
                            brand_visibility = text.strip()
                            logger.info(f"Found brand visibility: {brand_visibility}")
                            break
                except:
                    continue
            
            await asyncio.sleep(2)
            
            # Try to find prompt count using various selectors
            logger.info("Looking for prompt count...")
            prompt_count = None
            
            # Try different selectors that might contain the prompt count
            prompt_selectors = [
                "[data-testid*='prompt']",
                "[class*='prompt']",
                "text=/.*prompt.*count.*/i",
                "text=/.*total.*prompt.*/i",
                "[class*='count']",
                "[class*='metric']"
            ]
            
            for selector in prompt_selectors:
                try:
                    element = await self.page.wait_for_selector(selector, timeout=1000)
                    if element:
                        text = await element.text_content()
                        if text and any(word in text.lower() for word in ['prompt', 'count', 'total']):
                            prompt_count = text.strip()
                            logger.info(f"Found prompt count: {prompt_count}")
                            break
                except:
                    continue
            
            # Parse the extracted text to get clean values
            parsed_brand_visibility = None
            parsed_prompt_count = None
            
            if brand_visibility:
                # Extract percentage from text like "10.3%"
                import re
                percentage_match = re.search(r'(\d+\.?\d*)%', brand_visibility)
                if percentage_match:
                    parsed_brand_visibility = f"{percentage_match.group(1)}%"
            
            if prompt_count:
                # Extract number from text like "39 total prompts"
                count_match = re.search(r'(\d+)\s*total\s*prompts', prompt_count)
                if count_match:
                    parsed_prompt_count = count_match.group(1)
            
            # Combine the extracted data
            result = {
                "brand_visibility_percentage": parsed_brand_visibility,
                "prompt_count": parsed_prompt_count,
                "extraction_method": "playwright_selectors"
            }
            
            logger.info(f"Extracted data: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to extract data: {str(e)}")
            return {
                "brand_visibility_percentage": None,
                "prompt_count": None,
                "error": str(e)
            }
    
    async def scrape_dashboard(self) -> Dict[str, Any]:
        """Main method to scrape the Bear dashboard using Stagehand."""

        try:
            logger.info("Starting Bear dashboard scraping with Stagehand...")
            
            # Setup Stagehand
            await self.setup_stagehand()
            
            # Login to Bear
            if not await self.login_to_bear():
                return {"status": "error", "message": "Failed to login to Bear dashboard"}
            
            # Extract data
            data = await self.extract_brand_visibility_data()
            
            # Add metadata
            result = {
                "status": "success",
                "url": self.page.url,
                "data": data
            }
            
            logger.info("Dashboard scraping completed successfully")
            return result
            
        except Exception as e:
            logger.error(f"Dashboard scraping failed: {str(e)}")
            return {
                "status": "error",
                "message": str(e),
                "data": {}
            }
        
        finally:
            # Clean up resources
            if self.stagehand:
                await self.stagehand.close()
                logger.info("Stagehand browser closed")
            
            # Clean up Browserbase session if it exists
            if hasattr(self, 'session') and self.session:
                try:
                    await self.session.close()
                    logger.info("Browserbase session closed")
                except Exception as e:
                    logger.warning(f"Failed to close Browserbase session: {e}")

async def scrape_dashboard():
    """Async function to scrape the Bear dashboard."""
    scraper = BearDashboardScraper()
    return await scraper.scrape_dashboard()

if __name__ == "__main__":
    # Test the scraper
    result = asyncio.run(scrape_dashboard())
    print(result)

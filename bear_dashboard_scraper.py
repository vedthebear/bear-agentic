#!/usr/bin/env python3
"""
Bear Dashboard Scraper

This script uses Stagehand to scrape brand visibility percentage and prompt count
from the Bear dashboard at app.usebear.ai and stores the data using json_io.py.

Required environment variables in .env file:
- BEAR_DASHBOARD_EMAIL: Email for Bear dashboard login
- BEAR_DASHBOARD_PASSWORD: Password for Bear dashboard login
"""

import os
import sys
import asyncio
import logging
from datetime import datetime
from dotenv import load_dotenv

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.scraper.stagehand_scraper import scrape_dashboard
from app.storage.json_io import save_data, load_data, list_data_files

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def main():
    """Main async function to run the Bear dashboard scraper."""
    logger.info("Starting Bear Dashboard Scraper with Stagehand...")
    
    # Check for required environment variables
    required_vars = ['BEAR_DASHBOARD_EMAIL', 'BEAR_DASHBOARD_PASSWORD']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        logger.error("Please create a .env file with the required credentials.")
        return False
    
    try:
        # Scrape the dashboard using Stagehand
        logger.info("Scraping Bear dashboard with Stagehand...")
        scrape_result = await scrape_dashboard()
        
        if scrape_result.get('status') == 'success':
            # Extract the data
            dashboard_data = scrape_result.get('data', {})
            
            # Prepare data for storage
            data_to_store = {
                "brand_visibility_percentage": dashboard_data.get('brand_visibility_percentage'),
                "prompt_count": dashboard_data.get('prompt_count'),
                "extraction_method": dashboard_data.get('extraction_method'),
                "scrape_url": scrape_result.get('url'),
                "scrape_timestamp": datetime.now().isoformat()
            }
            
            # Save the data
            logger.info("Saving scraped data...")
            save_result = save_data(data_to_store)
            
            if save_result.get('status') == 'saved':
                logger.info(f"Data saved successfully to: {save_result.get('file_path')}")
                
                # Display the results
                print("\n" + "="*50)
                print("BEAR DASHBOARD SCRAPING RESULTS")
                print("="*50)
                print(f"Brand Visibility: {data_to_store['brand_visibility_percentage']}%")
                print(f"Prompt Count: {data_to_store['prompt_count']}")
                print(f"Extraction Method: {data_to_store['extraction_method']}")
                print(f"Data File: {save_result.get('file_path')}")
                print("="*50)
                
                return True
            else:
                logger.error(f"Failed to save data: {save_result.get('error')}")
                return False
        else:
            logger.error(f"Scraping failed: {scrape_result.get('message')}")
            return False
            
    except Exception as e:
        logger.error(f"Unexpected error during scraping: {str(e)}")
        return False

def list_previous_scrapes():
    """List all previous scrape data files."""
    logger.info("Listing previous scrape data files...")
    files_result = list_data_files()
    
    if files_result.get('status') == 'success':
        files = files_result.get('files', [])
        if files:
            print("\nPrevious scrape data files:")
            for i, filename in enumerate(files, 1):
                print(f"{i}. {filename}")
        else:
            print("No previous scrape data files found.")
    else:
        logger.error(f"Failed to list files: {files_result.get('error')}")

def view_latest_data():
    """View the most recent scrape data."""
    files_result = list_data_files()
    
    if files_result.get('status') == 'success':
        files = files_result.get('files', [])
        if files:
            latest_file = files[0]  # Most recent file
            load_result = load_data(latest_file)
            
            if load_result.get('status') == 'loaded':
                data = load_result.get('data', {})
                print(f"\nLatest scrape data from {latest_file}:")
                print("="*50)
                print(f"Timestamp: {data.get('timestamp')}")
                print(f"Brand Visibility: {data.get('data', {}).get('brand_visibility_percentage')}%")
                print(f"Prompt Count: {data.get('data', {}).get('prompt_count')}")
                print(f"Extraction Method: {data.get('data', {}).get('extraction_method')}")
                print("="*50)
            else:
                logger.error(f"Failed to load data: {load_result.get('error')}")
        else:
            print("No scrape data files found.")
    else:
        logger.error(f"Failed to list files: {files_result.get('error')}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Bear Dashboard Scraper with Stagehand')
    parser.add_argument('--list', action='store_true', help='List previous scrape data files')
    parser.add_argument('--view-latest', action='store_true', help='View the most recent scrape data')
    parser.add_argument('--scrape', action='store_true', help='Run a new scrape (default action)')
    
    args = parser.parse_args()
    
    if args.list:
        list_previous_scrapes()
    elif args.view_latest:
        view_latest_data()
    else:
        # Default action is to scrape
        success = asyncio.run(main())
        if not success:
            sys.exit(1) 
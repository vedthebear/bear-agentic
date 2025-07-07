import json
import os
from datetime import datetime
from typing import Dict, Any

def save_data(data: Dict[str, Any], filename: str = None) -> Dict[str, Any]:
    """
    Save data to a JSON file with timestamp.
    
    Args:
        data: Dictionary containing the data to save
        filename: Optional custom filename, defaults to timestamp-based name
    
    Returns:
        Dictionary with status and file path
    """
    try:
        # Create storage directory if it doesn't exist
        storage_dir = os.path.join(os.path.dirname(__file__), "data")
        os.makedirs(storage_dir, exist_ok=True)
        
        # Generate filename with timestamp if not provided
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"bear_dashboard_data_{timestamp}.json"
        
        # Ensure .json extension
        if not filename.endswith('.json'):
            filename += '.json'
        
        file_path = os.path.join(storage_dir, filename)
        
        # Add timestamp to data
        data_with_timestamp = {
            "timestamp": datetime.now().isoformat(),
            "data": data
        }
        
        # Save to JSON file
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data_with_timestamp, f, indent=2, ensure_ascii=False)
        
        return {
            "status": "saved",
            "file_path": file_path,
            "data": data_with_timestamp
        }
    
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "data": {}
        }

def load_data(filename: str) -> Dict[str, Any]:
    """
    Load data from a JSON file.
    
    Args:
        filename: Name of the JSON file to load
    
    Returns:
        Dictionary containing the loaded data
    """
    try:
        storage_dir = os.path.join(os.path.dirname(__file__), "data")
        file_path = os.path.join(storage_dir, filename)
        
        if not os.path.exists(file_path):
            return {
                "status": "error",
                "error": f"File {filename} not found",
                "data": {}
            }
        
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        return {
            "status": "loaded",
            "file_path": file_path,
            "data": data
        }
    
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "data": {}
        }

def list_data_files() -> Dict[str, Any]:
    """
    List all available data files in the storage directory.
    
    Returns:
        Dictionary with list of available files
    """
    try:
        storage_dir = os.path.join(os.path.dirname(__file__), "data")
        
        if not os.path.exists(storage_dir):
            return {
                "status": "success",
                "files": []
            }
        
        files = [f for f in os.listdir(storage_dir) if f.endswith('.json')]
        files.sort(reverse=True)  # Most recent first
        
        return {
            "status": "success",
            "files": files
        }
    
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "files": []
        }


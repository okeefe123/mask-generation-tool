"""Remove the entries from the database.

This script will be the way to reset the state on the tracking of completed images. In a future iteration,
we should have a mechanism that allows users to re-upload images that they have previously completed so
they can improve masks if needed without resetting the DB. For now, we just need to do a manual reset. This
will not affect the actual images stored in the filesystem, just the tracking of completed images in the database.
"""


import os
import sys
import logging
from typing import NoReturn, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def clean_database(confirm: bool = False) -> None:
    """
    Delete all Image and Mask objects from the database.
    
    Args:
        confirm: If True, performs deletion without confirmation prompt.
               If False (default), asks for user confirmation.
    
    Raises:
        ImportError: If Django or models cannot be imported
        Exception: For any other errors during database operations
    """
    # Set up Django environment
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mask_generator.settings')
    
    try:
        # Initialize Django
        import django
        django.setup()
        
        # Import models after Django setup
        from api.models import Image, Mask
        
        # Count objects before deletion
        image_count_before = Image.objects.count()
        mask_count_before = Mask.objects.count()
        logger.info(f"Before deletion: {image_count_before} images, {mask_count_before} masks")
        
        # Confirm deletion if not already confirmed
        if not confirm:
            confirmation = input(f"You're about to delete {image_count_before} images and {mask_count_before} masks. "
                                f"Are you sure? (y/n): ")
            if confirmation.lower() != 'y':
                logger.info("Deletion cancelled by user")
                return
        
        # Perform deletion
        logger.info("Deleting all masks...")
        Mask.objects.all().delete()
        
        logger.info("Deleting all images...")
        Image.objects.all().delete()
        
        # Count objects after deletion
        image_count_after = Image.objects.count()
        mask_count_after = Mask.objects.count()
        logger.info(f"After deletion: {image_count_after} images, {mask_count_after} masks")
        
    except ImportError as exc:
        logger.error("Failed to import Django or required models")
        raise ImportError(
            "Couldn't import Django or required models. Are you sure Django is installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    except Exception as exc:
        logger.error(f"Database operation failed: {exc}")
        raise

def main() -> NoReturn:
    """
    Main entry point for the database cleanup script.
    
    You can pass "--force" as an argument to skip confirmation prompt.
    """
    force_deletion = "--force" in sys.argv
    
    try:
        clean_database(confirm=force_deletion)
    except Exception as e:
        logger.error(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
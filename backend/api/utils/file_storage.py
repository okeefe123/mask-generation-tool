"""
Secure file storage utilities for the mask_generator API.

This module provides utilities for secure file storage, including:
1. Custom storage classes
2. File naming conventions
3. File validation
"""
import os
import uuid
import re
from django.core.files.storage import FileSystemStorage
from django.conf import settings
from django.utils.text import slugify


class SecureFileStorage(FileSystemStorage):
    """
    A custom file storage class that implements secure file storage practices.
    
    Features:
    - Generates secure random filenames
    - Validates file types
    - Organizes files in appropriate directories
    """
    
    def __init__(self, location=None, base_url=None, file_types=None):
        """
        Initialize the storage with optional location and allowed file types.
        
        Args:
            location: The directory where files will be stored
            base_url: The base URL for accessing files
            file_types: List of allowed file extensions (e.g., ['.jpg', '.jpeg'])
        """
        if location is None:
            location = settings.MEDIA_ROOT
        if base_url is None:
            base_url = settings.MEDIA_URL
            
        self.file_types = file_types
        super().__init__(location, base_url)
    
    def get_valid_name(self, name):
        """
        Return a secure, sanitized version of the filename.
        
        Args:
            name: Original filename
            
        Returns:
            A sanitized filename
        """
        # Extract the file extension
        ext = os.path.splitext(name)[1].lower()
        
        # Validate file extension if file_types is specified
        if self.file_types and ext not in self.file_types:
            raise ValueError(f"File type {ext} not allowed. Allowed types: {self.file_types}")
        
        # Generate a UUID-based filename with the original extension
        return f"{uuid.uuid4().hex}{ext}"
    
    def get_available_name(self, name, max_length=None):
        """
        Return a filename that's not taken in the storage location.
        
        Args:
            name: Desired filename
            max_length: Maximum length of the filename
            
        Returns:
            An available filename
        """
        # First sanitize the name
        name = self.get_valid_name(name)
        
        # Then ensure it's available
        return super().get_available_name(name, max_length)


class ImageStorage(SecureFileStorage):
    """Storage class specifically for images."""
    
    def __init__(self):
        """Initialize with image-specific settings."""
        super().__init__(
            location=os.path.join(settings.MEDIA_ROOT, 'images'),
            base_url=f"{settings.MEDIA_URL}images/",
            file_types=['.jpg', '.jpeg', '.png']
        )


class MaskStorage(SecureFileStorage):
    """Storage class specifically for masks."""
    
    def __init__(self):
        """Initialize with mask-specific settings."""
        super().__init__(
            location=os.path.join(settings.MEDIA_ROOT, 'masks'),
            base_url=f"{settings.MEDIA_URL}masks/",
            file_types=['.png', '.jpg', '.jpeg']
        )


def generate_paired_filename(original_filename, prefix='mask_'):
    """
    Generate a filename for a related file (e.g., a mask for an image).
    
    Args:
        original_filename: The filename of the original file
        prefix: A prefix to add to the new filename
        
    Returns:
        A new filename that maintains a relationship with the original
    """
    # Extract the base name and extension
    base_name = os.path.basename(original_filename)
    name, ext = os.path.splitext(base_name)
    
    # Create a slug from the original name
    slug = slugify(name)
    
    # Generate a new filename with the prefix and original extension
    return f"{prefix}{slug}{ext}"


def validate_file_type(file, allowed_types):
    """
    Validate that a file has an allowed type.
    
    Args:
        file: The file to validate
        allowed_types: List of allowed MIME types
        
    Returns:
        True if the file type is allowed, False otherwise
    """
    return file.content_type in allowed_types


def safe_filename(filename):
    """
    Create a safe version of a filename, removing potentially unsafe characters.
    
    Args:
        filename: The original filename
        
    Returns:
        A sanitized filename
    """
    # Remove any path components
    filename = os.path.basename(filename)
    
    # Remove any non-alphanumeric characters except for periods, hyphens, and underscores
    filename = re.sub(r'[^\w\-\.]', '_', filename)
    
    return filename
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
        Return the given name without checking for availability.
        
        This allows files to be overwritten rather than renamed.
        
        Args:
            name: Desired filename
            max_length: Maximum length of the filename
            
        Returns:
            The original filename
        """
        # First sanitize the name
        name = self.get_valid_name(name)
        
        # If the file exists, delete it
        if self.exists(name):
            self.delete(name)
        
        return name


class ImageStorage(SecureFileStorage):
    """Storage class specifically for images."""
    
    def __init__(self):
        """Initialize with image-specific settings."""
        super().__init__(
            location=os.path.join(settings.MEDIA_ROOT, 'images'),
            base_url=f"{settings.MEDIA_URL}images/",
            file_types=['.jpg', '.jpeg', '.png']
        )
    
    def get_valid_name(self, name):
        """
        Override to preserve original filename while ensuring it's safe.
        
        Args:
            name: Original filename
            
        Returns:
            A sanitized version of the original filename
        """
        # Extract extension and base name
        base_name = os.path.basename(name)
        name, ext = os.path.splitext(base_name)
        
        # Create a safe version of the original name
        safe_name = slugify(name)
        
        # If the name is empty after slugify, use a timestamp
        if not safe_name:
            safe_name = str(uuid.uuid4())[:8]
        
        return f"{safe_name}{ext.lower()}"


class MaskStorage(SecureFileStorage):
    """Storage class specifically for masks."""
    
    def __init__(self):
        """Initialize with mask-specific settings."""
        super().__init__(
            location=os.path.join(settings.MEDIA_ROOT, 'masks'),
            base_url=f"{settings.MEDIA_URL}masks/",
            file_types=['.png', '.jpg', '.jpeg']
        )
    
    def get_valid_name(self, name):
        """
        Override to use original filename pattern instead of UUID.
        
        Args:
            name: Original filename
            
        Returns:
            A sanitized filename that maintains relationship with original image
        """
        # Extract the base name and extension
        base_name, ext = os.path.splitext(os.path.basename(name))
        
        # If no extension, default to .jpg
        if not ext:
            ext = '.jpg'
        
        # Return sanitized name with original extension
        return f"{safe_filename(base_name)}{ext}"


def generate_paired_filename(original_filename):
    """
    Generate a filename for a related file (e.g., a mask for an image).
    
    Args:
        original_filename: The filename of the original file
        
    Returns:
        A new filename that maintains a relationship with the original
    """
    # Extract the base name and extension
    base_name = os.path.basename(original_filename)
    name, ext = os.path.splitext(base_name)
    
    # Create a slug from the original name
    slug = slugify(name)
    
    # If no extension, default to .jpg
    if not ext:
        ext = '.jpg'
    
    # Generate a new filename with the same name and original extension
    return f"{slug}{ext}"


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
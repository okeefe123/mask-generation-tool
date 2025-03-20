"""
Models for the mask_generator API.

This file defines the data models for our mask generator application:
1. Image - Stores uploaded images
2. Mask - Stores masks generated for images
"""
import os
import json
import uuid
from django.db import models
from django.conf import settings
from django.dispatch import receiver
from django.db.models.signals import pre_delete
from .utils.file_storage import ImageStorage, MaskStorage, generate_paired_filename

# Create storage instances
image_storage = ImageStorage()
mask_storage = MaskStorage()
# Upload path functions used in migrations
def image_upload_path(instance, filename):
    """
    Define the upload path for image files.
    
    This function is referenced in migrations but has been replaced by ImageStorage.
    It's kept here for backward compatibility with tests and migrations.
    
    Args:
        instance: The Image instance being saved
        filename: The original filename
        
    Returns:
        The path where the file should be stored
    """
    # Generate a unique filename using UUID
    ext = os.path.splitext(filename)[1].lower()
    new_filename = f"{uuid.uuid4().hex}{ext}"
    # Make sure to include 'images/' in the path for test compatibility
    return f"images/{new_filename}"

def mask_upload_path(instance, filename):
    """
    Define the upload path for mask files.
    
    This function is referenced in migrations but has been replaced by MaskStorage.
    It's kept here for backward compatibility with tests and migrations.
    
    Args:
        instance: The Mask instance being saved
        filename: The original filename
        
    Returns:
        The path where the file should be stored
    """
    # Generate a unique filename using UUID
    ext = os.path.splitext(filename)[1].lower()
    new_filename = f"{uuid.uuid4().hex}{ext}"
    # Make sure to include 'masks/' in the path for test compatibility
    return f"masks/{new_filename}"
    return os.path.join('masks', new_filename)


class Image(models.Model):
    """
    Model representing an uploaded image.
    
    Attributes:
        file (ImageField): The image file
        original_filename (CharField): The original filename of the uploaded image
        width (IntegerField): The width of the image in pixels
        height (IntegerField): The height of the image in pixels
        uploaded_at (DateTimeField): When the image was uploaded
        is_mpo (BooleanField): Whether the image was originally an MPO file
        metadata_json (TextField): JSON string containing additional metadata
    """
    file = models.ImageField(storage=image_storage)
    original_filename = models.CharField(max_length=255)
    width = models.IntegerField()
    height = models.IntegerField()
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_mpo = models.BooleanField(default=False)
    metadata_json = models.TextField(blank=True, null=True)
    
    @property
    def metadata(self):
        """Get the metadata as a Python dictionary."""
        if not self.metadata_json:
            return {}
        try:
            return json.loads(self.metadata_json)
        except json.JSONDecodeError:
            return {}
    
    def set_metadata(self, metadata_dict):
        """Set the metadata from a Python dictionary."""
        if metadata_dict:
            self.metadata_json = json.dumps(metadata_dict)
        else:
            self.metadata_json = None
    
    def __str__(self):
        """String representation of the Image model."""
        return f"Image: {self.original_filename}"


class Mask(models.Model):
    """
    Model representing a mask for an image.
    
    Attributes:
        file (ImageField): The mask file
        image (ForeignKey): The image this mask is for
        created_at (DateTimeField): When the mask was created
        original_width (IntegerField): The width of original image when mask was created
        original_height (IntegerField): The height of original image when mask was created
    """
    file = models.ImageField(storage=mask_storage)
    image = models.ForeignKey(Image, on_delete=models.CASCADE, related_name='masks')
    created_at = models.DateTimeField(auto_now_add=True)
    original_width = models.IntegerField()
    original_height = models.IntegerField()
    
    def save(self, *args, **kwargs):
        """
        Override save method to generate a paired filename for the mask.
        
        This ensures that masks have filenames that relate to their source images.
        """
        if self.image and not self.file.name:
            # If this is a new mask being created with a reference to an image
            # Generate a paired filename based on the image's original filename
            if hasattr(self.file, 'content_type'):  # If file is already uploaded
                ext = os.path.splitext(self.file.name)[1].lower()
                paired_name = generate_paired_filename(self.image.original_filename)
                # Ensure the extension matches the uploaded file
                paired_name = os.path.splitext(paired_name)[0] + ext
                self.file.name = paired_name
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        """String representation of the Mask model."""
        return f"Mask for {self.image.original_filename}"


@receiver(pre_delete, sender=Image)
def delete_image_file(sender, instance, **kwargs):
    """
    Signal handler to delete the file when an Image instance is deleted.
    
    This ensures we don't leave orphaned files in the filesystem.
    """
    if instance.file:
        if os.path.isfile(instance.file.path):
            os.remove(instance.file.path)


@receiver(pre_delete, sender=Mask)
def delete_mask_file(sender, instance, **kwargs):
    """
    Signal handler to delete the file when a Mask instance is deleted.
    
    This ensures we don't leave orphaned files in the filesystem.
    """
    if instance.file:
        if os.path.isfile(instance.file.path):
            os.remove(instance.file.path)

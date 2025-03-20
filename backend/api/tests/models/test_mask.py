"""
Test file for the Mask model.

This file contains tests for the Mask model to ensure it:
1. Properly stores and retrieves mask data
2. Associates correctly with an Image
3. Generates file paths properly
"""
import os
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.conf import settings
from api.models import Image, Mask

class MaskModelTest(TestCase):
    """Test class for Mask model"""
    
    def setUp(self):
        """Set up test data"""
        # Create a test image first (since a mask must be associated with an image)
        self.test_image_content = b'JPEG test content'
        
        # Create a test file in the images directory
        self.test_image_path = os.path.join(settings.MEDIA_ROOT, 'images', 'test_image_for_mask.jpg')
        with open(self.test_image_path, 'wb') as f:
            f.write(self.test_image_content)
        
        # Use the file path directly
        self.image = Image.objects.create(
            file='images/test_image_for_mask.jpg',
            original_filename='test_image.jpg',
            width=800,
            height=600
        )
        
        # Create a simple mask test file (black and white image)
        self.test_mask_content = b'PNG mask content'
        
        # Create a test file in the masks directory
        self.test_mask_path = os.path.join(settings.MEDIA_ROOT, 'masks', 'test_mask.png')
        with open(self.test_mask_path, 'wb') as f:
            f.write(self.test_mask_content)
    
    def test_mask_creation(self):
        """Test that a Mask instance can be created with proper attributes"""
        mask = Mask.objects.create(
            file='masks/test_mask.png',
            image=self.image,
            original_width=800,
            original_height=600
        )
        
        # Check that the object was created
        self.assertEqual(Mask.objects.count(), 1)
        
        # Check that the attributes were saved correctly
        saved_mask = Mask.objects.first()
        self.assertEqual(saved_mask.image, self.image)
        self.assertEqual(saved_mask.original_width, 800)
        self.assertEqual(saved_mask.original_height, 600)
        
        # Check that the file was saved to the correct location
        expected_path = os.path.join(settings.MEDIA_ROOT, 'masks', os.path.basename(saved_mask.file.name))
        self.assertTrue(os.path.exists(expected_path))
    
    def test_mask_string_representation(self):
        """Test the string representation of the Mask model"""
        # Create a test file in the masks directory
        test_mask_path = os.path.join(settings.MEDIA_ROOT, 'masks', 'test_mask_str.png')
        with open(test_mask_path, 'wb') as f:
            f.write(self.test_mask_content)
            
        mask = Mask.objects.create(
            file='masks/test_mask_str.png',
            image=self.image,
            original_width=800,
            original_height=600
        )
        
        self.assertEqual(str(mask), f'Mask for {self.image.original_filename}')
    def test_mask_file_path(self):
        """Test that the mask file is saved to the correct path"""
        # Create a test file in the masks directory
        test_mask_path = os.path.join(settings.MEDIA_ROOT, 'masks', 'test_mask_path.png')
        with open(test_mask_path, 'wb') as f:
            f.write(self.test_mask_content)
            
        mask = Mask.objects.create(
            file='masks/test_mask_path.png',
            image=self.image,
            original_width=800,
            original_height=600
        )
        
        # Check that the file path contains the 'masks' directory
        self.assertIn('masks/', mask.file.name)
        self.assertIn('masks/', mask.file.name)
    
    def test_cascade_delete(self):
        """Test that when an image is deleted, its masks are also deleted"""
        # Create a test file in the masks directory
        test_mask_path = os.path.join(settings.MEDIA_ROOT, 'masks', 'test_mask_cascade.png')
        with open(test_mask_path, 'wb') as f:
            f.write(self.test_mask_content)
            
        # Create a mask associated with the image
        mask = Mask.objects.create(
            file='masks/test_mask_cascade.png',
            image=self.image,
            original_width=800,
            original_height=600
        )
        
        # Store the mask file path for later checking
        mask_file_path = mask.file.path
        
        # Delete the image
        self.image.delete()
        
        # Verify that the mask was also deleted from the database
        self.assertEqual(Mask.objects.count(), 0)
        
        # Verify that the mask file was deleted from storage
        self.assertFalse(os.path.exists(mask_file_path))
    
    def tearDown(self):
        """Clean up after tests"""
        # Delete all test images and masks
        for image in Image.objects.all():
            if image.file and os.path.exists(image.file.path):
                os.remove(image.file.path)
        
        for mask in Mask.objects.all():
            if mask.file and os.path.exists(mask.file.path):
                os.remove(mask.file.path)
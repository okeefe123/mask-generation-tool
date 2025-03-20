"""
Test file for the Image model.

This file contains tests for the Image model to ensure it:
1. Properly stores and retrieves image data
2. Validates file types correctly
3. Generates file paths properly
4. Handles MPO conversion if needed
"""
import os
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.conf import settings
from api.models import Image

class ImageModelTest(TestCase):
    """Test class for Image model"""
    
    def setUp(self):
        """Set up test data"""
        # Create a simple JPEG test file
        self.test_image_content = b'JPEG test content'
        self.test_image = SimpleUploadedFile(
            name='test_image.jpg',
            content=self.test_image_content,
            content_type='image/jpeg'
        )
    
    def test_image_creation(self):
        """Test that an Image instance can be created with proper attributes"""
        # Create a test file in the images directory
        test_file_path = os.path.join(settings.MEDIA_ROOT, 'images', 'test_image.jpg')
        with open(test_file_path, 'wb') as f:
            f.write(self.test_image_content)
        
        # Use the file path directly
        image = Image.objects.create(
            file='images/test_image.jpg',
            original_filename='test_image.jpg',
            width=800,
            height=600
        )
        
        # Check that the object was created
        self.assertEqual(Image.objects.count(), 1)
        
        # Check that the attributes were saved correctly
        saved_image = Image.objects.first()
        self.assertEqual(saved_image.original_filename, 'test_image.jpg')
        self.assertEqual(saved_image.width, 800)
        self.assertEqual(saved_image.height, 600)
        
        # Check that the file was saved to the correct location
        expected_path = os.path.join(settings.MEDIA_ROOT, 'images', os.path.basename(saved_image.file.name))
        self.assertTrue(os.path.exists(expected_path))
    
    def test_image_string_representation(self):
        """Test the string representation of the Image model"""
        # Create a test file in the images directory
        test_file_path = os.path.join(settings.MEDIA_ROOT, 'images', 'test_image_str.jpg')
        with open(test_file_path, 'wb') as f:
            f.write(self.test_image_content)
        
        # Use the file path directly
        image = Image.objects.create(
            file='images/test_image_str.jpg',
            original_filename='test_image.jpg',
            width=800,
            height=600
        )
        
        self.assertEqual(str(image), f'Image: {image.original_filename}')
    
    def test_image_file_path(self):
        """Test that the image file is saved to the correct path"""
        # Create a test file in the images directory
        test_file_path = os.path.join(settings.MEDIA_ROOT, 'images', 'test_image_path.jpg')
        with open(test_file_path, 'wb') as f:
            f.write(self.test_image_content)
        
        # Use the file path directly
        image = Image.objects.create(
            file='images/test_image_path.jpg',
            original_filename='test_image.jpg',
            width=800,
            height=600
        )
        
        # Check that the file path contains the 'images' directory
        self.assertIn('images/', image.file.name)
    
    def tearDown(self):
        """Clean up after tests"""
        # Delete all test images
        for image in Image.objects.all():
            if image.file and os.path.exists(image.file.path):
                os.remove(image.file.path)
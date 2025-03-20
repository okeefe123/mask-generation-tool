"""
Test file for the mask save endpoint.

This file contains tests for the mask save endpoint to ensure it:
1. Properly saves masks associated with images
2. Validates input data correctly
3. Handles resize requirements
4. Returns appropriate responses and status codes
"""
import os
import io
from django.test import TestCase
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from api.models import Image, Mask


class MaskSaveTest(TestCase):
    """Test class for mask save endpoint"""
    
    def setUp(self):
        """Set up test client, test image, and test mask"""
        self.client = APIClient()
        self.url = reverse('mask-save')
        
        # Create a test image in the database to associate masks with
        self.test_image_content = b'JPEG test content'
        self.test_image_file = SimpleUploadedFile(
            name='test_image.jpg',
            content=self.test_image_content,
            content_type='image/jpeg'
        )
        
        self.image = Image.objects.create(
            file=self.test_image_file,
            original_filename='test_image.jpg',
            width=1024,
            height=768
        )
        
        # Create a simple mask test file (black and white image)
        self.test_mask_content = b'PNG mask content'
        self.test_mask_file = SimpleUploadedFile(
            name='test_mask.png',
            content=self.test_mask_content,
            content_type='image/png'
        )
    
    def test_save_mask_success(self):
        """Test successful mask saving"""
        data = {
            'file': self.test_mask_file,
            'image': self.image.id,
            'original_width': 800,  # Simulating a resized original image
            'original_height': 600  # that was shown at 800x600
        }
        
        response = self.client.post(
            self.url, 
            data,
            format='multipart'
        )
        
        # Check response status and content
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertIn('file', response.data)
        self.assertIn('image', response.data)
        
        # Check database record
        self.assertEqual(Mask.objects.count(), 1)
        mask = Mask.objects.first()
        self.assertEqual(mask.image.id, self.image.id)
        self.assertEqual(mask.original_width, 800)
        self.assertEqual(mask.original_height, 600)
    
    def test_save_mask_missing_image(self):
        """Test error when no image ID is provided"""
        data = {
            'file': self.test_mask_file,
            'original_width': 800,
            'original_height': 600
        }
        
        response = self.client.post(
            self.url, 
            data,
            format='multipart'
        )
        
        # Check response status and error message
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('image', response.data)
        
        # Check no database record was created
        self.assertEqual(Mask.objects.count(), 0)
    
    def test_save_mask_invalid_image_id(self):
        """Test error when an invalid image ID is provided"""
        invalid_id = self.image.id + 999  # Ensure this doesn't exist
        
        data = {
            'file': self.test_mask_file,
            'image': invalid_id,
            'original_width': 800,
            'original_height': 600
        }
        
        response = self.client.post(
            self.url, 
            data,
            format='multipart'
        )
        
        # Check response status and error message
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('image', response.data)
        
        # Check no database record was created
        self.assertEqual(Mask.objects.count(), 0)
    
    def test_save_mask_missing_file(self):
        """Test error when no mask file is provided"""
        data = {
            'image': self.image.id,
            'original_width': 800,
            'original_height': 600
        }
        
        response = self.client.post(
            self.url, 
            data,
            format='multipart'
        )
        
        # Check response status and error message
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('file', response.data)
        
        # Check no database record was created
        self.assertEqual(Mask.objects.count(), 0)
    
    def tearDown(self):
        """Clean up after tests"""
        # Delete all test images and masks
        for image in Image.objects.all():
            if image.file and os.path.exists(image.file.path):
                os.remove(image.file.path)
        
        for mask in Mask.objects.all():
            if mask.file and os.path.exists(mask.file.path):
                os.remove(mask.file.path)
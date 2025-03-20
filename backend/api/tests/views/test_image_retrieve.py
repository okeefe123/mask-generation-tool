"""
Test file for the image retrieval endpoint.

This file contains tests for the image retrieval endpoint to ensure it:
1. Returns correct image data for valid IDs
2. Returns 404 for non-existent image IDs
3. Includes all necessary image information
"""
import os
from django.test import TestCase
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from api.models import Image


class ImageRetrieveTest(TestCase):
    """Test class for image retrieval endpoint"""
    
    def setUp(self):
        """Set up test client and create a test image"""
        self.client = APIClient()
        
        # Create a test image in the database
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
        
        # URL with the image ID
        self.url = reverse('image-detail', args=[self.image.id])
        
        # URL with a non-existent image ID
        self.invalid_url = reverse('image-detail', args=[9999])
    
    def test_retrieve_valid_image(self):
        """Test retrieving an existing image"""
        response = self.client.get(self.url)
        
        # Check response status and content
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.image.id)
        self.assertEqual(response.data['original_filename'], 'test_image.jpg')
        self.assertEqual(response.data['width'], 1024)
        self.assertEqual(response.data['height'], 768)
        self.assertIn('file', response.data)
    
    def test_retrieve_nonexistent_image(self):
        """Test 404 response for non-existent image ID"""
        response = self.client.get(self.invalid_url)
        
        # Check response status
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def tearDown(self):
        """Clean up after tests"""
        # Delete all test images
        for image in Image.objects.all():
            if image.file and os.path.exists(image.file.path):
                os.remove(image.file.path)
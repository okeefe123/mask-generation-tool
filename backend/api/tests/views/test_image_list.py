"""
Tests for the image list view.
"""
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from api.models import Image
import os

class ImageListViewTests(APITestCase):
    """
    Test cases for the ImageListView.
    """
    def setUp(self):
        """Set up test data."""
        # Create test images
        self.image1 = Image.objects.create(
            file='images/test_image1.jpg',
            original_filename='test_image1.jpg',
            width=800,
            height=600,
            is_mpo=False
        )
        
        self.image2 = Image.objects.create(
            file='images/test_image2.jpg',
            original_filename='test_image2.jpg',
            width=1024,
            height=768,
            is_mpo=False
        )
        
        self.image3 = Image.objects.create(
            file='images/test_image3.jpg',
            original_filename='test_image3.mpo',
            width=1920,
            height=1080,
            is_mpo=True
        )
    
    def test_list_images(self):
        """Test retrieving a list of all images."""
        url = reverse('image-list')
        response = self.client.get(url)
        
        # Check response status
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that all images are returned
        self.assertEqual(len(response.data), 3)
        
        # Check image data is correct
        image_ids = [item['id'] for item in response.data]
        self.assertIn(self.image1.id, image_ids)
        self.assertIn(self.image2.id, image_ids)
        self.assertIn(self.image3.id, image_ids)
        
        # Verify some fields in the response
        for image_data in response.data:
            if image_data['id'] == self.image3.id:
                self.assertEqual(image_data['original_filename'], 'test_image3.mpo')
                self.assertEqual(image_data['width'], 1920)
                self.assertEqual(image_data['height'], 1080)
                self.assertTrue(image_data['is_mpo'])
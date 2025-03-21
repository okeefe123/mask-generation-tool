"""
URL configuration for the API app.

This file defines the URL patterns for our mask generator API endpoints:
- Image upload
- Mask saving
- Image retrieval
- Listing all images
- Listing all masks
- Checking if an image has a mask
"""
from django.urls import path
from rest_framework.urlpatterns import format_suffix_patterns
from . import views

# Create URL patterns for our API endpoints
urlpatterns = [
    # Image endpoints
    path('images/upload/', views.ImageUploadView.as_view(), name='image-upload'),
    path('images/<int:pk>/', views.ImageDetailView.as_view(), name='image-detail'),
    path('images/', views.ImageListView.as_view(), name='image-list'),
    
    # Mask endpoints
    path('masks/save/', views.MaskSaveView.as_view(), name='mask-save'),
    path('masks/', views.MaskListView.as_view(), name='mask-list'),
    path('masks/check/<str:filename>/', views.MaskCheckView.as_view(), name='mask-check'),
]

# Add format suffix patterns to support different formats (.json, etc)
urlpatterns = format_suffix_patterns(urlpatterns)
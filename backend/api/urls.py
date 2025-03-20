"""
URL configuration for the API app.

This file defines the URL patterns for our mask generator API endpoints:
- Image upload
- Mask saving
- Image retrieval
"""
from django.urls import path
from rest_framework.urlpatterns import format_suffix_patterns
from . import views

# Create URL patterns for our API endpoints
urlpatterns = [
    # Image upload endpoint
    path('images/upload/', views.ImageUploadView.as_view(), name='image-upload'),
    
    # Mask save endpoint
    path('masks/save/', views.MaskSaveView.as_view(), name='mask-save'),
    
    # Image retrieval endpoint
    path('images/<int:pk>/', views.ImageDetailView.as_view(), name='image-detail'),
]

# Add format suffix patterns to support different formats (.json, etc)
urlpatterns = format_suffix_patterns(urlpatterns)
"""
URL configuration for mask_generator project.

This file defines the top-level URL routing for the entire project, including:
1. Django admin interface
2. API endpoints
3. Media file serving (in development)

For more details on Django URL routing, see:
https://docs.djangoproject.com/en/5.1/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Django admin interface
    path('admin/', admin.site.urls),
    
    # API endpoints - we'll create api/urls.py to define these routes
    path('api/', include('api.urls')),
]

# Add URL patterns for serving media files in development
# In production, these would typically be served by the web server directly
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

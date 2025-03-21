# Generated by Django 5.1.7 on 2025-03-20 04:30

import api.models
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Image',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file', models.ImageField(upload_to=api.models.image_upload_path)),
                ('original_filename', models.CharField(max_length=255)),
                ('width', models.IntegerField()),
                ('height', models.IntegerField()),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('is_mpo', models.BooleanField(default=False)),
            ],
        ),
        migrations.CreateModel(
            name='Mask',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file', models.ImageField(upload_to=api.models.mask_upload_path)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('original_width', models.IntegerField()),
                ('original_height', models.IntegerField()),
                ('image', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='masks', to='api.image')),
            ],
        ),
    ]

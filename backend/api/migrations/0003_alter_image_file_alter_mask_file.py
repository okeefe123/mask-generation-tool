# Generated manually

from django.db import migrations, models
import api.utils.file_storage


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_image_metadata_json'),
    ]

    operations = [
        migrations.AlterField(
            model_name='image',
            name='file',
            field=models.ImageField(storage=api.utils.file_storage.ImageStorage()),
        ),
        migrations.AlterField(
            model_name='mask',
            name='file',
            field=models.ImageField(storage=api.utils.file_storage.MaskStorage()),
        ),
    ]
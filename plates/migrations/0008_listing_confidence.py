# Generated by Django 2.0.6 on 2018-06-05 21:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('plates', '0007_plate_label'),
    ]

    operations = [
        migrations.AddField(
            model_name='listing',
            name='confidence',
            field=models.FloatField(default=0.0),
        ),
    ]

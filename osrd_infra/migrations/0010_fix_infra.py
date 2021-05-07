# Generated by Django 3.2 on 2021-05-10 07:52

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('osrd_infra', '0009_add_entities'),
    ]

    operations = [
        migrations.AlterField(
            model_name='infra',
            name='namespace',
            field=models.ForeignKey(editable=False, on_delete=django.db.models.deletion.CASCADE, to='osrd_infra.entitynamespace'),
        ),
        migrations.AlterField(
            model_name='infra',
            name='owner',
            field=models.UUIDField(default='00000000-0000-0000-0000-000000000000', editable=False),
        ),
    ]

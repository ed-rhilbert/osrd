# Generated by Django 4.1.2 on 2023-01-02 16:58

from django.db import migrations, models
import osrd_infra.schemas.rolling_stock
import osrd_infra.utils


class Migration(migrations.Migration):

    dependencies = [
        ("osrd_infra", "0011_electricalprofilesset"),
    ]

    operations = [
        migrations.AlterField(
            model_name="rollingstock",
            name="effort_curves",
            field=models.JSONField(
                help_text="A group of curves mapping speed (in m/s) to maximum traction (in newtons)",
                validators=[osrd_infra.utils.PydanticValidator(osrd_infra.schemas.rolling_stock.EffortCurves)],
            ),
        ),
    ]
# Generated by Django 4.0.6 on 2022-08-02 14:20

from django.db import migrations, models

import osrd_infra.utils


def apply_migration(apps, schema_editor):
    """Update infra from v2.3.0 to v2.3.1"""
    Infra = apps.get_model("osrd_infra", "Infra")
    OperationalPointModel = apps.get_model("osrd_infra", "OperationalPointModel")

    updated_infra = []
    updated_operational_points = []

    for infra in Infra.objects.all():
        if infra.railjson_version == "2.3.0":
            infra.railjson_version = "2.3.1"
            updated_infra.append(infra)

            for op in OperationalPointModel.objects.filter(infra=infra):
                op.data["uic"] = int("87" + str(op.data["ci"]))
                op.data["trigram"] = "???"
                updated_operational_points.append(op)

    Infra.objects.bulk_update(updated_infra, ["railjson_version"])
    OperationalPointModel.objects.bulk_update(updated_operational_points, ["data"])


def revert_migration(apps, schema_editor):
    """Revert infra from v2.3.1 to v2.3.0"""
    Infra = apps.get_model("osrd_infra", "Infra")
    OperationalPointModel = apps.get_model("osrd_infra", "OperationalPointModel")

    updated_infra = []
    updated_operational_points = []

    for infra in Infra.objects.all():
        if infra.railjson_version == "2.3.1":
            infra.railjson_version = "2.3.0"
            updated_infra.append(infra)

            for op in OperationalPointModel.objects.filter(infra=infra):
                op.data.pop("uic")
                op.data.pop("trigram")
                updated_operational_points.append(op)

    Infra.objects.bulk_update(updated_infra, ["railjson_version"])
    OperationalPointModel.objects.bulk_update(updated_operational_points, ["data"])


class Migration(migrations.Migration):

    dependencies = [
        ("osrd_infra", "0022_alter_errorlayer_information"),
    ]

    operations = [
        migrations.AlterField(
            model_name="infra",
            name="railjson_version",
            field=models.CharField(default="2.3.1", editable=False, max_length=16),
        ),
        migrations.AlterField(
            model_name="operationalpointmodel",
            name="data",
            field=models.JSONField(
                validators=[
                    osrd_infra.utils.JSONSchemaValidator(
                        limit_value={
                            "definitions": {
                                "ObjectReference": {
                                    "properties": {
                                        "id": {"maxLength": 255, "title": "Id", "type": "string"},
                                        "type": {"title": "Type", "type": "string"},
                                    },
                                    "required": ["id", "type"],
                                    "title": "ObjectReference",
                                    "type": "object",
                                },
                                "OperationalPointPart": {
                                    "properties": {
                                        "position": {"title": "Position", "type": "number"},
                                        "track": {"$ref": "#/definitions/ObjectReference"},
                                    },
                                    "required": ["track", "position"],
                                    "title": "OperationalPointPart",
                                    "type": "object",
                                },
                            },
                            "properties": {
                                "ch": {"maxLength": 2, "title": "Ch", "type": "string"},
                                "ch_long_label": {"maxLength": 255, "title": "Ch Long Label", "type": "string"},
                                "ch_short_label": {"maxLength": 255, "title": "Ch Short Label", "type": "string"},
                                "ci": {"title": "Ci", "type": "integer"},
                                "id": {"maxLength": 255, "title": "Id", "type": "string"},
                                "name": {"maxLength": 255, "title": "Name", "type": "string"},
                                "parts": {
                                    "items": {"$ref": "#/definitions/OperationalPointPart"},
                                    "title": "Parts",
                                    "type": "array",
                                },
                                "trigram": {"maxLength": 3, "title": "Trigram", "type": "string"},
                                "uic": {"title": "Uic", "type": "integer"},
                            },
                            "required": ["id", "parts", "name", "uic", "ci", "ch", "trigram"],
                            "title": "OperationalPoint",
                            "type": "object",
                        }
                    )
                ]
            ),
        ),
        migrations.AlterField(
            model_name="rollingstock",
            name="loading_gauge",
            field=models.CharField(
                choices=[
                    (osrd_infra.schemas.infra.LoadingGaugeType["G1"], osrd_infra.schemas.infra.LoadingGaugeType["G1"]),
                    (osrd_infra.schemas.infra.LoadingGaugeType["G2"], osrd_infra.schemas.infra.LoadingGaugeType["G2"]),
                    (osrd_infra.schemas.infra.LoadingGaugeType["GA"], osrd_infra.schemas.infra.LoadingGaugeType["GA"]),
                    (osrd_infra.schemas.infra.LoadingGaugeType["GB"], osrd_infra.schemas.infra.LoadingGaugeType["GB"]),
                    (
                        osrd_infra.schemas.infra.LoadingGaugeType["GB1"],
                        osrd_infra.schemas.infra.LoadingGaugeType["GB1"],
                    ),
                    (osrd_infra.schemas.infra.LoadingGaugeType["GC"], osrd_infra.schemas.infra.LoadingGaugeType["GC"]),
                    (
                        osrd_infra.schemas.infra.LoadingGaugeType["FR3_3"],
                        osrd_infra.schemas.infra.LoadingGaugeType["FR3_3"],
                    ),
                    (
                        osrd_infra.schemas.infra.LoadingGaugeType["FR3_3_GB_G2"],
                        osrd_infra.schemas.infra.LoadingGaugeType["FR3_3_GB_G2"],
                    ),
                    (
                        osrd_infra.schemas.infra.LoadingGaugeType["GLOTT"],
                        osrd_infra.schemas.infra.LoadingGaugeType["GLOTT"],
                    ),
                ],
                max_length=16,
            ),
        ),
        migrations.AlterField(
            model_name="tracksectionmodel",
            name="data",
            field=models.JSONField(
                validators=[
                    osrd_infra.utils.JSONSchemaValidator(
                        limit_value={
                            "definitions": {
                                "ApplicableDirections": {
                                    "description": "An enumeration.",
                                    "enum": ["START_TO_STOP", "STOP_TO_START", "BOTH"],
                                    "title": "ApplicableDirections",
                                    "type": "string",
                                },
                                "ApplicableTrainType": {
                                    "description": "An enumeration.",
                                    "enum": ["FREIGHT", "PASSENGER"],
                                    "title": "ApplicableTrainType",
                                    "type": "string",
                                },
                                "Curve": {
                                    "properties": {
                                        "begin": {"title": "Begin", "type": "number"},
                                        "end": {"title": "End", "type": "number"},
                                        "radius": {"title": "Radius", "type": "number"},
                                    },
                                    "required": ["radius", "begin", "end"],
                                    "title": "Curve",
                                    "type": "object",
                                },
                                "LineString": {
                                    "description": "LineString Model",
                                    "properties": {
                                        "coordinates": {
                                            "items": {
                                                "anyOf": [
                                                    {
                                                        "items": [
                                                            {"anyOf": [{"type": "number"}, {"type": "integer"}]},
                                                            {"anyOf": [{"type": "number"}, {"type": "integer"}]},
                                                        ],
                                                        "maxItems": 2,
                                                        "minItems": 2,
                                                        "type": "array",
                                                    },
                                                    {
                                                        "items": [
                                                            {"anyOf": [{"type": "number"}, {"type": "integer"}]},
                                                            {"anyOf": [{"type": "number"}, {"type": "integer"}]},
                                                            {"anyOf": [{"type": "number"}, {"type": "integer"}]},
                                                        ],
                                                        "maxItems": 3,
                                                        "minItems": 3,
                                                        "type": "array",
                                                    },
                                                ]
                                            },
                                            "minItems": 2,
                                            "title": "Coordinates",
                                            "type": "array",
                                        },
                                        "type": {"const": "LineString", "title": "Type", "type": "string"},
                                    },
                                    "required": ["coordinates"],
                                    "title": "LineString",
                                    "type": "object",
                                },
                                "LoadingGaugeLimit": {
                                    "properties": {
                                        "applicable_train_type": {"$ref": "#/definitions/ApplicableTrainType"},
                                        "begin": {"title": "Begin", "type": "number"},
                                        "category": {"$ref": "#/definitions/LoadingGaugeType"},
                                        "end": {"title": "End", "type": "number"},
                                    },
                                    "required": ["category", "begin", "end", "applicable_train_type"],
                                    "title": "LoadingGaugeLimit",
                                    "type": "object",
                                },
                                "LoadingGaugeType": {
                                    "description": "An enumeration.",
                                    "enum": ["G1", "G2", "GA", "GB", "GB1", "GC", "FR3.3", "FR3.3/GB/G2", "GLOTT"],
                                    "title": "LoadingGaugeType",
                                    "type": "string",
                                },
                                "Slope": {
                                    "properties": {
                                        "begin": {"title": "Begin", "type": "number"},
                                        "end": {"title": "End", "type": "number"},
                                        "gradient": {"title": "Gradient", "type": "number"},
                                    },
                                    "required": ["gradient", "begin", "end"],
                                    "title": "Slope",
                                    "type": "object",
                                },
                            },
                            "properties": {
                                "curves": {
                                    "items": {"$ref": "#/definitions/Curve"},
                                    "title": "Curves",
                                    "type": "array",
                                },
                                "geo": {"$ref": "#/definitions/LineString"},
                                "id": {"maxLength": 255, "title": "Id", "type": "string"},
                                "length": {"title": "Length", "type": "number"},
                                "line_code": {"title": "Line Code", "type": "integer"},
                                "line_name": {"maxLength": 255, "title": "Line Name", "type": "string"},
                                "loading_gauge_limits": {
                                    "items": {"$ref": "#/definitions/LoadingGaugeLimit"},
                                    "title": "Loading Gauge Limits",
                                    "type": "array",
                                },
                                "navigability": {"$ref": "#/definitions/ApplicableDirections"},
                                "sch": {"$ref": "#/definitions/LineString"},
                                "slopes": {
                                    "items": {"$ref": "#/definitions/Slope"},
                                    "title": "Slopes",
                                    "type": "array",
                                },
                                "track_name": {"maxLength": 255, "title": "Track Name", "type": "string"},
                                "track_number": {"title": "Track Number", "type": "integer"},
                            },
                            "required": [
                                "geo",
                                "sch",
                                "id",
                                "length",
                                "line_code",
                                "line_name",
                                "track_number",
                                "track_name",
                                "navigability",
                                "slopes",
                                "curves",
                            ],
                            "title": "TrackSection",
                            "type": "object",
                        }
                    )
                ]
            ),
        ),
        migrations.RunPython(code=apply_migration, reverse_code=revert_migration),
    ]
# Data migration that adds three default categories on migrate
from django.db import migrations

DEFAULT_CATEGORIES = [
    ("شغل", "#3b82f6"),
    ("بيت", "#22c55e"),
    ("دراسة", "#a855f7"),
]


def add_categories(apps, schema_editor):
    Category = apps.get_model("tasks", "Category")
    for name, color in DEFAULT_CATEGORIES:
        Category.objects.get_or_create(name=name, defaults={"color": color})


def remove_categories(apps, schema_editor):
    Category = apps.get_model("tasks", "Category")
    Category.objects.filter(name__in=[n for n, _ in DEFAULT_CATEGORIES]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("tasks", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(add_categories, remove_categories),
    ]

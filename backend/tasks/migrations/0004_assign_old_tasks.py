# Tasks created before login existed have no owner.
# This migration assigns them to the first superuser (if any) so they don't disappear.
from django.conf import settings
from django.db import migrations


def assign_orphans(apps, schema_editor):
    User = apps.get_model(*settings.AUTH_USER_MODEL.split("."))
    Task = apps.get_model("tasks", "Task")
    first = User.objects.filter(is_superuser=True).order_by("id").first()
    if first:
        Task.objects.filter(owner__isnull=True).update(owner=first)


class Migration(migrations.Migration):
    dependencies = [
        ("tasks", "0003_task_owner"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(assign_orphans, migrations.RunPython.noop),
    ]

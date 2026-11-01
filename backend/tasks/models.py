# timedelta for time offsets (e.g. 30 minutes before the due date)
from datetime import timedelta

from django.conf import settings
from django.db import models
# timezone.now() returns the current time, time zone aware
from django.utils import timezone


# ================== Category ==================
class Category(models.Model):
    # Category name; unique=True prevents duplicates
    name = models.CharField(max_length=50, unique=True)
    # Hex color such as #3b82f6
    color = models.CharField(max_length=7, default="#3b82f6")

    class Meta:
        ordering = ["name"]
        verbose_name = "Category / تصنيف"
        verbose_name_plural = "Categories / التصنيفات"

    def __str__(self):
        return self.name


# ================== Task ==================
class Task(models.Model):
    PRIORITY_CHOICES = [
        ("high", "High / عالية 🔴"),
        ("medium", "Medium / متوسطة 🟡"),
        ("low", "Low / منخفضة 🟢"),
    ]

    REPEAT_CHOICES = [
        ("none", "Once / مرة واحدة"),
        ("daily", "Daily / يوميًا"),
        ("weekly", "Weekly / أسبوعيًا"),
    ]

    # How far each repeat type moves the due date
    REPEAT_STEPS = {
        "daily": timedelta(days=1),
        "weekly": timedelta(weeks=1),
    }

    # Task owner: each user only sees their own tasks
    # settings.AUTH_USER_MODEL is Django's user model
    # CASCADE: deleting the account deletes its tasks
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        related_name="tasks",
    )

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    # Category link: deleting a category keeps the task without a category
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks",
    )

    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default="medium")

    # Due date and time (optional)
    due_at = models.DateTimeField(null=True, blank=True)

    # Minutes before the due date to remind (null = no reminder, 0 = at due time)
    remind_before_minutes = models.PositiveIntegerField(null=True, blank=True, default=30)
    # Whether the reminder has been sent (so it isn't sent twice)
    reminder_sent = models.BooleanField(default=False)

    # Repeat
    repeat = models.CharField(max_length=10, choices=REPEAT_CHOICES, default="none")
    # Whether the next occurrence was created (so it isn't created twice)
    next_created = models.BooleanField(default=False)

    # Completion
    is_done = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Unfinished first, then nearest due date, tasks without a date last
        ordering = ["is_done", models.F("due_at").asc(nulls_last=True), "-created_at"]
        verbose_name = "Task / مهمة"
        verbose_name_plural = "Tasks / المهام"

    def __str__(self):
        return self.title

    @property
    def remind_at(self):
        """When the reminder should fire"""
        if self.due_at is None or self.remind_before_minutes is None:
            return None
        return self.due_at - timedelta(minutes=self.remind_before_minutes)

    @property
    def is_overdue(self):
        """True if the due date has passed and the task isn't done"""
        if self.is_done or self.due_at is None:
            return False
        return self.due_at < timezone.now()

    def save(self, *args, **kwargs):
        # If the due date or reminder offset changed, re-arm the reminder
        if self.pk:
            old = Task.objects.filter(pk=self.pk).values(
                "due_at", "remind_before_minutes"
            ).first()
            if old and (
                old["due_at"] != self.due_at
                or old["remind_before_minutes"] != self.remind_before_minutes
            ):
                self.reminder_sent = False

        # Was the task just marked as done?
        just_completed = self.is_done and self.completed_at is None

        if just_completed:
            self.completed_at = timezone.now()
        elif not self.is_done:
            self.completed_at = None

        super().save(*args, **kwargs)

        # Repeating task just completed: create the next occurrence
        if just_completed:
            self.create_next_occurrence()

    def create_next_occurrence(self):
        """Create the next occurrence of a repeating task"""
        step = self.REPEAT_STEPS.get(self.repeat)
        if step is None or self.due_at is None or self.next_created:
            return None

        # Next due date: add one step, and keep adding while it is still in the past
        # (e.g. if "drink water" wasn't ticked for 3 days, the next one is tomorrow, not 3 days ago)
        next_due = self.due_at + step
        now = timezone.now()
        while next_due <= now:
            next_due += step

        new_task = Task.objects.create(
            owner=self.owner,
            title=self.title,
            description=self.description,
            category=self.category,
            priority=self.priority,
            due_at=next_due,
            remind_before_minutes=self.remind_before_minutes,
            repeat=self.repeat,
        )
        # update instead of save to skip the save() logic
        Task.objects.filter(pk=self.pk).update(next_created=True)
        self.next_created = True
        return new_task

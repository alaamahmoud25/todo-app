from datetime import timedelta

from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Category, Task
from .serializers import CategorySerializer, TaskSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer

    def get_queryset(self):
        # annotate adds each category's count of unfinished tasks
        # Count only the current user's tasks
        return Category.objects.annotate(
            pending_count=Count(
                "tasks",
                filter=Q(tasks__is_done=False, tasks__owner=self.request.user),
            )
        )


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer

    # Current user's tasks only
    # request.user is the owner of the token sent with the request
    def mine(self):
        return Task.objects.filter(owner=self.request.user)

    # New tasks belong to the logged-in user.
    # (Not taken from the payload, so nobody can create tasks for someone else.)
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def get_queryset(self):
        # select_related fetches the category in the same query
        qs = self.mine().select_related("category")
        params = self.request.query_params
        now = timezone.now()
        today = timezone.localdate()

        # ---- View filter ----
        view = params.get("view")
        if view == "today":
            qs = qs.filter(due_at__date=today)
        elif view == "overdue":
            qs = qs.filter(is_done=False, due_at__lt=now)
        elif view == "upcoming":
            qs = qs.filter(is_done=False, due_at__gt=now)
        elif view == "done":
            qs = qs.filter(is_done=True)

        # ---- Extra filters ----
        category = params.get("category")
        if category:
            qs = qs.filter(category_id=category)

        priority = params.get("priority")
        if priority:
            qs = qs.filter(priority=priority)

        search = params.get("search")
        if search:
            # icontains: case-insensitive substring match
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))

        return qs

    # ✅ POST /api/tasks/<id>/toggle/
    @action(detail=True, methods=["post"])
    def toggle(self, request, pk=None):
        task = self.get_object()
        task.is_done = not task.is_done
        task.save()  # save() sets completed_at and creates the next occurrence for repeating tasks
        return Response(self.get_serializer(task).data)

    # 📊 GET /api/tasks/summary/
    @action(detail=False)
    def summary(self, request):
        now = timezone.now()
        today = timezone.localdate()
        pending = self.mine().filter(is_done=False)
        return Response({
            "today": pending.filter(due_at__date=today).count(),
            "overdue": pending.filter(due_at__lt=now).count(),
            "pending": pending.count(),
            "done_today": self.mine().filter(is_done=True, completed_at__date=today).count(),
        })

    # GET /api/tasks/stats/  (chart data)
    @action(detail=False)
    def stats(self, request):
        today = timezone.localdate()
        start = today - timedelta(days=6)  # Last 7 days including today

        # Tasks completed per day
        # TruncDate drops the time and keeps the date (in Cairo time)
        done_rows = (
            self.mine().filter(is_done=True, completed_at__date__gte=start)
            .annotate(day=TruncDate("completed_at"))
            .values("day")
            .annotate(count=Count("id"))
        )
        done_map = {row["day"]: row["count"] for row in done_rows}

        # Tasks due per day
        due_rows = (
            self.mine().filter(due_at__date__gte=start, due_at__date__lte=today)
            .annotate(day=TruncDate("due_at"))
            .values("day")
            .annotate(count=Count("id"))
        )
        due_map = {row["day"]: row["count"] for row in due_rows}

        # Build all seven days, filling empty days with zero
        last_7_days = []
        for i in range(7):
            day = start + timedelta(days=i)
            last_7_days.append({
                "date": day.isoformat(),
                "done": done_map.get(day, 0),
                "due": due_map.get(day, 0),
            })

        pending = self.mine().filter(is_done=False)

        # Unfinished tasks by category
        by_category = [
            {"name": c.name, "color": c.color, "count": c.pending_count}
            for c in Category.objects.annotate(
                pending_count=Count(
                    "tasks", filter=Q(tasks__is_done=False, tasks__owner=request.user)
                )
            )
            if c.pending_count > 0
        ]
        uncategorized = pending.filter(category__isnull=True).count()

        # Unfinished tasks by priority
        by_priority = {
            p: pending.filter(priority=p).count() for p in ("high", "medium", "low")
        }

        total = self.mine().count()
        done_total = self.mine().filter(is_done=True).count()

        return Response({
            "last_7_days": last_7_days,
            "by_category": by_category,
            "uncategorized": uncategorized,
            "by_priority": by_priority,
            "completion_rate": round(done_total / total * 100) if total else 0,
        })

    # GET /api/tasks/reminders/  (tasks whose reminder time has arrived)
    @action(detail=False)
    def reminders(self, request):
        now = timezone.now()
        # Candidates: not done, with a due date and reminder, reminder not sent yet,
        # and not overdue by more than a day (skip very old tasks)
        candidates = self.mine().select_related("category").filter(
            is_done=False,
            reminder_sent=False,
            due_at__isnull=False,
            remind_before_minutes__isnull=False,
            due_at__gte=now - timedelta(days=1),
        )
        # remind_at is a property, not a database column, so filter in Python
        due_now = [t for t in candidates if t.remind_at <= now]
        return Response(self.get_serializer(due_now, many=True).data)

    # POST /api/tasks/<id>/mark_reminded/  (mark the reminder as sent)
    @action(detail=True, methods=["post"])
    def mark_reminded(self, request, pk=None):
        task = self.get_object()
        # update instead of save so the reminder re-arm logic doesn't run
        Task.objects.filter(pk=task.pk).update(reminder_sent=True)
        return Response({"ok": True})

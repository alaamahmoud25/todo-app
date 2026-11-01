from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import Category, Task


class TaskApiTests(APITestCase):
    def setUp(self):
        # Every test runs as a logged-in user
        self.user = get_user_model().objects.create_user("alaa", password="StrongPass!123")
        self.client.force_authenticate(self.user)
        self.now = timezone.now()
        self.cat = Category.objects.get(name="شغل")  # Created by a migration

    def test_default_categories_exist(self):
        self.assertEqual(Category.objects.count(), 3)

    def test_create_task_and_list(self):
        res = self.client.post("/api/tasks/", {
            "title": "  اشتري عيش ", "priority": "high", "category": self.cat.id,
            "due_at": "2030-01-01T18:00",
        }, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data["title"], "اشتري عيش")
        # Naive datetimes are interpreted as Cairo time
        self.assertTrue(res.data["due_at"].endswith("+02:00"))
        self.assertEqual(res.data["category_detail"]["name"], "شغل")

    def test_blank_title_rejected(self):
        res = self.client.post("/api/tasks/", {"title": "   "}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_repeat_needs_due_date(self):
        res = self.client.post("/api/tasks/", {"title": "x", "repeat": "daily"}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_views_filters(self):
        Task.objects.create(owner=self.user, title="old", due_at=self.now - timedelta(days=2))
        Task.objects.create(owner=self.user, title="future", due_at=self.now + timedelta(days=3))
        Task.objects.create(owner=self.user, title="nodate")
        overdue = self.client.get("/api/tasks/?view=overdue").data
        upcoming = self.client.get("/api/tasks/?view=upcoming").data
        self.assertEqual([t["title"] for t in overdue], ["old"])
        self.assertEqual([t["title"] for t in upcoming], ["future"])
        self.assertTrue(overdue[0]["is_overdue"])

    def test_toggle_sets_completed_at(self):
        t = Task.objects.create(owner=self.user, title="t")
        res = self.client.post(f"/api/tasks/{t.id}/toggle/")
        self.assertTrue(res.data["is_done"])
        self.assertIsNotNone(res.data["completed_at"])
        res = self.client.post(f"/api/tasks/{t.id}/toggle/")
        self.assertFalse(res.data["is_done"])
        self.assertIsNone(res.data["completed_at"])

    def test_daily_repeat_creates_next_once(self):
        t = Task.objects.create(owner=self.user, title="water", repeat="daily", due_at=self.now - timedelta(days=3))
        self.client.post(f"/api/tasks/{t.id}/toggle/")
        self.assertEqual(Task.objects.filter(title="water").count(), 2)
        nxt = Task.objects.get(title="water", is_done=False)
        self.assertGreater(nxt.due_at, self.now)  # The next one is in the future
        # Undo + redo doesn't create a third copy
        self.client.post(f"/api/tasks/{t.id}/toggle/")
        self.client.post(f"/api/tasks/{t.id}/toggle/")
        self.assertEqual(Task.objects.filter(title="water").count(), 2)

    def test_reminders_flow(self):
        t = Task.objects.create(owner=self.user, title="soon", due_at=self.now + timedelta(minutes=10),
                                remind_before_minutes=30)
        Task.objects.create(owner=self.user, title="later", due_at=self.now + timedelta(hours=5),
                            remind_before_minutes=30)
        res = self.client.get("/api/tasks/reminders/")
        self.assertEqual([x["title"] for x in res.data], ["soon"])
        self.client.post(f"/api/tasks/{t.id}/mark_reminded/")
        self.assertEqual(self.client.get("/api/tasks/reminders/").data, [])
        # Changing the due date re-arms the reminder
        t.refresh_from_db()
        t.due_at = self.now + timedelta(minutes=5)
        t.save()
        self.assertEqual(len(self.client.get("/api/tasks/reminders/").data), 1)

    def test_summary_and_stats(self):
        Task.objects.create(owner=self.user, title="a", category=self.cat, due_at=self.now + timedelta(minutes=1))
        done = Task.objects.create(owner=self.user, title="b")
        done.is_done = True
        done.save()
        s = self.client.get("/api/tasks/summary/").data
        self.assertEqual(s["pending"], 1)
        self.assertEqual(s["done_today"], 1)
        st = self.client.get("/api/tasks/stats/").data
        self.assertEqual(len(st["last_7_days"]), 7)
        self.assertEqual(st["last_7_days"][-1]["done"], 1)
        self.assertEqual(st["by_category"][0]["name"], "شغل")
        self.assertEqual(st["completion_rate"], 50)

    def test_admin_language_urls(self):
        self.assertEqual(self.client.get("/ar/admin/").status_code, 302)
        self.assertEqual(self.client.get("/en/admin/").status_code, 302)


class AuthTests(APITestCase):
    def test_requires_login(self):
        self.assertEqual(self.client.get("/api/tasks/").status_code, 401)

    def test_register_login_me_logout(self):
        res = self.client.post("/api/auth/register/", {"username": "omar", "password": "short"}, format="json")
        self.assertEqual(res.data["detail"], "weak_password")
        res = self.client.post("/api/auth/register/", {"username": "omar", "password": "StrongPass!123"}, format="json")
        self.assertEqual(res.status_code, 201)
        res = self.client.post("/api/auth/register/", {"username": "OMAR", "password": "StrongPass!123"}, format="json")
        self.assertEqual(res.data["detail"], "username_taken")

        res = self.client.post("/api/auth/login/", {"username": "omar", "password": "wrong"}, format="json")
        self.assertEqual(res.data["detail"], "invalid_credentials")
        res = self.client.post("/api/auth/login/", {"username": "omar", "password": "StrongPass!123"}, format="json")
        token = res.data["token"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        self.assertEqual(self.client.get("/api/auth/me/").data["username"], "omar")
        self.client.post("/api/auth/logout/")
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 401)

    def test_users_only_see_their_own_tasks(self):
        User = get_user_model()
        a = User.objects.create_user("a", password="StrongPass!123")
        b = User.objects.create_user("b", password="StrongPass!123")
        self.client.force_authenticate(a)
        tid = self.client.post("/api/tasks/", {"title": "secret"}, format="json").data["id"]
        self.client.force_authenticate(b)
        self.assertEqual(self.client.get("/api/tasks/").data, [])
        self.assertEqual(self.client.get(f"/api/tasks/{tid}/").status_code, 404)
        self.assertEqual(self.client.delete(f"/api/tasks/{tid}/").status_code, 404)
        self.assertEqual(self.client.get("/api/tasks/summary/").data["pending"], 0)

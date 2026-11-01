from django.contrib import admin

from .models import Category, Task


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "color"]


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ["title", "owner", "category", "priority", "due_at", "repeat", "is_done", "is_overdue"]
    list_filter = ["owner", "is_done", "priority", "category", "repeat"]
    search_fields = ["title", "description"]
    list_editable = ["is_done"]
    date_hierarchy = "due_at"

    # Show is_overdue as a boolean icon
    @admin.display(boolean=True, description="Overdue / متأخرة")
    def is_overdue(self, obj):
        return obj.is_overdue

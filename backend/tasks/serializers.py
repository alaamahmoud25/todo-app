from rest_framework import serializers

from .models import Category, Task


class CategorySerializer(serializers.ModelSerializer):
    # Number of unfinished tasks in this category (read only)
    pending_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Category
        fields = ["id", "name", "color", "pending_count"]


class TaskSerializer(serializers.ModelSerializer):
    # Full category details for display; writes send category as an id
    category_detail = CategorySerializer(source="category", read_only=True)
    # Model properties
    remind_at = serializers.DateTimeField(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    # Only codes are sent (high, daily, ...); the frontend translates them
    class Meta:
        model = Task
        fields = [
            "id", "title", "description",
            "category", "category_detail",
            "priority", "due_at", "remind_before_minutes", "remind_at",
            "repeat", "is_done", "is_overdue", "completed_at",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "completed_at", "created_at", "updated_at"]

    def validate_title(self, value):
        # Reject titles that are only whitespace
        value = value.strip()
        if not value:
            raise serializers.ValidationError("العنوان مطلوب / Title is required")
        return value

    def validate(self, attrs):
        # A repeating task needs a due date to schedule the next occurrence
        repeat = attrs.get("repeat", getattr(self.instance, "repeat", "none"))
        due_at = attrs.get("due_at", getattr(self.instance, "due_at", None))
        if repeat != "none" and due_at is None:
            raise serializers.ValidationError(
                {"due_at": "المهمة المتكررة لازم يكون ليها ميعاد / A repeating task needs a due date"}
            )
        return attrs

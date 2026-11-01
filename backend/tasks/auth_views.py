# Login and sign-up endpoints
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

User = get_user_model()


def user_data(user, token):
    """Payload returned to the frontend after login or sign-up"""
    return {"token": token.key, "user": {"id": user.id, "username": user.username}}


# POST /api/auth/login/   {"username": "...", "password": "..."}
@api_view(["POST"])
@permission_classes([AllowAny])  # Open to anonymous users
def login_view(request):
    username = (request.data.get("username") or "").strip()
    password = request.data.get("password") or ""

    # authenticate checks the credentials and returns the user or None
    user = authenticate(username=username, password=password)
    if user is None:
        return Response(
            {"detail": "invalid_credentials"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # get_or_create reuses the user's existing token or creates one
    token, _ = Token.objects.get_or_create(user=user)
    return Response(user_data(user, token))


# POST /api/auth/register/   {"username": "...", "password": "..."}
@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    username = (request.data.get("username") or "").strip()
    password = request.data.get("password") or ""

    # Errors are returned as codes; the frontend translates them
    if len(username) < 3:
        return Response({"detail": "username_short"}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(username__iexact=username).exists():
        return Response({"detail": "username_taken"}, status=status.HTTP_400_BAD_REQUEST)

    # validate_password applies Django's rules (min 8 chars, not all digits, not too common, ...)
    try:
        validate_password(password, user=User(username=username))
    except ValidationError as e:
        return Response(
            {"detail": "weak_password", "messages": e.messages},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # create_user hashes the password; the plain text is never stored
    user = User.objects.create_user(username=username, password=password)
    token = Token.objects.create(user=user)
    return Response(user_data(user, token), status=status.HTTP_201_CREATED)


# GET /api/auth/me/   Current user (the frontend uses it to check the token is still valid)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response({"id": request.user.id, "username": request.user.username})


# POST /api/auth/logout/   Deletes the token so it can't be used again
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    Token.objects.filter(user=request.user).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

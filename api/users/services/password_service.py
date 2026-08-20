from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.token_blacklist.models import (
    OutstandingToken, BlacklistedToken
)

class PasswordService:
    
    @staticmethod
    def change_password(
        user,
        current_password,
        new_password,
    ):
        if not user.check_password(current_password):
            raise ValueError("Senha atual incorreta.")
        
        validate_password(new_password, user)
        
        user.set_password(new_password)
        
        user.save(update_fields=["password"])
        
        tokens = OutstandingToken.objects.filter(
            user=user
        )
        
        for token in tokens:
            BlacklistedToken.objects.get_or_create(
                token=token
            )
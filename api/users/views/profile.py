from rest_framework.permissions import IsAuthenticated
from users.serializers.profile import ProfileUpdateSerializer, ProfileSerializer
from rest_framework.generics import RetrieveUpdateAPIView

class ProfileView(RetrieveUpdateAPIView):
    
    permission_classes = [IsAuthenticated]
    
    serializer_class = ProfileSerializer
    
    def get_object(self): # type: ignore
        return self.request.user
    
    def get_serializer_class(self): #type: ignore
        
        if self.request.method in ["PATCH", "PUT"]:
            return ProfileUpdateSerializer
        
        return ProfileSerializer
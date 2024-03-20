from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('room/', views.room, name='room'),
    path('lobby/', views.lobby, name='lobby'),
    path('settings/', views.settings, name='settings'),
    path('profile/', views.profile, name='profile')
]
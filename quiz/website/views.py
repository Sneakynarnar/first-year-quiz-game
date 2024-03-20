from django.shortcuts import render

# Will need to pass through params

def home(request):
    return render(request, 'home.html', {})

def room(request):
    return render(request, 'room.html', {})

def lobby(request):
    return lobby(request, 'lobby.html', {})

def settings(request):
    return settings(request, 'settings.html', {})

def profile(request):
    return profile(request, 'profile.html', {})
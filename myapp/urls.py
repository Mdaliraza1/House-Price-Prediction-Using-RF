from django.urls import path
from . import views

app_name = 'myapp'

urlpatterns = [
    path('', views.predict_price, name='predict_price'),
]


from django.urls import path
from . import views

app_name = 'price_prediction'

urlpatterns = [
    path('', views.predict_price, name='predict'),
]

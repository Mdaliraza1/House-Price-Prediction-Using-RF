from django.urls import path
from . import views

app_name = 'myapp'

urlpatterns = [
    path('', views.portfolio_home, name='portfolio_home'),
    path('house-price-prediction/', views.predict_price, name='predict_price'),
]


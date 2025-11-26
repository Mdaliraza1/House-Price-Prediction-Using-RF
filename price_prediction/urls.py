from django.urls import path
from . import views

app_name = 'price_prediction'

urlpatterns = [
    path('', views.predict_price, name='predict'),
    path('api/nearby-places/', views.fetch_nearby_places, name='fetch_nearby_places'),
    path('api/search-places/', views.search_places_by_text, name='search_places_by_text'),
    path('api/distance/', views.calculate_distance, name='calculate_distance'),
    path('api/batch-distance/', views.calculate_batch_distances, name='calculate_batch_distances'),
]

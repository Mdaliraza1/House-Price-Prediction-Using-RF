from django.urls import path
from . import views

app_name = 'price_prediction'

urlpatterns = [
    path('', views.predict_price, name='predict'),
    path('api/batch-distance/', views.calculate_batch_distances, name='calculate_batch_distances'),
    path('api/batch-distance-both/', views.calculate_batch_distances_both_modes, name='calculate_batch_distances_both'),
    path('api/all-amenities/', views.fetch_all_amenities, name='fetch_all_amenities'),
]

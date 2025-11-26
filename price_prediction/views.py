"""
Django views for house price prediction
"""

from django.shortcuts import render
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .utils import predict_house_price, get_property_types
import requests

def predict_price(request):
    """Main view: shows form and processes predictions"""
    property_types = get_property_types()
    prediction = None
    error_message = None
    
    if request.method == 'POST':
        try:
            form_data = extract_form_data(request.POST)
            validate_form_data(form_data)
            input_data = prepare_model_input(form_data)
            predicted_price = predict_house_price(input_data)
            
            prediction = {
                'price': predicted_price,
                'formatted_price': format_price(predicted_price),
                'latitude': form_data['latitude'],
                'longitude': form_data['longitude']
            }
            
        except ValueError as e:
            error_message = str(e)
        except KeyError as e:
            error_message = f"Missing required field: {str(e)}"
        except Exception as e:
            error_message = f"Error making prediction: {str(e)}"
    
    context = {
        'property_types': property_types,
        'prediction': prediction,
        'error_message': error_message,
        'google_maps_api_key': settings.GOOGLE_MAPS_API_KEY,
    }
    
    return render(request, 'price_prediction/predict.html', context)


def extract_form_data(post_data):
    """Extract and convert form data to correct types"""
    return {
        'bedrooms': int(post_data.get('bedrooms', 0)),
        'bathrooms': float(post_data.get('bathrooms', 0)),
        'living_area': int(post_data.get('living_area', 0)),
        'lot_area': int(post_data.get('lot_area', 0)),
        'floor': int(post_data.get('floor', 0)),
        'property_type': post_data.get('property_type', ''),
        'latitude': float(post_data.get('latitude', 0)),
        'longitude': float(post_data.get('longitude', 0)),
    }


def validate_form_data(form_data):
    """Validate form data and raise error if invalid"""
    validations = [
        (form_data['bedrooms'] <= 0, "Number of bedrooms must be greater than 0"),
        (form_data['bathrooms'] <= 0, "Number of bathrooms must be greater than 0"),
        (form_data['living_area'] <= 0, "Living area must be greater than 0"),
        (form_data['lot_area'] <= 0, "Lot area must be greater than 0"),
        (not form_data['property_type'], "Property type is required"),
        (not (-90 <= form_data['latitude'] <= 90), "Latitude must be between -90 and 90"),
        (not (-180 <= form_data['longitude'] <= 180), "Longitude must be between -180 and 180"),
    ]
    
    for condition, message in validations:
        if condition:
            raise ValueError(message)


def prepare_model_input(form_data):
    """Convert form data to format expected by ML model"""
    return {
        'number of bedrooms': form_data['bedrooms'],
        'number of bathrooms': form_data['bathrooms'],
        'living area': form_data['living_area'],
        'lot area': form_data['lot_area'],
        'floor': form_data['floor'],
        'property_type': form_data['property_type'],
        'Lattitude': form_data['latitude'],
        'Longitude': form_data['longitude'],
    }


def format_price(price):
    """Format price with Indian number system"""
    price_str = f"{price:.2f}"
    integer_part, decimal_part = (price_str.split('.') if '.' in price_str else (price_str, "00"))
    formatted_integer = format_indian_number(int(integer_part))
    return f"₹{formatted_integer}.{decimal_part}"


def format_indian_number(num):
    """Format number according to Indian numbering system"""
    num_str = str(num)
    if len(num_str) <= 3:
        return num_str
    
    result = num_str[-3:]
    remaining_reversed = num_str[:-3][::-1]
    groups = [remaining_reversed[i:i+2] for i in range(0, len(remaining_reversed), 2)]
    formatted_remaining = ','.join(groups)[::-1]
    return f"{formatted_remaining},{result}"


def get_api_key():
    """Get Google Maps API key from settings"""
    api_key = settings.GOOGLE_MAPS_API_KEY
    if not api_key:
        return None, JsonResponse({'error': 'Google Maps API key not configured'}, status=500)
    return api_key, None


def call_google_api(url, params):
    """Make request to Google API and return response"""
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        return response.json(), None
    except requests.exceptions.RequestException as e:
        return None, JsonResponse({'error': 'Failed to fetch from Google API', 'details': str(e)}, status=500)
    except Exception as e:
        return None, JsonResponse({'error': 'Internal server error', 'details': str(e)}, status=500)


@require_http_methods(["GET"])
def fetch_nearby_places(request):
    """Proxy endpoint to fetch nearby places from Google Places API"""
    lat = request.GET.get('lat')
    lng = request.GET.get('lng')
    place_type = request.GET.get('type')
    
    if not lat or not lng or not place_type:
        return JsonResponse({'error': 'Missing required parameters: lat, lng, type'}, status=400)
    
    api_key, error_response = get_api_key()
    if error_response:
        return error_response
    
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params = {
        'location': f"{lat},{lng}",
        'type': place_type,
        'radius': 1000,
        'key': api_key
    }
    
    data, error_response = call_google_api(url, params)
    if error_response:
        return error_response
    
    return JsonResponse(data)


@require_http_methods(["GET"])
def search_places_by_text(request):
    """Proxy endpoint to search places using Google Places API Text Search"""
    lat = request.GET.get('lat')
    lng = request.GET.get('lng')
    query = request.GET.get('query')
    
    if not lat or not lng or not query:
        return JsonResponse({'error': 'Missing required parameters: lat, lng, query'}, status=400)
    
    api_key, error_response = get_api_key()
    if error_response:
        return error_response
    
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {
        'query': query,
        'location': f"{lat},{lng}",
        'radius': 1000,
        'key': api_key
    }
    
    data, error_response = call_google_api(url, params)
    if error_response:
        return error_response
    
    return JsonResponse(data)


@require_http_methods(["GET"])
def calculate_distance(request):
    """Proxy endpoint to calculate distances using Google Distance Matrix API"""
    origin_lat = request.GET.get('origin_lat')
    origin_lng = request.GET.get('origin_lng')
    dest_lat = request.GET.get('dest_lat')
    dest_lng = request.GET.get('dest_lng')
    mode = request.GET.get('mode', 'walking')
    
    if not all([origin_lat, origin_lng, dest_lat, dest_lng]):
        return JsonResponse({'error': 'Missing required parameters'}, status=400)
    
    api_key, error_response = get_api_key()
    if error_response:
        return error_response
    
    url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    params = {
        'origins': f"{origin_lat},{origin_lng}",
        'destinations': f"{dest_lat},{dest_lng}",
        'mode': mode,
        'units': 'metric',
        'key': api_key
    }
    
    data, error_response = call_google_api(url, params)
    if error_response:
        return error_response
    
    if data.get('status') == 'REQUEST_DENIED':
        error_msg = data.get('error_message', 'Distance Matrix API request denied')
        if 'legacy API' in error_msg.lower():
            return JsonResponse({
                'status': 'REQUEST_DENIED',
                'error': 'Distance Matrix API (New) is not enabled. Please enable it in Google Cloud Console.',
                'error_message': error_msg
            }, status=403)
    
    return JsonResponse(data)


@require_http_methods(["GET"])
def calculate_batch_distances(request):
    """Proxy endpoint to calculate distances for multiple destinations in a single API call"""
    origin_lat = request.GET.get('origin_lat')
    origin_lng = request.GET.get('origin_lng')
    destinations = request.GET.get('destinations')
    mode = request.GET.get('mode', 'walking')
    
    if not all([origin_lat, origin_lng, destinations]):
        return JsonResponse({'error': 'Missing required parameters'}, status=400)
    
    api_key, error_response = get_api_key()
    if error_response:
        return error_response
    
    url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    params = {
        'origins': f"{origin_lat},{origin_lng}",
        'destinations': destinations,
        'mode': mode,
        'units': 'metric',
        'key': api_key
    }
    
    data, error_response = call_google_api(url, params)
    if error_response:
        return error_response
    
    if data.get('status') == 'REQUEST_DENIED':
        error_msg = data.get('error_message', 'Distance Matrix API request denied')
        if 'legacy API' in error_msg.lower():
            return JsonResponse({
                'status': 'REQUEST_DENIED',
                'error': 'Distance Matrix API (New) is not enabled. Please enable it in Google Cloud Console.',
                'error_message': error_msg
            }, status=403)
    
    return JsonResponse(data)

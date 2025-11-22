from django.shortcuts import render
from .utils import predict_house_price, get_property_types
import logging

logger = logging.getLogger(__name__)


def predict_price(request):
    """
    Main view for house price prediction.
    Handles both GET (display form) and POST (process prediction) requests.
    """
    property_types = get_property_types()
    prediction = None
    error_message = None
    
    if request.method == 'POST':
        try:
            # Extract form data
            bedrooms = int(request.POST.get('bedrooms', 0))
            bathrooms = float(request.POST.get('bathrooms', 0))
            living_area = int(request.POST.get('living_area', 0))
            lot_area = int(request.POST.get('lot_area', 0))
            floor = int(request.POST.get('floor', 0))
            property_type = request.POST.get('property_type', '')
            latitude = float(request.POST.get('latitude', 0))
            longitude = float(request.POST.get('longitude', 0))
            
            # Validate inputs
            if bedrooms <= 0:
                raise ValueError("Number of bedrooms must be greater than 0")
            if bathrooms <= 0:
                raise ValueError("Number of bathrooms must be greater than 0")
            if living_area <= 0:
                raise ValueError("Living area must be greater than 0")
            if lot_area <= 0:
                raise ValueError("Lot area must be greater than 0")
            if not property_type:
                raise ValueError("Property type is required")
            if not (-90 <= latitude <= 90):
                raise ValueError("Latitude must be between -90 and 90")
            if not (-180 <= longitude <= 180):
                raise ValueError("Longitude must be between -180 and 180")
            
            # Prepare input dictionary
            input_data = {
                'number of bedrooms': bedrooms,
                'number of bathrooms': bathrooms,
                'living area': living_area,
                'lot area': lot_area,
                'floor': floor,
                'property_type': property_type,
                'Lattitude': latitude,
                'Longitude': longitude,
            }
            
            # Make prediction
            predicted_price = predict_house_price(input_data)
            prediction = {
                'price': predicted_price,
                'formatted_price': format_price(predicted_price)
            }
            
        except ValueError as e:
            error_message = str(e)
            logger.error(f"Validation error: {error_message}")
        except KeyError as e:
            error_message = f"Missing required field: {str(e)}"
            logger.error(f"Key error: {error_message}")
        except Exception as e:
            error_message = f"Error making prediction: {str(e)}"
            logger.error(f"Prediction error: {error_message}")
    
    context = {
        'property_types': property_types,
        'prediction': prediction,
        'error_message': error_message,
    }
    
    return render(request, 'price_prediction/predict.html', context)


def format_price(price):
    """Format price with Indian number system (lakhs and crores)"""
    # Convert to string with 2 decimal places
    price_str = f"{price:.2f}"
    
    # Split into integer and decimal parts
    if '.' in price_str:
        integer_part, decimal_part = price_str.split('.')
    else:
        integer_part = price_str
        decimal_part = "00"
    
    # Format integer part according to Indian numbering system
    # Indian system: XX,XX,XXX (lakhs separator after every 2 digits from right, except first 3)
    integer_part = int(integer_part)
    formatted_integer = format_indian_number(integer_part)
    
    return f"₹{formatted_integer}.{decimal_part}"


def format_indian_number(num):
    """Format number according to Indian numbering system (lakhs/crores)"""
    num_str = str(num)
    n = len(num_str)
    
    if n <= 3:
        return num_str
    
    # First 3 digits from right don't need separator
    result = num_str[-3:]
    
    # Remaining digits: add comma after every 2 digits
    remaining = num_str[:-3]
    remaining_reversed = remaining[::-1]  # Reverse for easier processing
    
    # Group by 2 digits
    groups = []
    for i in range(0, len(remaining_reversed), 2):
        groups.append(remaining_reversed[i:i+2])
    
    # Reverse back and join
    formatted_remaining = ','.join(groups)[::-1]
    
    return f"{formatted_remaining},{result}"

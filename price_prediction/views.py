"""
Django views for house price prediction
"""

from django.shortcuts import render
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .utils import predict_house_price, get_property_types
import requests
from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED
import time
import threading

# Short in-memory amenity cache (rounded lat/lng → response payload).
_AMENITY_CACHE = {}
_AMENITY_CACHE_LOCK = threading.Lock()
_AMENITY_CACHE_TTL_SEC = 600  # 10 minutes
_OVERPASS_BUDGET_SEC = 4.0
_OVERPASS_ENDPOINTS = (
    "https://overpass.kumi.systems/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.osm.ch/api/interpreter",
)


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
def reverse_geocode(request):
    """
    Free reverse-geocoding using OpenStreetMap Nominatim.

    Returns:
      { "display_name": "..." }
    """
    lat = request.GET.get("lat", "").strip()
    lon = request.GET.get("lon", "").strip()

    try:
        lat_f = float(lat)
        lon_f = float(lon)
    except (TypeError, ValueError):
        return JsonResponse({"error": "Invalid lat/lon"}, status=400)

    headers = {
        # Nominatim asks for a real User-Agent. Browsers cannot set this reliably,
        # so we proxy through the backend.
        "User-Agent": "PropertyLocationPicker/1.0 (mdaliraza92@gmail.com)",
        "Accept": "application/json",
    }

    try:
        resp = requests.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={"lat": lat_f, "lon": lon_f, "format": "jsonv2"},
            headers=headers,
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        return JsonResponse({"error": "Reverse geocoding failed", "details": str(e)}, status=502)

    display_name = (data or {}).get("display_name")
    if not display_name:
        return JsonResponse({"error": "No address found"}, status=404)

    return JsonResponse({"display_name": display_name})


@require_http_methods(["GET"])
def location_search(request):
    """
    Free forward search using OpenStreetMap Nominatim.

    Returns:
      { "results": [ { "display_name": "...", "lat": "...", "lon": "..." }, ... ] }
    """
    q = request.GET.get("q", "").strip()
    if not q:
        return JsonResponse({"results": []})

    headers = {
        "User-Agent": "PropertyLocationPicker/1.0 (mdaliraza92@gmail.com)",
        "Accept": "application/json",
    }

    try:
        resp = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": q, "format": "jsonv2", "limit": 5},
            headers=headers,
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        return JsonResponse({"error": "Search failed", "details": str(e)}, status=502)

    results = []
    for item in data[:5]:
        display_name = item.get("display_name")
        lat = item.get("lat")
        lon = item.get("lon")
        if display_name and lat is not None and lon is not None:
            results.append({"display_name": display_name, "lat": lat, "lon": lon})

    return JsonResponse({"results": results})


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


@require_http_methods(["GET"])
def calculate_batch_distances_both_modes(request):
    """Optimized endpoint to calculate both walking and driving distances in parallel"""
    origin_lat = request.GET.get('origin_lat')
    origin_lng = request.GET.get('origin_lng')
    destinations = request.GET.get('destinations')
    
    if not all([origin_lat, origin_lng, destinations]):
        return JsonResponse({'error': 'Missing required parameters'}, status=400)
    
    api_key, error_response = get_api_key()
    if error_response:
        return error_response
    
    def fetch_distance(mode):
        """Fetch distance for a specific mode"""
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
            return {'mode': mode, 'status': 'ERROR', 'data': None}
        return {'mode': mode, 'status': 'OK', 'data': data}
    
    # Fetch both modes in parallel using ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=2) as executor:
        walk_future = executor.submit(fetch_distance, 'walking')
        drive_future = executor.submit(fetch_distance, 'driving')
        
        walk_result = walk_future.result()
        drive_result = drive_future.result()
    
    # Check for REQUEST_DENIED errors
    if walk_result.get('data') and walk_result['data'].get('status') == 'REQUEST_DENIED':
        error_msg = walk_result['data'].get('error_message', 'Distance Matrix API request denied')
        if 'legacy API' in error_msg.lower():
            return JsonResponse({
                'status': 'REQUEST_DENIED',
                'error': 'Distance Matrix API (New) is not enabled. Please enable it in Google Cloud Console.',
                'error_message': error_msg
            }, status=403)
    
    if drive_result.get('data') and drive_result['data'].get('status') == 'REQUEST_DENIED':
        error_msg = drive_result['data'].get('error_message', 'Distance Matrix API request denied')
        if 'legacy API' in error_msg.lower():
            return JsonResponse({
                'status': 'REQUEST_DENIED',
                'error': 'Distance Matrix API (New) is not enabled. Please enable it in Google Cloud Console.',
                'error_message': error_msg
            }, status=403)
    
    return JsonResponse({
        'status': 'OK',
        'walking': walk_result.get('data', {}),
        'driving': drive_result.get('data', {})
    })


def _haversine_km(lat1, lon1, lat2, lon2):
    """Great-circle distance in kilometers."""
    from math import radians, sin, cos, asin, sqrt
    rlat1, rlon1, rlat2, rlon2 = map(radians, (lat1, lon1, lat2, lon2))
    dlat = rlat2 - rlat1
    dlon = rlon2 - rlon1
    a = sin(dlat / 2) ** 2 + cos(rlat1) * cos(rlat2) * sin(dlon / 2) ** 2
    return 2 * 6371 * asin(sqrt(a))


def _amenity_cache_key(lat_f, lng_f):
    return (round(lat_f, 3), round(lng_f, 3))


def _amenity_cache_get(key):
    now = time.time()
    with _AMENITY_CACHE_LOCK:
        entry = _AMENITY_CACHE.get(key)
        if not entry:
            return None
        payload, expires_at = entry
        if expires_at < now:
            _AMENITY_CACHE.pop(key, None)
            return None
        return payload


def _amenity_cache_set(key, payload):
    # Only cache useful responses so empty/error blips don't stick.
    results = (payload or {}).get("results") or {}
    has_any = any((bucket.get("results") or []) for bucket in results.values())
    if not has_any:
        return
    with _AMENITY_CACHE_LOCK:
        _AMENITY_CACHE[key] = (payload, time.time() + _AMENITY_CACHE_TTL_SEC)
        if len(_AMENITY_CACHE) > 200:
            oldest = sorted(_AMENITY_CACHE.items(), key=lambda kv: kv[1][1])[:50]
            for old_key, _ in oldest:
                _AMENITY_CACHE.pop(old_key, None)


_EMPTY_AMENITY_RESULTS = {
    "train_station": {"status": "ZERO_RESULTS", "results": []},
    "subway_station": {"status": "ZERO_RESULTS", "results": []},
    "hospital": {"status": "ZERO_RESULTS", "results": []},
    "school": {"status": "ZERO_RESULTS", "results": []},
    "bank": {"status": "ZERO_RESULTS", "results": []},
    "university": {"status": "ZERO_RESULTS", "results": []},
}

_FALLBACK_NAMES = {
    "train_station": "Railway Station",
    "subway_station": "Metro Station",
    "hospital": "Hospital",
    "school": "School",
    "bank": "Bank",
    "university": "College",
}

# Photon (Komoot) — free, fast location-biased OSM search fallback.
_PHOTON_QUERIES = (
    ("hospital", "hospital", "amenity:hospital"),
    ("hospital", "clinic", "amenity:clinic"),
    ("school", "school", "amenity:school"),
    ("bank", "bank", "amenity:bank"),
    ("university", "university", "amenity:university"),
    ("university", "college", "amenity:college"),
    ("subway_station", "metro", None),
    ("subway_station", "subway", None),
    ("train_station", "railway station", "railway:station"),
    ("train_station", "train station", "railway:station"),
)


def _bbox_for(lat_f, lng_f, radius_m=1600):
    import math
    dlat = radius_m / 111_000.0
    dlng = radius_m / (111_000.0 * max(0.2, abs(math.cos(math.radians(lat_f)))))
    return f"{lng_f - dlng:.5f},{lat_f - dlat:.5f},{lng_f + dlng:.5f},{lat_f + dlat:.5f}"


def _fetch_overpass(endpoint, query, headers, timeout_sec):
    resp = requests.post(
        endpoint,
        data={"data": query},
        headers=headers,
        timeout=(1.2, max(1.0, timeout_sec)),
    )
    resp.raise_for_status()
    payload = resp.json()
    if not isinstance(payload, dict) or "elements" not in payload:
        raise ValueError("Unexpected Overpass response shape")
    remark = str(payload.get("remark") or "")
    if remark and "error" in remark.lower():
        raise ValueError(remark)
    return payload


def _race_overpass(query, headers, budget_sec=_OVERPASS_BUDGET_SEC):
    """Parallel mirror race; prefer first non-empty elements payload."""
    last_error = None
    empty_payload = None
    pool = ThreadPoolExecutor(max_workers=len(_OVERPASS_ENDPOINTS))
    futures = [
        pool.submit(_fetch_overpass, url, query, headers, budget_sec)
        for url in _OVERPASS_ENDPOINTS
    ]
    pending = set(futures)
    try:
        deadline = time.monotonic() + budget_sec
        while pending:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                break
            done, pending = wait(pending, timeout=remaining, return_when=FIRST_COMPLETED)
            if not done:
                break
            for fut in done:
                try:
                    payload = fut.result()
                    if payload.get("elements"):
                        return payload, None
                    empty_payload = payload
                except Exception as exc:
                    last_error = str(exc)
        if empty_payload is not None:
            return empty_payload, None
        return None, last_error or "Overpass timed out"
    finally:
        for fut in futures:
            fut.cancel()
        pool.shutdown(wait=False, cancel_futures=True)


def _photon_fetch(lat_f, lng_f, bucket_key, query, osm_tag, headers, bbox):
    params = {"q": query, "limit": 8, "bbox": bbox}
    if osm_tag:
        params["osm_tag"] = osm_tag
    resp = requests.get(
        "https://photon.komoot.io/api/",
        params=params,
        headers=headers,
        timeout=(1.0, 2.5),
    )
    resp.raise_for_status()
    data = resp.json()
    places = []
    for feature in (data.get("features") or []):
        props = feature.get("properties") or {}
        geom = feature.get("geometry") or {}
        coords = geom.get("coordinates") or []
        if len(coords) < 2:
            continue
        lon, lat = float(coords[0]), float(coords[1])
        if _haversine_km(lat_f, lng_f, lat, lon) > 1.8:
            continue
        name = props.get("name") or props.get("street") or _FALLBACK_NAMES.get(bucket_key, "Place")
        lname = name.lower()
        if bucket_key == "subway_station" and not any(
            k in lname for k in ("metro", "subway", "tube", "station")
        ):
            continue
        if bucket_key == "train_station" and any(k in lname for k in ("metro", "subway")):
            continue
        places.append({
            "name": name,
            "geometry": {"location": {"lat": lat, "lng": lon}},
            "rating": 0,
            "user_ratings_total": 0,
        })
    return bucket_key, places


def _fetch_photon_amenities(lat_f, lng_f, headers):
    """Parallel Photon lookups with bbox — typically 1–2s."""
    buckets = {key: [] for key in _EMPTY_AMENITY_RESULTS}
    bbox = _bbox_for(lat_f, lng_f)
    pool = ThreadPoolExecutor(max_workers=len(_PHOTON_QUERIES))
    futures = [
        pool.submit(_photon_fetch, lat_f, lng_f, bucket, query, osm_tag, headers, bbox)
        for bucket, query, osm_tag in _PHOTON_QUERIES
    ]
    try:
        done, _pending = wait(futures, timeout=3.0)
        for fut in done:
            try:
                bucket_key, places = fut.result()
                buckets[bucket_key].extend(places)
            except Exception:
                continue
    finally:
        for fut in futures:
            fut.cancel()
        pool.shutdown(wait=False, cancel_futures=True)
    return buckets


def _merge_buckets(*bucket_maps):
    merged = {key: [] for key in _EMPTY_AMENITY_RESULTS}
    for buckets in bucket_maps:
        for key, places in (buckets or {}).items():
            if key in merged:
                merged[key].extend(places or [])
    return merged


def _classify_osm_tags(tags):
    amenity = tags.get("amenity")
    railway = tags.get("railway")
    station = (tags.get("station") or "").lower()
    subway_flag = tags.get("subway") == "yes"
    public_transport = tags.get("public_transport")

    if amenity in ("hospital", "clinic"):
        return "hospital"
    if amenity == "school":
        return "school"
    if amenity == "bank":
        return "bank"
    if amenity in ("university", "college"):
        return "university"

    is_metro = (
        railway == "subway_entrance"
        or station in ("subway", "metro")
        or subway_flag
        or (public_transport == "station" and (station in ("subway", "metro") or subway_flag))
    )
    if is_metro:
        return "subway_station"
    if railway in ("station", "halt"):
        return "train_station"
    if public_transport == "station" and railway != "tram_stop":
        return "train_station"
    return None


def _el_to_place(el, bucket_key):
    tags = el.get("tags", {}) or {}
    name = (
        tags.get("name")
        or tags.get("name:en")
        or tags.get("ref")
        or tags.get("brand")
        or tags.get("operator")
        or _FALLBACK_NAMES.get(bucket_key, "Place")
    )
    el_lat = el.get("lat")
    el_lon = el.get("lon")
    if el_lat is None or el_lon is None:
        center = el.get("center") or {}
        el_lat = center.get("lat")
        el_lon = center.get("lon")
    if el_lat is None or el_lon is None:
        return None
    return {
        "name": name,
        "geometry": {"location": {"lat": float(el_lat), "lng": float(el_lon)}},
        "rating": 0,
        "user_ratings_total": 0,
    }


def _finalize_buckets(lat_f, lng_f, buckets):
    results = {}
    for key in _EMPTY_AMENITY_RESULTS:
        places = buckets.get(key) or []
        seen = set()
        unique = []
        for p in places:
            loc = p.get("geometry", {}).get("location", {}) or {}
            latv = loc.get("lat")
            lonv = loc.get("lng")
            name = p.get("name")
            dedup_key = (name, round(float(latv or 0), 5), round(float(lonv or 0), 5))
            if dedup_key in seen:
                continue
            seen.add(dedup_key)
            unique.append(p)
        unique.sort(
            key=lambda p: _haversine_km(
                lat_f,
                lng_f,
                float(p["geometry"]["location"]["lat"]),
                float(p["geometry"]["location"]["lng"]),
            )
        )
        unique = unique[:15]
        results[key] = {
            "status": "OK" if unique else "ZERO_RESULTS",
            "results": unique,
        }
    return results


@require_http_methods(["GET"])
def fetch_all_amenities(request):
    """
    Nearby amenities (free): Overpass race first, Photon parallel fallback.
    Hard ~5s budget, short cache, response shape for amenities.js.
    """
    lat = request.GET.get('lat')
    lng = request.GET.get('lng')

    if not lat or not lng:
        return JsonResponse({'error': 'Missing required parameters: lat, lng'}, status=400)

    try:
        lat_f = float(lat)
        lng_f = float(lng)
    except (TypeError, ValueError):
        return JsonResponse({'error': 'Invalid lat/lng'}, status=400)

    cache_key = _amenity_cache_key(lat_f, lng_f)
    cached = _amenity_cache_get(cache_key)
    if cached is not None:
        return JsonResponse(cached)

    headers = {
        "User-Agent": "PropertyLocationPicker/1.0 (mdaliraza92@gmail.com)",
        "Accept": "application/json",
    }

    radius_m = 1500
    query = f"""
    [out:json][timeout:4];
    (
      nwr["railway"="station"](around:{radius_m},{lat_f},{lng_f});
      nwr["railway"="halt"](around:{radius_m},{lat_f},{lng_f});
      node["railway"="subway_entrance"](around:{radius_m},{lat_f},{lng_f});
      nwr["public_transport"="station"]["subway"="yes"](around:{radius_m},{lat_f},{lng_f});
      nwr["public_transport"="station"]["station"="subway"](around:{radius_m},{lat_f},{lng_f});
      nwr["public_transport"="station"]["station"="metro"](around:{radius_m},{lat_f},{lng_f});
      nwr["amenity"="hospital"](around:{radius_m},{lat_f},{lng_f});
      nwr["amenity"="clinic"](around:{radius_m},{lat_f},{lng_f});
      nwr["amenity"="school"](around:{radius_m},{lat_f},{lng_f});
      nwr["amenity"="bank"](around:{radius_m},{lat_f},{lng_f});
      nwr["amenity"="university"](around:{radius_m},{lat_f},{lng_f});
      nwr["amenity"="college"](around:{radius_m},{lat_f},{lng_f});
    );
    out center tags;
    """

    # Race Photon (fast) and Overpass (richer) in parallel; merge whatever arrives in budget.
    overpass_buckets = {key: [] for key in _EMPTY_AMENITY_RESULTS}
    photon_buckets = {key: [] for key in _EMPTY_AMENITY_RESULTS}
    last_error = None

    pool = ThreadPoolExecutor(max_workers=2)

    def run_overpass():
        data, err = _race_overpass(query, headers, budget_sec=3.5)
        local = {key: [] for key in _EMPTY_AMENITY_RESULTS}
        if data and data.get("elements"):
            for el in data["elements"]:
                tags = el.get("tags", {}) or {}
                key = _classify_osm_tags(tags)
                if not key:
                    continue
                place = _el_to_place(el, key)
                if place:
                    local[key].append(place)
        return local, err

    fut_overpass = pool.submit(run_overpass)
    fut_photon = pool.submit(_fetch_photon_amenities, lat_f, lng_f, headers)
    try:
        done, _pending = wait([fut_overpass, fut_photon], timeout=4.5)
        if fut_photon in done:
            try:
                photon_buckets = fut_photon.result()
            except Exception as exc:
                last_error = str(exc)
        if fut_overpass in done:
            try:
                overpass_buckets, err = fut_overpass.result()
                if err:
                    last_error = err
            except Exception as exc:
                last_error = str(exc)
    finally:
        fut_overpass.cancel()
        fut_photon.cancel()
        pool.shutdown(wait=False, cancel_futures=True)

    buckets = _merge_buckets(photon_buckets, overpass_buckets)

    if not any(buckets.values()):
        return JsonResponse({
            "status": "ERROR",
            "error": last_error or "Amenities providers unavailable",
            "results": {k: dict(v) for k, v in _EMPTY_AMENITY_RESULTS.items()},
        }, status=502)

    results = _finalize_buckets(lat_f, lng_f, buckets)
    payload = {"status": "OK", "results": results}
    _amenity_cache_set(cache_key, payload)
    return JsonResponse(payload)

// Google Maps integration for property location selection

window.mapInitialized = false;
window.map = null;
window.marker = null;

window.initMapPicker = function() {
    if (window.mapInitialized) return;
    
    if (typeof google === 'undefined' || typeof google.maps === 'undefined' || typeof google.maps.Map === 'undefined') {
        setTimeout(window.initMapPicker, 100);
        return;
    }
    
    window.mapInitialized = true;
    
    const mapContainer = document.getElementById('mapContainer');
    const mapLoading = document.getElementById('mapLoading');
    
    if (!mapContainer) return;
    
    try {
        window.map = new google.maps.Map(mapContainer, {
            zoom: 13,
            center: { lat: 22.5726, lng: 88.3639 },
            mapTypeId: 'roadmap',
            zoomControl: true,
            scaleControl: true,
            fullscreenControl: true
        });
        
        google.maps.event.addListenerOnce(window.map, 'tilesloaded', function() {
            if (mapLoading) mapLoading.style.display = 'none';
            setTimeout(() => google.maps.event.trigger(window.map, 'resize'), 100);
        });
        
        google.maps.event.addListenerOnce(window.map, 'idle', function() {
            if (mapLoading) mapLoading.style.display = 'none';
        });
        
        window.map.addListener('click', (event) => {
            placeMarker(event.latLng);
            const statusDiv = document.getElementById('locationStatus');
            getAddressFromCoords(event.latLng, statusDiv);
        });
        setupButtons();
        setupLocationSearch();
        
    } catch (error) {
        if (mapLoading) {
            mapLoading.innerHTML = '<p style="color: var(--error-color);">Error loading map. Please refresh.</p>';
        }
    }
};

function setupButtons() {
    const locateBtn = document.getElementById('locateMeBtn');
    const clearBtn = document.getElementById('clearLocationBtn');
    
    if (locateBtn) {
        locateBtn.disabled = false;
        locateBtn.addEventListener('click', handleLocateMe);
    }
    if (clearBtn) {
        clearBtn.addEventListener('click', clearLocation);
    }
}

function setupLocationSearch() {
    const searchInput = document.getElementById('locationSearch');
    if (!searchInput) return;
    
    setTimeout(() => {
        if (typeof google === 'undefined' || typeof google.maps === 'undefined' || typeof google.maps.places === 'undefined') {
            searchInput.placeholder = 'Places API not loaded. Please enable Places API in Google Cloud Console.';
            searchInput.disabled = true;
            return;
        }
        
        try {
            const autocomplete = new google.maps.places.Autocomplete(searchInput, {
                types: ['geocode'],
                componentRestrictions: { country: 'in' }
            });
            
            autocomplete.addListener('place_changed', function() {
                const place = autocomplete.getPlace();
                if (place.geometry) {
                    const location = place.geometry.location;
                    window.map.setCenter(location);
                    window.map.setZoom(15);
                    placeMarker(location);
                    searchInput.value = place.formatted_address || place.name;
                    // Hide status when address is filled from autocomplete
                    const statusDiv = document.getElementById('locationStatus');
                    updateStatus(statusDiv, '', '', true);
                }
            });
        } catch (error) {
            searchInput.placeholder = 'Autocomplete failed.';
            searchInput.disabled = true;
        }
    }, 200);
}

function clearMapErrors() {
    const mapContainer = document.getElementById('mapContainer');
    if (mapContainer) mapContainer.classList.remove('error');
    if (typeof removeMapErrorMessage === 'function') removeMapErrorMessage();
}

function updateStatus(statusDiv, text, className, hideIfEmpty = false) {
    if (statusDiv) {
        if (hideIfEmpty && !text) {
            statusDiv.style.display = 'none';
            statusDiv.textContent = '';
        } else {
            statusDiv.style.display = 'block';
            statusDiv.textContent = text;
            statusDiv.className = className;
        }
    }
}

function placeMarker(location) {
    const latInput = document.getElementById('latitude');
    const lonInput = document.getElementById('longitude');
    const statusDiv = document.getElementById('locationStatus');
    const clearBtn = document.getElementById('clearLocationBtn');
    
    if (!latInput || !lonInput) return;
    
    if (window.marker) window.marker.setMap(null);
    
    window.marker = new google.maps.Marker({
        position: location,
        map: window.map,
        draggable: true,
        animation: google.maps.Animation.DROP,
        title: 'Property Location'
    });
    
    const lat = location.lat();
    const lng = location.lng();
    latInput.value = lat.toFixed(6);
    lonInput.value = lng.toFixed(6);
    
    // Don't show status here - it will be hidden when address is filled, or shown if geocoding fails
    // updateStatus(statusDiv, `Location set: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, 'location-status location-status-success');
    
    if (clearBtn) clearBtn.style.display = 'inline-flex';
    
    const mapInstruction = document.getElementById('mapInstruction');
    if (mapInstruction) mapInstruction.textContent = 'Drag the pin to adjust location';
    
    clearMapErrors();
    window.map.setCenter(location);
    
    window.marker.addListener('dragend', (event) => {
        const newLocation = event.latLng;
        const newLat = newLocation.lat();
        const newLng = newLocation.lng();
        latInput.value = newLat.toFixed(6);
        lonInput.value = newLng.toFixed(6);
        // Don't show status here - it will be hidden when address is filled, or shown if geocoding fails
        clearMapErrors();
        getAddressFromCoords(newLocation, statusDiv);
    });
}

function clearLocation() {
    const latInput = document.getElementById('latitude');
    const lonInput = document.getElementById('longitude');
    const statusDiv = document.getElementById('locationStatus');
    const clearBtn = document.getElementById('clearLocationBtn');
    const mapInstruction = document.getElementById('mapInstruction');
    const searchInput = document.getElementById('locationSearch');
    
    if (window.marker) {
        window.marker.setMap(null);
        window.marker = null;
    }
    
    if (latInput) latInput.value = '';
    if (lonInput) lonInput.value = '';
    updateStatus(statusDiv, '', 'location-status', true);
    
    if (clearBtn) clearBtn.style.display = 'none';
    if (mapInstruction) mapInstruction.textContent = 'Click on the map or drag the pin to set your property location';
    if (searchInput) searchInput.value = '';
    
    clearMapErrors();
}

function handleLocateMe() {
    const locateBtn = document.getElementById('locateMeBtn');
    const statusDiv = document.getElementById('locationStatus');
    
    if (!window.map || !window.mapInitialized) {
        updateStatus(statusDiv, 'Map is still loading. Please wait...', 'location-status location-status-error');
        return;
    }
    
    if (!navigator.geolocation) {
        updateStatus(statusDiv, 'Geolocation is not supported by your browser', 'location-status location-status-error');
        return;
    }
    
    updateButtonState(locateBtn, true);
    updateStatus(statusDiv, 'Getting your location...', 'location-status location-status-loading');
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const location = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            if (window.map && typeof placeMarker === 'function') placeMarker(location);
            getAddressFromCoords(location, statusDiv);
            updateButtonState(locateBtn, false);
        },
        (error) => {
            showGeolocationError(error, statusDiv);
            updateButtonState(locateBtn, false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

function getAddressFromCoords(location, statusDiv) {
    const geocoder = new google.maps.Geocoder();
    const searchInput = document.getElementById('locationSearch');
    
    updateStatus(statusDiv, 'Getting address...', 'location-status location-status-loading');
    
    const timeout = setTimeout(() => {
        const coords = `${location.lat().toFixed(6)}, ${location.lng().toFixed(6)}`;
        if (searchInput) {
            searchInput.value = '';
            searchInput.placeholder = 'Address lookup timed out.';
        }
        updateStatus(statusDiv, `Location set (${coords}). Address lookup timed out.`, 'location-status location-status-success');
    }, 10000);
    
    try {
        geocoder.geocode({ location: location }, (results, status) => {
            clearTimeout(timeout);
            
            if (status === 'OK' && results && results.length > 0 && results[0]) {
                const address = results[0].formatted_address;
                if (searchInput) searchInput.value = address;
                // Hide status when address is successfully filled in text box
                updateStatus(statusDiv, '', '', true);
            } else {
                showGeocodingError(status, location, searchInput, statusDiv);
            }
        });
    } catch (error) {
        clearTimeout(timeout);
        const coords = `${location.lat().toFixed(6)}, ${location.lng().toFixed(6)}`;
        if (searchInput) {
            searchInput.value = '';
            searchInput.placeholder = 'Geocoding error.';
        }
        updateStatus(statusDiv, `Location set (${coords}). Geocoding error.`, 'location-status location-status-success');
    }
}

function showGeocodingError(status, location, searchInput, statusDiv) {
    const coords = `${location.lat().toFixed(6)}, ${location.lng().toFixed(6)}`;
    const errorMessages = {
        'ZERO_RESULTS': 'No address found for this location',
        'OVER_QUERY_LIMIT': 'Geocoding quota exceeded.',
        'REQUEST_DENIED': 'Geocoding request denied. Please enable Geocoding API.',
        'INVALID_REQUEST': 'Invalid geocoding request',
        'UNKNOWN_ERROR': 'Geocoding service error.'
    };
    const errorMsg = errorMessages[status] || 'Address lookup failed';
    
    if (searchInput) {
        searchInput.value = '';
        searchInput.placeholder = 'Address lookup failed.';
    }
    updateStatus(statusDiv, `Location set (${coords}). ${errorMsg}`, 'location-status location-status-success');
}

function showGeolocationError(error, statusDiv) {
    const errorMessages = {
        [error.PERMISSION_DENIED]: 'Location access denied. Please allow location access.',
        [error.POSITION_UNAVAILABLE]: 'Location information unavailable.',
        [error.TIMEOUT]: 'Location request timed out.'
    };
    const errorMessage = errorMessages[error.code] || 'Unable to get your location';
    updateStatus(statusDiv, errorMessage, 'location-status location-status-error');
}

function updateButtonState(button, isLoading) {
    if (!button) return;
    
    button.disabled = isLoading;
    const btnText = button.querySelector('.btn-locate-text');
    const btnSpinner = button.querySelector('.btn-locate-spinner');
    
    if (btnText) btnText.textContent = isLoading ? 'Locating...' : 'Locate Me';
    if (btnSpinner) btnSpinner.style.display = isLoading ? 'inline-block' : 'none';
}

window.gm_authFailure = function() {
    const searchInput = document.getElementById('locationSearch');
    if (searchInput) {
        searchInput.placeholder = 'API key issue. Check API key restrictions.';
        searchInput.disabled = true;
    }
    const statusDiv = document.getElementById('locationStatus');
    updateStatus(statusDiv, 'API authentication failed. Check API key and ensure Places API is enabled.', 'location-status location-status-error');
};

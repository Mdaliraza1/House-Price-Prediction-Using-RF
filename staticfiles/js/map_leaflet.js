// Free property location picker using Leaflet (OpenStreetMap tiles)
// Keeps the same UI/flow: click/drag marker -> lat/lng hidden fields + reverse geocode -> address in #locationSearch.

window.mapInitialized = false;
window.map = null;
window.marker = null;
window.__leafletDefaultIcon = null;

function updateStatus(statusDiv, text, className, hideIfEmpty = false) {
    if (!statusDiv) return;
    if (hideIfEmpty && !text) {
        statusDiv.style.display = 'none';
        statusDiv.textContent = '';
        return;
    }
    statusDiv.style.display = 'block';
    statusDiv.textContent = text;
    statusDiv.className = className || '';
}

function placeMarker(latlng) {
    const latInput = document.getElementById('latitude');
    const lonInput = document.getElementById('longitude');
    const statusDiv = document.getElementById('locationStatus');
    const clearBtn = document.getElementById('clearLocationBtn');

    if (!latInput || !lonInput || !window.map) return;

    if (!window.__leafletDefaultIcon) {
        // Explicit icon with local static URLs so Leaflet doesn't rely on its default assets.
        window.__leafletDefaultIcon = L.icon({
            iconUrl: '/static/images/leaflet/marker-icon.png',
            iconRetinaUrl: '/static/images/leaflet/marker-icon-2x.png',
            shadowUrl: '/static/images/leaflet/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
    }

    if (!window.marker) {
        window.marker = L.marker(latlng, { draggable: true, icon: window.__leafletDefaultIcon }).addTo(window.map);
        window.marker.on('dragend', () => {
            const newLatLng = window.marker.getLatLng();
            latInput.value = newLatLng.lat.toFixed(6);
            lonInput.value = newLatLng.lng.toFixed(6);
            updateStatus(statusDiv, 'Updating address...', 'location-status location-status-loading');
            getAddressFromCoords(newLatLng, statusDiv);
        });
    } else {
        window.marker.setLatLng(latlng);
    }

    latInput.value = latlng.lat.toFixed(6);
    lonInput.value = latlng.lng.toFixed(6);

    if (clearBtn) clearBtn.style.display = 'inline-flex';

    const mapInstruction = document.getElementById('mapInstruction');
    if (mapInstruction) mapInstruction.textContent = 'Drag the pin to adjust location';

    // Clear any map errors if present in your CSS/JS.
    if (typeof clearMapErrors === 'function') clearMapErrors();

    updateStatus(statusDiv, '', '', true);
    window.map.setView(latlng, 15);
}

function clearLocation() {
    const latInput = document.getElementById('latitude');
    const lonInput = document.getElementById('longitude');
    const statusDiv = document.getElementById('locationStatus');
    const clearBtn = document.getElementById('clearLocationBtn');
    const mapInstruction = document.getElementById('mapInstruction');
    const searchInput = document.getElementById('locationSearch');

    if (latInput) latInput.value = '';
    if (lonInput) lonInput.value = '';
    updateStatus(statusDiv, '', 'location-status', true);

    if (clearBtn) clearBtn.style.display = 'none';
    if (mapInstruction) mapInstruction.textContent = 'Click on the map to set your property location';
    if (searchInput) searchInput.value = '';

    if (typeof clearMapErrors === 'function') clearMapErrors();
}

function handleLocateMe() {
    const locateBtn = document.getElementById('locateMeBtn');
    const statusDiv = document.getElementById('locationStatus');

    if (!window.map) {
        updateStatus(statusDiv, 'Map is still loading. Please wait...', 'location-status location-status-error');
        return;
    }

    if (!navigator.geolocation) {
        updateStatus(statusDiv, 'Geolocation is not supported by your browser', 'location-status location-status-error');
        return;
    }

    // Reuse your existing button state helper if present; otherwise ignore.
    if (typeof updateButtonState === 'function') updateButtonState(locateBtn, true);

    updateStatus(statusDiv, 'Getting your location...', 'location-status location-status-loading');

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const latlng = { lat: position.coords.latitude, lng: position.coords.longitude };
            placeMarker(latlng);
            getAddressFromCoords(latlng, statusDiv);
            if (typeof updateButtonState === 'function') updateButtonState(locateBtn, false);
        },
        (error) => {
            console.error(error);
            const msg = 'Unable to get your location';
            updateStatus(statusDiv, msg, 'location-status location-status-error');
            if (typeof updateButtonState === 'function') updateButtonState(locateBtn, false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

function updateButtonState(button, isLoading) {
    if (!button) return;
    button.disabled = isLoading;
    const btnText = button.querySelector('.btn-locate-text');
    const btnSpinner = button.querySelector('.btn-locate-spinner');
    if (btnText) btnText.textContent = isLoading ? 'Locating...' : 'Locate Me';
    if (btnSpinner) btnSpinner.style.display = isLoading ? 'inline-block' : 'none';
}

function getAddressFromCoords(latlng, statusDiv) {
    const searchInput = document.getElementById('locationSearch');
    const latitude = latlng.lat;
    const longitude = latlng.lng;

    updateStatus(statusDiv, 'Getting address...', 'location-status location-status-loading');

    const timeout = setTimeout(() => {
        const coords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        if (searchInput) {
            searchInput.value = '';
            searchInput.placeholder = 'Address lookup timed out.';
        }
        updateStatus(
            statusDiv,
            `Location set (${coords}). Address lookup timed out.`,
            'location-status location-status-success',
            false
        );
    }, 10000);

    const url =
        `api/reverse-geocode/?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`;

    fetch(url)
        .then((response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then((data) => {
            clearTimeout(timeout);
            const address = data && data.display_name ? data.display_name : '';
            if (!address) throw new Error('No address found');

            if (searchInput) {
                searchInput.value = address;
                updateStatus(statusDiv, '', '', true);
            } else {
                updateStatus(statusDiv, '', '', true);
            }
        })
        .catch((error) => {
            clearTimeout(timeout);
            console.error('Reverse geocoding error:', error);

            const coords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            if (searchInput) {
                searchInput.value = '';
                searchInput.placeholder = 'Address lookup failed.';
            }

            updateStatus(
                statusDiv,
                `Location set (${coords}). Address lookup failed.`,
                'location-status location-status-success'
            );
        });
}

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

    const datalist = document.getElementById('locationSuggestions');
    if (!datalist) return;

    // Map from display_name -> {lat,lng} so we can apply selection on change.
    const lastSuggestions = new Map();
    let debounceTimer = null;

    function renderOptions(results) {
        // Reset suggestions
        datalist.innerHTML = '';
        lastSuggestions.clear();

        results.forEach((r) => {
            const option = document.createElement('option');
            option.value = r.display_name;
            datalist.appendChild(option);
            lastSuggestions.set(r.display_name, { lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
        });
    }

    searchInput.addEventListener('input', function () {
        const q = (searchInput.value || '').trim();
        if (q.length < 3) return;

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            fetch(`api/location-search/?q=${encodeURIComponent(q)}`)
                .then((resp) => resp.ok ? resp.json() : Promise.reject(new Error('Search failed')))
                .then((data) => {
                    const results = (data && data.results) ? data.results : [];
                    renderOptions(results.slice(0, 5));
                })
                .catch(() => {
                    // Don’t hard-fail typing; just clear suggestions.
                    datalist.innerHTML = '';
                    lastSuggestions.clear();
                });
        }, 400);
    });

    searchInput.addEventListener('change', function () {
        const val = searchInput.value;
        if (!lastSuggestions.has(val)) return;
        const { lat, lng } = lastSuggestions.get(val);
        const latlng = { lat, lng };
        placeMarker(latlng);

        // We already have an address string from Nominatim; no need to reverse-geocode again.
        updateStatus(document.getElementById('locationStatus'), '', '', true);
    });
}

window.initMapPicker = function () {
    if (window.mapInitialized) return;
    window.mapInitialized = true;

    const mapContainer = document.getElementById('mapContainer');
    const mapLoading = document.getElementById('mapLoading');
    if (!mapContainer) return;

    // Fix default icon paths (Leaflet expects relative assets)
    if (L && L.Icon && L.Icon.Default) {
        L.Icon.Default.mergeOptions({
            // Use local static assets (no external CDN dependency).
            iconRetinaUrl: '/static/images/leaflet/marker-icon-2x.png',
            iconUrl: '/static/images/leaflet/marker-icon.png',
            shadowUrl: '/static/images/leaflet/marker-shadow.png',
        });
    }

    // Create map
    window.map = L.map(mapContainer, { zoomControl: true, fullscreenControl: false }).setView([22.5726, 88.3639], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
    }).addTo(window.map);

    if (mapLoading) mapLoading.style.display = 'none';

    // Click to place marker
    window.map.on('click', function (e) {
        placeMarker({ lat: e.latlng.lat, lng: e.latlng.lng });
        const statusDiv = document.getElementById('locationStatus');
        getAddressFromCoords(e.latlng, statusDiv);
    });

    setupButtons();
    setupLocationSearch();
};

// Auto-init on load (works whether scripts load before/after DOMContentLoaded)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.initMapPicker());
} else {
    window.initMapPicker();
}


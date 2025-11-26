// Nearby amenities search and display

const AMENITY_TYPES = [
    { type: 'train_station', icon: '🚉', name: 'Railway Station' },
    { type: 'subway_station', icon: '🚇', name: 'Metro Station' },
    { type: 'hospital', icon: '🏥', name: 'Hospital' },
    { type: 'school', icon: '🏫', name: 'School' },
    { type: 'bank', icon: '🏦', name: 'Bank' },
    { type: 'university', icon: '🎓', name: 'College' }
];

const MAX_RESULTS = 5;
const TIMEOUT = 15000;

function initAmenitiesSearch(lat, lng) {
    const card = document.getElementById('amenitiesCard');
    if (!card) return;
    card.style.display = 'block';
    fetchAmenities(lat, lng);
}

function fetchAmenities(propertyLat, propertyLng) {
    let amenities = [];
    let searchesCompleted = 0;
    let displayed = false;
    let checkTimeout = null;
    
    function addAmenity(amenity) {
        const nameKey = amenity.name.toLowerCase().trim();
        const lat = amenity.location.lat;
        const lng = amenity.location.lng;
        
        const isDuplicate = amenities.some(existing => {
            const existingName = existing.name.toLowerCase().trim();
            const sameName = existingName === nameKey;
            const similarName = (existingName.includes(nameKey) || nameKey.includes(existingName)) && 
                              Math.abs(existingName.length - nameKey.length) < 10;
            const sameLocation = Math.abs(existing.location.lat - lat) < 0.0001 && 
                                Math.abs(existing.location.lng - lng) < 0.0001;
            return (sameName || (similarName && sameLocation)) && sameLocation;
        });
        
        if (!isDuplicate) {
            amenities.push(amenity);
        }
    }
    
    function createAmenity(place, amenityType) {
        return {
            name: place.name,
            icon: amenityType.icon,
            type: amenityType.name,
            walkingDistance: 'Calculating...',
            drivingDistance: 'Calculating...',
            location: { lat: place.geometry.location.lat, lng: place.geometry.location.lng }
        };
    }
    
    function setAllDistancesToNA() {
        amenities.forEach(amenity => {
            amenity.walkingDistance = 'N/A';
            amenity.drivingDistance = 'N/A';
        });
    }
    
    const timeout = setTimeout(() => {
        if (displayed) return;
        displayed = true;
        clearTimeout(timeout);
        if (checkTimeout) clearTimeout(checkTimeout);
        if (amenities.length > 0) {
            showAmenities(amenities.slice(0, MAX_RESULTS));
        } else if (searchesCompleted === AMENITY_TYPES.length) {
            showError('No nearby amenities found.');
        } else {
            showError('Unable to load amenities. Check API settings.');
        }
    }, TIMEOUT);
    
    function checkAllDone() {
        if (displayed) return;
        
        if (checkTimeout) clearTimeout(checkTimeout);
        
        checkTimeout = setTimeout(() => {
            if (displayed) return;
            
            const allSearchesDone = searchesCompleted === AMENITY_TYPES.length;
            
            if (allSearchesDone) {
                displayed = true;
                clearTimeout(timeout);
                if (checkTimeout) clearTimeout(checkTimeout);
                if (amenities.length > 0) {
                    showAmenities(amenities.slice(0, MAX_RESULTS));
                } else {
                    showError('No nearby amenities found.');
                }
            }
        }, 300);
    }
    
    async function fetchNearbyPlaces(type) {
        try {
            const response = await fetch(`/house-price-prediction/api/nearby-places/?lat=${propertyLat}&lng=${propertyLng}&type=${type}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data.status === 'OK' && data.results) {
                    return data;
                }
            }
        } catch (error) {
            // Error handled
        }
        return { status: 'ZERO_RESULTS', results: [] };
    }
    
    async function fetchTextSearch(query) {
        try {
            const response = await fetch(`/house-price-prediction/api/search-places/?lat=${propertyLat}&lng=${propertyLng}&query=${encodeURIComponent(query + ' near me')}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data.status === 'OK' && data.results && data.results.length > 0) {
                    return data;
                }
            }
        } catch (error) {
            // Error handled
        }
        return null;
    }
    
    function filterPlaces(places, amenityType) {
        if (places.length === 0) return [];
        
        let filtered = places;
        const name = (place) => (place.name || '').toLowerCase();
        
        if (amenityType.type === 'hospital') {
            const nonHospitalTerms = ['nursing home', 'pharmacy', 'clinic', 'medical store', 'medical hall', 
                                     'medical shop', 'diagnostic', 'lab', 'laboratory', 'imaging', 'pathology', 
                                     'medical center', 'health center'];
            filtered = places.filter(p => {
                const n = name(p);
                const isNonHospital = nonHospitalTerms.some(term => n.includes(term)) || 
                                     (n.includes('medical') && !n.includes('hospital'));
                return !isNonHospital && n.includes('hospital');
            });
            if (filtered.length === 0) {
                filtered = places.filter(p => {
                    const n = name(p);
                    return n.includes('hospital') && !n.includes('medical store') && !n.includes('medical hall');
                });
            }
        }
        
        if (amenityType.type === 'train_station') {
            filtered = places.filter(p => {
                const n = name(p);
                const isCabin = n.includes('cabin') && !n.includes('station') && !n.includes('railway');
                return !isCabin && (n.includes('station') || n.includes('railway') || n.includes('junction'));
            });
            if (filtered.length === 0) {
                filtered = places.filter(p => {
                    const n = name(p);
                    return n.includes('railway') || n.includes('junction');
                });
            }
        }
        
        if (amenityType.type === 'subway_station') {
            const nonStationTerms = ['watch', 'shop', 'store', 'restaurant', 'hotel', 'mall', 'market'];
            filtered = places.filter(p => {
                const n = name(p);
                const isCabin = n.includes('cabin') && !n.includes('station') && !n.includes('metro') && !n.includes('subway');
                const isPlatform = n.includes('platform') && !n.includes('station') && !n.includes('metro') && !n.includes('subway');
                const isGate = n.includes('gate') && !n.includes('station');
                const isNonStation = nonStationTerms.some(term => n.includes(term));
                return !isCabin && !isPlatform && !isGate && !isNonStation && 
                       (n.includes('station') || (n.includes('metro') && (n.includes('station') || n.includes('rail'))) ||
                        (n.includes('subway') && (n.includes('station') || n.includes('rail'))));
            });
            if (filtered.length === 0) {
                filtered = places.filter(p => {
                    const n = name(p);
                    const isNonStation = n.includes('watch') || n.includes('shop') || n.includes('store');
                    return (n.includes('metro') || n.includes('subway')) && !n.includes('gate') && 
                           !isNonStation && (n.includes('station') || n.includes('rail'));
                });
            }
        }
        
        if (amenityType.type === 'bank') {
            filtered = places.filter(p => !name(p).includes('csp'));
        }
        
        if (amenityType.type === 'school') {
            const nonEducationalTerms = ['driving school', 'motor training', 'coaching center', 'tuition center', 
                                        'tutorial center', 'open school', 'distance learning', 'correspondence',
                                        'pre-school', 'preschool', 'pre school', 'play school', 'playschool',
                                        'kindergarten', 'nursery', 'junior'];
            filtered = places.filter(p => {
                const n = name(p);
                const isNonEducational = nonEducationalTerms.some(term => n.includes(term)) ||
                                        (n.includes('training school') && !n.includes('high school'));
                return !isNonEducational && (n.includes('school') || n.includes('education'));
            });
        }
        
        if (amenityType.type === 'university') {
            filtered = places.filter(p => {
                const n = name(p);
                return !n.includes('driving school') && !n.includes('motor training') && 
                       !n.includes('training school') && !n.includes('coaching') &&
                       (n.includes('college') || n.includes('university') || n.includes('institute'));
            });
        }
        
        return filtered;
    }
    
    async function searchByType(amenityType) {
        try {
            let data = { status: 'ZERO_RESULTS', results: [] };
            
            const needsTextSearch = ['train_station', 'subway_station', 'hospital'].includes(amenityType.type);
            
            if (needsTextSearch) {
                const query = amenityType.type === 'train_station' ? 'railway station' :
                             amenityType.type === 'subway_station' ? 'metro station' : 'hospital';
                data = await fetchTextSearch(query) || await fetchNearbyPlaces(amenityType.type);
            } else {
                data = await fetchNearbyPlaces(amenityType.type);
            }
            
            if (data && data.status === 'OK' && data.results && data.results.length > 0) {
                const filtered = filterPlaces(data.results, amenityType);
                
                if (needsTextSearch) {
                    if (filtered.length > 0) {
                        const bestPlace = filtered[0];
                        addAmenity(createAmenity(bestPlace, amenityType));
                    } else {
                        const fallbackData = await fetchNearbyPlaces(amenityType.type);
                        if (fallbackData.results && fallbackData.results.length > 0) {
                            const fallbackFiltered = filterPlaces(fallbackData.results, amenityType);
                            if (fallbackFiltered.length > 0) {
                                addAmenity(createAmenity(fallbackFiltered[0], amenityType));
                            }
                        }
                    }
                } else {
                    const bestPlace = selectBestPlace(filtered, amenityType);
                    if (bestPlace) {
                        addAmenity(createAmenity(bestPlace, amenityType));
                    }
                }
            }
        } catch (error) {
            // Error handled
        } finally {
            searchesCompleted++;
        }
    }
    
    async function calculateAllDistances() {
        if (amenities.length === 0) {
            checkAllDone();
            return;
        }
        
        amenities = amenities.filter(amenity => {
            const distance = calculateDistance(propertyLat, propertyLng, amenity.location.lat, amenity.location.lng);
            return distance <= 2;
        });
        
        if (amenities.length === 0) {
            checkAllDone();
            return;
        }
        
        const destinations = amenities.map(a => `${a.location.lat},${a.location.lng}`).join('|');
        
        try {
            const [walkResponse, driveResponse] = await Promise.all([
                fetch(`/house-price-prediction/api/batch-distance/?origin_lat=${propertyLat}&origin_lng=${propertyLng}&destinations=${encodeURIComponent(destinations)}&mode=walking`),
                fetch(`/house-price-prediction/api/batch-distance/?origin_lat=${propertyLat}&origin_lng=${propertyLng}&destinations=${encodeURIComponent(destinations)}&mode=driving`)
            ]);
            
            if (walkResponse.ok && driveResponse.ok) {
                const walkData = await walkResponse.json();
                const driveData = await driveResponse.json();
                
                if (walkData.status === 'OK' && driveData.status === 'OK' && 
                    walkData.rows && walkData.rows[0] && driveData.rows && driveData.rows[0]) {
                    
                    const walkElements = walkData.rows[0].elements;
                    const driveElements = driveData.rows[0].elements;
                    
                    amenities.forEach((amenity, index) => {
                        if (index < walkElements.length && walkElements[index] && walkElements[index].status === 'OK') {
                            const walkText = walkElements[index].duration.text;
                            const walkMinutes = parseTime(walkText);
                            amenity.walkingDistance = walkMinutes <= 30 ? walkText : 'N/A';
                        } else {
                            amenity.walkingDistance = 'N/A';
                        }
                        
                        if (index < driveElements.length && driveElements[index] && driveElements[index].status === 'OK') {
                            const driveText = driveElements[index].duration.text;
                            const driveMinutes = parseTime(driveText);
                            amenity.drivingDistance = driveMinutes <= 20 ? driveText : 'N/A';
                        } else {
                            amenity.drivingDistance = 'N/A';
                        }
                    });
                    
                    amenities = amenities.filter(amenity => {
                        if (amenity.walkingDistance === 'Calculating...' || amenity.drivingDistance === 'Calculating...') {
                            return false;
                        }
                        const walkMinutes = parseTime(amenity.walkingDistance);
                        const driveMinutes = parseTime(amenity.drivingDistance);
                        return walkMinutes <= 30 || driveMinutes <= 20;
                    });
                } else {
                    setAllDistancesToNA();
                }
            } else {
                setAllDistancesToNA();
            }
        } catch (error) {
            setAllDistancesToNA();
        }
        
        checkAllDone();
    }
    
    function selectBestPlace(places, amenityType) {
        if (places.length === 0) return null;
        if (places.length === 1) return places[0];
        
        const filtered = filterPlaces(places, amenityType);
        if (filtered.length === 0) return null;
        
        if (['train_station', 'subway_station', 'bank', 'hospital'].includes(amenityType.type)) {
            return filtered[0];
        }
        
        const closestPlaces = filtered.slice(0, Math.min(15, filtered.length));
        
        if (amenityType.type === 'school' || amenityType.type === 'university') {
            const scored = closestPlaces.map(p => ({
                place: p,
                score: ((p.rating || 0) * 30) + Math.min((p.user_ratings_total || 0) / 3, 60),
                reviews: p.user_ratings_total || 0
            }));
            
            scored.sort((a, b) => {
                if (Math.abs(a.score - b.score) < 20) {
                    return b.reviews - a.reviews;
                }
                return b.score - a.score;
            });
            return scored[0].place;
        }
        
        return closestPlaces[0];
    }
    
    Promise.all(AMENITY_TYPES.map(searchByType)).then(() => {
        calculateAllDistances();
    }).catch(() => {
        calculateAllDistances();
    });
}

function parseDistanceResponse(data) {
    if (data.status === 'REQUEST_DENIED') {
        if (!window.distanceApiWarningShown) {
            window.distanceApiWarningShown = true;
        }
        return 'N/A';
    }
    if (data.status === 'OK' && data.rows?.[0]?.elements?.[0]?.status === 'OK') {
        return data.rows[0].elements[0].duration.text;
    }
    return 'N/A';
}

function getDistances(originLat, originLng, destLat, destLng, callback) {
    const baseUrl = `/house-price-prediction/api/distance/?origin_lat=${originLat}&origin_lng=${originLng}&dest_lat=${destLat}&dest_lng=${destLng}`;
    
    let callbackCalled = false;
    const safeCallback = (walk, drive) => {
        if (!callbackCalled) {
            callbackCalled = true;
            callback(walk, drive);
        }
    };
    
    const timeout = setTimeout(() => {
        safeCallback('N/A', 'N/A');
    }, 8000);
    
    Promise.all([
        fetch(`${baseUrl}&mode=walking`).then(r => r.ok ? r.json() : {status: 'ERROR'}),
        fetch(`${baseUrl}&mode=driving`).then(r => r.ok ? r.json() : {status: 'ERROR'})
    ])
    .then(([walkData, driveData]) => {
        clearTimeout(timeout);
        safeCallback(parseDistanceResponse(walkData), parseDistanceResponse(driveData));
    })
    .catch(() => {
        clearTimeout(timeout);
        safeCallback('N/A', 'N/A');
    });
}

function showAmenities(amenities) {
    const loading = document.getElementById('amenitiesLoading');
    const content = document.getElementById('amenitiesContent');
    const grid = document.getElementById('amenitiesGrid');
    
    if (!grid) return;
    
    if (loading) loading.style.display = 'none';
    
    if (amenities.length === 0) {
        grid.innerHTML = '<p class="no-amenities">No nearby amenities found.</p>';
        if (content) content.style.display = 'block';
        return;
    }
    
    amenities.sort((a, b) => {
        const walkA = parseTime(a.walkingDistance);
        const walkB = parseTime(b.walkingDistance);
        if (walkA !== walkB) return walkA - walkB;
        return parseTime(a.drivingDistance) - parseTime(b.drivingDistance);
    });
    grid.innerHTML = '';
    
    amenities.forEach(amenity => {
        const card = document.createElement('div');
        card.className = 'amenity-item';
        card.innerHTML = `
            <div class="amenity-icon">${amenity.icon}</div>
            <div class="amenity-details">
                <h4 class="amenity-name">${amenity.name}</h4>
                <p class="amenity-type">${amenity.type}</p>
                <div class="amenity-distances">
                    <span class="distance-item">
                        <span class="distance-icon">🚶</span>
                        <span class="distance-text">${amenity.walkingDistance} walking</span>
                    </span>
                    <span class="distance-item">
                        <span class="distance-icon">🚗</span>
                        <span class="distance-text">${amenity.drivingDistance} by car</span>
                    </span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
    
    if (content) content.style.display = 'block';
}

function showError(message) {
    const loading = document.getElementById('amenitiesLoading');
    const content = document.getElementById('amenitiesContent');
    const grid = document.getElementById('amenitiesGrid');
    
    if (loading) loading.style.display = 'none';
    if (content) {
        content.style.display = 'block';
        if (grid) grid.innerHTML = `<p class="no-amenities">${message}</p>`;
    }
}

function parseTime(timeStr) {
    if (timeStr === 'N/A' || timeStr === 'Calculating...') return 999999;
    
    const timeStrLower = timeStr.toLowerCase();
    let totalMinutes = 0;
    
    const dayMatch = timeStrLower.match(/(\d+)\s*d/);
    if (dayMatch) return 999999;
    
    const hourMatch = timeStrLower.match(/(\d+)\s*h/);
    if (hourMatch) {
        const hours = parseInt(hourMatch[1]);
        if (hours > 2) return 999999;
        totalMinutes += hours * 60;
    }
    
    const minMatch = timeStrLower.match(/(\d+)\s*min/);
    if (minMatch) totalMinutes += parseInt(minMatch[1]);
    
    return totalMinutes || 999999;
}

function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

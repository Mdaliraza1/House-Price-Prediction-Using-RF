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
const TIMEOUT = 8000;

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
            showError('Amenities are taking too long. Please try again.');
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

    function placeDistanceKm(place) {
        const loc = place.geometry && place.geometry.location;
        if (!loc) return Number.POSITIVE_INFINITY;
        return calculateDistance(propertyLat, propertyLng, loc.lat, loc.lng);
    }

    function sortByDistance(places) {
        return places.slice().sort((a, b) => placeDistanceKm(a) - placeDistanceKm(b));
    }

    function filterPlaces(places, amenityType) {
        // OSM results are already tagged by type on the backend.
        // Prefer name-based quality filters, but fall back to closest tagged places.
        if (places.length === 0) return [];

        const name = (place) => (place.name || '').toLowerCase();
        let preferred = places;

        if (amenityType.type === 'hospital') {
            const junk = ['pharmacy', 'medical store', 'medical hall', 'medical shop',
                'diagnostic', 'pathology', 'imaging', 'nursing home'];
            preferred = places.filter(p => {
                const n = name(p);
                return !junk.some(term => n.includes(term));
            });
            const withHospital = preferred.filter(p => name(p).includes('hospital'));
            if (withHospital.length > 0) preferred = withHospital;
        }

        if (amenityType.type === 'train_station') {
            preferred = places.filter(p => {
                const n = name(p);
                const isCabin = n.includes('cabin') && !n.includes('station') && !n.includes('railway');
                return !isCabin;
            });
        }

        if (amenityType.type === 'subway_station') {
            const junk = ['watch', 'shop', 'store', 'restaurant', 'hotel', 'mall', 'market'];
            preferred = places.filter(p => {
                const n = name(p);
                const isGate = n.includes('gate') && !n.includes('station') && !n.includes('metro');
                return !isGate && !junk.some(term => n.includes(term));
            });
        }

        if (amenityType.type === 'bank') {
            preferred = places.filter(p => !name(p).includes('csp'));
        }

        if (amenityType.type === 'school') {
            const junk = ['driving school', 'motor training', 'coaching center', 'tuition center',
                'tutorial center', 'distance learning', 'correspondence'];
            preferred = places.filter(p => !junk.some(term => name(p).includes(term)));
        }

        if (amenityType.type === 'university') {
            preferred = places.filter(p => {
                const n = name(p);
                return !n.includes('driving school') && !n.includes('motor training') &&
                    !n.includes('coaching');
            });
        }

        const pool = preferred.length > 0 ? preferred : places;
        return sortByDistance(pool);
    }

    async function calculateAllDistances() {
        if (amenities.length === 0) {
            checkAllDone();
            return;
        }

        // Match Overpass search radius (~1.5 km).
        amenities = amenities.filter(amenity => {
            const distanceKm = calculateDistance(propertyLat, propertyLng, amenity.location.lat, amenity.location.lng);
            return distanceKm <= 1.5;
        });

        if (amenities.length === 0) {
            checkAllDone();
            return;
        }

        // Fully free option: estimate walking/driving time from straight-line distance.
        amenities.forEach(amenity => {
            const distanceKm = calculateDistance(propertyLat, propertyLng, amenity.location.lat, amenity.location.lng);
            amenity.walkingDistance = estimateWalkingTime(distanceKm);
            amenity.drivingDistance = estimateDrivingTime(distanceKm);
        });

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

    // Single free Overpass-backed endpoint (all amenity types).
    async function fetchAllAmenitiesOptimized() {
        try {
            const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
            const abortTimer = controller ? setTimeout(() => controller.abort(), TIMEOUT) : null;
            const response = await fetch(
                `/house-price-prediction/api/all-amenities/?lat=${propertyLat}&lng=${propertyLng}`,
                controller ? { signal: controller.signal } : undefined
            );
            if (abortTimer) clearTimeout(abortTimer);

            const data = await response.json().catch(() => null);

            if (!response.ok || !data || data.status === 'ERROR') {
                showError('Nearby amenities are temporarily unavailable. Please try again.');
                searchesCompleted = AMENITY_TYPES.length;
                displayed = true;
                clearTimeout(timeout);
                return;
            }

            if (data.results) {
                AMENITY_TYPES.forEach(amenityType => {
                    const amenityData = data.results[amenityType.type];
                    if (amenityData && amenityData.results && amenityData.results.length > 0) {
                        const filtered = filterPlaces(amenityData.results, amenityType);
                        const bestPlace = selectBestPlace(filtered.length ? filtered : amenityData.results, amenityType);
                        if (bestPlace) {
                            addAmenity(createAmenity(bestPlace, amenityType));
                        }
                    }
                });
                searchesCompleted = AMENITY_TYPES.length;
                calculateAllDistances();
                return;
            }
        } catch (error) {
            console.error('Error fetching amenities:', error);
            if (!displayed) {
                showError('Nearby amenities are temporarily unavailable. Please try again.');
                displayed = true;
                clearTimeout(timeout);
            }
            searchesCompleted = AMENITY_TYPES.length;
            return;
        }

        searchesCompleted = AMENITY_TYPES.length;
        calculateAllDistances();
    }

    fetchAllAmenitiesOptimized();
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
        // Prioritize amenities with walking distance available
        const walkA = a.walkingDistance !== 'N/A' ? parseTime(a.walkingDistance) : 999999;
        const walkB = b.walkingDistance !== 'N/A' ? parseTime(b.walkingDistance) : 999999;
        if (walkA !== walkB) return walkA - walkB;
        
        // Then sort by driving distance
        const driveA = a.drivingDistance !== 'N/A' ? parseTime(a.drivingDistance) : 999999;
        const driveB = b.drivingDistance !== 'N/A' ? parseTime(b.drivingDistance) : 999999;
        return driveA - driveB;
    });
    grid.innerHTML = '';

    amenities.forEach(amenity => {
        const card = document.createElement('div');
        card.className = 'amenity-item';
        ////
        // Build distance items only for available distances
        const distanceItems = [];
        if (amenity.walkingDistance !== 'N/A' && amenity.walkingDistance !== 'Calculating...') {
            distanceItems.push(`
                <span class="distance-item">
                    <span class="distance-icon">🚶</span>
                    <span class="distance-text">${amenity.walkingDistance} walking</span>
                </span>
            `);
        }
        if (amenity.drivingDistance !== 'N/A' && amenity.drivingDistance !== 'Calculating...') {
            distanceItems.push(`
                <span class="distance-item">
                    <span class="distance-icon">🚗</span>
                    <span class="distance-text">${amenity.drivingDistance} by car</span>
                </span>
            `);
        }
        
        card.innerHTML = `
            <div class="amenity-icon">${amenity.icon}</div>
            <div class="amenity-details">
                <h4 class="amenity-name">${amenity.name}</h4>
                <p class="amenity-type">${amenity.type}</p>
                <div class="amenity-distances">
                    ${distanceItems.join('')}
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

    const hourMatch = timeStrLower.match(/(\d+)\s*(?:h|hour|hours)/);
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
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function estimateWalkingTime(distanceKm) {
    // Average walking speed is approximately 5 km/h (0.083 km/min)
    // Add 20% overhead for indirect routes, traffic lights, etc.
    const walkingSpeedKmPerMin = 0.083;
    const overheadFactor = 1.2;
    const minutes = Math.round((distanceKm / walkingSpeedKmPerMin) * overheadFactor);
    
    if (minutes < 1) {
        return '1 min';
    } else if (minutes < 60) {
        return `${minutes} mins`;
    } else {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (mins === 0) {
            return `${hours} hour${hours > 1 ? 's' : ''}`;
        }
        return `${hours} hour${hours > 1 ? 's' : ''} ${mins} mins`;
    }
}

function estimateDrivingTime(distanceKm) {
    // Approximate average city driving speed (km/min) with overhead.
    // 0.55 km/min ~= 33 km/h average, then we inflate for traffic/road conditions.
    const drivingSpeedKmPerMin = 0.55;
    const overheadFactor = 1.35;
    const minutes = Math.round((distanceKm / drivingSpeedKmPerMin) * overheadFactor);

    if (minutes < 1) {
        return '1 min';
    } else if (minutes < 60) {
        return `${minutes} mins`;
    } else {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (mins === 0) {
            return `${hours} hour${hours > 1 ? 's' : ''}`;
        }
        return `${hours} hour${hours > 1 ? 's' : ''} ${mins} mins`;
    }
}
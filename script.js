let playPauseButton = document.getElementById("playPause");
let isPlaying = false;
let atcPlayer;
let atcAudio = new Audio("https://s1-bos.liveatc.net/sbbr3_app?nocache=2025022215215419159"); // ATC do Galeão

// Inicializa a API do YouTube
function onYouTubeIframeAPIReady() {
    atcPlayer = new YT.Player('atcPlayer', { events: { 'onReady': onPlayerReady } });
}

// Quando o player estiver pronto, define o volume do YouTube
function onPlayerReady(event) {
    event.target.setVolume(50);
}

// Função para atualizar o volume do ATC
const atcVolumeControl = document.getElementById("atcVolume");
atcVolumeControl.addEventListener("input", (event) => {
    atcAudio.volume = event.target.value / 100;  // O valor do volume é de 0 a 1
});

// Função para atualizar o volume do Lo-Fi
const lofiVolumeControl = document.getElementById("lofiVolume");
lofiVolumeControl.addEventListener("input", (event) => {
    atcPlayer.setVolume(event.target.value);  // O volume do YouTube vai de 0 a 100
});

// Função Play/Pause sincronizada
playPauseButton.addEventListener("click", () => {
    if (!isPlaying) {
        atcPlayer.playVideo();
        atcAudio.play();
        playPauseButton.textContent = "⏸ Pause";
    } else {
        atcPlayer.pauseVideo();
        atcAudio.pause();
        playPauseButton.textContent = "▶ Play";
    }
    isPlaying = !isPlaying;
});

// Flight tracking system
const flights = new Map();

function updateFlightTable() {
    const tableBody = document.getElementById('flightTableBody');
    tableBody.innerHTML = '';
    
    flights.forEach((flight, flightNumber) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${flightNumber}</td>
            <td>${flight.route}</td>
            <td class="status-${flight.status.toLowerCase()}">${flight.status}</td>
            <td>${flight.altitude}ft</td>
            <td>${flight.speed}kts</td>
            <td>${flight.lastUpdate}</td>
        `;
        tableBody.appendChild(row);
    });
}

function addOrUpdateFlight(flightNumber, status, altitude, speed, route, airline) {
    const now = new Date();
    const updateTime = now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
    });
    
    flights.set(flightNumber, {
        status,
        altitude,
        speed,
        lastUpdate: updateTime,
        route,
        airline
    });
    
    updateFlightTable();
}

function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
    });
    document.querySelector('.current-time').textContent = timeString;
}

// BSB coordinates (approximate)
const BSB_LAT = -15.8711;
const BSB_LON = -47.9186;

async function fetchBSBFlights() {
    try {
        // OpenSky Network API endpoint for flights in BSB area
        const response = await fetch(`https://opensky-network.org/api/states/all?lamin=${BSB_LAT-0.5}&lomin=${BSB_LON-0.5}&lamax=${BSB_LAT+0.5}&lomax=${BSB_LON+0.5}`);
        const data = await response.json();
        
        if (data.states) {
            // Clear previous flights
            flights.clear();
            
            // Process each flight
            data.states.forEach(state => {
                const [icao24, callsign, origin_country, time_position, time_velocity, longitude, latitude, altitude, on_ground, velocity, true_track, vertical_rate, sensors, geo_altitude, squawk, spi, position_source, category] = state;
                
                // Only process flights that are not on the ground
                if (!on_ground) {
                    const flightNumber = callsign.trim();
                    const airline = getAirlineFromCallsign(flightNumber);
                    const route = determineRoute(latitude, longitude);
                    const status = determineStatus(vertical_rate, velocity);
                    
                    addOrUpdateFlight(
                        flightNumber,
                        status,
                        Math.round(altitude),
                        Math.round(velocity),
                        route,
                        airline
                    );
                }
            });
        }
    } catch (error) {
        console.error('Error fetching flight data:', error);
    }
}

function getAirlineFromCallsign(callsign) {
    // Map common airline codes to full names
    const airlines = {
        'LA': 'LATAM',
        'G3': 'GOL',
        'AD': 'Azul',
        'AA': 'American Airlines',
        'AF': 'Air France',
        'BA': 'British Airways',
        'DL': 'Delta',
        'IB': 'Iberia',
        'KL': 'KLM',
        'LH': 'Lufthansa',
        'QR': 'Qatar Airways',
        'TK': 'Turkish Airlines',
        'UA': 'United Airlines'
    };
    
    const code = callsign.substring(0, 2);
    return airlines[code] || 'Unknown';
}

function determineRoute(lat, lon) {
    // Calculate if flight is arriving or departing based on position relative to BSB
    const isArriving = lat > BSB_LAT;
    const destination = isArriving ? 'BSB' : getNearestAirport(lat, lon);
    return isArriving ? `${destination} → BSB` : `BSB → ${destination}`;
}

function getNearestAirport(lat, lon) {
    // List of major Brazilian airports with their coordinates
    const airports = {
        'GRU': { lat: -23.4356, lon: -46.4731 },
        'CNF': { lat: -19.6337, lon: -43.9688 },
        'FOR': { lat: -3.7762, lon: -38.5322 },
        'SDU': { lat: -22.9105, lon: -43.1631 },
        'MAO': { lat: -3.0386, lon: -60.0497 },
        'REC': { lat: -8.1264, lon: -34.9236 },
        'NAT': { lat: -5.7681, lon: -35.3767 },
        'MCZ': { lat: -9.5108, lon: -35.7917 },
        'VCP': { lat: -23.0074, lon: -47.1345 },
        'THE': { lat: -5.0599, lon: -42.8234 },
        'SLZ': { lat: -2.5854, lon: -44.2341 }
    };
    
    let nearest = 'Unknown';
    let minDistance = Infinity;
    
    for (const [code, coords] of Object.entries(airports)) {
        const distance = calculateDistance(lat, lon, coords.lat, coords.lon);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = code;
        }
    }
    
    return nearest;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function determineStatus(verticalRate, velocity) {
    if (verticalRate > 0) return 'Climbing';
    if (verticalRate < 0) return 'Descending';
    if (velocity < 100) return 'Holding';
    return 'Active';
}

// Start flight tracking when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Fetch flights immediately
    fetchBSBFlights();
    
    // Update every 10 seconds
    setInterval(fetchBSBFlights, 10000);
});

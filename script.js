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

function convertFeetToMeters(feet) {
    return Math.round(feet * 0.3048);
}

function convertKnotsToKmh(knots) {
    return Math.round(knots * 1.852);
}

function updateFlightTable() {
    const tableBody = document.getElementById('flightTableBody');
    tableBody.innerHTML = '';
    
    flights.forEach((flight, flightNumber) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${flightNumber}</td>
            <td class="status-${flight.status.toLowerCase()}">${flight.status}</td>
            <td>${convertFeetToMeters(flight.altitude)}m</td>
            <td>${convertKnotsToKmh(flight.speed)}km/h</td>
            <td>${flight.lastUpdate}</td>
        `;
        tableBody.appendChild(row);
    });
}

function addOrUpdateFlight(flightNumber, status, altitude, speed) {
    const now = new Date();
    const updateTime = now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Only update if the flight exists or if it's not landed
    if (flights.has(flightNumber) || status !== 'Landed') {
        flights.set(flightNumber, {
            status,
            altitude,
            speed,
            lastUpdate: updateTime
        });
        
        updateFlightTable();
    }
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
        const response = await fetch(`https://opensky-network.org/api/states/all?lamin=${BSB_LAT-0.5}&lomin=${BSB_LON-0.5}&lamax=${BSB_LAT+0.5}&lomax=${BSB_LON+0.5}`);
        const data = await response.json();
        
        if (data.states) {
            // Process each flight
            for (const state of data.states) {
                const [icao24, callsign, origin_country, time_position, time_velocity, longitude, latitude, altitude, on_ground, velocity, true_track, vertical_rate, sensors, geo_altitude, squawk, spi, position_source, category] = state;
                
                // Only process flights that have a callsign
                if (callsign) {
                    const status = on_ground ? 'Landed' : determineStatus(vertical_rate, velocity);
                    
                    addOrUpdateFlight(
                        callsign.trim(),
                        status,
                        Math.round(altitude),
                        Math.round(velocity)
                    );
                }
            }
        } else {
            console.log('No flight states available');
        }
    } catch (error) {
        console.error('Error fetching flight data:', error);
    }
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

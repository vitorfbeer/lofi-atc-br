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
            <td class="status-${flight.status.toLowerCase()}">${flight.status}</td>
            <td>${flight.altitude}ft</td>
            <td>${flight.speed}kts</td>
            <td>${flight.lastUpdate}</td>
        `;
        tableBody.appendChild(row);
    });
}

function addOrUpdateFlight(flightNumber, status, altitude, speed) {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    
    flights.set(flightNumber, {
        status,
        altitude,
        speed,
        lastUpdate: timeString
    });
    
    updateFlightTable();
}

// Simulate flight updates (you can replace this with real ATC data parsing)
function simulateFlightUpdates() {
    const flightNumbers = ['LA3300', 'G3 1766', 'AD 4032', 'LA 3301'];
    const statuses = ['Active', 'Holding', 'Landed'];
    const altitudes = [30000, 25000, 20000, 15000, 10000, 5000];
    const speeds = [450, 400, 350, 300, 250, 200];
    
    setInterval(() => {
        const randomFlight = flightNumbers[Math.floor(Math.random() * flightNumbers.length)];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const randomAltitude = altitudes[Math.floor(Math.random() * altitudes.length)];
        const randomSpeed = speeds[Math.floor(Math.random() * speeds.length)];
        
        addOrUpdateFlight(randomFlight, randomStatus, randomAltitude, randomSpeed);
    }, 5000); // Update every 5 seconds
}

// Start flight simulation when the page loads
document.addEventListener('DOMContentLoaded', () => {
    simulateFlightUpdates();
});

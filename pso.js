// Buat array untuk menyimpan lokasi pengguna
let userLocations = [];
let maxIterations = 100;

// Inisialisasi peta menggunakan Leaflet.js
const map = L.map('map').setView([-7.250445, 112.768845], 8); // Set view awal
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
}).addTo(map);

// Event listener untuk klik di peta
map.on('click', (e) => {
    const { lat, lng } = e.latlng;

    // Tambahkan marker di lokasi klik
    L.marker([lat, lng]).addTo(map);

    // Simpan lokasi ke array
    userLocations.push({ x: lat, y: lng });

    // Tambahkan nama titik ke tabel
    const pointNamesBody = document.getElementById('point-names-body');
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    const latCell = document.createElement('td');
    const lngCell = document.createElement('td');

    nameCell.textContent = String.fromCharCode(65 + userLocations.length - 1); // A, B, C, ...
    latCell.textContent = lat.toFixed(6);
    lngCell.textContent = lng.toFixed(6);

    row.appendChild(nameCell);
    row.appendChild(latCell);
    row.appendChild(lngCell);
    pointNamesBody.appendChild(row);

    // Update distance table
    updateDistanceTable();

    console.log(`Added location: (${lat}, lng)`);
});

function updateDistanceTable() {
    const distanceTableBody = document.getElementById('distance-table-body');
    distanceTableBody.innerHTML = ''; // Kosongkan tabel sebelum memulai

    const headerRow = document.createElement('tr');
    const emptyCell = document.createElement('th');
    headerRow.appendChild(emptyCell);

    // Create header row
    for (let i = 0; i < userLocations.length; i++) {
        const headerCell = document.createElement('th');
        headerCell.textContent = String.fromCharCode(65 + i);
        headerRow.appendChild(headerCell);
    }
    distanceTableBody.appendChild(headerRow);

    // Create distance rows
    for (let i = 0; i < userLocations.length; i++) {
        const row = document.createElement('tr');
        const rowHeaderCell = document.createElement('th');
        rowHeaderCell.textContent = String.fromCharCode(65 + i);
        row.appendChild(rowHeaderCell);

        for (let j = 0; j < userLocations.length; j++) {
            const distanceCell = document.createElement('td');
            if (i === j) {
                distanceCell.textContent = '-';
            } else {
                distanceCell.textContent = calculateDistance(userLocations[i], userLocations[j]).toFixed(2);
            }
            row.appendChild(distanceCell);
        }
        distanceTableBody.appendChild(row);
    }
}

function calculateDistance(a, b) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (b.x - a.x) * Math.PI / 180;
    const dLng = (b.y - a.y) * Math.PI / 180;
    const lat1 = a.x * Math.PI / 180;
    const lat2 = b.x * Math.PI / 180;

    const aVal = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                 Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
    return R * c; // Distance in kilometers
}

function calculateFitness(route) {
    let totalDistance = 0;
    for (let i = 0; i < route.length - 1; i++) {
        totalDistance += calculateDistance(route[i], route[i + 1]);
    }
    totalDistance += calculateDistance(route[route.length - 1], route[0]); // Kembali ke titik awal
    return totalDistance;
}

function initializeParticles() {
    let populationSize;    
    if (userLocations.length === 0) {
        alert('Tambahkan lokasi pada peta terlebih dahulu.');
        return;
    }

    if (userLocations.length <= 10) {
        populationSize = 20;
    } else if (userLocations.length <= 50) {
        populationSize = 50;
    } else {
        populationSize = 100;
    }

    particles = [];
    globalBest = { position: [], fitness: Infinity };

    const initialRandomTableBody = document.getElementById('initial-random-table-body');
    const initialPositionTableBody = document.getElementById('initial-position-table-body');
    const initialVelocityTableBody = document.getElementById('initial-velocity-table-body');
    initialRandomTableBody.innerHTML = ''; // Kosongkan tabel sebelum memulai
    initialPositionTableBody.innerHTML = ''; // Kosongkan tabel sebelum memulai
    initialVelocityTableBody.innerHTML = ''; // Kosongkan tabel sebelum memulai

    for (let i = 0; i < populationSize; i++) {
        let randomValues = userLocations.map(() => Math.random());
        let sortedIndices = randomValues.map((value, index) => ({ value, index }))
                                        .sort((a, b) => a.value - b.value)
                                        .map(item => item.index);
        let route = sortedIndices.map(index => userLocations[index]);
        const fitness = calculateFitness(route);

        const velocity = Array(route.length).fill(0).map(() => Math.random() * 2 - 1); // Random velocities

        particles.push({
            position: route,
            velocity: velocity,
            fitness: fitness,
            bestPosition: route,
            bestFitness: fitness
        });

        // Perbarui global best
        if (fitness < globalBest.fitness) {
            globalBest = { position: route, fitness: fitness };
        }

        // Tambahkan baris ke tabel random values untuk setiap partikel
        const randomRow = document.createElement('tr');
        const particleRandomCell = document.createElement('td');
        const randomCell = document.createElement('td');

        particleRandomCell.textContent = i + 1;
        randomCell.textContent = randomValues.map(v => v.toFixed(2)).join(', ');

        randomRow.appendChild(particleRandomCell);
        randomRow.appendChild(randomCell);
        initialRandomTableBody.appendChild(randomRow);

        // Tambahkan baris ke tabel posisi awal untuk setiap partikel
        const positionRow = document.createElement('tr');
        const particlePositionCell = document.createElement('td');
        const positionCell = document.createElement('td');

        particlePositionCell.textContent = i + 1;
        positionCell.textContent = route.map((p, index) => String.fromCharCode(65 + index)).join(' -> ');

        positionRow.appendChild(particlePositionCell);
        positionRow.appendChild(positionCell);
        initialPositionTableBody.appendChild(positionRow);

        // Tambahkan baris ke tabel kecepatan awal untuk setiap partikel
        const velocityRow = document.createElement('tr');
        const particleVelocityCell = document.createElement('td');
        const velocityCell = document.createElement('td');

        particleVelocityCell.textContent = i + 1;
        velocityCell.textContent = velocity.map(v => v.toFixed(2)).join(', ');

        velocityRow.appendChild(particleVelocityCell);
        velocityRow.appendChild(velocityCell);
        initialVelocityTableBody.appendChild(velocityRow);
    }
}

document.getElementById('runPSO').addEventListener('click', () => {
    if (userLocations.length < 2) {
        alert('Tambahkan minimal dua lokasi untuk memulai optimasi.');
        return;
    }

    // Update distance table before running PSO
    updateDistanceTable();

    initializeParticles();

    // runPSO();

    // Visualisasi hasil
    // drawRoute(globalBest.position);
});


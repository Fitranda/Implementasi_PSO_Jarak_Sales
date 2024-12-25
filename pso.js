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
        // positionCell.textContent = route.map((p, index) => `(${p.x.toFixed(6)}, ${p.y.toFixed(6)})`).join(' -> ');
        positionCell.textContent = randomValues.map(v => v.toFixed(2)).join(', ');


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

// Parameter PSO
const w = 0.5; // Inertia weight
const c1 = 1.5; // Cognitive (particle) weight
const c2 = 1.5; // Social (swarm) weight

function updateParticles() {
    particles.forEach((particle) => {
        for (let i = 0; i < particle.position.length; i++) {
            // Update velocity
            const r1 = Math.random();
            const r2 = Math.random();
            particle.velocity[i] = w * particle.velocity[i] +
                                   c1 * r1 * (particle.bestPosition[i].x - particle.position[i].x) +
                                   c2 * r2 * (globalBest.position[i].x - particle.position[i].x);

            // Update position
            particle.position[i].x += particle.velocity[i];
            particle.position[i].y += particle.velocity[i];
        }

        // Calculate fitness
        particle.fitness = calculateFitness(particle.position);

        // Update personal best
        if (particle.fitness < particle.bestFitness) {
            particle.bestPosition = [...particle.position];
            particle.bestFitness = particle.fitness;
        }

        // Update global best
        if (particle.fitness < globalBest.fitness) {
            globalBest = { position: [...particle.position], fitness: particle.fitness };
        }
    });
}

function runPSO() {
    initializeParticles();

    const tabelBody = document.getElementById('tabel-body');
    tabelBody.innerHTML = ''; // Kosongkan tabel sebelum memulai

    // Tampilkan hasil inisialisasi awal
    particles.forEach((particle, index) => {
        const row = document.createElement('tr');
        const iterasiCell = document.createElement('td');
        const jarakCell = document.createElement('td');
        const titikAwalCell = document.createElement('td');
        const kecepatanCell = document.createElement('td');
        const pbestCell = document.createElement('td');
        const gbestCell = document.createElement('td');

        iterasiCell.textContent = 0; // Iterasi 0 untuk hasil random awal
        jarakCell.textContent = particle.fitness.toFixed(2);
        titikAwalCell.textContent = JSON.stringify(particle.position.map(p => `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`));
        kecepatanCell.textContent = JSON.stringify(particle.velocity.map(v => v.toFixed(2)));
        pbestCell.textContent = JSON.stringify(particle.bestPosition.map(p => `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`));
        gbestCell.textContent = JSON.stringify(globalBest.position.map(p => `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`));

        row.appendChild(iterasiCell);
        row.appendChild(jarakCell);
        row.appendChild(titikAwalCell);
        row.appendChild(kecepatanCell);
        row.appendChild(pbestCell);
        row.appendChild(gbestCell);
        tabelBody.appendChild(row);
    });

    // Jalankan iterasi PSO
    for (let iter = 1; iter <= maxIterations; iter++) {
        updateParticles();
        console.log(`Iteration ${iter}, Best Distance: ${globalBest.fitness}`);

        // Tambahkan baris ke tabel untuk setiap iterasi
        const row = document.createElement('tr');
        const iterasiCell = document.createElement('td');
        const jarakCell = document.createElement('td');
        const titikAwalCell = document.createElement('td');
        const kecepatanCell = document.createElement('td');
        const pbestCell = document.createElement('td');
        const gbestCell = document.createElement('td');

        iterasiCell.textContent = iter;
        jarakCell.textContent = globalBest.fitness.toFixed(2);
        titikAwalCell.textContent = JSON.stringify(particles[0].position.map(p => `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`));
        kecepatanCell.textContent = JSON.stringify(particles[0].velocity.map(v => v.toFixed(2)));
        pbestCell.textContent = JSON.stringify(particles[0].bestPosition.map(p => `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`));
        gbestCell.textContent = JSON.stringify(globalBest.position.map(p => `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`));

        row.appendChild(iterasiCell);
        row.appendChild(jarakCell);
        row.appendChild(titikAwalCell);
        row.appendChild(kecepatanCell);
        row.appendChild(pbestCell);
        row.appendChild(gbestCell);
        tabelBody.appendChild(row);
    }
    // Tampilkan kesimpulan rute optimal
    const summaryBody = document.getElementById('summary-body');
    summaryBody.innerHTML = ''; // Kosongkan tabel kesimpulan sebelum memulai

    const summaryRow = document.createElement('tr');
    const ruteCell = document.createElement('td');
    const jarakTotalCell = document.createElement('td');

    const routeNames = globalBest.position.map((p, index) => String.fromCharCode(65 + index)).join('->');
    ruteCell.textContent = routeNames;
    jarakTotalCell.textContent = globalBest.fitness.toFixed(2);

    summaryRow.appendChild(ruteCell);
    summaryRow.appendChild(jarakTotalCell);
    summaryBody.appendChild(summaryRow);

    console.log('Optimal Route:', globalBest.position);
    console.log('Optimal Distance:', globalBest.fitness);
}

document.getElementById('runPSO').addEventListener('click', () => {
    if (userLocations.length < 2) {
        alert('Tambahkan minimal dua lokasi untuk memulai optimasi.');
        return;
    }

    initializeParticles();

    // Update distance table before running PSO
    updateDistanceTable();

     // Jalankan PSO
     runPSO();




    // runPSO();

    // Visualisasi hasil
    // drawRoute(globalBest.position);
});


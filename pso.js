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

    console.log(`Added location: (${lat}, ${lng})`);
});

function calculateDistance(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

function calculateFitness(route) {
    let totalDistance = 0;
    for (let i = 0; i < route.length - 1; i++) {
        totalDistance += calculateDistance(route[i], route[i + 1]);
    }
    totalDistance += calculateDistance(route[route.length - 1], route[0]); // Kembali ke titik awal
    return totalDistance;
}

function updateParticles() {
    particles.forEach((particle) => {
        let newPosition = [...particle.position];

        // Mutasi berdasarkan probabilitas
        for (let i = 0; i < newPosition.length - 1; i++) {
            if (Math.random() < 0.3) { // Mutasi dengan probabilitas 30%
                const j = Math.floor(Math.random() * newPosition.length);
                [newPosition[i], newPosition[j]] = [newPosition[j], newPosition[i]];
            }
        }

        const newFitness = calculateFitness(newPosition);

        // Update posisi dan fitness
        if (newFitness < particle.bestFitness) {
            particle.bestPosition = newPosition;
            particle.bestFitness = newFitness;
        }

        if (newFitness < globalBest.fitness) {
            globalBest = { position: newPosition, fitness: newFitness };
        }

        particle.position = newPosition;
        particle.fitness = newFitness;
    });
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

    for (let i = 0; i < populationSize; i++) {
        let route = [...userLocations];
        // Acak posisi awal partikel kecuali titik pertama
        let firstLocation = route.shift();
        route.sort(() => Math.random() - 0.5);
        route.unshift(firstLocation);
        const fitness = calculateFitness(route);

        particles.push({
            position: route,
            velocity: [],
            fitness: fitness,
            bestPosition: route,
            bestFitness: fitness
        });

        // Perbarui global best
        if (fitness < globalBest.fitness) {
            globalBest = { position: route, fitness: fitness };
        }
    }
}

function drawRoute(route) {
    const colors = ['blue', 'green', 'red', 'purple', 'orange', 'yellow', 'cyan', 'magenta'];
    const latlngs = route.map((loc) => L.latLng(loc.x, loc.y));

    let routeDescription = 'Rute: ';
    for (let i = 0; i < latlngs.length - 1; i++) {
        const color = colors[i % colors.length];
        var routing = L.Routing.control({
            waypoints: [latlngs[i], latlngs[i + 1]],
            routeWhileDragging: false,
            lineOptions: {
                styles: [{ color: color, weight: 5, opacity: 0.7 }]
            },
            createMarker: function() { return null; }
        }).addTo(map);
        document.getElementById('routing-controls').appendChild(routing.getContainer())
        routeDescription += `(${route[i].x.toFixed(2)}, ${route[i].y.toFixed(2)}) -> `;
    }


    // // Menggambar garis kembali ke titik awal
    // const color = colors[(latlngs.length - 1) % colors.length];
    // L.Routing.control({
    //     waypoints: [latlngs[latlngs.length - 1], latlngs[0]],
    //     routeWhileDragging: false,
    //     lineOptions: {
    //         styles: [{ color: color, weight: 5, opacity: 0.7 }]
    //     },
    //     createMarker: function() { return null; }
    // }).addTo(map);
    // routeDescription += `(${route[route.length - 1].x.toFixed(2)}, ${route[route.length - 1].y.toFixed(2)}) -> (${route[0].x.toFixed(2)}, ${route[0].y.toFixed(2)})`;

    // Menampilkan deskripsi rute
    document.getElementById('output').innerHTML += `<br>${routeDescription}`;
}

function runPSO() {
    initializeParticles();

    const tabelBody = document.getElementById('tabel-body');
    tabelBody.innerHTML = ''; // Kosongkan tabel sebelum memulai

    for (let iter = 0; iter < maxIterations; iter++) {
        updateParticles();
        console.log(`Iteration ${iter + 1}, Best Distance: ${globalBest.fitness}`);

        // Tambahkan baris ke tabel untuk setiap iterasi
        const row = document.createElement('tr');
        const iterasiCell = document.createElement('td');
        const jarakCell = document.createElement('td');
        const titikAwalCell = document.createElement('td');
        const kecepatanCell = document.createElement('td');
        const pbestCell = document.createElement('td');
        const gbestCell = document.createElement('td');

        iterasiCell.textContent = iter + 1;
        jarakCell.textContent = globalBest.fitness.toFixed(2);
        titikAwalCell.textContent = JSON.stringify(particles[0].position.map(p => `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`));
        kecepatanCell.textContent = JSON.stringify(particles[0].velocity);
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

    console.log('Optimal Route:', globalBest.position);
    console.log('Optimal Distance:', globalBest.fitness);
}

document.getElementById('runPSO').addEventListener('click', () => {
    if (userLocations.length < 2) {
        alert('Tambahkan minimal dua lokasi untuk memulai optimasi.');
        return;
    }

    runPSO();

    // Visualisasi hasil
    drawRoute(globalBest.position);
});


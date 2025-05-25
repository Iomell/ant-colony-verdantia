// Dane mapy z JSON
const mapData = {
    "nodes": [
        { "id": "MR1", "name": "Najwyższe Mrowisko", "x": 150, "y": 350 },
        { "id": "BG1", "name": "Bagna Koralowe", "x": 180, "y": 1250 },
        { "id": "RC1", "name": "Rzeka Dwóch Cieni", "x": 450, "y": 800 },
        { "id": "LB1", "name": "Labirynt Pięciu Dolin", "x": 500, "y": 700 },
        { "id": "BST", "name": "Baszta Zmierzchu", "x": 870, "y": 240 },
        { "id": "CT1", "name": "Zamek Verdantii", "x": 830, "y": 1370 }
    ],
    "edges": [
        { "from": "BG1", "to": "RC1", "dist": 53.58 },
        { "from": "MR1", "to": "LB1", "dist": 41.83 },
        { "from": "RC1", "to": "LB1", "dist": 10.00 },
        { "from": "LB1", "to": "BST", "dist": 77.11 },
        { "from": "MR1", "to": "BG1", "dist": 90.11 },
        { "from": "BG1", "to": "CT1", "dist": 17.78 },
        { "from": "CT1", "to": "LB1", "dist": 68.00 },
        { "from": "MR1", "to": "RC1", "dist": 54.08 },
        { "from": "BST", "to": "CT1", "dist": 113.07 }
    ]
};

// Parametry algorytmu mrówkowego
let params = {
    antsCount: 20,
    iterations: 100,
    alpha: 1,   // Waga feromonów
    beta: 2,    // Waga odwrotności odległości
    evaporation: 0.5, // Współczynnik parowania
    q: 100,     // Stała do obliczania feromonów
};

// Elementy DOM
const canvas = document.getElementById('map');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const antsSlider = document.getElementById('ants-slider');
const antsValue = document.getElementById('ants-value');
const iterationsSlider = document.getElementById('iterations-slider');
const iterationsValue = document.getElementById('iterations-value');

// Inicjalizacja
function init() {
    // Ustaw rozmiar canvas
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Rysuj początkową mapę
    drawMap();
    
    // Event listeners
    startBtn.addEventListener('click', startSimulation);
    resetBtn.addEventListener('click', resetSimulation);
    antsSlider.addEventListener('input', updateSliders);
    iterationsSlider.addEventListener('input', updateSliders);
}

function updateSliders() {
    params.antsCount = parseInt(antsSlider.value);
    params.iterations = parseInt(iterationsSlider.value);
    antsValue.textContent = params.antsCount;
    iterationsValue.textContent = params.iterations;
}

// Rysowanie mapy
function drawMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Skalowanie współrzędnych do rozmiaru canvas
    const scale = 0.8 * Math.min(canvas.width / 1000, canvas.height / 1500);
    const offsetX = 0.1 * canvas.width;
    const offsetY = 0.1 * canvas.height;
    
    // Rysuj krawędzie
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 2;
    mapData.edges.forEach(edge => {
        const fromNode = mapData.nodes.find(n => n.id === edge.from);
        const toNode = mapData.nodes.find(n => n.id === edge.to);
        
        ctx.beginPath();
        ctx.moveTo(fromNode.x * scale + offsetX, fromNode.y * scale + offsetY);
        ctx.lineTo(toNode.x * scale + offsetX, toNode.y * scale + offsetY);
        ctx.stroke();
    });
    
    // Rysuj węzły
    mapData.nodes.forEach(node => {
        const x = node.x * scale + offsetX;
        const y = node.y * scale + offsetY;
        
        // Różne kolory dla różnych typów lokacji
        let color;
        if (node.id === 'BG1') color = '#2e8b57'; // Bagna - zielony
        else if (node.id === 'BST') color = '#b22222'; // Smok - czerwony
        else if (node.id === 'CT1') color = '#9370db'; // Zamek - fioletowy
        else color = '#8b4513'; // Standardowy brązowy
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Nazwy miejsc
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.fillText(node.name, x + 15, y + 5);
    });
}

// Algorytm mrówkowy
class AntColonyOptimization {
    constructor(graph, params) {
        this.graph = graph;
        this.params = params;
        this.pheromones = {};
        this.bestPath = null;
        this.bestLength = Infinity;
        
        // Inicjalizacja feromonów
        this.initializePheromones();
    }
    
    initializePheromones() {
        this.graph.edges.forEach(edge => {
            const key = `${edge.from}-${edge.to}`;
            this.pheromones[key] = 1;
        });
    }
    
    run() {
        for (let i = 0; i < this.params.iterations; i++) {
            const antsPaths = this.generateAntsPaths();
            this.updatePheromones(antsPaths);
            this.findBestPath(antsPaths);
        }
        return this.bestPath;
    }
    
    generateAntsPaths() {
        const paths = [];
        for (let i = 0; i < this.params.antsCount; i++) {
            paths.push(this.generateAntPath());
        }
        return paths;
    }
    
    generateAntPath() {
        // Start z Bagien Koralowych (BG1)
        let currentNode = 'BG1';
        const path = [currentNode];
        const visited = new Set([currentNode]);
        let length = 0;
        
        while (currentNode !== 'BST') { // Cel to Baszta Zmierzchu
            const edges = this.getAvailableEdges(currentNode, visited);
            if (edges.length === 0) break; // Brak dostępnych ścieżek
            
            const nextEdge = this.chooseEdge(edges);
            path.push(nextEdge.to);
            visited.add(nextEdge.to);
            length += nextEdge.dist;
            currentNode = nextEdge.to;
        }
        
        return { path, length };
    }
    
    getAvailableEdges(nodeId, visited) {
        return this.graph.edges.filter(edge => 
            edge.from === nodeId && !visited.has(edge.to)
        );
    }
    
    chooseEdge(edges) {
        // Oblicz prawdopodobieństwa dla każdej krawędzi
        const probabilities = edges.map(edge => {
            const pheromone = this.pheromones[`${edge.from}-${edge.to}`] || 1;
            const attractiveness = Math.pow(pheromone, this.params.alpha) * 
                                  Math.pow(1 / edge.dist, this.params.beta);
            return attractiveness;
        });
        
        // Wybierz krawędź na podstawie prawdopodobieństw
        const sum = probabilities.reduce((a, b) => a + b, 0);
        const rand = Math.random() * sum;
        let cumulative = 0;
        
        for (let i = 0; i < edges.length; i++) {
            cumulative += probabilities[i];
            if (rand <= cumulative) {
                return edges[i];
            }
        }
        
        return edges[0];
    }
    
    updatePheromones(paths) {
        // Parowanie feromonów
        for (const key in this.pheromones) {
            this.pheromones[key] *= (1 - this.params.evaporation);
        }
        
        // Dodanie nowych feromonów
        paths.forEach(path => {
            const deltaPheromone = this.params.q / path.length;
            for (let i = 0; i < path.path.length - 1; i++) {
                const from = path.path[i];
                const to = path.path[i+1];
                const key = `${from}-${to}`;
                this.pheromones[key] = (this.pheromones[key] || 0) + deltaPheromone;
            }
        });
    }
    
    findBestPath(paths) {
        paths.forEach(path => {
            if (path.path.includes('BST') && path.length < this.bestLength) {
                this.bestLength = path.length;
                this.bestPath = [...path.path];
            }
        });
    }
}

// Symulacja
function startSimulation() {
    startBtn.disabled = true;
    
    const aco = new AntColonyOptimization(mapData, params);
    const bestPath = aco.run();
    
    // Wizualizacja najlepszej ścieżki
    drawBestPath(bestPath);
    
    // Wyświetl wynik
    displayResult(bestPath);
    
    startBtn.disabled = false;
}

function drawBestPath(path) {
    if (!path) return;
    
    const scale = 0.8 * Math.min(canvas.width / 1000, canvas.height / 1500);
    const offsetX = 0.1 * canvas.width;
    const offsetY = 0.1 * canvas.height;
    
    ctx.strokeStyle = '#ff4500';
    ctx.lineWidth = 4;
    
    for (let i = 0; i < path.length - 1; i++) {
        const fromNode = mapData.nodes.find(n => n.id === path[i]);
        const toNode = mapData.nodes.find(n => n.id === path[i+1]);
        
        ctx.beginPath();
        ctx.moveTo(fromNode.x * scale + offsetX, fromNode.y * scale + offsetY);
        ctx.lineTo(toNode.x * scale + offsetX, toNode.y * scale + offsetY);
        ctx.stroke();
    }
}

function displayResult(path) {
    const storyText = document.getElementById('story-text');
    if (!path || !path.includes('BST')) {
        storyText.innerHTML += `<p class="result">Niestety, mrówki nie znalazły bezpiecznej ścieżki do Baszty Zmierzchu. Gruntor musi spróbować ponownie!</p>`;
    } else {
        const length = calculatePathLength(path);
        storyText.innerHTML += `
            <p class="result">Mrówki znalazły najlepszą ścieżkę! Długość: ${length.toFixed(2)}</p>
            <p class="result">Ścieżka: ${path.join(' → ')}</p>
            <p class="result">Gruntor dotarł do Baszty Zmierzchu i uratował księżniczkę Lilianę! Królestwo Verdantii znów jest bezpieczne.</p>
        `;
    }
}

function calculatePathLength(path) {
    let length = 0;
    for (let i = 0; i < path.length - 1; i++) {
        const edge = mapData.edges.find(e => 
            e.from === path[i] && e.to === path[i+1] || 
            e.to === path[i] && e.from === path[i+1]
        );
        if (edge) length += edge.dist;
    }
    return length;
}

function resetSimulation() {
    const storyText = document.getElementById('story-text');
    storyText.innerHTML = `
        <p>W królestwie Verdantii księżniczka Liliana została porwana przez smoka Skaldra Czarnopłomyka...</p>
        <p>Dzielny ogr Gruntor wyrusza na ratunek z pomocą mrówek Formica Ex Machina!</p>
    `;
    drawMap();
}

// Start aplikacji
window.addEventListener('load', init);

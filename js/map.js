// Variável global para o mapa e camadas
let map;
let drawnItems;
let currentBaseLayer;

// Definição das camadas de mapa
const mapLayers = {
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: ' OpenStreetMap contributors'
    }),
    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: ' Esri'
    }),
    terrain: L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg', {
        maxZoom: 18,
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>'
    }),
    dark: L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: ' CartoDB'
    })
};

// Função para editar marcador
window.editMarker = function(markerId) {
    let marker = null;

    // Procura o marcador em todas as camadas
    drawnItems.eachLayer(layer => {
        if (layer._leaflet_id === markerId) {
            marker = layer;
        }
    });

    if (!marker) {
        console.error('Marcador não encontrado');
        return;
    }

    const properties = marker.feature?.properties || {};

    // Preenche os campos de edição com os valores atuais
    const titleInput = document.getElementById('marker-title');
    const descInput = document.getElementById('marker-description');
    const colorInput = document.getElementById('marker-color');
    const iconInput = document.getElementById('marker-icon');

    if (titleInput) titleInput.value = properties.name || '';
    if (descInput) descInput.value = properties.description || '';
    if (colorInput) colorInput.value = properties.color || '#ff0000';
    if (iconInput) iconInput.value = properties.symbol || '';

    // Atualiza o marcador com os novos valores
    const updateMarker = () => {
        const title = titleInput?.value || 'Marcador';
        const description = descInput?.value || '';
        const color = colorInput?.value || '#ff0000';
        const icon = iconInput?.value || '';

        // Atualiza as propriedades do marcador
        if (!marker.feature) marker.feature = {};
        if (!marker.feature.properties) marker.feature.properties = {};

        marker.feature.properties = {
            ...marker.feature.properties,
            name: title,
            description: description,
            color: color,
            symbol: icon
        };

        // Atualiza o ícone
        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${color}; color: white; padding: 8px 12px; border-radius: 15px; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2); white-space: nowrap;">
                    ${icon} ${title}
                  </div>`,
            iconSize: null,
            iconAnchor: [20, 20]
        });

        marker.setIcon(customIcon);

        // Atualiza o popup
        const popupContent = `
            <div class="marker-popup">
                <h3>${title}</h3>
                ${description ? `<p>${description}</p>` : ''}
            </div>
        `;
        marker.bindPopup(popupContent);

        // Atualiza a lista de marcadores
        if (typeof updateMarkersList === 'function') {
            updateMarkersList();
        }
    };

    // Adiciona evento para atualização em tempo real
    if (titleInput) titleInput.addEventListener('input', updateMarker);
    if (descInput) descInput.addEventListener('input', updateMarker);
    if (colorInput) colorInput.addEventListener('input', updateMarker);
    if (iconInput) iconInput.addEventListener('input', updateMarker);
};

// Função para inicializar o mapa
function initMap() {
    // Inicializa o mapa
    map = L.map('map').setView([-15.793889, -47.882778], 13);
    window.map = map;

    // Adiciona a camada base inicial do OpenStreetMap
    currentBaseLayer = mapLayers.osm;
    currentBaseLayer.addTo(map);

    // Camadas para desenhos
    drawnItems = new L.FeatureGroup();
    window.drawnItems = drawnItems;
    drawnItems.addTo(map);

    // Configuração das ferramentas de desenho
    const drawControl = new L.Control.Draw({
        draw: {
            polygon: {
                allowIntersection: false,
                drawError: {
                    color: '#e1e100',
                    message: '<strong>Ops!</strong> você não pode desenhar isso!'
                },
                shapeOptions: {
                    color: '#97009c'
                }
            },
            polyline: {
                shapeOptions: {
                    color: '#f357a1',
                    weight: 10
                }
            },
            rectangle: {
                shapeOptions: {
                    clickable: false
                }
            },
            circle: {
                shapeOptions: {
                    clickable: false
                }
            },
            circlemarker: false,
            marker: true
        },
        edit: {
            featureGroup: drawnItems,
            remove: true
        }
    });

    // Adiciona o controle de desenho ao mapa
    map.addControl(drawControl);

    // Inicializa o painel de edição
    const closeBtn = document.querySelector('.close-customization-btn');
    const panel = document.querySelector('.marker-customization');
    
    // Fecha o painel quando clicar no botão de fechar
    if (closeBtn && panel) {
        closeBtn.addEventListener('click', () => {
            panel.classList.remove('active');
        });
    }

    // Fecha o painel quando clicar fora dele
    document.addEventListener('click', (e) => {
        if (panel && !panel.contains(e.target) && 
            !e.target.closest('.marker-actions') && 
            panel.classList.contains('active')) {
            panel.classList.remove('active');
        }
    });

    // Fecha o painel quando pressionar ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panel && panel.classList.contains('active')) {
            panel.classList.remove('active');
        }
    });

    // Configura o seletor de tipo de mapa
    const mapTypeSelect = document.getElementById('map-type');
    if (mapTypeSelect) {
        mapTypeSelect.addEventListener('change', function() {
            const selectedType = this.value;
            
            // Remove a camada atual
            if (currentBaseLayer) {
                map.removeLayer(currentBaseLayer);
            }
            
            // Adiciona a nova camada
            currentBaseLayer = mapLayers[selectedType];
            currentBaseLayer.addTo(map);
        });
    }

    // Dispara evento de inicialização do mapa
    document.dispatchEvent(new Event('map:init'));
}

// Aguarda o DOM estar pronto para inicializar o mapa
document.addEventListener('DOMContentLoaded', initMap);

// Estado do modo de desenho
let drawingMode = false;

// Toggle do modo de desenho
const toggleDrawBtn = document.getElementById('toggle-draw');
if (toggleDrawBtn) {
    toggleDrawBtn.addEventListener('click', function() {
        drawingMode = !drawingMode;
        this.classList.toggle('active');
    });
}

// Função para criar marcador personalizado
function createCustomMarker(latlng) {
    const title = document.getElementById('marker-title')?.value || 'Marcador';
    const description = document.getElementById('marker-description')?.value || '';
    const color = document.getElementById('marker-color')?.value || '#ff0000';
    const icon = document.getElementById('marker-icon')?.value || '';

    const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; color: white; padding: 8px 12px; border-radius: 15px; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2); white-space: nowrap;">
                ${icon} ${title}
              </div>`,
        iconSize: null,
        iconAnchor: [20, 20]
    });

    const marker = L.marker(latlng, {
        icon: customIcon,
        draggable: true,
        title: title
    });

    // Adiciona popup com título e descrição
    const popupContent = `
        <div class="marker-popup">
            <h3>${title}</h3>
            ${description ? `<p>${description}</p>` : ''}
        </div>
    `;
    marker.bindPopup(popupContent);

    return marker;
}

// Evento de clique no mapa
document.addEventListener('map:init', function () {
    map.on('click', function(e) {
        if (drawingMode) {
            const marker = createCustomMarker(e.latlng);
            drawnItems.addLayer(marker);
        }
    });
});

// Controle de seleção de tipo de mapa
const mapTypeSelect = document.getElementById('map-type-select');
if (mapTypeSelect) {
    mapTypeSelect.addEventListener('change', function(e) {
        const selectedType = e.target.value;
        if (window.layerManager) {
            window.layerManager.setBaseLayer(selectedType);
            
            // Se for híbrido, adiciona a camada de rótulos
            if (selectedType === 'hybrid' && mapLayers.labels) {
                window.layerManager.addLayer('labels', mapLayers.labels);
            } else {
                window.layerManager.removeLayer('labels');
            }
        }
    });
}

// Busca por coordenadas
const searchBtn = document.getElementById('search-coord-btn');
if (searchBtn) {
    searchBtn.addEventListener('click', function() {
        const lat = parseFloat(document.getElementById('lat')?.value);
        const lng = parseFloat(document.getElementById('lng')?.value);
        
        if (!isNaN(lat) && !isNaN(lng)) {
            map.setView([lat, lng], 13);
            const marker = createCustomMarker([lat, lng]);
            drawnItems.addLayer(marker);
        } else {
            alert('Por favor, insira coordenadas válidas.');
        }
    });
}

// Configuração da localização em tempo real
let locationMarker = null;
let locationCircle = null;
let watchId = null;
let isTracking = false;

function onLocationFound(e) {
    const radius = e.accuracy / 4;

    // Remove marcadores anteriores
    if (locationMarker) {
        map.removeLayer(locationMarker);
    }
    if (locationCircle) {
        map.removeLayer(locationCircle);
    }

    // Adiciona novo marcador de localização com popup "EU"
    locationMarker = L.marker(e.latlng, {
        icon: L.divIcon({
            className: 'location-marker',
            html: '<div style="background-color: #2196F3; color: white; padding: 5px 10px; border-radius: 15px; font-weight: bold;">EU</div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        })
    }).addTo(map);

    // Adiciona círculo de precisão com raio menor
    locationCircle = L.circle(e.latlng, {
        radius: radius,
        color: '#2196F3',
        fillColor: '#2196F3',
        fillOpacity: 0.15,
        weight: 1
    }).addTo(map);

    // Centraliza o mapa na localização
    map.setView(e.latlng);
}

function onLocationError(e) {
    alert("Erro ao obter localização: " + e.message);
    stopLocationTracking();
}

function startLocationTracking() {
    if (!navigator.geolocation) {
        alert("Seu navegador não suporta geolocalização");
        return;
    }

    isTracking = true;
    const locationBtn = document.getElementById('location-btn');
    if (locationBtn) {
        locationBtn.classList.add('active');
    }
    
    // Primeira localização
    map.locate({setView: true, maxZoom: 16});
    
    // Acompanhamento contínuo
    watchId = navigator.geolocation.watchPosition(
        position => {
            const e = {
                latlng: L.latLng(position.coords.latitude, position.coords.longitude),
                accuracy: position.coords.accuracy
            };
            onLocationFound(e);
        },
        error => onLocationError(error),
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );
}

function stopLocationTracking() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    
    if (locationMarker) {
        map.removeLayer(locationMarker);
        locationMarker = null;
    }
    
    if (locationCircle) {
        map.removeLayer(locationCircle);
        locationCircle = null;
    }

    isTracking = false;
    const locationBtn = document.getElementById('location-btn');
    if (locationBtn) {
        locationBtn.classList.remove('active');
    }
}

// Event listeners para localização
document.addEventListener('map:init', function () {
    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);
});

const locationBtn = document.getElementById('location-btn');
if (locationBtn) {
    locationBtn.addEventListener('click', () => {
        if (!isTracking) {
            startLocationTracking();
        } else {
            stopLocationTracking();
        }
    });
}

// Estado do modo de desenho
let isDrawing = false;

// Aguarda o mapa ser inicializado
document.addEventListener('map:init', function() {
    // Camada para os marcadores
    if (typeof window.markersLayer === 'undefined') {
        window.markersLayer = L.layerGroup();
        window.markersLayer.addTo(window.map);
    }
});

// Aguarda o DOM estar completamente carregado
document.addEventListener('DOMContentLoaded', function() {
    // Função para buscar coordenadas
    const searchCoordBtn = document.getElementById('search-coord-btn');
    if (searchCoordBtn) {
        searchCoordBtn.addEventListener('click', function() {
            const lat = parseFloat(document.getElementById('lat').value);
            const lng = parseFloat(document.getElementById('lng').value);
            
            if (!isNaN(lat) && !isNaN(lng)) {
                window.map.setView([lat, lng], 15);
                const marker = L.marker([lat, lng], {
                    icon: createCustomIcon(militarySymbols.infantry, markerColors[0].value)
                });
                
                if (window.markersLayer) {
                    marker.addTo(window.markersLayer);
                }
                
                marker.feature = {
                    type: 'Feature',
                    properties: {
                        name: `Coordenadas ${lat}, ${lng}`,
                        description: 'Marcador criado pela busca de coordenadas',
                        symbol: militarySymbols.infantry,
                        color: markerColors[0].value
                    }
                };
                addEditablePopup(marker);
                marker.openPopup();
            } else {
                alert('Por favor, insira coordenadas válidas.');
            }
        });
    }

    // Função para localização atual
    const locationBtn = document.getElementById('location-btn');
    if (locationBtn) {
        locationBtn.addEventListener('click', function() {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    window.map.setView([lat, lng], 15);
                    const marker = L.marker([lat, lng], {
                        icon: createCustomIcon(militarySymbols.observation, markerColors[0].value)
                    });
                    
                    if (window.markersLayer) {
                        marker.addTo(window.markersLayer);
                    }
                    
                    marker.feature = {
                        type: 'Feature',
                        properties: {
                            name: 'Minha Localização',
                            description: 'Sua localização atual',
                            symbol: militarySymbols.observation,
                            color: markerColors[0].value
                        }
                    };
                    addEditablePopup(marker);
                    marker.openPopup();
                }, function(error) {
                    alert('Erro ao obter localização: ' + error.message);
                });
            } else {
                alert('Geolocalização não está disponível no seu navegador.');
            }
        });
    }

    // Toggle do modo de desenho
    const toggleDrawBtn = document.getElementById('toggle-draw');
    if (toggleDrawBtn) {
        toggleDrawBtn.addEventListener('click', function() {
            isDrawing = !isDrawing;
            this.classList.toggle('active');
            if (isDrawing) {
                new L.Draw.Marker(window.map).enable();
            } else {
                window.map.off('click');
            }
        });
    }
});

// Função para criar um ícone personalizado
function createCustomIcon(symbol, color, name) {
    return L.divIcon({
        className: 'custom-marker',
        html: `
            <div class="marker-icon" style="background-color: ${color};">
                <span class="marker-symbol">${symbol}</span>
                ${name ? `<span class="marker-name">${name}</span>` : ''}
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    });
}

// Função para criar popup de visualização
function createViewPopup(layer) {
    const properties = layer.feature ? layer.feature.properties : {};
    const content = document.createElement('div');
    content.className = 'marker-popup';
    content.innerHTML = `
        <h3>${properties.name || 'Sem nome'}</h3>
        <p>${properties.description || 'Sem descrição'}</p>
        <div class="marker-symbol-preview" style="background-color: ${properties.color || markerColors[0].value}">
            ${properties.symbol || militarySymbols.infantry}
        </div>
        <button onclick="editMarker('${layer._leaflet_id}')" class="popup-btn edit-btn">Editar</button>
    `;
    return content;
}

// Função para criar popup de edição
function createEditPopup(layer) {
    const properties = layer.feature ? layer.feature.properties : {};
    const content = document.createElement('div');
    content.className = 'marker-edit-popup';
    
    // Criar seletor de símbolos
    let symbolsOptions = '';
    for (const [key, symbol] of Object.entries(militarySymbols)) {
        symbolsOptions += `<option value="${symbol}" ${properties.symbol === symbol ? 'selected' : ''}>${key}: ${symbol}</option>`;
    }
    
    // Criar seletor de cores
    let colorOptions = '';
    markerColors.forEach(color => {
        colorOptions += `<option value="${color.value}" ${properties.color === color.value ? 'selected' : ''}>${color.name}</option>`;
    });
    
    content.innerHTML = `
        <div class="edit-form">
            <label>Nome:</label>
            <input type="text" class="popup-input" id="marker-name-${layer._leaflet_id}" 
                   value="${properties.name || ''}" placeholder="Nome">
            
            <label>Descrição:</label>
            <textarea class="popup-input" id="marker-desc-${layer._leaflet_id}" 
                     placeholder="Descrição">${properties.description || ''}</textarea>
            
            <label>Símbolo:</label>
            <select class="popup-input" id="marker-symbol-${layer._leaflet_id}">
                ${symbolsOptions}
            </select>
            
            <label>Cor:</label>
            <select class="popup-input" id="marker-color-${layer._leaflet_id}">
                ${colorOptions}
            </select>
            
            <div class="marker-preview" id="marker-preview-${layer._leaflet_id}">
                Prévia do marcador
            </div>
            
            <div class="popup-buttons">
                <button onclick="saveMarker('${layer._leaflet_id}')" class="popup-btn save-btn">Salvar</button>
                <button onclick="deleteMarker('${layer._leaflet_id}')" class="popup-btn delete-btn">Excluir</button>
            </div>
        </div>
    `;
    
    // Adicionar event listeners para atualização em tempo real da prévia
    setTimeout(() => {
        const symbolSelect = document.getElementById(`marker-symbol-${layer._leaflet_id}`);
        const colorSelect = document.getElementById(`marker-color-${layer._leaflet_id}`);
        const preview = document.getElementById(`marker-preview-${layer._leaflet_id}`);
        
        function updatePreview() {
            preview.style.backgroundColor = colorSelect.value;
            preview.innerHTML = symbolSelect.value;
        }
        
        symbolSelect.addEventListener('change', updatePreview);
        colorSelect.addEventListener('change', updatePreview);
        updatePreview();
    }, 0);
    
    return content;
}

// Função para adicionar popup editável
function addEditablePopup(layer) {
    if (!layer.feature) {
        layer.feature = {
            type: 'Feature',
            properties: {
                symbol: militarySymbols.infantry,
                color: markerColors[0].value
            }
        };
    }
    layer.bindPopup(createViewPopup(layer));
}

// Função para editar marcador
window.editMarker = function(layerId) {
    const layer = drawnItems.getLayer(layerId) || window.markersLayer.getLayer(layerId);
    if (layer) {
        layer.setPopupContent(createEditPopup(layer));
    }
};

// Função para salvar marcador
window.saveMarker = function(layerId) {
    const layer = drawnItems.getLayer(layerId) || window.markersLayer.getLayer(layerId);
    if (layer) {
        const name = document.getElementById(`marker-name-${layerId}`).value;
        const desc = document.getElementById(`marker-desc-${layerId}`).value;
        const symbol = document.getElementById(`marker-symbol-${layerId}`).value;
        const color = document.getElementById(`marker-color-${layerId}`).value;
        
        layer.feature.properties = {
            name: name,
            description: desc,
            symbol: symbol,
            color: color
        };
        
        // Atualiza o ícone do marcador
        layer.setIcon(createCustomIcon(symbol, color, name));
        
        // Atualiza o popup
        layer.setPopupContent(createViewPopup(layer));
    }
};

// Função para deletar marcador
window.deleteMarker = function(layerId) {
    const layer = drawnItems.getLayer(layerId) || window.markersLayer.getLayer(layerId);
    if (layer && confirm('Tem certeza que deseja excluir este marcador?')) {
        if (drawnItems.hasLayer(layer)) {
            drawnItems.removeLayer(layer);
        } else if (window.markersLayer.hasLayer(layer)) {
            window.markersLayer.removeLayer(layer);
        }
    }
};

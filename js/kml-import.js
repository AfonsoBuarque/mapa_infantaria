// Camada para os marcadores KML
if (!window.kmlLayer) {
    window.kmlLayer = L.layerGroup();
}

// Camada principal de marcadores
if (!window.markersLayer) {
    window.markersLayer = L.layerGroup();
}

// Função para processar o arquivo KML
function processKMLFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const kmlText = e.target.result;
            const parser = new DOMParser();
            const kmlDoc = parser.parseFromString(kmlText, 'text/xml');
            
            // Processa os placemarks
            const placemarks = kmlDoc.getElementsByTagName('Placemark');
            let markerCount = 0;
            let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
            
            Array.from(placemarks).forEach(placemark => {
                try {
                    // Obtém o nome e descrição
                    const name = placemark.getElementsByTagName('name')[0]?.textContent || 'Sem nome';
                    const description = placemark.getElementsByTagName('description')[0]?.textContent || 'Importado do KML';
                    
                    // Processa as coordenadas
                    const coordinates = placemark.getElementsByTagName('coordinates')[0]?.textContent;
                    if (coordinates) {
                        const coords = coordinates.trim().split(',');
                        if (coords.length >= 2) {
                            const lng = parseFloat(coords[0]);
                            const lat = parseFloat(coords[1]);
                            
                            if (!isNaN(lat) && !isNaN(lng)) {
                                // Atualiza os limites
                                minLat = Math.min(minLat, lat);
                                maxLat = Math.max(maxLat, lat);
                                minLng = Math.min(minLng, lng);
                                maxLng = Math.max(maxLng, lng);
                                
                                // Cria o marcador
                                const marker = L.marker([lat, lng], {
                                    draggable: true // Permite arrastar o marcador
                                });
                                
                                // Define as propriedades do marcador
                                marker.feature = {
                                    type: 'Feature',
                                    properties: {
                                        name: name,
                                        description: description,
                                        symbol: '📍',
                                        color: 'transparent',
                                        source: 'kml'
                                    }
                                };
                                
                                // Define o ícone baseado nas propriedades
                                marker.setIcon(createCustomIcon(marker.feature.properties.symbol, 'transparent'));
                                
                                // Adiciona popup editável
                                const popupContent = `
                                    <div class="marker-popup">
                                        <input type="text" class="marker-name" value="${name}" placeholder="Nome">
                                        <textarea class="marker-description" placeholder="Descrição">${description}</textarea>
                                        <div class="marker-controls">
                                            <div class="control-group">
                                                <label>Símbolo:</label>
                                                <select class="marker-symbol">
                                                    ${Object.entries(militarySymbols).map(([key, symbol]) => 
                                                        `<option value="${symbol}" ${symbol === '📍' ? 'selected' : ''}>${symbol} ${key}</option>`
                                                    ).join('')}
                                                </select>
                                            </div>
                                            <div class="control-group">
                                                <label>Cor:</label>
                                                <div class="color-controls">
                                                    <input type="color" class="marker-color" value="#ff0000">
                                                    <label class="transparent-checkbox">
                                                        <input type="checkbox" class="marker-transparent" ${marker.feature.properties.color === 'transparent' ? 'checked' : ''}>
                                                        Sem cor de fundo
                                                    </label>
                                                </div>
                                            </div>
                                            <div class="control-group">
                                                <label>Tamanho:</label>
                                                <select class="marker-size">
                                                    <option value="small">Pequeno</option>
                                                    <option value="medium" selected>Médio</option>
                                                    <option value="large">Grande</option>
                                                </select>
                                            </div>
                                            <div class="control-group">
                                                <label>Opacidade:</label>
                                                <input type="range" class="marker-opacity" min="0" max="100" value="100">
                                            </div>
                                        </div>
                                        <div class="popup-buttons">
                                            <button class="save-marker">Salvar</button>
                                            <button class="delete-marker">Excluir</button>
                                        </div>
                                    </div>
                                `;
                                
                                const popup = L.popup({
                                    closeButton: true,
                                    closeOnClick: false,
                                    autoClose: false,
                                    className: 'marker-popup-container'
                                }).setContent(popupContent);
                                
                                marker.bindPopup(popup);
                                
                                // Eventos do popup
                                marker.on('popupopen', () => {
                                    const popupElement = marker.getPopup().getElement();
                                    
                                    // Botão salvar
                                    const saveBtn = popupElement.querySelector('.save-marker');
                                    saveBtn.onclick = () => {
                                        const newName = popupElement.querySelector('.marker-name').value;
                                        const newDesc = popupElement.querySelector('.marker-description').value;
                                        const newSymbol = popupElement.querySelector('.marker-symbol').value;
                                        const transparentCheck = popupElement.querySelector('.marker-transparent');
                                        const newColor = transparentCheck.checked ? 'transparent' : popupElement.querySelector('.marker-color').value;
                                        const newSize = popupElement.querySelector('.marker-size').value;
                                        const newOpacity = popupElement.querySelector('.marker-opacity').value / 100;
                                        
                                        marker.feature.properties.name = newName;
                                        marker.feature.properties.description = newDesc;
                                        marker.feature.properties.symbol = newSymbol;
                                        marker.feature.properties.color = newColor;
                                        marker.feature.properties.size = newSize;
                                        marker.feature.properties.opacity = newOpacity;
                                        
                                        // Atualiza o ícone com as novas propriedades
                                        const iconOptions = {
                                            symbol: newSymbol,
                                            color: newColor,
                                            size: newSize,
                                            opacity: newOpacity
                                        };
                                        
                                        marker.setIcon(createCustomIcon(iconOptions.symbol, iconOptions.color, iconOptions.size));
                                        marker.setOpacity(iconOptions.opacity);
                                        
                                        marker.closePopup();
                                        updateMarkersList();
                                    };
                                    
                                    // Botão excluir
                                    const deleteBtn = popupElement.querySelector('.delete-marker');
                                    deleteBtn.onclick = () => {
                                        if (confirm('Tem certeza que deseja excluir este marcador?')) {
                                            window.markersLayer.removeLayer(marker);
                                            updateMarkersList();
                                        }
                                    };
                                    
                                    // Atualização em tempo real
                                    const symbolSelect = popupElement.querySelector('.marker-symbol');
                                    const colorInput = popupElement.querySelector('.marker-color');
                                    const transparentCheck = popupElement.querySelector('.marker-transparent');
                                    const sizeSelect = popupElement.querySelector('.marker-size');
                                    const opacityInput = popupElement.querySelector('.marker-opacity');
                                    
                                    const updateMarkerStyle = () => {
                                        const iconOptions = {
                                            symbol: symbolSelect.value,
                                            color: transparentCheck.checked ? 'transparent' : colorInput.value,
                                            size: sizeSelect.value,
                                            opacity: opacityInput.value / 100
                                        };
                                        
                                        marker.setIcon(createCustomIcon(iconOptions.symbol, iconOptions.color, iconOptions.size));
                                        marker.setOpacity(iconOptions.opacity);
                                        
                                        // Desabilita/habilita o seletor de cor
                                        colorInput.disabled = transparentCheck.checked;
                                    };
                                    
                                    symbolSelect.addEventListener('change', updateMarkerStyle);
                                    colorInput.addEventListener('input', updateMarkerStyle);
                                    transparentCheck.addEventListener('change', updateMarkerStyle);
                                    sizeSelect.addEventListener('change', updateMarkerStyle);
                                    opacityInput.addEventListener('input', updateMarkerStyle);
                                    
                                    // Inicializa o estado do seletor de cor
                                    colorInput.disabled = transparentCheck.checked;
                                });
                                
                                // Evento de arrasto
                                marker.on('dragend', () => {
                                    updateMarkersList();
                                });
                                
                                // Adiciona à camada principal de marcadores
                                window.markersLayer.addLayer(marker);
                                markerCount++;
                            }
                        }
                    }
                } catch (err) {
                    console.error('Erro ao processar placemark:', err);
                }
            });
            
            // Se marcadores foram adicionados, ajusta o zoom
            if (markerCount > 0) {
                try {
                    // Calcula o centro do mapa
                    const centerLat = (minLat + maxLat) / 2;
                    const centerLng = (minLng + maxLng) / 2;
                    
                    // Define os limites
                    const southWest = L.latLng(minLat, minLng);
                    const northEast = L.latLng(maxLat, maxLng);
                    const bounds = L.latLngBounds(southWest, northEast);
                    
                    // Ajusta o zoom
                    map.fitBounds(bounds, { padding: [50, 50] });
                    
                    // Atualiza a lista de marcações
                    updateMarkersList();
                    
                    alert('Arquivo KML importado com sucesso!');
                } catch (err) {
                    console.error('Erro ao ajustar zoom:', err);
                    map.setView([centerLat, centerLng], 13);
                    
                    // Atualiza a lista de marcações mesmo se houver erro no zoom
                    updateMarkersList();
                    
                    alert('Arquivo KML importado com sucesso, mas houve um erro ao ajustar o zoom.');
                }
            } else {
                alert('Nenhum marcador encontrado no arquivo KML.');
            }
        } catch (err) {
            console.error('Erro ao processar arquivo KML:', err);
            alert('Erro ao processar o arquivo KML. Por favor, verifique se o arquivo está no formato correto.');
        }
    };
    
    reader.onerror = function() {
        alert('Erro ao ler o arquivo KML. Por favor, tente novamente.');
    };
    
    reader.readAsText(file);
}

// Inicializa os eventos quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Configura os botões de importação
    const setupImportButton = (buttonId, inputId) => {
        const importBtn = document.getElementById(buttonId);
        const fileInput = document.getElementById(inputId);
        
        if (importBtn && fileInput) {
            importBtn.addEventListener('click', () => {
                fileInput.click();
            });
            
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    if (file.name.toLowerCase().endsWith('.kml')) {
                        processKMLFile(file);
                    } else {
                        alert('Por favor, selecione um arquivo KML válido.');
                    }
                    fileInput.value = '';
                }
            });
        }
    };
    
    // Configura botão desktop
    setupImportButton('import-kml', 'kml-file-input');
    
    // Configura botão mobile
    setupImportButton('import-kml-mobile', 'kml-file-input');
    
    // Adiciona a camada KML ao mapa quando ele estiver pronto
    const initKMLLayer = () => {
        if (typeof map !== 'undefined' && map) {
            window.kmlLayer.addTo(map);
            window.markersLayer.addTo(map);
        } else {
            setTimeout(initKMLLayer, 100);
        }
    };
    initKMLLayer();
});

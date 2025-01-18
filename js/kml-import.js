// Camada para os marcadores KML
let kmlLayer;

// Função para processar o arquivo KML
function processKMLFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const kmlText = e.target.result;
        const parser = new DOMParser();
        const kmlDoc = parser.parseFromString(kmlText, 'text/xml');
        
        // Processa os placemarks
        const placemarks = kmlDoc.getElementsByTagName('Placemark');
        let bounds = L.latLngBounds([]);
        
        Array.from(placemarks).forEach(placemark => {
            // Obtém o nome e descrição
            const name = placemark.getElementsByTagName('name')[0]?.textContent || 'Sem nome';
            const description = placemark.getElementsByTagName('description')[0]?.textContent || 'Importado do KML';
            
            // Processa as coordenadas
            const coordinates = placemark.getElementsByTagName('coordinates')[0]?.textContent;
            if (coordinates) {
                const [lng, lat] = coordinates.trim().split(',').map(Number);
                if (!isNaN(lat) && !isNaN(lng)) {
                    // Cria o marcador
                    const marker = L.marker([lat, lng], {
                        icon: createCustomIcon(militarySymbols.infantry, markerColors[0].value)
                    }).addTo(kmlLayer);
                    
                    // Adiciona as propriedades
                    marker.feature = {
                        type: 'Feature',
                        properties: {
                            name: name,
                            description: description,
                            symbol: militarySymbols.infantry,
                            color: markerColors[0].value,
                            source: 'kml'
                        }
                    };
                    
                    // Adiciona o popup editável
                    addEditablePopup(marker);
                    
                    // Atualiza os limites
                    bounds.extend([lat, lng]);
                }
            }
            
            // Processa os estilos (se houver)
            const style = placemark.getElementsByTagName('Style')[0];
            if (style) {
                const iconStyle = style.getElementsByTagName('IconStyle')[0];
                if (iconStyle) {
                    const color = iconStyle.getElementsByTagName('color')[0]?.textContent;
                    if (color) {
                        // Converte cor ABGR do KML para RGB
                        const abgr = color.match(/.{2}/g);
                        if (abgr && abgr.length === 4) {
                            const rgb = `#${abgr[3]}${abgr[2]}${abgr[1]}`;
                            marker.feature.properties.color = rgb;
                            marker.setIcon(createCustomIcon(
                                marker.feature.properties.symbol,
                                rgb,
                                marker.feature.properties.name
                            ));
                        }
                    }
                }
            }
        });
        
        // Processa linhas e polígonos
        const lineStrings = kmlDoc.getElementsByTagName('LineString');
        const polygons = kmlDoc.getElementsByTagName('Polygon');
        
        // Processa LineStrings (linhas)
        Array.from(lineStrings).forEach(lineString => {
            const coordinates = lineString.getElementsByTagName('coordinates')[0]?.textContent;
            if (coordinates) {
                const points = coordinates.trim().split(' ')
                    .map(coord => {
                        const [lng, lat] = coord.split(',').map(Number);
                        return [lat, lng];
                    })
                    .filter(coord => !isNaN(coord[0]) && !isNaN(coord[1]));
                
                if (points.length >= 2) {
                    const line = L.polyline(points, {
                        color: '#3388ff',
                        weight: 3,
                        opacity: 0.7
                    }).addTo(kmlLayer);
                    
                    points.forEach(point => bounds.extend(point));
                }
            }
        });
        
        // Processa Polygons (polígonos)
        Array.from(polygons).forEach(polygon => {
            const coordinates = polygon.getElementsByTagName('coordinates')[0]?.textContent;
            if (coordinates) {
                const points = coordinates.trim().split(' ')
                    .map(coord => {
                        const [lng, lat] = coord.split(',').map(Number);
                        return [lat, lng];
                    })
                    .filter(coord => !isNaN(coord[0]) && !isNaN(coord[1]));
                
                if (points.length >= 3) {
                    const poly = L.polygon(points, {
                        color: '#3388ff',
                        fillColor: '#3388ff',
                        fillOpacity: 0.2,
                        weight: 2
                    }).addTo(kmlLayer);
                    
                    points.forEach(point => bounds.extend(point));
                }
            }
        });
        
        // Ajusta o zoom para mostrar todos os elementos importados
        if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
        
        // Atualiza a lista de marcações se estiver aberta
        const markersPanel = document.getElementById('markers-panel');
        if (markersPanel?.classList.contains('active')) {
            updateMarkersList();
        }
        
        // Mostra mensagem de sucesso
        alert('Arquivo KML importado com sucesso!');
    };
    
    reader.onerror = function() {
        alert('Erro ao ler o arquivo KML. Por favor, tente novamente.');
    };
    
    reader.readAsText(file);
}

// Inicializa os eventos quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa a camada KML depois que o mapa estiver pronto
    if (typeof map !== 'undefined') {
        kmlLayer = L.layerGroup().addTo(map);
    } else {
        // Se o mapa ainda não estiver pronto, aguarda o evento de inicialização
        document.addEventListener('map:init', () => {
            kmlLayer = L.layerGroup().addTo(map);
        });
    }
    
    const importKmlBtn = document.getElementById('import-kml');
    const kmlFileInput = document.getElementById('kml-file-input');
    
    if (importKmlBtn && kmlFileInput) {
        importKmlBtn.addEventListener('click', () => {
            kmlFileInput.click();
        });
        
        kmlFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.name.toLowerCase().endsWith('.kml')) {
                    processKMLFile(file);
                } else {
                    alert('Por favor, selecione um arquivo KML válido.');
                }
                // Limpa o input para permitir selecionar o mesmo arquivo novamente
                kmlFileInput.value = '';
            }
        });
    }
});

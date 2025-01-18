// Função para criar o cabeçalho do KML
function createKMLHeader() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
    <name>Mapa Infantaria - Exportação</name>
    <description>Marcadores e elementos exportados do Mapa Infantaria</description>`;
}

// Função para criar o rodapé do KML
function createKMLFooter() {
    return `
</Document>
</kml>`;
}

// Função para criar um estilo KML
function createKMLStyle(color, id) {
    // Converte cor hex para ABGR (formato KML)
    const rgb = color.replace('#', '');
    const r = rgb.substr(0, 2);
    const g = rgb.substr(2, 2);
    const b = rgb.substr(4, 2);
    const abgr = `ff${b}${g}${r}`; // ff = alpha (opacidade)

    return `
    <Style id="style_${id}">
        <IconStyle>
            <color>${abgr}</color>
            <scale>1.1</scale>
        </IconStyle>
        <LabelStyle>
            <scale>0.8</scale>
        </LabelStyle>
    </Style>`;
}

// Função para criar um Placemark KML
function createKMLPlacemark(marker) {
    const properties = marker.feature?.properties || {};
    const latLng = marker.getLatLng();
    const styleId = properties.color?.replace('#', '') || 'default';

    return `
    <Placemark>
        <name><![CDATA[${properties.name || 'Sem nome'}]]></name>
        <description><![CDATA[${properties.description || ''}]]></description>
        <styleUrl>#style_${styleId}</styleUrl>
        <Point>
            <coordinates>${latLng.lng},${latLng.lat},0</coordinates>
        </Point>
    </Placemark>`;
}

// Função para criar um LineString KML
function createKMLLineString(line) {
    const coordinates = line.getLatLngs()
        .map(latLng => `${latLng.lng},${latLng.lat},0`)
        .join(' ');

    return `
    <Placemark>
        <name>Linha</name>
        <LineString>
            <coordinates>${coordinates}</coordinates>
        </LineString>
    </Placemark>`;
}

// Função para criar um Polygon KML
function createKMLPolygon(polygon) {
    const coordinates = polygon.getLatLngs()[0]
        .map(latLng => `${latLng.lng},${latLng.lat},0`)
        .join(' ');

    return `
    <Placemark>
        <name>Polígono</name>
        <Polygon>
            <outerBoundaryIs>
                <LinearRing>
                    <coordinates>${coordinates}</coordinates>
                </LinearRing>
            </outerBoundaryIs>
        </Polygon>
    </Placemark>`;
}

// Função para exportar o KML
function exportKML() {
    let kml = createKMLHeader();
    const styles = new Set();
    const placemarks = [];

    // Processa os marcadores da camada principal
    markersLayer.eachLayer(marker => {
        if (marker.feature?.properties?.color) {
            styles.add(createKMLStyle(marker.feature.properties.color, marker.feature.properties.color.replace('#', '')));
        }
        placemarks.push(createKMLPlacemark(marker));
    });

    // Processa os marcadores da camada KML
    if (typeof kmlLayer !== 'undefined') {
        kmlLayer.eachLayer(marker => {
            if (marker.feature?.properties?.color) {
                styles.add(createKMLStyle(marker.feature.properties.color, marker.feature.properties.color.replace('#', '')));
            }
            placemarks.push(createKMLPlacemark(marker));
        });
    }

    // Processa os elementos desenhados
    drawnItems.eachLayer(layer => {
        if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
            placemarks.push(createKMLLineString(layer));
        } else if (layer instanceof L.Polygon) {
            placemarks.push(createKMLPolygon(layer));
        } else if (layer instanceof L.Marker) {
            if (layer.feature?.properties?.color) {
                styles.add(createKMLStyle(layer.feature.properties.color, layer.feature.properties.color.replace('#', '')));
            }
            placemarks.push(createKMLPlacemark(layer));
        }
    });

    // Adiciona os estilos ao KML
    styles.forEach(style => {
        kml += style;
    });

    // Adiciona um estilo padrão
    kml += createKMLStyle('#ff0000', 'default');

    // Adiciona os placemarks ao KML
    placemarks.forEach(placemark => {
        kml += placemark;
    });

    // Fecha o documento KML
    kml += createKMLFooter();

    // Cria o blob e faz o download
    const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mapa_infantaria_${new Date().toISOString().split('T')[0]}.kml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Inicializa o evento de exportação quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    const exportKmlBtn = document.getElementById('export-kml');
    if (exportKmlBtn) {
        exportKmlBtn.addEventListener('click', exportKML);
    }
});

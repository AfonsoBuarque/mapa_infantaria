// Função para criar o painel de lista de marcações
function createMarkersPanel() {
    const panel = document.createElement('div');
    panel.className = 'markers-panel';
    panel.id = 'markers-panel';
    panel.innerHTML = `
        <div class="markers-panel-header">
            <h3>Lista de Marcações</h3>
            <button class="close-panel-btn">×</button>
        </div>
        <div class="markers-list"></div>
    `;
    document.body.appendChild(panel);

    // Adiciona evento para fechar o painel
    panel.querySelector('.close-panel-btn').addEventListener('click', () => {
        panel.classList.remove('active');
    });

    return panel;
}

// Função para atualizar a lista de marcações
function updateMarkersList() {
    const listContainer = document.querySelector('.markers-list');
    if (!listContainer) return;

    listContainer.innerHTML = ''; // Limpa a lista atual

    // Cria grupos para organizar as marcações
    const groups = {
        'Marcadores': window.markersLayer,
        'KML Importado': window.kmlLayer,
        'Desenhos': window.drawnItems
    };

    let totalMarkers = 0;

    // Itera sobre cada grupo
    for (const [groupName, layer] of Object.entries(groups)) {
        if (!layer) continue;

        const groupDiv = document.createElement('div');
        groupDiv.className = 'markers-group';
        groupDiv.innerHTML = `<h4>${groupName}</h4>`;
        let hasItems = false;

        // Adiciona cada marcação do grupo
        layer.eachLayer(marker => {
            if (marker instanceof L.Marker) {
                hasItems = true;
                totalMarkers++;

                // Garante que o marcador tenha as propriedades necessárias
                if (!marker.feature) {
                    marker.feature = {
                        type: 'Feature',
                        properties: {
                            name: 'Sem nome',
                            description: 'Sem descrição',
                            symbol: '📍',
                            color: '#ff0000'
                        }
                    };
                }

                const properties = marker.feature.properties;
                const itemDiv = document.createElement('div');
                itemDiv.className = 'marker-item';
                
                // Cria o ícone em miniatura
                const miniIcon = document.createElement('div');
                miniIcon.className = 'mini-marker-icon';
                if (properties.source === 'kml') {
                    miniIcon.style.backgroundColor = 'transparent';
                } else {
                    miniIcon.style.backgroundColor = properties.color || '#ff0000';
                }
                miniIcon.innerHTML = `<span class="mini-marker-symbol">${properties.symbol || '📍'}</span>`;

                // Cria o nome e descrição
                const infoDiv = document.createElement('div');
                infoDiv.className = 'marker-info';
                infoDiv.innerHTML = `
                    <div class="marker-name">${properties.name || 'Sem nome'}</div>
                    <div class="marker-description">${properties.description || 'Sem descrição'}</div>
                `;

                // Cria os botões de ação
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'marker-actions';
                actionsDiv.innerHTML = `
                    <button class="locate-marker-btn" title="Localizar no mapa">
                        <i class="fas fa-search-location"></i>
                    </button>
                    <button class="edit-marker-btn" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-marker-btn" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                `;

                // Adiciona os elementos ao item
                itemDiv.appendChild(miniIcon);
                itemDiv.appendChild(infoDiv);
                itemDiv.appendChild(actionsDiv);

                // Adiciona eventos aos botões
                actionsDiv.querySelector('.locate-marker-btn').addEventListener('click', () => {
                    const latLng = marker.getLatLng();
                    window.map.setView(latLng, 15);
                    marker.openPopup();
                });

                actionsDiv.querySelector('.edit-marker-btn').addEventListener('click', () => {
                    marker.openPopup();
                });

                actionsDiv.querySelector('.delete-marker-btn').addEventListener('click', () => {
                    if (confirm('Tem certeza que deseja excluir este marcador?')) {
                        layer.removeLayer(marker);
                        updateMarkersList();
                    }
                });

                groupDiv.appendChild(itemDiv);
            }
        });

        // Só adiciona o grupo se tiver itens
        if (hasItems) {
            listContainer.appendChild(groupDiv);
        }
    }

    // Adiciona mensagem se não houver marcadores
    if (totalMarkers === 0) {
        listContainer.innerHTML = `
            <div class="no-markers">
                <p>Nenhum marcador adicionado</p>
                <small>Clique no botão de marcador e depois no mapa para adicionar</small>
            </div>
        `;
    }
}

// Inicializa o painel quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    const panel = createMarkersPanel();
    const listMarkersBtn = document.getElementById('list-markers');
    
    if (listMarkersBtn) {
        listMarkersBtn.addEventListener('click', () => {
            panel.classList.toggle('active');
            if (panel.classList.contains('active')) {
                updateMarkersList();
            }
        });
    }
});

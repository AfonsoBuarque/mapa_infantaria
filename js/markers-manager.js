class MarkersManager {
    constructor(map) {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.map = map;
        this.markers = new Map(); // Armazena os marcadores ativos
        this.markersUnsubscribe = null;
        this.userColors = new Map(); // Armazena as cores para cada usuário
        this.availableColors = [
            '#FF5733', // Vermelho
            '#33FF57', // Verde
            '#3357FF', // Azul
            '#FF33F6', // Rosa
            '#33FFF6', // Ciano
            '#F6FF33', // Amarelo
            '#FF8333', // Laranja
            '#8333FF', // Roxo
            '#33FF9E', // Verde-água
            '#FF3333'  // Vermelho escuro
        ];
        this.nextColorIndex = 0;
        this.setupUI();
        this.setupEventListeners();
        this.setupRealtimeSync();
        this.setupCleanup();
    }

    setupUI() {
        // Adicionar botão de marcação ao menu
        const menuItems = document.querySelector('.menu-items');
        const markerButton = document.createElement('button');
        markerButton.id = 'toggle-markers-menu';
        markerButton.className = 'menu-item';
        markerButton.innerHTML = `
            <i class="fas fa-map-marker-alt"></i>
            Marcações
        `;
        menuItems.appendChild(markerButton);

        // Criar container para marcações
        const markersContainer = document.createElement('div');
        markersContainer.id = 'markers-container';
        markersContainer.className = 'feature-container';
        markersContainer.innerHTML = `
            <div class="markers-header">
                <h3>Marcações</h3>
                <button id="add-marker" class="action-button">
                    <i class="fas fa-plus"></i> Nova Marcação
                </button>
            </div>
            <div id="markers-list" class="markers-list"></div>
        `;
        document.body.appendChild(markersContainer);

        // Adicionar estilos
        const style = document.createElement('style');
        style.textContent = `
            #markers-container {
                display: none;
                position: fixed;
                top: 80px;
                right: 20px;
                width: 300px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 1000;
                padding: 15px;
            }

            #markers-container.visible {
                display: block;
            }

            .markers-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .markers-header h3 {
                margin: 0;
                color: #2c3e50;
            }

            .action-button {
                background: #2c3e50;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 14px;
            }

            .action-button:hover {
                background: #34495e;
            }

            .markers-list {
                max-height: 400px;
                overflow-y: auto;
            }

            .marker-item {
                background: #f8f9fa;
                border-radius: 6px;
                padding: 10px;
                margin-bottom: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .marker-info {
                flex: 1;
            }

            .marker-title {
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 5px;
            }

            .marker-description {
                font-size: 14px;
                color: #666;
            }

            .marker-actions {
                display: flex;
                gap: 5px;
            }

            .marker-button {
                background: none;
                border: none;
                padding: 5px;
                cursor: pointer;
                color: #666;
                border-radius: 4px;
            }

            .marker-button:hover {
                background: rgba(0,0,0,0.1);
            }

            .marker-button.delete {
                color: #e74c3c;
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Toggle menu de marcações
        const toggleMarkersButton = document.getElementById('toggle-markers-menu');
        const markersContainer = document.getElementById('markers-container');
        
        toggleMarkersButton.addEventListener('click', () => {
            markersContainer.classList.toggle('visible');
            if (!markersContainer.classList.contains('visible')) {
                this.exitMarkerMode();
            }
        });

        // Adicionar nova marcação
        const addMarkerButton = document.getElementById('add-marker');
        addMarkerButton.addEventListener('click', () => {
            this.enterMarkerMode();
        });

        // Clique no mapa para adicionar marcação
        this.map.on('click', (e) => {
            if (this.isAddingMarker) {
                this.showMarkerDialog(e.latlng);
            }
        });
    }

    enterMarkerMode() {
        this.isAddingMarker = true;
        this.map.getContainer().style.cursor = 'crosshair';
    }

    exitMarkerMode() {
        this.isAddingMarker = false;
        this.map.getContainer().style.cursor = '';
    }

    async showMarkerDialog(latlng) {
        const title = prompt('Digite o título da marcação:');
        if (!title) {
            this.exitMarkerMode();
            return;
        }

        const description = prompt('Digite a descrição da marcação:');
        if (!description) {
            this.exitMarkerMode();
            return;
        }

        await this.addMarker({
            title,
            description,
            lat: latlng.lat,
            lng: latlng.lng,
            createdBy: this.auth.currentUser.uid,
            createdAt: new Date(),
            userName: this.auth.currentUser.displayName || 'Usuário'
        });

        this.exitMarkerMode();
    }

    async addMarker(markerData) {
        try {
            await this.db.collection('markers').add(markerData);
            console.log('Marcação adicionada com sucesso');
        } catch (error) {
            console.error('Erro ao adicionar marcação:', error);
            alert('Erro ao adicionar marcação. Tente novamente.');
        }
    }

    async deleteMarker(markerId) {
        try {
            await this.db.collection('markers').doc(markerId).delete();
            console.log('Marcação removida com sucesso');
        } catch (error) {
            console.error('Erro ao remover marcação:', error);
            alert('Erro ao remover marcação. Tente novamente.');
        }
    }

    setupRealtimeSync() {
        // Cancelar inscrição anterior se existir
        if (this.markersUnsubscribe) {
            this.markersUnsubscribe();
        }

        // Monitorar mudanças nas marcações
        this.markersUnsubscribe = this.db.collection('markers')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    const marker = { id: change.doc.id, ...change.doc.data() };

                    if (change.type === 'added') {
                        this.createMarkerOnMap(marker);
                        this.addMarkerToList(marker);
                    }
                    else if (change.type === 'modified') {
                        this.updateMarkerOnMap(marker);
                        this.updateMarkerInList(marker);
                    }
                    else if (change.type === 'removed') {
                        this.removeMarkerFromMap(marker.id);
                        this.removeMarkerFromList(marker.id);
                    }
                });
            });
    }

    getUserColor(userId) {
        if (!this.userColors.has(userId)) {
            const color = this.availableColors[this.nextColorIndex % this.availableColors.length];
            this.userColors.set(userId, color);
            this.nextColorIndex++;
        }
        return this.userColors.get(userId);
    }

    createMarkerOnMap(markerData) {
        const userColor = this.getUserColor(markerData.createdBy);
        const markerIcon = L.divIcon({
            className: 'custom-marker',
            html: `<i class="fas fa-map-marker-alt" style="color: ${userColor}; font-size: 24px;"></i>`,
            iconSize: [24, 24],
            iconAnchor: [12, 24],
            popupAnchor: [0, -24]
        });

        const marker = L.marker([markerData.lat, markerData.lng], { icon: markerIcon })
            .bindPopup(`
                <div class="marker-popup">
                    <h3>${markerData.title}</h3>
                    <p>${markerData.description}</p>
                    <small style="color: ${userColor}">Criado por: ${markerData.userName}</small>
                </div>
            `);
        
        marker.addTo(this.map);
        this.markers.set(markerData.id, marker);
    }

    updateMarkerOnMap(markerData) {
        this.removeMarkerFromMap(markerData.id);
        this.createMarkerOnMap(markerData);
    }

    removeMarkerFromMap(markerId) {
        const marker = this.markers.get(markerId);
        if (marker) {
            marker.remove();
            this.markers.delete(markerId);
        }
    }

    addMarkerToList(markerData) {
        const markersList = document.getElementById('markers-list');
        const markerElement = document.createElement('div');
        markerElement.className = 'marker-item';
        markerElement.id = `marker-${markerData.id}`;
        const userColor = this.getUserColor(markerData.createdBy);
        
        markerElement.innerHTML = `
            <div class="marker-info">
                <div class="marker-title">${markerData.title}</div>
                <div class="marker-description">${markerData.description}</div>
                <small style="color: ${userColor}">Criado por: ${markerData.userName}</small>
            </div>
            <div class="marker-actions">
                ${markerData.createdBy === this.auth.currentUser.uid ? `
                    <button class="marker-button delete" onclick="window.markersManager.deleteMarker('${markerData.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        `;

        markersList.insertBefore(markerElement, markersList.firstChild);
    }

    updateMarkerInList(markerData) {
        this.removeMarkerFromList(markerData.id);
        this.addMarkerToList(markerData);
    }

    removeMarkerFromList(markerId) {
        const element = document.getElementById(`marker-${markerId}`);
        if (element) {
            element.remove();
        }
    }

    setupCleanup() {
        // Executar limpeza imediatamente e depois a cada hora
        this.cleanOldMarkers();
        setInterval(() => this.cleanOldMarkers(), 3600000); // 1 hora em milissegundos
    }

    async cleanOldMarkers() {
        try {
            const oneDayAgo = new Date();
            oneDayAgo.setHours(oneDayAgo.getHours() - 24);

            const snapshot = await this.db.collection('markers')
                .where('createdAt', '<', oneDayAgo)
                .get();

            // Deletar em lotes para melhor performance
            const batch = this.db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            console.log(`Limpeza: ${snapshot.size} marcações removidas`);
        } catch (error) {
            console.error('Erro ao limpar marcações:', error);
        }
    }
}

// Exportar para uso global
window.MarkersManager = MarkersManager;

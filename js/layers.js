// Gerenciamento de camadas
class LayerManager {
    constructor() {
        this.layers = new Map();
        this.baseLayers = new Map();
        this.currentBaseLayer = null;
    }

    // Adiciona uma nova camada
    addLayer(name, layer) {
        if (!window.map) {
            console.error('Mapa não inicializado');
            return;
        }
        layer.addTo(window.map);
        this.layers.set(name, layer);
    }

    // Adiciona uma nova camada base
    addBaseLayer(name, layer) {
        this.baseLayers.set(name, layer);
    }

    // Define a camada base atual
    setBaseLayer(name) {
        // Remove a camada base atual se existir
        if (this.currentBaseLayer) {
            const currentLayer = this.baseLayers.get(this.currentBaseLayer);
            if (currentLayer && window.map.hasLayer(currentLayer)) {
                window.map.removeLayer(currentLayer);
            }
        }

        // Adiciona a nova camada base
        const newLayer = this.baseLayers.get(name);
        if (newLayer) {
            newLayer.addTo(window.map);
            this.currentBaseLayer = name;
        }
    }

    // Remove uma camada
    removeLayer(name) {
        const layer = this.layers.get(name);
        if (layer) {
            layer.remove();
            this.layers.delete(name);
        }
    }

    // Retorna uma camada
    getLayer(name) {
        return this.layers.get(name);
    }

    // Verifica se uma camada existe
    hasLayer(name) {
        return this.layers.has(name);
    }

    // Limpa todas as camadas
    clearLayers() {
        this.layers.forEach(layer => layer.remove());
        this.layers.clear();
    }
}

// Espera o mapa ser inicializado antes de criar o gerenciador de camadas
document.addEventListener('map:init', () => {
    window.layerManager = new LayerManager();
    
    // Adiciona as camadas de overlay
    if (window.drawnItems) {
        window.layerManager.addLayer('drawnItems', window.drawnItems);
    }
    if (window.markersLayer) {
        window.layerManager.addLayer('markers', window.markersLayer);
    }
});

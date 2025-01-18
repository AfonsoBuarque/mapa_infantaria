// Aguarda o mapa ser inicializado
document.addEventListener('map:init', function() {
    // Apenas se o drawControl ainda não existir
    if (typeof window.drawControl === 'undefined') {
        // Configuração do Leaflet.draw
        window.drawControl = new L.Control.Draw({
            draw: {
                polygon: {
                    allowIntersection: false,
                    drawError: {
                        color: '#e1e100',
                        message: '<strong>Ops!</strong> Você não pode desenhar isso!'
                    },
                    shapeOptions: {
                        color: '#3388ff'
                    }
                },
                polyline: {
                    shapeOptions: {
                        color: '#3388ff'
                    }
                },
                circle: false,
                rectangle: false,
                circlemarker: false,
                marker: {
                    icon: new L.Icon.Default()
                }
            },
            edit: {
                featureGroup: window.drawnItems,
                remove: true
            }
        });

        window.map.addControl(window.drawControl);
    }

    // Função para criar popup de edição
    function createEditablePopup(layer) {
        const properties = layer.feature ? layer.feature.properties : {};
        const content = document.createElement('div');
        content.className = 'marker-edit-popup';

        // Nome
        const nameLabel = document.createElement('label');
        nameLabel.textContent = 'Nome:';
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = properties.name || '';
        nameInput.className = 'popup-input';
        
        // Descrição
        const descLabel = document.createElement('label');
        descLabel.textContent = 'Descrição:';
        const descInput = document.createElement('textarea');
        descInput.value = properties.description || '';
        descInput.className = 'popup-input';

        // Cor de Fundo
        const bgColorLabel = document.createElement('label');
        bgColorLabel.textContent = 'Cor de Fundo:';
        const bgColorSelect = document.createElement('select');
        bgColorSelect.className = 'popup-input';

        // Opções de cores de fundo
        const bgColors = [
            { value: 'transparent', text: 'Sem cor' },
            { value: '#ff0000', text: 'Vermelho' },
            { value: '#00ff00', text: 'Verde' },
            { value: '#0000ff', text: 'Azul' },
            { value: '#ffff00', text: 'Amarelo' },
            { value: '#000000', text: 'Preto' },
            { value: '#ffffff', text: 'Branco' }
        ];

        bgColors.forEach(color => {
            const option = document.createElement('option');
            option.value = color.value;
            option.textContent = color.text;
            if (properties.backgroundColor === color.value) {
                option.selected = true;
            }
            bgColorSelect.appendChild(option);
        });

        // Cor do Texto
        const textColorLabel = document.createElement('label');
        textColorLabel.textContent = 'Cor do Texto:';
        const textColorSelect = document.createElement('select');
        textColorSelect.className = 'popup-input';

        // Opções de cores do texto
        const textColors = [
            { value: '#000000', text: 'Preto' },
            { value: '#ffffff', text: 'Branco' },
            { value: '#ff0000', text: 'Vermelho' },
            { value: '#00ff00', text: 'Verde' },
            { value: '#0000ff', text: 'Azul' },
            { value: '#ffff00', text: 'Amarelo' }
        ];

        textColors.forEach(color => {
            const option = document.createElement('option');
            option.value = color.value;
            option.textContent = color.text;
            if (properties.textColor === color.value) {
                option.selected = true;
            }
            textColorSelect.appendChild(option);
        });

        // Cor
        const colorLabel = document.createElement('label');
        colorLabel.textContent = 'Cor:';
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = properties.color || '#ff0000';
        colorInput.className = 'popup-input';

        // Ícone
        const iconLabel = document.createElement('label');
        iconLabel.textContent = 'Ícone:';
        const iconSelect = document.createElement('select');
        iconSelect.className = 'popup-input';

        // Adiciona opções de ícones militares
        const icons = {
            'infantry': '⚔️ Infantaria',
            'artillery': '💥 Artilharia',
            'armor': '🛡️ Blindado',
            'air': '✈️ Aéreo',
            'hq': '🎯 QG',
            'medical': '⚕️ Médico',
            'supply': '📦 Suprimento',
            'observation': '👁️ Observação'
        };

        Object.entries(icons).forEach(([value, text]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = text;
            if (properties.icon === value) {
                option.selected = true;
            }
            iconSelect.appendChild(option);
        });

        // Botões
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Salvar';
        saveBtn.className = 'popup-btn save-btn';
        saveBtn.onclick = function() {
            // Salva as propriedades
            if (!layer.feature) layer.feature = {};
            if (!layer.feature.properties) layer.feature.properties = {};
            
            layer.feature.properties.name = nameInput.value;
            layer.feature.properties.description = descInput.value;
            layer.feature.properties.backgroundColor = bgColorSelect.value;
            layer.feature.properties.textColor = textColorSelect.value;
            layer.feature.properties.color = colorInput.value;
            layer.feature.properties.icon = iconSelect.value;
            
            // Atualiza o ícone do marcador
            if (layer instanceof L.Marker) {
                layer.setIcon(L.divIcon({
                    className: 'custom-marker',
                    html: `<div class="marker-icon" style="background-color: ${bgColorSelect.value};">
                            <span class="marker-symbol">${getIconSymbol(iconSelect.value)}</span>
                            <span class="marker-name" style="color: ${textColorSelect.value};">${nameInput.value}</span>
                          </div>`,
                    iconSize: [40, 40],
                    iconAnchor: [20, 40],
                    popupAnchor: [0, -40]
                }));
            }
            
            // Atualiza o popup
            layer.setPopupContent(createViewPopup(layer));
            layer.getPopup().update();
        };

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.className = 'popup-btn cancel-btn';
        cancelBtn.onclick = function() {
            layer.setPopupContent(createViewPopup(layer));
            layer.getPopup().update();
        };

        // Monta o conteúdo
        content.appendChild(nameLabel);
        content.appendChild(nameInput);
        content.appendChild(descLabel);
        content.appendChild(descInput);
        content.appendChild(bgColorLabel);
        content.appendChild(bgColorSelect);
        content.appendChild(textColorLabel);
        content.appendChild(textColorSelect);
        content.appendChild(colorLabel);
        content.appendChild(colorInput);
        content.appendChild(iconLabel);
        content.appendChild(iconSelect);
        content.appendChild(saveBtn);
        content.appendChild(cancelBtn);

        return content;
    }

    // Função para obter o símbolo do ícone
    function getIconSymbol(iconType) {
        const symbols = {
            'infantry': '⚔️',
            'artillery': '💥',
            'armor': '🛡️',
            'air': '✈️',
            'hq': '🎯',
            'medical': '⚕️',
            'supply': '📦',
            'observation': '👁️'
        };
        return symbols[iconType] || '📍';
    }

    // Função para criar popup de visualização
    function createViewPopup(layer) {
        const properties = layer.feature ? layer.feature.properties : {};
        const content = document.createElement('div');
        content.className = 'marker-view-popup';

        const title = document.createElement('h3');
        title.textContent = properties.name || 'Sem nome';
        content.appendChild(title);

        if (properties.description) {
            const desc = document.createElement('p');
            desc.textContent = properties.description;
            content.appendChild(desc);
        }

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Editar';
        editBtn.className = 'popup-btn edit-btn';
        editBtn.onclick = function() {
            layer.setPopupContent(createEditablePopup(layer));
            layer.getPopup().update();
        };

        content.appendChild(editBtn);
        return content;
    }

    // Função para adicionar popup editável a uma camada
    function addEditablePopup(layer) {
        layer.bindPopup(createViewPopup(layer));
    }

    // Evento quando um novo item é desenhado
    window.map.on('draw:created', function(e) {
        const layer = e.layer;
        window.drawnItems.addLayer(layer);
        addEditablePopup(layer);
        layer.openPopup();
    });

    // Adiciona popup editável aos itens existentes
    window.drawnItems.eachLayer(function(layer) {
        addEditablePopup(layer);
    });

    // Exportar funções para uso global
    window.addEditablePopup = addEditablePopup;
    window.createViewPopup = createViewPopup;
    window.createEditablePopup = createEditablePopup;
    window.getIconSymbol = getIconSymbol;
});

class MovementHistory {
    constructor(map) {
        this.map = map;
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.historyUnsubscribe = null;
        this.userPaths = new Map(); // Armazena as polylines dos usuários
        this.setupUI();
        this.setupCleanup();
    }

    setupUI() {
        // Criar container do histórico
        const historyContainer = document.createElement('div');
        historyContainer.id = 'history-container';
        historyContainer.innerHTML = `
            <div class="history-header">
                <span>Histórico de Movimentação</span>
                <button id="toggle-history" class="toggle-history">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
            <div class="history-content" id="history-content">
                <div class="history-filters">
                    <select id="user-filter">
                        <option value="all">Todos os usuários</option>
                    </select>
                    <select id="time-filter">
                        <option value="1">Última hora</option>
                        <option value="24">Últimas 24 horas</option>
                        <option value="168">Última semana</option>
                    </select>
                </div>
                <div class="history-list" id="history-list"></div>
            </div>
        `;
        document.body.appendChild(historyContainer);

        // Adicionar estilos
        const style = document.createElement('style');
        style.textContent = `
            #history-container {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 300px;
                background: white;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 1000;
            }

            .history-header {
                padding: 10px 15px;
                background: #2c3e50;
                color: white;
                border-radius: 10px 10px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
            }

            .history-content {
                padding: 10px;
                max-height: 400px;
                overflow-y: auto;
            }

            .history-filters {
                margin-bottom: 10px;
                display: flex;
                gap: 10px;
            }

            .history-filters select {
                flex: 1;
                padding: 5px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }

            .history-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .history-item {
                padding: 10px;
                background: #f8f9fa;
                border-radius: 6px;
                border-left: 4px solid #3498db;
            }

            .history-item .user {
                font-weight: bold;
                margin-bottom: 5px;
            }

            .history-item .time {
                font-size: 0.8em;
                color: #666;
            }

            .user-path {
                stroke-width: 2;
                opacity: 0.7;
            }

            @media (max-width: 480px) {
                #history-container {
                    width: 100%;
                    top: auto;
                    bottom: 0;
                    right: 0;
                    border-radius: 10px 10px 0 0;
                }
            }
        `;
        document.head.appendChild(style);

        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        const toggleButton = document.getElementById('toggle-history');
        const historyContent = document.getElementById('history-content');
        const userFilter = document.getElementById('user-filter');
        const timeFilter = document.getElementById('time-filter');

        toggleButton.addEventListener('click', () => {
            historyContent.style.display = historyContent.style.display === 'none' ? 'block' : 'none';
            toggleButton.querySelector('i').classList.toggle('fa-chevron-up');
            toggleButton.querySelector('i').classList.toggle('fa-chevron-down');
        });

        userFilter.addEventListener('change', () => this.updateHistory());
        timeFilter.addEventListener('change', () => this.updateHistory());

        // Iniciar monitoramento do histórico
        this.startHistoryMonitoring();
    }

    startHistoryMonitoring() {
        // Monitorar mudanças de localização dos usuários
        this.historyUnsubscribe = this.db.collection('users')
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    const userId = change.doc.id;
                    const data = change.doc.data();

                    if (data.location) {
                        this.updateUserPath(userId, data);
                    }
                });
            });

        // Atualizar lista de usuários no filtro
        this.updateUserList();
    }

    async updateUserList() {
        const userFilter = document.getElementById('user-filter');
        const users = await this.db.collection('users').get();
        
        users.forEach(doc => {
            const userData = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = userData.displayName || 'Usuário Anônimo';
            userFilter.appendChild(option);
        });
    }

    updateUserPath(userId, data) {
        // Salvar posição no histórico
        this.db.collection('movement_history').add({
            userId: userId,
            userName: data.displayName || 'Usuário Anônimo',
            location: data.location,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Atualizar caminho no mapa
        this.updatePathOnMap(userId);
    }

    async updatePathOnMap(userId) {
        try {
            const timeFilter = document.getElementById('time-filter');
            const hoursAgo = parseInt(timeFilter.value);
            const startTime = new Date();
            startTime.setHours(startTime.getHours() - hoursAgo);

            // Buscar pontos do histórico (simplificado para funcionar sem índice composto)
            const history = await this.db.collection('movement_history')
                .where('userId', '==', userId)
                .get();

            // Filtrar os resultados no cliente
            const filteredDocs = history.docs.filter(doc => {
                const timestamp = doc.data().timestamp?.toDate();
                return timestamp && timestamp >= startTime;
            }).sort((a, b) => {
                const timeA = a.data().timestamp?.toDate() || 0;
                const timeB = b.data().timestamp?.toDate() || 0;
                return timeA - timeB;
            });

            // Criar array de coordenadas
            const coordinates = filteredDocs.map(doc => {
                const data = doc.data();
                return [data.location.latitude, data.location.longitude];
            });

            // Remover caminho antigo se existir
            if (this.userPaths.has(userId)) {
                this.userPaths.get(userId).remove();
            }

            // Criar novo caminho
            if (coordinates.length > 1) {
                const color = this.getRandomColor();
                const path = L.polyline(coordinates, {
                    color: color,
                    className: 'user-path'
                }).addTo(this.map);

                this.userPaths.set(userId, path);
            }
        } catch (error) {
            console.error('Erro ao atualizar caminho:', error);
        }
    }

    getRandomColor() {
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    updateHistory() {
        const userFilter = document.getElementById('user-filter');
        const timeFilter = document.getElementById('time-filter');
        const selectedUser = userFilter.value;
        const hoursAgo = parseInt(timeFilter.value);

        // Limpar caminhos antigos
        this.userPaths.forEach(path => path.remove());
        this.userPaths.clear();

        // Atualizar caminhos para usuários selecionados
        if (selectedUser === 'all') {
            this.db.collection('users').get().then(users => {
                users.forEach(user => this.updatePathOnMap(user.id));
            });
        } else {
            this.updatePathOnMap(selectedUser);
        }
    }

    cleanup() {
        if (this.historyUnsubscribe) {
            this.historyUnsubscribe();
        }

        // Remover todos os caminhos
        this.userPaths.forEach(path => path.remove());
        this.userPaths.clear();
    }

    setupCleanup() {
        // Executar limpeza imediatamente e depois a cada hora
        this.cleanOldRecords();
        setInterval(() => this.cleanOldRecords(), 3600000); // 1 hora em milissegundos
    }

    async cleanOldRecords() {
        try {
            const oneDayAgo = new Date();
            oneDayAgo.setHours(oneDayAgo.getHours() - 24);

            const snapshot = await this.db.collection('movement_history')
                .where('timestamp', '<', oneDayAgo)
                .get();

            // Deletar em lotes para melhor performance
            const batch = this.db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            console.log(`Limpeza: ${snapshot.size} registros de movimentação removidos`);
        } catch (error) {
            console.error('Erro ao limpar histórico de movimentação:', error);
        }
    }
}

// Exportar para uso global
window.MovementHistory = MovementHistory;

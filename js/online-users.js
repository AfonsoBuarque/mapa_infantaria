class OnlineUsersManager {
    constructor(map) {
        this.map = map;
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.userMarkers = new Map();
        this.currentUserRef = null;
        this.presenceInterval = null;
        
        // Ícones personalizados para usuários
        this.userIcon = L.divIcon({
            html: '<i class="fas fa-user" style="color: #2ecc71; font-size: 24px; text-shadow: 2px 2px 2px rgba(0,0,0,0.3);"></i>',
            className: 'user-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        this.currentUserIcon = L.divIcon({
            html: '<i class="fas fa-user" style="color: #3498db; font-size: 24px; text-shadow: 2px 2px 2px rgba(0,0,0,0.3);"></i>',
            className: 'current-user-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
    }

    async init() {
        this.auth.onAuthStateChanged(async (user) => {
            if (user) {
                await this.setupPresenceMonitoring(user);
                this.startTrackingOnlineUsers();
            } else {
                this.cleanup();
            }
        });
    }

    async setupPresenceMonitoring(user) {
        try {
            // Atualizar informações do usuário
            this.currentUserRef = this.db.collection('users').doc(user.uid);
            await this.currentUserRef.set({
                displayName: user.displayName || 'Usuário Anônimo',
                email: user.email,
                photoURL: user.photoURL,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
                online: true
            }, { merge: true });

            // Atualizar status periodicamente
            this.presenceInterval = setInterval(() => {
                this.updatePresence(user.uid);
            }, 30000); // A cada 30 segundos

            // Iniciar monitoramento de localização
            this.startLocationTracking();

            // Configurar limpeza ao fechar a página
            window.addEventListener('beforeunload', () => {
                this.setOffline(user.uid);
            });

        } catch (error) {
            console.error('Erro ao configurar presença:', error);
        }
    }

    async updatePresence(userId) {
        try {
            await this.currentUserRef.update({
                lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
                online: true
            });
        } catch (error) {
            console.error('Erro ao atualizar presença:', error);
        }
    }

    async setOffline(userId) {
        try {
            await this.currentUserRef.update({
                online: false,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Erro ao definir offline:', error);
        }
    }

    async updateUserLocation(position, userId) {
        try {
            await this.currentUserRef.update({
                location: new firebase.firestore.GeoPoint(position.coords.latitude, position.coords.longitude),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Erro ao atualizar localização:', error);
        }
    }

    startTrackingOnlineUsers() {
        // Monitorar usuários online
        this.onlineUsersUnsubscribe = this.db.collection('users')
            .where('online', '==', true)
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    const userId = change.doc.id;
                    const data = change.doc.data();

                    if (change.type === 'removed' || !data.online) {
                        this.removeUserMarker(userId);
                    } else if (data.location) {
                        this.updateUserMarker(userId, data);
                    }
                });
            }, (error) => {
                console.error('Erro ao monitorar usuários:', error);
            });
    }

    updateUserMarker(userId, data) {
        const isCurrentUser = userId === this.auth.currentUser?.uid;
        const position = [data.location.latitude, data.location.longitude];
        
        if (this.userMarkers.has(userId)) {
            this.userMarkers.get(userId).setLatLng(position);
        } else {
            const marker = L.marker(position, {
                icon: isCurrentUser ? this.currentUserIcon : this.userIcon
            });

            marker.bindPopup(`
                <div style="text-align: center;">
                    ${data.photoURL ? `<img src="${data.photoURL}" style="width: 32px; height: 32px; border-radius: 50%; margin-bottom: 5px;">` : ''}
                    <div><strong>${data.displayName}</strong></div>
                    <div style="font-size: 12px; color: #666;">${data.email}</div>
                </div>
            `);

            marker.addTo(this.map);
            this.userMarkers.set(userId, marker);
        }
    }

    removeUserMarker(userId) {
        if (this.userMarkers.has(userId)) {
            this.userMarkers.get(userId).remove();
            this.userMarkers.delete(userId);
        }
    }

    cleanup() {
        // Limpar intervalo de presença
        if (this.presenceInterval) {
            clearInterval(this.presenceInterval);
        }

        // Limpar monitoramento de usuários
        if (this.onlineUsersUnsubscribe) {
            this.onlineUsersUnsubscribe();
        }

        // Limpar watch position
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
        }

        // Definir usuário como offline
        if (this.auth.currentUser && this.currentUserRef) {
            this.setOffline(this.auth.currentUser.uid);
        }

        // Remover todos os marcadores
        this.userMarkers.forEach(marker => marker.remove());
        this.userMarkers.clear();

        // Limpar referências
        this.currentUserRef = null;
    }

    startLocationTracking() {
        const options = {
            enableHighAccuracy: true,
            timeout: 30000, // Aumentado para 30 segundos
            maximumAge: 0
        };

        if (!navigator.geolocation) {
            console.error('Geolocalização não suportada neste navegador');
            alert('Seu navegador não suporta geolocalização. Por favor, use um navegador mais recente.');
            return;
        }

        // Primeiro, tentar obter a localização uma vez
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.updateUserLocation(position, this.auth.currentUser.uid);
                this.startContinuousTracking(options);
            },
            (error) => {
                this.handleGeolocationError(error);
                // Tentar novamente após 5 segundos
                setTimeout(() => this.startLocationTracking(), 5000);
            },
            options
        );
    }

    startContinuousTracking(options) {
        // Iniciar monitoramento contínuo
        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.updateUserLocation(position, this.auth.currentUser.uid);
            },
            (error) => {
                this.handleGeolocationError(error);
                // Se o watch falhar, tentar reiniciar após 5 segundos
                navigator.geolocation.clearWatch(this.watchId);
                setTimeout(() => this.startContinuousTracking(options), 5000);
            },
            options
        );
    }

    handleGeolocationError(error) {
        let errorMessage = 'Erro ao obter localização: ';
        
        switch(error.code) {
            case error.PERMISSION_DENIED:
                errorMessage += 'Permissão negada. Por favor, permita o acesso à sua localização nas configurações do navegador.';
                // Mostrar instruções específicas para cada navegador
                if (navigator.userAgent.includes('Chrome')) {
                    errorMessage += '\n\nNo Chrome:\n1. Clique no ícone de cadeado na barra de endereço\n2. Clique em "Permissões"\n3. Ative "Localização"';
                } else if (navigator.userAgent.includes('Firefox')) {
                    errorMessage += '\n\nNo Firefox:\n1. Clique no ícone de informação na barra de endereço\n2. Clique em "Mais Informações"\n3. Em Permissões, ative "Acessar Sua Localização"';
                }
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage += 'Informação de localização indisponível. Verifique se o GPS está ativado.';
                break;
            case error.TIMEOUT:
                errorMessage += 'Tempo limite excedido. Tentando novamente...';
                break;
            default:
                errorMessage += 'Erro desconhecido ao obter localização.';
        }

        console.error('Geolocation error:', error);
        
        // Mostrar mensagem de erro mais amigável
        const errorDiv = document.createElement('div');
        errorDiv.className = 'geolocation-error';
        errorDiv.innerHTML = `
            <div class="error-content">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${errorMessage}</p>
                <button onclick="this.parentElement.parentElement.remove()">OK</button>
            </div>
        `;

        // Adicionar estilos se ainda não existirem
        if (!document.getElementById('geolocation-error-styles')) {
            const style = document.createElement('style');
            style.id = 'geolocation-error-styles';
            style.textContent = `
                .geolocation-error {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    z-index: 1000;
                    max-width: 90%;
                    width: 400px;
                }

                .error-content {
                    text-align: center;
                }

                .error-content i {
                    color: #e74c3c;
                    font-size: 24px;
                    margin-bottom: 10px;
                }

                .error-content p {
                    margin: 10px 0;
                    white-space: pre-line;
                }

                .error-content button {
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 8px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 10px;
                }

                .error-content button:hover {
                    background: #2980b9;
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(errorDiv);

        // Remover a mensagem após 10 segundos
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 10000);
    }
}

// Exportar para uso global
window.OnlineUsersManager = OnlineUsersManager;

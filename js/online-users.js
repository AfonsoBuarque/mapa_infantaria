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
            if ("geolocation" in navigator) {
                this.watchId = navigator.geolocation.watchPosition(
                    (position) => this.updateUserLocation(position, user.uid),
                    (error) => console.error('Erro ao obter localização:', error),
                    {
                        enableHighAccuracy: true,
                        maximumAge: 10000,
                        timeout: 5000
                    }
                );
            }

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
}

// Exportar para uso global
window.OnlineUsersManager = OnlineUsersManager;

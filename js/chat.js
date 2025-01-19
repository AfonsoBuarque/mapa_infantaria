class ChatManager {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.messagesUnsubscribe = null;
        this.setupUI();
        this.setupEventListeners();
        this.setupCleanup();
    }

    setupUI() {
        // Criar container do chat
        const chatContainer = document.createElement('div');
        chatContainer.id = 'chat-container';
        chatContainer.innerHTML = `
            <div class="chat-header">
                <span>Chat</span>
                <button id="toggle-chat" class="toggle-chat">
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
            <div class="chat-messages" id="chat-messages"></div>
            <div class="chat-input">
                <input type="text" id="message-input" placeholder="Digite sua mensagem...">
                <button id="send-message">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        `;
        document.body.appendChild(chatContainer);

        // Adicionar estilos
        const style = document.createElement('style');
        style.textContent = `
            #chat-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 300px;
                background: white;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 1000;
                display: flex;
                flex-direction: column;
                max-height: 400px;
            }

            .chat-header {
                padding: 10px 15px;
                background: #2c3e50;
                color: white;
                border-radius: 10px 10px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
            }

            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 10px;
                max-height: 300px;
            }

            .chat-input {
                padding: 10px;
                border-top: 1px solid #eee;
                display: flex;
                gap: 10px;
            }

            .chat-input input {
                flex: 1;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                outline: none;
            }

            .chat-input button {
                background: #2c3e50;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
            }

            .message {
                margin-bottom: 10px;
                padding: 8px 12px;
                border-radius: 8px;
                max-width: 80%;
                word-wrap: break-word;
            }

            .message.sent {
                background: #3498db;
                color: white;
                margin-left: auto;
            }

            .message.received {
                background: #eee;
                margin-right: auto;
            }

            .message .sender {
                font-size: 0.8em;
                margin-bottom: 4px;
                opacity: 0.8;
            }

            .message .time {
                font-size: 0.7em;
                opacity: 0.7;
                margin-top: 4px;
                text-align: right;
            }

            @media (max-width: 480px) {
                #chat-container {
                    width: 100%;
                    bottom: 0;
                    right: 0;
                    border-radius: 10px 10px 0 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-message');
        const toggleButton = document.getElementById('toggle-chat');
        const chatMessages = document.getElementById('chat-messages');
        const chatContainer = document.getElementById('chat-container');

        // Enviar mensagem
        const sendMessage = async () => {
            const message = messageInput.value.trim();
            if (!message) return;

            const user = this.auth.currentUser;
            if (!user) return;

            try {
                await this.db.collection('chat').add({
                    text: message,
                    userId: user.uid,
                    userName: user.displayName || 'Usuário Anônimo',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

                messageInput.value = '';
                chatMessages.scrollTop = chatMessages.scrollHeight;
            } catch (error) {
                console.error('Erro ao enviar mensagem:', error);
            }
        };

        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        // Toggle chat
        toggleButton.addEventListener('click', () => {
            chatMessages.style.display = chatMessages.style.display === 'none' ? 'block' : 'none';
            toggleButton.querySelector('i').classList.toggle('fa-chevron-up');
            toggleButton.querySelector('i').classList.toggle('fa-chevron-down');
        });

        // Iniciar monitoramento de mensagens
        this.startMessageMonitoring();
    }

    setupCleanup() {
        // Executar limpeza imediatamente e depois a cada hora
        this.cleanOldMessages();
        setInterval(() => this.cleanOldMessages(), 3600000); // 1 hora em milissegundos
    }

    async cleanOldMessages() {
        try {
            const oneDayAgo = new Date();
            oneDayAgo.setHours(oneDayAgo.getHours() - 24);

            const snapshot = await this.db.collection('chat')
                .where('timestamp', '<', oneDayAgo)
                .get();

            // Deletar em lotes para melhor performance
            const batch = this.db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            console.log(`Limpeza: ${snapshot.size} mensagens removidas`);
        } catch (error) {
            console.error('Erro ao limpar mensagens:', error);
        }
    }

    startMessageMonitoring() {
        const chatMessages = document.getElementById('chat-messages');
        
        this.messagesUnsubscribe = this.db.collection('chat')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .onSnapshot((snapshot) => {
                const changes = snapshot.docChanges();
                
                changes.reverse().forEach((change) => {
                    if (change.type === 'added') {
                        const data = change.doc.data();
                        const isCurrentUser = data.userId === this.auth.currentUser?.uid;
                        
                        const messageDiv = document.createElement('div');
                        messageDiv.className = `message ${isCurrentUser ? 'sent' : 'received'}`;
                        
                        const time = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleTimeString() : '';
                        
                        messageDiv.innerHTML = `
                            ${!isCurrentUser ? `<div class="sender">${data.userName}</div>` : ''}
                            <div class="text">${data.text}</div>
                            <div class="time">${time}</div>
                        `;
                        
                        chatMessages.appendChild(messageDiv);
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                });
            });
    }

    cleanup() {
        if (this.messagesUnsubscribe) {
            this.messagesUnsubscribe();
        }
    }
}

// Exportar para uso global
window.ChatManager = ChatManager;

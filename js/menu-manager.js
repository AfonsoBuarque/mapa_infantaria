class MenuManager {
    constructor() {
        this.setupUI();
        this.setupEventListeners();
    }

    setupUI() {
        // Criar o botão do menu
        const menuButton = document.createElement('div');
        menuButton.id = 'menu-button';
        menuButton.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.appendChild(menuButton);

        // Criar o menu lateral
        const menuContainer = document.createElement('div');
        menuContainer.id = 'side-menu';
        menuContainer.innerHTML = `
            <div class="menu-header">
                <span>Menu</span>
                <button type="button" id="close-menu" class="close-button">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="menu-items">
                <button type="button" id="toggle-chat-menu" class="menu-item">
                    <i class="fas fa-comments"></i>
                    Chat
                </button>
                <button type="button" id="toggle-history-menu" class="menu-item">
                    <i class="fas fa-history"></i>
                    Histórico
                </button>
            </div>
        `;
        document.body.appendChild(menuContainer);

        // Adicionar estilos
        const style = document.createElement('style');
        style.textContent = `
            #menu-button {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 40px;
                height: 40px;
                background: #2c3e50;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 1001;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }

            #side-menu {
                position: fixed;
                top: 0;
                right: -300px;
                width: 300px;
                height: 100vh;
                background: white;
                box-shadow: -2px 0 5px rgba(0,0,0,0.1);
                z-index: 1002;
                transition: right 0.3s ease;
            }

            #side-menu.open {
                right: 0;
            }

            .menu-header {
                padding: 20px;
                background: #2c3e50;
                color: white;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .close-button {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 1.2em;
                padding: 8px;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: background-color 0.3s;
            }

            .close-button:hover {
                background-color: rgba(255,255,255,0.1);
            }

            .menu-items {
                padding: 20px;
            }

            .menu-item {
                width: 100%;
                padding: 15px;
                margin-bottom: 10px;
                border: none;
                background: #f8f9fa;
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 10px;
                transition: background 0.3s ease;
            }

            .menu-item:hover {
                background: #e9ecef;
            }

            .menu-item i {
                font-size: 1.2em;
                color: #2c3e50;
            }

            #chat-container, #history-container {
                display: none;
            }

            #chat-container.visible, #history-container.visible {
                display: block;
            }

            @media (max-width: 480px) {
                #side-menu {
                    width: 100%;
                    right: -100%;
                }

                #chat-container, #history-container {
                    width: 100%;
                    right: 0;
                    left: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        const menuButton = document.getElementById('menu-button');
        const closeButton = document.getElementById('close-menu');
        const sideMenu = document.getElementById('side-menu');
        const toggleChatButton = document.getElementById('toggle-chat-menu');
        const toggleHistoryButton = document.getElementById('toggle-history-menu');

        // Abrir menu
        menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            sideMenu.classList.add('open');
        });

        // Fechar menu com o X
        if (closeButton) {
            closeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                sideMenu.classList.remove('open');
                // Fechar também o chat e histórico
                const chatContainer = document.getElementById('chat-container');
                const historyContainer = document.getElementById('history-container');
                if (chatContainer) chatContainer.classList.remove('visible');
                if (historyContainer) historyContainer.classList.remove('visible');
            });
        }

        // Fechar menu ao clicar fora
        document.addEventListener('click', (e) => {
            if (!sideMenu.contains(e.target) && !menuButton.contains(e.target)) {
                sideMenu.classList.remove('open');
                // Fechar também o chat e histórico
                const chatContainer = document.getElementById('chat-container');
                const historyContainer = document.getElementById('history-container');
                if (chatContainer) chatContainer.classList.remove('visible');
                if (historyContainer) historyContainer.classList.remove('visible');
            }
        });

        // Prevenir que cliques dentro do menu fechem ele
        sideMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Toggle chat
        toggleChatButton.addEventListener('click', () => {
            const chatContainer = document.getElementById('chat-container');
            const historyContainer = document.getElementById('history-container');
            
            chatContainer.classList.toggle('visible');
            historyContainer.classList.remove('visible');
            sideMenu.classList.remove('open');
        });

        // Toggle histórico
        toggleHistoryButton.addEventListener('click', () => {
            const chatContainer = document.getElementById('chat-container');
            const historyContainer = document.getElementById('history-container');
            
            historyContainer.classList.toggle('visible');
            chatContainer.classList.remove('visible');
            sideMenu.classList.remove('open');
        });
    }
}

// Exportar para uso global
window.MenuManager = MenuManager;

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

        // Criar o menu lateral
        const menuContainer = document.createElement('div');
        menuContainer.id = 'side-menu';
        menuContainer.innerHTML = `
            <div class="menu-header">
                <span>Menu</span>
                <button type="button" id="close-menu" class="close-button" data-action="close">
                    <i class="fas fa-times" data-action="close"></i>
                </button>
            </div>
            <div class="menu-content">
                <div class="menu-items">
                    <button id="toggle-chat-menu" class="menu-item">
                        <i class="fas fa-comments"></i>
                        Chat
                    </button>
                    <button id="toggle-history-menu" class="menu-item">
                        <i class="fas fa-history"></i>
                        Histórico
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(menuButton);
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
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                background: rgba(255,255,255,0.1);
                border: none;
                border-radius: 4px;
                color: white;
                padding: 0;
                transition: background 0.3s ease;
            }

            .close-button:hover {
                background: rgba(255,255,255,0.2);
            }

            .menu-content {
                height: calc(100vh - 60px);
                overflow-y: auto;
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
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Elementos do DOM
        const menuButton = document.getElementById('menu-button');
        const sideMenu = document.getElementById('side-menu');
        const closeButton = document.getElementById('close-menu');
        const toggleChatButton = document.getElementById('toggle-chat-menu');
        const toggleHistoryButton = document.getElementById('toggle-history-menu');

        // Função para fechar o menu
        const closeMenu = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            if (sideMenu) {
                sideMenu.classList.remove('open');
            }
        };

        // Abrir menu
        if (menuButton) {
            menuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                if (sideMenu) {
                    sideMenu.classList.add('open');
                }
            });
        }

        // Fechar menu com o X
        if (closeButton) {
            // Usar evento nativo do botão
            closeButton.onclick = (e) => {
                closeMenu(e);
            };
        }

        // Delegação de eventos para o menu inteiro
        if (sideMenu) {
            sideMenu.addEventListener('click', (e) => {
                // Se o elemento clicado (ou seus pais) tem o atributo data-action="close"
                const closeEl = e.target.closest('[data-action="close"]');
                if (closeEl) {
                    closeMenu(e);
                    return;
                }

                // Prevenir que cliques dentro do menu o fechem
                e.stopPropagation();
            });
        }

        // Fechar menu ao clicar fora
        document.addEventListener('click', (e) => {
            if (!sideMenu?.contains(e.target) && !menuButton?.contains(e.target)) {
                closeMenu();
            }
        });

        // Toggle chat
        if (toggleChatButton) {
            toggleChatButton.addEventListener('click', () => {
                const chatContainer = document.getElementById('chat-container');
                const historyContainer = document.getElementById('history-container');
                
                if (chatContainer && historyContainer) {
                    chatContainer.classList.toggle('visible');
                    historyContainer.classList.remove('visible');
                    closeMenu();
                }
            });
        }

        // Toggle histórico
        if (toggleHistoryButton) {
            toggleHistoryButton.addEventListener('click', () => {
                const chatContainer = document.getElementById('chat-container');
                const historyContainer = document.getElementById('history-container');
                
                if (chatContainer && historyContainer) {
                    historyContainer.classList.toggle('visible');
                    chatContainer.classList.remove('visible');
                    closeMenu();
                }
            });
        }
    }
}

// Exportar para uso global
window.MenuManager = MenuManager;

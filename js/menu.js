// Controles do menu hamburguer
document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const menuBtn = document.getElementById('close-menu');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (menuBtn && sidebar && overlay) {
        // Função para abrir/fechar o menu
        function toggleMenu() {
            sidebar.classList.toggle('active');
            if (overlay) {
                overlay.classList.toggle('active');
            }
        }

        // Event Listeners
        menuBtn.addEventListener('click', toggleMenu);
        if (overlay) {
            overlay.addEventListener('click', toggleMenu);
        }

        // Fechar menu com tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('active')) {
                toggleMenu();
            }
        });

        // Fechar o menu ao clicar fora dele
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 768 && 
                !sidebar.contains(e.target) && 
                !menuBtn.contains(e.target)) {
                toggleMenu();
            }
        });

        // Prevenir que cliques dentro do sidebar fechem o menu
        sidebar.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        // Fechar o menu ao redimensionar a tela para desktop
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                toggleMenu();
            }
        });
    }

    // Botão de listar marcadores
    const listMarkersBtn = document.getElementById('list-markers');
    if (listMarkersBtn) {
        listMarkersBtn.addEventListener('click', function() {
            if (sidebar) {
                sidebar.classList.add('active');
                if (overlay) {
                    overlay.classList.add('active');
                }
            }
        });
    }
});

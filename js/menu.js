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

    // Menu Mobile
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileMenuClose = document.querySelector('.mobile-menu-close');
    const body = document.body;

    // Criar overlay
    const overlayMobile = document.createElement('div');
    overlayMobile.className = 'mobile-menu-overlay';
    body.appendChild(overlayMobile);

    // Abrir menu
    mobileMenuBtn.addEventListener('click', function() {
        mobileMenu.classList.add('active');
        overlayMobile.classList.add('active');
        body.style.overflow = 'hidden';
    });

    // Fechar menu
    function closeMenu() {
        mobileMenu.classList.remove('active');
        overlayMobile.classList.remove('active');
        body.style.overflow = '';
    }

    mobileMenuClose.addEventListener('click', closeMenu);
    overlayMobile.addEventListener('click', closeMenu);

    // Sincronizar ações entre menu desktop e mobile
    const mapTypeMobile = document.getElementById('map-type-mobile');
    const mapTypeDesktop = document.getElementById('map-type');

    mapTypeMobile.addEventListener('change', function() {
        mapTypeDesktop.value = this.value;
        mapTypeDesktop.dispatchEvent(new Event('change'));
        closeMenu();
    });

    mapTypeDesktop.addEventListener('change', function() {
        mapTypeMobile.value = this.value;
    });

    // Botões do menu mobile
    document.getElementById('toggle-draw-mobile').addEventListener('click', function() {
        document.getElementById('toggle-draw').click();
        closeMenu();
    });

    document.getElementById('list-markers-mobile').addEventListener('click', function() {
        document.getElementById('list-markers').click();
        closeMenu();
    });

    document.getElementById('import-kml-mobile').addEventListener('click', function() {
        document.getElementById('import-kml').click();
        closeMenu();
    });

    document.getElementById('export-kml-mobile').addEventListener('click', function() {
        document.getElementById('export-kml').click();
        closeMenu();
    });

    document.getElementById('location-btn-mobile').addEventListener('click', function() {
        document.getElementById('location-btn').click();
        closeMenu();
    });

    // Coordenadas
    const latMobile = document.getElementById('lat-mobile');
    const lngMobile = document.getElementById('lng-mobile');
    const latDesktop = document.getElementById('lat');
    const lngDesktop = document.getElementById('lng');

    // Sincronizar inputs de coordenadas
    latMobile.addEventListener('input', function() {
        latDesktop.value = this.value;
    });

    lngMobile.addEventListener('input', function() {
        lngDesktop.value = this.value;
    });

    document.getElementById('search-coord-btn-mobile').addEventListener('click', function() {
        document.getElementById('search-coord-btn').click();
        closeMenu();
    });

    // Logout
    document.getElementById('logout-btn-mobile').addEventListener('click', function() {
        document.getElementById('logout-btn').click();
    });
});

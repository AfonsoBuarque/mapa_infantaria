// Espera o DOM estar completamente carregado
document.addEventListener('DOMContentLoaded', function() {
    // Configuração do Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyACZPubimPLAFWm5vebMJdgRtxmnY5ThOk",
        authDomain: "fft-solucoes.firebaseapp.com",
        projectId: "fft-solucoes",
        storageBucket: "fft-solucoes.firebasestorage.app",
        messagingSenderId: "478444990886",
        appId: "1:478444990886:web:02365a5028c823d3dcdf67",
        measurementId: "G-YT6J674H4V"
    };

    try {
        // Inicializa o Firebase
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        // Elementos do DOM
        const loginForm = document.getElementById('loginForm');
        const googleLoginBtn = document.getElementById('googleLogin');
        const errorMessage = document.getElementById('errorMessage');
        const loading = document.getElementById('loading');

        // Verifica se já está autenticado
        firebase.auth().onAuthStateChanged(function(user) {
            if (user && window.location.pathname.includes('login.html')) {
                console.log('Usuário autenticado:', user.email);
                window.location.href = 'index.html';
            }
        });

        // Função para mostrar erro
        function showError(message) {
            console.error('Erro de autenticação:', message);
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            loading.style.display = 'none';
        }

        // Função para mostrar loading
        function showLoading() {
            loading.style.display = 'block';
            errorMessage.style.display = 'none';
        }

        // Função para esconder loading
        function hideLoading() {
            loading.style.display = 'none';
        }

        // Login com Google
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', async function() {
                try {
                    showLoading();
                    const provider = new firebase.auth.GoogleAuthProvider();
                    provider.addScope('email');
                    provider.setCustomParameters({
                        prompt: 'select_account'
                    });
                    
                    const result = await firebase.auth().signInWithPopup(provider);
                    console.log('Login Google bem sucedido:', result.user.email);
                    // Redirecionamento será feito pelo onAuthStateChanged
                } catch (error) {
                    console.error('Erro completo:', error);
                    let errorMsg = 'Erro ao fazer login com Google.';
                    
                    switch (error.code) {
                        case 'auth/popup-blocked':
                            errorMsg = 'Por favor, permita popups para fazer login com Google.';
                            break;
                        case 'auth/popup-closed-by-user':
                            errorMsg = 'Login cancelado. Tente novamente.';
                            break;
                        case 'auth/cancelled-popup-request':
                            errorMsg = 'Apenas uma janela de login pode estar aberta por vez.';
                            break;
                        case 'auth/account-exists-with-different-credential':
                            errorMsg = 'Uma conta já existe com o mesmo email mas com diferente credencial.';
                            break;
                        case 'auth/unauthorized-domain':
                            errorMsg = 'Este domínio não está autorizado para login com Google. Entre em contato com o administrador.';
                            break;
                        default:
                            errorMsg = `Erro ao fazer login com Google: ${error.message}`;
                    }
                    
                    showError(errorMsg);
                } finally {
                    hideLoading();
                }
            });
        }

        // Event listener para o formulário de login
        if (loginForm) {
            loginForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                
                try {
                    showLoading();
                    await firebase.auth().signInWithEmailAndPassword(email, password);
                    console.log('Login email/senha bem sucedido');
                    // Redirecionamento será feito pelo onAuthStateChanged
                } catch (error) {
                    console.error('Erro completo:', error);
                    let errorMsg = 'Erro ao fazer login. Verifique suas credenciais.';
                    
                    switch (error.code) {
                        case 'auth/invalid-email':
                            errorMsg = 'E-mail inválido.';
                            break;
                        case 'auth/user-disabled':
                            errorMsg = 'Usuário desativado.';
                            break;
                        case 'auth/user-not-found':
                            errorMsg = 'Usuário não encontrado.';
                            break;
                        case 'auth/wrong-password':
                            errorMsg = 'Senha incorreta.';
                            break;
                        default:
                            errorMsg = `Erro ao fazer login: ${error.message}`;
                    }
                    
                    showError(errorMsg);
                } finally {
                    hideLoading();
                }
            });
        }
    } catch (error) {
        console.error('Erro na inicialização:', error);
        showError('Erro ao inicializar o sistema de autenticação. Por favor, recarregue a página.');
    }
});

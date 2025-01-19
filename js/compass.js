class CompassController {
    constructor() {
        this.createCompassElement();
        this.compassContainer = document.getElementById('compass-container');
        this.compassArrow = this.compassContainer.querySelector('.compass-arrow');
        this.compassText = this.compassContainer.querySelector('.compass-text');
        this.lastOrientation = 0;
        this.init();
    }

    createCompassElement() {
        const compassHtml = `
            <div class="compass-container" id="compass-container">
                <div class="compass">
                    <div class="compass-arrow"></div>
                    <div class="compass-text">N</div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', compassHtml);
    }

    init() {
        // Verificar se é um dispositivo móvel
        if (this.isMobileDevice()) {
            this.setupDeviceOrientation();
        } else {
            console.log('Não é um dispositivo móvel - bússola desativada');
            this.compassContainer.style.display = 'none';
        }
    }

    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    setupDeviceOrientation() {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS 13+ requer permissão
            this.compassContainer.addEventListener('click', async () => {
                try {
                    const permission = await DeviceOrientationEvent.requestPermission();
                    if (permission === 'granted') {
                        this.startListening();
                        this.compassContainer.style.display = 'block';
                    } else {
                        console.log('Permissão negada para acessar a orientação do dispositivo');
                        this.compassContainer.style.display = 'none';
                    }
                } catch (error) {
                    console.error('Erro ao solicitar permissão:', error);
                    this.compassContainer.style.display = 'none';
                }
            });
            
            // Mostrar a bússola para que o usuário possa clicar e conceder permissão
            this.compassContainer.style.display = 'block';
        } else {
            // Android e outros dispositivos
            this.startListening();
            this.compassContainer.style.display = 'block';
        }
    }

    startListening() {
        if (window.DeviceOrientationAbsoluteEvent) {
            window.addEventListener('deviceorientationabsolute', this.handleOrientation.bind(this), true);
        } else {
            window.addEventListener('deviceorientation', this.handleOrientation.bind(this), true);
        }
    }

    handleOrientation(event) {
        let heading;
        
        if (event.webkitCompassHeading) {
            // iOS
            heading = event.webkitCompassHeading;
        } else if (event.absolute === true && event.alpha !== null) {
            // Android
            heading = 360 - event.alpha;
        } else {
            // Dispositivo não suporta orientação absoluta
            console.log('Dispositivo não suporta orientação absoluta');
            return;
        }

        // Suavizar a rotação
        this.lastOrientation = this.smoothRotation(heading, this.lastOrientation);
        
        // Atualizar a seta da bússola
        this.compassArrow.style.transform = `rotate(${this.lastOrientation}deg)`;
        
        // Atualizar o texto
        const cardinalDirection = this.getCardinalDirection(this.lastOrientation);
        this.compassText.textContent = cardinalDirection;
    }

    smoothRotation(newRotation, oldRotation) {
        const smoothFactor = 0.3;
        return oldRotation + (smoothFactor * this.getShortestAngle(newRotation, oldRotation));
    }

    getShortestAngle(angle1, angle2) {
        const diff = ((angle1 - angle2 + 180) % 360) - 180;
        return diff < -180 ? diff + 360 : diff;
    }

    getCardinalDirection(degrees) {
        const directions = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
        const index = Math.round(degrees / 45) % 8;
        return directions[index];
    }
}

// Inicializar a bússola quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new CompassController();
});

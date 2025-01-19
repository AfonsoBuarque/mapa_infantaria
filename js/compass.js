class CompassControl {
    constructor(map) {
        this.map = map;
        this.setupCompass();
        this.setupEventListeners();
        this.lastOrientation = 0;
        this.isCalibrating = false;
    }

    setupCompass() {
        // Criar o container da bússola
        const compassContainer = document.createElement('div');
        compassContainer.className = 'compass-container';
        compassContainer.innerHTML = `
            <div class="compass">
                <div class="compass-arrow"></div>
                <div class="compass-circle"></div>
                <div class="compass-degrees">0°</div>
            </div>
            <div class="calibration-message" style="display: none;">
                <p>Calibrando bússola...</p>
                <p>Por favor, faça um movimento em forma de 8 com seu dispositivo.</p>
            </div>
        `;
        document.body.appendChild(compassContainer);

        // Adicionar estilos
        const style = document.createElement('style');
        style.textContent = `
            .compass-container {
                position: fixed;
                bottom: 20px;
                left: 20px;
                z-index: 1000;
            }

            .compass {
                width: 60px;
                height: 60px;
                position: relative;
                background: rgba(255, 255, 255, 0.9);
                border-radius: 50%;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.3s ease;
            }

            .compass-arrow {
                position: absolute;
                width: 4px;
                height: 30px;
                background: linear-gradient(to bottom, #e74c3c 50%, #2c3e50 50%);
                transform-origin: center;
            }

            .compass-circle {
                position: absolute;
                width: 8px;
                height: 8px;
                background: #2c3e50;
                border-radius: 50%;
            }

            .compass-degrees {
                position: absolute;
                bottom: -25px;
                width: 100%;
                text-align: center;
                font-size: 12px;
                color: #2c3e50;
                background: rgba(255, 255, 255, 0.8);
                padding: 2px 4px;
                border-radius: 4px;
            }

            .calibration-message {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                z-index: 1001;
            }

            .calibration-message p {
                margin: 10px 0;
            }

            @media (max-width: 480px) {
                .compass {
                    width: 50px;
                    height: 50px;
                }

                .compass-arrow {
                    height: 25px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        if (window.DeviceOrientationEvent) {
            // Verificar se precisa de permissão (iOS 13+)
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                // Criar botão para solicitar permissão
                const permissionButton = document.createElement('button');
                permissionButton.innerHTML = 'Ativar Bússola';
                permissionButton.className = 'compass-permission-button';
                permissionButton.style.cssText = `
                    position: fixed;
                    bottom: 90px;
                    left: 20px;
                    padding: 8px 16px;
                    background: #3498db;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    z-index: 1000;
                `;

                permissionButton.onclick = async () => {
                    try {
                        const permission = await DeviceOrientationEvent.requestPermission();
                        if (permission === 'granted') {
                            this.startCompass();
                            permissionButton.remove();
                        }
                    } catch (error) {
                        console.error('Erro ao solicitar permissão:', error);
                    }
                };

                document.body.appendChild(permissionButton);
            } else {
                // Não precisa de permissão, iniciar direto
                this.startCompass();
            }
        } else {
            console.warn('Dispositivo não suporta orientação');
        }
    }

    startCompass() {
        window.addEventListener('deviceorientation', (e) => {
            // Verificar se os dados são válidos
            if (e.alpha === null) {
                if (!this.isCalibrating) {
                    this.showCalibrationMessage();
                }
                return;
            }

            // Esconder mensagem de calibração se estiver visível
            if (this.isCalibrating) {
                this.hideCalibrationMessage();
            }

            // Obter o ângulo e aplicar suavização
            let angle = e.alpha;
            if (e.webkitCompassHeading) {
                // Para iOS
                angle = e.webkitCompassHeading;
            }

            // Suavizar a rotação
            const smoothFactor = 0.3;
            const smoothedAngle = this.smoothAngle(angle, smoothFactor);

            // Atualizar a bússola
            this.updateCompass(smoothedAngle);
        });
    }

    smoothAngle(newAngle, factor) {
        if (Math.abs(newAngle - this.lastOrientation) > 180) {
            if (newAngle > this.lastOrientation) {
                this.lastOrientation += 360;
            } else {
                this.lastOrientation -= 360;
            }
        }

        const smoothed = this.lastOrientation + factor * (newAngle - this.lastOrientation);
        this.lastOrientation = smoothed % 360;
        return this.lastOrientation;
    }

    updateCompass(degrees) {
        const compass = document.querySelector('.compass');
        const degreesDisplay = document.querySelector('.compass-degrees');
        
        if (compass && degreesDisplay) {
            compass.style.transform = `rotate(${degrees}deg)`;
            degreesDisplay.textContent = `${Math.round(degrees)}°`;
        }
    }

    showCalibrationMessage() {
        this.isCalibrating = true;
        const message = document.querySelector('.calibration-message');
        if (message) {
            message.style.display = 'block';
        }
    }

    hideCalibrationMessage() {
        this.isCalibrating = false;
        const message = document.querySelector('.calibration-message');
        if (message) {
            message.style.display = 'none';
        }
    }
}

// Exportar para uso global
window.CompassControl = CompassControl;

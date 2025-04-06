class CoinRenderer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.coin = null;
        this.targetRotation = 0;
        this.currentRotation = 0;
        this.isSpinning = false;
        this.container = document.getElementById('threejs-container');
        
        this.init();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, this.container.clientWidth/this.container.clientHeight, 0.1, 1000);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(1, 1, 2);
        this.scene.add(light);
        this.scene.add(new THREE.AmbientLight(0x404040));

        // Create coin
        this.createCoin('./images/heads.png', './images/tails.png');

        this.camera.position.z = 5;
        
        // Bind animate to preserve context
        this.animate = this.animate.bind(this);
        this.animate();
    }

    createCoin(headsTextureUrl, tailsTextureUrl) {
        const loader = new THREE.TextureLoader();
        
        // Load textures
        const headsTexture = loader.load(headsTextureUrl);
        const tailsTexture = loader.load(tailsTextureUrl);
        
        // Adjust texture properties for better fitting
        headsTexture.rotation = Math.PI;
        headsTexture.center.set(0.45, 0.38);
        headsTexture.repeat.set(0.8, 0.8);
        headsTexture.offset.set(0.1, 0.2); // Adjusted Y offset for heads
        
        tailsTexture.repeat.set(0.8, 0.8);
        tailsTexture.offset.set(0.1, 0.1);
        
        const materials = [
            new THREE.MeshPhongMaterial({ // Edge
                color: 0xF8DB82,
                shininess: 100,
                specular: 0x111111
            }),
            new THREE.MeshPhongMaterial({ // Heads
                map: headsTexture,
                shininess: 50,
                specular: 0x333333,
                side: THREE.DoubleSide
            }),
            new THREE.MeshPhongMaterial({ // Tails
                map: tailsTexture,
                shininess: 50,
                specular: 0x333333,
                side: THREE.DoubleSide
            })
        ];

        const geometry = new THREE.CylinderGeometry(2, 2, 0.2, 64);
        geometry.rotateX(Math.PI / 2);
        geometry.rotateZ(Math.PI + Math.PI/2);

        this.coin = new THREE.Mesh(geometry, materials);
        this.camera.position.set(0, 0, 4.5);
        this.camera.lookAt(0, 0, 0);
        
        this.scene.add(this.coin);
    }

    animate() {
        requestAnimationFrame(this.animate);
        
        if (!this.isSpinning) {
            // Slow continuous spin when idle
            this.coin.rotation.y += 0.01;
            // Keep coin slightly tilted during idle spin
            this.coin.rotation.x = Math.PI / 6;
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    spinToSide(side) {
        this.isSpinning = true;
        const spins = 5; // Number of full rotations
        const duration = 1000; // Animation duration in ms
        const startRotation = this.coin.rotation.y;
        
        // Calculate target rotation to show the correct face
        let targetRotation = side === 'heads' ? 0 : Math.PI;
        // Add full rotations
        targetRotation += Math.PI * 2 * spins;

        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth deceleration
            const easeOut = (t) => 1 - Math.pow(1 - t, 3);
            const currentProgress = easeOut(progress);
            
            // Update rotation
            this.coin.rotation.y = startRotation + (targetRotation - startRotation) * currentProgress;
            
            // Ensure coin faces user at the end
            if (side === 'heads') {
                this.coin.rotation.x = progress * Math.PI;
            } else {
                this.coin.rotation.x = progress * Math.PI + Math.PI;
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Ensure final position is exact
                this.coin.rotation.y = targetRotation % (Math.PI * 2);
                this.coin.rotation.x = side === 'heads' ? Math.PI : 0;
                this.isSpinning = false;
            }
        };

        requestAnimationFrame(animate);
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
}

// Export for use in main script
window.CoinRenderer = CoinRenderer;
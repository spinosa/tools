/**
 * Prime Spiral Galaxy - 3D Visualization
 * Interactive Three.js visualization of prime number distribution
 */

(function() {
    'use strict';

    // ============================================
    // Configuration & State
    // ============================================

    const CONFIG = {
        MAX_PRIME_LIMIT: 50000,
        DEFAULT_MAX_PRIME: 5000,
        DEFAULT_SPEED: 50,
        DEFAULT_TIGHTNESS: 0.5,
        PARTICLE_SIZE: 0.15,
        ANIMATION_FRAME_BATCH: 10,
        CAMERA_DISTANCE: 100,
        SPIRAL_HEIGHT_SCALE: 0.3,
        AUTO_ROTATE_SPEED: 0.5
    };

    const COLOR_THEMES = {
        coral: { h: 0, s: 1.0, l: 0.7 },
        gold: { h: 0.12, s: 1.0, l: 0.6 },
        ice: { h: 0.55, s: 0.8, l: 0.7 },
        neon: { h: 0.35, s: 1.0, l: 0.6 },
        rainbow: null // Special case
    };

    const state = {
        primes: [],
        visiblePrimeCount: 0,
        maxPrimeValue: CONFIG.DEFAULT_MAX_PRIME,
        animationSpeed: CONFIG.DEFAULT_SPEED,
        tightness: CONFIG.DEFAULT_TIGHTNESS,
        isPlaying: false,
        animationId: null,

        // Visual options
        colorTheme: 'coral',
        glowIntensity: 1,
        showGrid: true,
        showMarkers: true,
        autoRotate: true,

        // Drawer state
        drawerOpen: false,
        drawerDragStartY: 0,
        drawerCurrentY: 0
    };

    // Three.js objects
    let scene, camera, renderer, controls;
    let particleSystem, particleGeometry, particleMaterial;
    let gridHelper, markerSprites = [];
    let raycaster, mouse;

    // DOM Elements
    const elements = {};

    // ============================================
    // DOM Elements Cache
    // ============================================

    function cacheDOMElements() {
        elements.container = document.getElementById('container');
        elements.playPauseBtn = document.getElementById('playPauseBtn');
        elements.resetBtn = document.getElementById('resetBtn');
        elements.currentCount = document.getElementById('currentCount');
        elements.maxCount = document.getElementById('maxCount');
        elements.zoomIndicator = document.getElementById('zoomIndicator');
        elements.zoomIn = document.getElementById('zoomIn');
        elements.zoomOut = document.getElementById('zoomOut');
        elements.zoomReset = document.getElementById('zoomReset');

        elements.maxPrimeSlider = document.getElementById('maxPrimeSlider');
        elements.speedSlider = document.getElementById('speedSlider');
        elements.tightnessSlider = document.getElementById('tightnessSlider');
        elements.presetBtns = document.querySelectorAll('.preset-btn');

        elements.colorBtn = document.getElementById('colorBtn');
        elements.glowBtn = document.getElementById('glowBtn');
        elements.gridBtn = document.getElementById('gridBtn');
        elements.markersBtn = document.getElementById('markersBtn');

        elements.bottomDrawer = document.getElementById('bottomDrawer');
        elements.drawerHandle = document.getElementById('drawerHandle');
        elements.drawerHint = document.getElementById('drawerHint');
        elements.drawerOverlay = document.getElementById('drawerOverlay');
        elements.miniControlBar = document.getElementById('miniControlBar');

        elements.primeTooltip = document.getElementById('primeTooltip');
        elements.tooltipPrime = document.getElementById('tooltipPrime');
        elements.tooltipOrdinal = document.getElementById('tooltipOrdinal');
        elements.tooltipRadius = document.getElementById('tooltipRadius');
        elements.tooltipAngle = document.getElementById('tooltipAngle');

        elements.totalPrimes = document.getElementById('totalPrimes');
        elements.maxPrimeValue = document.getElementById('maxPrimeValue');
    }

    // ============================================
    // Prime Number Generation
    // ============================================

    function sieveOfEratosthenes(limit) {
        const sieve = new Uint8Array(limit + 1);
        const primes = [];

        for (let i = 2; i <= limit; i++) {
            if (!sieve[i]) {
                primes.push(i);
                for (let j = i * i; j <= limit; j += i) {
                    sieve[j] = 1;
                }
            }
        }

        return primes;
    }

    function generatePrimesUpTo(maxValue) {
        state.primes = sieveOfEratosthenes(maxValue);
    }

    function getOrdinal(n) {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    // ============================================
    // Three.js Setup
    // ============================================

    function initThreeJS() {
        const container = elements.container;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0d0d0d);
        scene.fog = new THREE.FogExp2(0x0d0d0d, 0.003);

        // Camera
        camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
        camera.position.set(0, 50, CONFIG.CAMERA_DISTANCE);

        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // Controls - OrbitControls for touch/drag rotation
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 20;
        controls.maxDistance = 500;
        controls.maxPolarAngle = Math.PI;
        controls.autoRotate = state.autoRotate;
        controls.autoRotateSpeed = CONFIG.AUTO_ROTATE_SPEED;
        controls.touches = {
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
        };

        // Raycaster for interaction
        raycaster = new THREE.Raycaster();
        raycaster.params.Points.threshold = 1;
        mouse = new THREE.Vector2();

        // Create particle system
        createParticleSystem();

        // Create grid
        createGrid();

        // Add ambient stars in background
        createBackgroundStars();

        // Handle resize
        window.addEventListener('resize', onWindowResize);

        // Click/tap handler for prime info
        renderer.domElement.addEventListener('click', onCanvasClick);
        renderer.domElement.addEventListener('touchend', onCanvasTouchEnd);
    }

    function createParticleSystem() {
        // Create geometry with positions for all possible primes
        particleGeometry = new THREE.BufferGeometry();

        const maxPrimes = sieveOfEratosthenes(CONFIG.MAX_PRIME_LIMIT).length;
        const positions = new Float32Array(maxPrimes * 3);
        const colors = new Float32Array(maxPrimes * 3);
        const sizes = new Float32Array(maxPrimes);

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Shader material for glowing particles
        particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                pointSize: { value: CONFIG.PARTICLE_SIZE * 100 },
                glowIntensity: { value: state.glowIntensity }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                varying float vSize;

                void main() {
                    vColor = color;
                    vSize = size;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform float glowIntensity;
                varying vec3 vColor;
                varying float vSize;

                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;

                    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                    float glow = exp(-dist * 3.0) * glowIntensity;

                    vec3 finalColor = vColor + vColor * glow;
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particleSystem);
    }

    function updateParticles() {
        const positions = particleGeometry.attributes.position.array;
        const colors = particleGeometry.attributes.color.array;
        const sizes = particleGeometry.attributes.size.array;

        const theme = COLOR_THEMES[state.colorTheme];
        const tightness = state.tightness;
        const heightScale = CONFIG.SPIRAL_HEIGHT_SCALE;

        for (let i = 0; i < state.visiblePrimeCount; i++) {
            const p = state.primes[i];
            const r = Math.pow(p, tightness);
            const theta = p;

            // 3D spiral coordinates
            const x = r * Math.cos(theta) * 0.5;
            const z = r * Math.sin(theta) * 0.5;
            const y = (i / state.primes.length) * 50 * heightScale - 25 * heightScale;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Color
            let color;
            if (state.colorTheme === 'rainbow') {
                color = new THREE.Color().setHSL((p % 360) / 360, 0.8, 0.6);
            } else {
                color = new THREE.Color().setHSL(theme.h, theme.s, theme.l);
            }

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            sizes[i] = CONFIG.PARTICLE_SIZE * (1 + Math.random() * 0.3);
        }

        // Hide remaining particles
        for (let i = state.visiblePrimeCount; i < state.primes.length; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = -1000;
            positions[i * 3 + 2] = 0;
            sizes[i] = 0;
        }

        particleGeometry.attributes.position.needsUpdate = true;
        particleGeometry.attributes.color.needsUpdate = true;
        particleGeometry.attributes.size.needsUpdate = true;
        particleGeometry.setDrawRange(0, state.visiblePrimeCount);
    }

    function createGrid() {
        // Create circular grid
        gridHelper = new THREE.Group();

        const gridMaterial = new THREE.LineBasicMaterial({
            color: 0x2a3a3a,
            transparent: true,
            opacity: 0.15
        });

        // Concentric circles
        for (let r = 10; r <= 60; r += 10) {
            const circleGeometry = new THREE.BufferGeometry();
            const points = [];
            for (let i = 0; i <= 64; i++) {
                const angle = (i / 64) * Math.PI * 2;
                points.push(new THREE.Vector3(r * Math.cos(angle), 0, r * Math.sin(angle)));
            }
            circleGeometry.setFromPoints(points);
            const circle = new THREE.Line(circleGeometry, gridMaterial);
            gridHelper.add(circle);
        }

        // Radial lines
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const lineGeometry = new THREE.BufferGeometry();
            lineGeometry.setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(60 * Math.cos(angle), 0, 60 * Math.sin(angle))
            ]);
            const line = new THREE.Line(lineGeometry, gridMaterial);
            gridHelper.add(line);
        }

        scene.add(gridHelper);
        gridHelper.visible = state.showGrid;
    }

    function createBackgroundStars() {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 2000;
        const positions = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 1000;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 1000;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 1000;
        }

        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const starMaterial = new THREE.PointsMaterial({
            color: 0x444466,
            size: 0.5,
            transparent: true,
            opacity: 0.6
        });

        const stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);
    }

    function onWindowResize() {
        const container = elements.container;
        const width = container.clientWidth;
        const height = container.clientHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    // ============================================
    // Animation Loop
    // ============================================

    function animate() {
        requestAnimationFrame(animate);

        controls.update();
        renderer.render(scene, camera);

        updateUI();
    }

    function startPrimeAnimation() {
        if (state.isPlaying) return;

        state.isPlaying = true;
        elements.playPauseBtn.classList.add('playing');
        controls.autoRotate = true;

        animatePrimes();
    }

    function stopPrimeAnimation() {
        state.isPlaying = false;
        elements.playPauseBtn.classList.remove('playing');

        if (state.animationId) {
            cancelAnimationFrame(state.animationId);
            state.animationId = null;
        }
    }

    function toggleAnimation() {
        if (state.isPlaying) {
            stopPrimeAnimation();
        } else {
            startPrimeAnimation();
        }
    }

    function resetAnimation() {
        stopPrimeAnimation();
        state.visiblePrimeCount = 0;
        updateParticles();
    }

    function animatePrimes() {
        if (!state.isPlaying) return;

        const batchSize = Math.ceil(state.animationSpeed / 10) * CONFIG.ANIMATION_FRAME_BATCH;

        if (state.visiblePrimeCount < state.primes.length) {
            state.visiblePrimeCount = Math.min(
                state.visiblePrimeCount + batchSize,
                state.primes.length
            );
            updateParticles();
            state.animationId = requestAnimationFrame(animatePrimes);
        } else {
            stopPrimeAnimation();
        }
    }

    // ============================================
    // Interaction Handlers
    // ============================================

    function onCanvasClick(event) {
        handleInteraction(event.clientX, event.clientY);
    }

    function onCanvasTouchEnd(event) {
        if (event.changedTouches.length === 1) {
            const touch = event.changedTouches[0];
            handleInteraction(touch.clientX, touch.clientY);
        }
    }

    function handleInteraction(clientX, clientY) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(particleSystem);

        if (intersects.length > 0) {
            const index = intersects[0].index;
            if (index < state.visiblePrimeCount) {
                showTooltip(index, clientX, clientY);
                triggerHaptic();
            }
        } else {
            hideTooltip();
        }
    }

    // ============================================
    // Tooltip
    // ============================================

    function showTooltip(index, clientX, clientY) {
        const prime = state.primes[index];
        const r = Math.pow(prime, state.tightness).toFixed(2);

        elements.tooltipPrime.textContent = prime.toLocaleString();
        elements.tooltipOrdinal.textContent = `The ${getOrdinal(index + 1)} prime`;
        elements.tooltipRadius.textContent = `r = ${r}`;
        elements.tooltipAngle.textContent = `θ = ${prime} rad`;

        const tooltip = elements.primeTooltip;

        let left = clientX - 80;
        let top = clientY - 150;

        left = Math.max(10, Math.min(window.innerWidth - 170, left));
        top = Math.max(10, top);

        if (top < 10) {
            top = clientY + 20;
        }

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        tooltip.classList.add('visible');
        tooltip.setAttribute('aria-hidden', 'false');
    }

    function hideTooltip() {
        elements.primeTooltip.classList.remove('visible');
        elements.primeTooltip.setAttribute('aria-hidden', 'true');
    }

    // ============================================
    // Drawer Controls
    // ============================================

    function setupDrawer() {
        elements.drawerHandle.addEventListener('touchstart', handleDrawerDragStart, { passive: false });
        elements.drawerHandle.addEventListener('touchmove', handleDrawerDragMove, { passive: false });
        elements.drawerHandle.addEventListener('touchend', handleDrawerDragEnd, { passive: false });

        elements.drawerHandle.addEventListener('click', toggleDrawer);
        elements.drawerHandle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleDrawer();
            }
        });

        elements.drawerHint.addEventListener('click', openDrawer);
        elements.drawerOverlay.addEventListener('click', closeDrawer);

        elements.miniControlBar.addEventListener('touchstart', (e) => {
            state.drawerDragStartY = e.touches[0].clientY;
        }, { passive: true });

        elements.miniControlBar.addEventListener('touchmove', (e) => {
            const deltaY = state.drawerDragStartY - e.touches[0].clientY;
            if (deltaY > 50) {
                openDrawer();
            }
        }, { passive: true });
    }

    function handleDrawerDragStart(e) {
        e.preventDefault();
        state.drawerDragStartY = e.touches[0].clientY;
        elements.bottomDrawer.style.transition = 'none';
    }

    function handleDrawerDragMove(e) {
        e.preventDefault();
        const deltaY = state.drawerDragStartY - e.touches[0].clientY;
        state.drawerCurrentY = deltaY;
    }

    function handleDrawerDragEnd() {
        elements.bottomDrawer.style.transition = '';

        if (state.drawerOpen && state.drawerCurrentY < -50) {
            closeDrawer();
        } else if (!state.drawerOpen && state.drawerCurrentY > 50) {
            openDrawer();
        }

        state.drawerCurrentY = 0;
    }

    function toggleDrawer() {
        if (state.drawerOpen) {
            closeDrawer();
        } else {
            openDrawer();
        }
    }

    function openDrawer() {
        state.drawerOpen = true;
        elements.bottomDrawer.classList.add('open');
        elements.bottomDrawer.setAttribute('aria-hidden', 'false');
        elements.drawerOverlay.classList.add('visible');
        elements.miniControlBar.style.transform = 'translateY(100%)';
    }

    function closeDrawer() {
        state.drawerOpen = false;
        elements.bottomDrawer.classList.remove('open');
        elements.bottomDrawer.setAttribute('aria-hidden', 'true');
        elements.drawerOverlay.classList.remove('visible');
        elements.miniControlBar.style.transform = '';
    }

    // ============================================
    // Controls Setup
    // ============================================

    function setupControls() {
        // Play/Pause
        elements.playPauseBtn.addEventListener('click', toggleAnimation);

        // Reset
        elements.resetBtn.addEventListener('click', resetAnimation);

        // Max Prime Slider
        elements.maxPrimeSlider.addEventListener('input', debounce((e) => {
            const value = parseInt(e.target.value);
            updateMaxPrime(value);
        }, 100));

        // Preset Buttons
        elements.presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const value = parseInt(btn.dataset.value);
                elements.maxPrimeSlider.value = value;
                updateMaxPrime(value);

                elements.presetBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                triggerHaptic();
            });
        });

        // Speed Slider
        elements.speedSlider.addEventListener('input', (e) => {
            state.animationSpeed = parseInt(e.target.value);
        });

        // Tightness Slider
        elements.tightnessSlider.addEventListener('input', debounce((e) => {
            state.tightness = parseFloat(e.target.value);
            updateParticles();
        }, 50));

        // Visual Settings
        elements.colorBtn.addEventListener('click', cycleColorTheme);
        elements.glowBtn.addEventListener('click', cycleGlowIntensity);
        elements.gridBtn.addEventListener('click', toggleGrid);
        elements.markersBtn.addEventListener('click', toggleMarkers);

        // Zoom buttons
        elements.zoomIn.addEventListener('click', () => {
            camera.position.multiplyScalar(0.8);
        });
        elements.zoomOut.addEventListener('click', () => {
            camera.position.multiplyScalar(1.2);
        });
        elements.zoomReset.addEventListener('click', () => {
            camera.position.set(0, 50, CONFIG.CAMERA_DISTANCE);
            controls.reset();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboard);
    }

    function updateMaxPrime(value) {
        state.maxPrimeValue = value;
        generatePrimesUpTo(value);

        if (state.visiblePrimeCount > state.primes.length) {
            state.visiblePrimeCount = state.primes.length;
        }

        updateParticles();
        updateStats();

        elements.presetBtns.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.value) === value);
        });
    }

    function cycleColorTheme() {
        const themes = Object.keys(COLOR_THEMES);
        const currentIndex = themes.indexOf(state.colorTheme);
        state.colorTheme = themes[(currentIndex + 1) % themes.length];
        updateParticles();
        triggerHaptic();
    }

    function cycleGlowIntensity() {
        state.glowIntensity = (state.glowIntensity + 1) % 3;
        elements.glowBtn.classList.toggle('active', state.glowIntensity > 0);
        particleMaterial.uniforms.glowIntensity.value = state.glowIntensity;
        triggerHaptic();
    }

    function toggleGrid() {
        state.showGrid = !state.showGrid;
        elements.gridBtn.classList.toggle('active', state.showGrid);
        gridHelper.visible = state.showGrid;
        triggerHaptic();
    }

    function toggleMarkers() {
        state.showMarkers = !state.showMarkers;
        elements.markersBtn.classList.toggle('active', state.showMarkers);
        triggerHaptic();
    }

    function handleKeyboard(e) {
        if (state.drawerOpen && e.key === 'Escape') {
            closeDrawer();
            return;
        }

        switch (e.key) {
            case ' ':
                e.preventDefault();
                toggleAnimation();
                break;
            case 'r':
            case 'R':
                resetAnimation();
                break;
            case 'g':
            case 'G':
                toggleGrid();
                break;
        }
    }

    // ============================================
    // UI Updates
    // ============================================

    function updateUI() {
        elements.currentCount.textContent = state.visiblePrimeCount.toLocaleString();
    }

    function updateStats() {
        elements.maxCount.textContent = state.primes.length.toLocaleString();
        elements.totalPrimes.textContent = `${state.primes.length.toLocaleString()} primes`;
        elements.maxPrimeValue.textContent = `up to ${state.primes[state.primes.length - 1]?.toLocaleString() || 0}`;
    }

    // ============================================
    // Utilities
    // ============================================

    function debounce(fn, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    function triggerHaptic() {
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    }

    // ============================================
    // Initialization
    // ============================================

    function init() {
        cacheDOMElements();
        generatePrimesUpTo(state.maxPrimeValue);

        initThreeJS();
        setupDrawer();
        setupControls();

        updateStats();

        // Start render loop
        animate();

        // Start prime animation after a brief delay
        setTimeout(() => {
            startPrimeAnimation();
        }, 500);

        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && state.isPlaying) {
                stopPrimeAnimation();
            }
        });

        // Dismiss tooltip on outside tap
        document.addEventListener('click', (e) => {
            if (!elements.primeTooltip.contains(e.target) && !renderer.domElement.contains(e.target)) {
                hideTooltip();
            }
        });
    }

    // Start the app
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

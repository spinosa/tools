/**
 * Prime Spiral Visualizer
 * A mobile-first interactive visualization of prime number distribution
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
        DOT_BASE_SIZE: 3,
        DOT_MIN_SIZE: 1.5,
        DOT_MAX_SIZE: 6,
        ANIMATION_FRAME_BATCH: 10,
        HIT_TEST_RADIUS: 20,
        ZOOM_MIN: 0.5,
        ZOOM_MAX: 10,
        ZOOM_STEP: 0.2,
        PAN_MOMENTUM_DECAY: 0.95,
        PINCH_ZOOM_SENSITIVITY: 0.01
    };

    const COLOR_THEMES = {
        coral: { primary: '#ff6b6b', glow: 'rgba(255, 107, 107, 0.6)' },
        gold: { primary: '#ffd93d', glow: 'rgba(255, 217, 61, 0.6)' },
        ice: { primary: '#6bcfff', glow: 'rgba(107, 207, 255, 0.6)' },
        neon: { primary: '#6bff8c', glow: 'rgba(107, 255, 140, 0.6)' },
        rainbow: { primary: 'rainbow', glow: 'rgba(255, 255, 255, 0.4)' }
    };

    const state = {
        primes: [],
        primesCoords: null,
        visiblePrimeCount: 0,
        maxPrimeValue: CONFIG.DEFAULT_MAX_PRIME,
        animationSpeed: CONFIG.DEFAULT_SPEED,
        tightness: CONFIG.DEFAULT_TIGHTNESS,
        isPlaying: false,
        animationId: null,

        // View state
        zoom: 1,
        panX: 0,
        panY: 0,
        targetZoom: 1,
        targetPanX: 0,
        targetPanY: 0,

        // Visual options
        colorTheme: 'coral',
        glowIntensity: 1, // 0, 1, 2
        showGrid: true,
        showMarkers: true,

        // Touch state
        touches: new Map(),
        lastPinchDistance: 0,
        isDragging: false,
        dragStartX: 0,
        dragStartY: 0,
        momentum: { x: 0, y: 0 },

        // Drawer state
        drawerOpen: false,
        drawerDragStartY: 0,
        drawerCurrentY: 0,

        // Canvas dimensions
        canvasWidth: 0,
        canvasHeight: 0,
        centerX: 0,
        centerY: 0,
        baseScale: 1
    };

    // ============================================
    // DOM Elements
    // ============================================

    let canvas, ctx;
    const elements = {};

    function cacheDOMElements() {
        canvas = document.getElementById('spiralCanvas');
        ctx = canvas.getContext('2d');

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
        state.primesCoords = new Float32Array(state.primes.length * 2);
        calculateCoordinates();
    }

    function calculateCoordinates() {
        const tightness = state.tightness;

        for (let i = 0; i < state.primes.length; i++) {
            const p = state.primes[i];
            const r = Math.pow(p, tightness);
            const theta = p;

            state.primesCoords[i * 2] = r * Math.cos(theta);
            state.primesCoords[i * 2 + 1] = r * Math.sin(theta);
        }
    }

    function getOrdinal(n) {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    // ============================================
    // Canvas Setup & Rendering
    // ============================================

    function setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();

        state.canvasWidth = rect.width;
        state.canvasHeight = rect.height;

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';

        ctx.scale(dpr, dpr);

        state.centerX = state.canvasWidth / 2;
        state.centerY = state.canvasHeight / 2;

        // Calculate base scale to fit the spiral
        const maxR = Math.pow(state.maxPrimeValue, state.tightness);
        const minDimension = Math.min(state.canvasWidth, state.canvasHeight);
        state.baseScale = (minDimension * 0.45) / maxR;
    }

    function render() {
        // Clear canvas
        ctx.fillStyle = '#0d0d0d';
        ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight);

        // Apply view transformations
        ctx.save();
        ctx.translate(state.centerX + state.panX, state.centerY + state.panY);
        ctx.scale(state.zoom * state.baseScale, state.zoom * state.baseScale);

        // Draw grid
        if (state.showGrid) {
            drawGrid();
        }

        // Draw distance markers
        if (state.showMarkers) {
            drawMarkers();
        }

        // Draw primes
        drawPrimes();

        ctx.restore();

        // Update UI
        updateUI();
    }

    function drawGrid() {
        const maxR = Math.pow(state.maxPrimeValue, state.tightness);

        ctx.strokeStyle = 'rgba(42, 58, 58, 0.15)';
        ctx.lineWidth = 1 / (state.zoom * state.baseScale);

        // Radial lines
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(maxR * Math.cos(angle), maxR * Math.sin(angle));
            ctx.stroke();
        }

        // Concentric circles
        const step = Math.pow(1000, state.tightness);
        for (let r = step; r <= maxR; r += step) {
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    function drawMarkers() {
        const maxR = Math.pow(state.maxPrimeValue, state.tightness);
        const step = Math.pow(1000, state.tightness);

        ctx.fillStyle = '#4ecdc4';
        ctx.font = `${12 / (state.zoom * state.baseScale)}px -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let valueStep = 1000;
        for (let r = step; r <= maxR; r += step) {
            const x = r + 10 / (state.zoom * state.baseScale);
            ctx.fillText(valueStep.toLocaleString(), x, 0);
            valueStep += 1000;
        }
    }

    function drawPrimes() {
        const theme = COLOR_THEMES[state.colorTheme];
        const dotSize = CONFIG.DOT_BASE_SIZE / (state.zoom * state.baseScale);
        const glowSize = dotSize * (2 + state.glowIntensity);

        for (let i = 0; i < state.visiblePrimeCount; i++) {
            const x = state.primesCoords[i * 2];
            const y = state.primesCoords[i * 2 + 1];

            let color = theme.primary;
            let glowColor = theme.glow;

            if (theme.primary === 'rainbow') {
                const hue = (state.primes[i] % 360);
                color = `hsl(${hue}, 80%, 60%)`;
                glowColor = `hsla(${hue}, 80%, 60%, 0.5)`;
            }

            // Draw glow
            if (state.glowIntensity > 0) {
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
                gradient.addColorStop(0, glowColor);
                gradient.addColorStop(1, 'transparent');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, glowSize, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw dot
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, dotSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ============================================
    // Animation
    // ============================================

    function startAnimation() {
        if (state.isPlaying) return;

        state.isPlaying = true;
        elements.playPauseBtn.classList.add('playing');

        animate();
    }

    function stopAnimation() {
        state.isPlaying = false;
        elements.playPauseBtn.classList.remove('playing');

        if (state.animationId) {
            cancelAnimationFrame(state.animationId);
            state.animationId = null;
        }
    }

    function toggleAnimation() {
        if (state.isPlaying) {
            stopAnimation();
        } else {
            startAnimation();
        }
    }

    function resetAnimation() {
        stopAnimation();
        state.visiblePrimeCount = 0;
        render();
    }

    function animate() {
        if (!state.isPlaying) return;

        // Calculate batch size based on speed
        const batchSize = Math.ceil(state.animationSpeed / 10) * CONFIG.ANIMATION_FRAME_BATCH;

        if (state.visiblePrimeCount < state.primes.length) {
            state.visiblePrimeCount = Math.min(
                state.visiblePrimeCount + batchSize,
                state.primes.length
            );
            render();
            state.animationId = requestAnimationFrame(animate);
        } else {
            stopAnimation();
        }
    }

    // ============================================
    // Touch & Gesture Handling
    // ============================================

    function setupTouchHandlers() {
        // Canvas touch events
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
        canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

        // Mouse events for desktop
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseUp);
        canvas.addEventListener('wheel', handleWheel, { passive: false });

        // Double tap/click
        canvas.addEventListener('dblclick', handleDoubleClick);

        // Zoom buttons
        elements.zoomIn.addEventListener('click', () => zoomBy(CONFIG.ZOOM_STEP));
        elements.zoomOut.addEventListener('click', () => zoomBy(-CONFIG.ZOOM_STEP));
        elements.zoomReset.addEventListener('click', resetView);

        // Single tap for prime info
        canvas.addEventListener('click', handleCanvasClick);
    }

    function handleTouchStart(e) {
        e.preventDefault();

        for (const touch of e.changedTouches) {
            state.touches.set(touch.identifier, {
                x: touch.clientX,
                y: touch.clientY,
                startX: touch.clientX,
                startY: touch.clientY,
                startTime: Date.now()
            });
        }

        if (state.touches.size === 2) {
            const touchArray = Array.from(state.touches.values());
            state.lastPinchDistance = getDistance(touchArray[0], touchArray[1]);
        }

        state.isDragging = true;
        state.momentum = { x: 0, y: 0 };
    }

    function handleTouchMove(e) {
        e.preventDefault();

        for (const touch of e.changedTouches) {
            if (state.touches.has(touch.identifier)) {
                const prev = state.touches.get(touch.identifier);
                state.touches.set(touch.identifier, {
                    ...prev,
                    x: touch.clientX,
                    y: touch.clientY,
                    prevX: prev.x,
                    prevY: prev.y
                });
            }
        }

        if (state.touches.size === 1 && state.zoom > 1) {
            // Single finger pan
            const touch = state.touches.values().next().value;
            const dx = touch.x - (touch.prevX || touch.x);
            const dy = touch.y - (touch.prevY || touch.y);

            state.panX += dx;
            state.panY += dy;
            state.momentum = { x: dx, y: dy };

            render();
        } else if (state.touches.size === 2) {
            // Pinch zoom
            const touchArray = Array.from(state.touches.values());
            const distance = getDistance(touchArray[0], touchArray[1]);
            const delta = distance - state.lastPinchDistance;

            if (Math.abs(delta) > 1) {
                const zoomDelta = delta * CONFIG.PINCH_ZOOM_SENSITIVITY;
                zoomBy(zoomDelta);
                state.lastPinchDistance = distance;
            }
        }
    }

    function handleTouchEnd(e) {
        for (const touch of e.changedTouches) {
            const touchData = state.touches.get(touch.identifier);

            // Check for tap (short duration, minimal movement)
            if (touchData) {
                const duration = Date.now() - touchData.startTime;
                const distance = getDistance(
                    { x: touchData.startX, y: touchData.startY },
                    { x: touch.clientX, y: touch.clientY }
                );

                if (duration < 300 && distance < 10) {
                    handleTap(touch.clientX, touch.clientY);
                }
            }

            state.touches.delete(touch.identifier);
        }

        if (state.touches.size === 0) {
            state.isDragging = false;
            applyMomentum();
        }
    }

    function handleMouseDown(e) {
        state.isDragging = true;
        state.dragStartX = e.clientX - state.panX;
        state.dragStartY = e.clientY - state.panY;
        state.momentum = { x: 0, y: 0 };
        canvas.style.cursor = 'grabbing';
    }

    function handleMouseMove(e) {
        if (!state.isDragging || state.zoom <= 1) return;

        const dx = e.clientX - state.dragStartX - state.panX;
        const dy = e.clientY - state.dragStartY - state.panY;

        state.panX = e.clientX - state.dragStartX;
        state.panY = e.clientY - state.dragStartY;
        state.momentum = { x: dx, y: dy };

        render();
    }

    function handleMouseUp() {
        state.isDragging = false;
        canvas.style.cursor = 'default';
        applyMomentum();
    }

    function handleWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -CONFIG.ZOOM_STEP : CONFIG.ZOOM_STEP;
        zoomBy(delta);
    }

    function handleDoubleClick(e) {
        if (state.zoom > 1) {
            resetView();
        } else {
            zoomTo(2, e.clientX, e.clientY);
        }
    }

    function handleCanvasClick(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const prime = findPrimeAtPoint(x, y);

        if (prime) {
            showTooltip(prime, e.clientX, e.clientY);
        } else {
            hideTooltip();
        }
    }

    function handleTap(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        const prime = findPrimeAtPoint(x, y);

        if (prime) {
            showTooltip(prime, clientX, clientY);
            triggerHaptic();
        } else {
            hideTooltip();
        }
    }

    function findPrimeAtPoint(canvasX, canvasY) {
        // Convert canvas coordinates to spiral coordinates
        const spiralX = (canvasX - state.centerX - state.panX) / (state.zoom * state.baseScale);
        const spiralY = (canvasY - state.centerY - state.panY) / (state.zoom * state.baseScale);

        const hitRadius = CONFIG.HIT_TEST_RADIUS / (state.zoom * state.baseScale);

        for (let i = state.visiblePrimeCount - 1; i >= 0; i--) {
            const px = state.primesCoords[i * 2];
            const py = state.primesCoords[i * 2 + 1];

            const dx = spiralX - px;
            const dy = spiralY - py;

            if (dx * dx + dy * dy < hitRadius * hitRadius) {
                return {
                    value: state.primes[i],
                    index: i,
                    x: px,
                    y: py
                };
            }
        }

        return null;
    }

    function applyMomentum() {
        if (Math.abs(state.momentum.x) < 0.5 && Math.abs(state.momentum.y) < 0.5) return;

        state.panX += state.momentum.x;
        state.panY += state.momentum.y;
        state.momentum.x *= CONFIG.PAN_MOMENTUM_DECAY;
        state.momentum.y *= CONFIG.PAN_MOMENTUM_DECAY;

        render();
        requestAnimationFrame(applyMomentum);
    }

    function getDistance(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // ============================================
    // Zoom & Pan
    // ============================================

    function zoomBy(delta) {
        const newZoom = Math.max(CONFIG.ZOOM_MIN, Math.min(CONFIG.ZOOM_MAX, state.zoom + delta));

        if (newZoom !== state.zoom) {
            state.zoom = newZoom;
            updateZoomIndicator();
            render();
        }
    }

    function zoomTo(targetZoom, clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const centerX = clientX - rect.left - state.centerX;
        const centerY = clientY - rect.top - state.centerY;

        const scale = targetZoom / state.zoom;
        state.panX = centerX - (centerX - state.panX) * scale;
        state.panY = centerY - (centerY - state.panY) * scale;
        state.zoom = targetZoom;

        updateZoomIndicator();
        render();
    }

    function resetView() {
        state.zoom = 1;
        state.panX = 0;
        state.panY = 0;
        updateZoomIndicator();
        render();
    }

    function updateZoomIndicator() {
        elements.zoomIndicator.textContent = state.zoom.toFixed(1) + 'x';
        elements.zoomIndicator.classList.toggle('visible', state.zoom !== 1);
    }

    // ============================================
    // Tooltip
    // ============================================

    function showTooltip(prime, clientX, clientY) {
        const r = Math.pow(prime.value, state.tightness).toFixed(2);
        const theta = prime.value;

        elements.tooltipPrime.textContent = prime.value.toLocaleString();
        elements.tooltipOrdinal.textContent = `The ${getOrdinal(prime.index + 1)} prime`;
        elements.tooltipRadius.textContent = `r = ${r}`;
        elements.tooltipAngle.textContent = `θ = ${theta} rad`;

        const tooltip = elements.primeTooltip;
        const tooltipRect = tooltip.getBoundingClientRect();

        // Position tooltip
        let left = clientX - 80;
        let top = clientY - tooltipRect.height - 20;

        // Keep within viewport
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
    // Drawer
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

        // Swipe up on mini control bar
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
    // Controls
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

                // Update active state
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
            calculateCoordinates();
            setupCanvas();
            render();
        }, 50));

        // Visual Settings
        elements.colorBtn.addEventListener('click', cycleColorTheme);
        elements.glowBtn.addEventListener('click', cycleGlowIntensity);
        elements.gridBtn.addEventListener('click', toggleGrid);
        elements.markersBtn.addEventListener('click', toggleMarkers);

        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboard);
    }

    function updateMaxPrime(value) {
        state.maxPrimeValue = value;
        generatePrimesUpTo(value);
        setupCanvas();

        // Update visible count if needed
        if (state.visiblePrimeCount > state.primes.length) {
            state.visiblePrimeCount = state.primes.length;
        }

        render();
        updateStats();

        // Update preset button states
        elements.presetBtns.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.value) === value);
        });
    }

    function cycleColorTheme() {
        const themes = Object.keys(COLOR_THEMES);
        const currentIndex = themes.indexOf(state.colorTheme);
        state.colorTheme = themes[(currentIndex + 1) % themes.length];
        render();
        triggerHaptic();
    }

    function cycleGlowIntensity() {
        state.glowIntensity = (state.glowIntensity + 1) % 3;
        elements.glowBtn.classList.toggle('active', state.glowIntensity > 0);
        render();
        triggerHaptic();
    }

    function toggleGrid() {
        state.showGrid = !state.showGrid;
        elements.gridBtn.classList.toggle('active', state.showGrid);
        render();
        triggerHaptic();
    }

    function toggleMarkers() {
        state.showMarkers = !state.showMarkers;
        elements.markersBtn.classList.toggle('active', state.showMarkers);
        render();
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
            case '+':
            case '=':
                zoomBy(CONFIG.ZOOM_STEP);
                break;
            case '-':
                zoomBy(-CONFIG.ZOOM_STEP);
                break;
            case '0':
                resetView();
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
        setupCanvas();
        setupTouchHandlers();
        setupDrawer();
        setupControls();

        updateStats();
        render();

        // Start animation after a brief delay
        setTimeout(() => {
            startAnimation();
        }, 500);

        // Handle resize
        window.addEventListener('resize', debounce(() => {
            setupCanvas();
            render();
        }, 100));

        // Handle visibility change (pause when tab hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && state.isPlaying) {
                stopAnimation();
            }
        });

        // Dismiss tooltip on outside tap
        document.addEventListener('click', (e) => {
            if (!elements.primeTooltip.contains(e.target) && !canvas.contains(e.target)) {
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

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('water-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height, dpr;
    let particles = [];
    let trailCanvas, trailCtx;

    // Slime Mold configuration
    const config = {
        particleCount: 1500,
        sensorAngle: Math.PI / 4,
        sensorDist: 20,
        turnSpeed: 0.2,
        moveSpeed: 1.5,
        decay: 0.95,
        diffuse: 0.1,
        color: '#d4af37'
    };

    function init() {
        dpr = window.devicePixelRatio || 1;
        width = window.innerWidth;
        height = window.innerHeight;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        // Create trail map
        trailCanvas = document.createElement('canvas');
        trailCanvas.width = canvas.width;
        trailCanvas.height = canvas.height;
        trailCtx = trailCanvas.getContext('2d');
        trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);

        // Initialize particles
        particles = [];
        for (let i = 0; i < config.particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                angle: Math.random() * Math.PI * 2
            });
        }
    }

    init();
    window.addEventListener('resize', init);

    // Helper to get pixel value from trail map
    function getSensorValue(x, y) {
        if (x < 0 || x >= width || y < 0 || y >= height) return -1;
        const tx = Math.floor(x * dpr);
        const ty = Math.floor(y * dpr);
        const data = trailCtx.getImageData(tx, ty, 1, 1).data;
        return data[3]; // Use Alpha channel for intensity in a transparent canvas
    }

    function sense(p, sensorAngle) {
        const sensorX = p.x + Math.cos(p.angle + sensorAngle) * config.sensorDist;
        const sensorY = p.y + Math.sin(p.angle + sensorAngle) * config.sensorDist;
        return getSensorValue(sensorX, sensorY);
    }

    let mouseX = -100, mouseY = -100;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Sync parallax
        const heroBg = document.querySelector('.hero-bg');
        if (heroBg) {
            const xPct = e.clientX / window.innerWidth;
            const yPct = e.clientY / window.innerHeight;
            heroBg.style.transform = `translate(${(xPct - 0.5) * -60}px, ${(yPct - 0.5) * -60}px) scale(1.15)`;
        }
    });

    function update() {
        // 1. Particle Logic
        for (let p of particles) {
            // Sense trails
            const vFwd = sense(p, 0);
            const vLeft = sense(p, config.sensorAngle);
            const vRight = sense(p, -config.sensorAngle);

            if (vFwd > vLeft && vFwd > vRight) {
                // Keep going
            } else if (vFwd < vLeft && vFwd < vRight) {
                p.angle += (Math.random() - 0.5) * 2 * config.turnSpeed;
            } else if (vLeft > vRight) {
                p.angle += config.turnSpeed;
            } else if (vRight > vLeft) {
                p.angle -= config.turnSpeed;
            }

            // Mouse interaction (Repulsion)
            const dx = p.x - mouseX;
            const dy = p.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
                const angleToMouse = Math.atan2(dy, dx);
                p.angle = angleToMouse + (Math.random() - 0.5) * 0.5;
            }

            // Move
            p.x += Math.cos(p.angle) * config.moveSpeed;
            p.y += Math.sin(p.angle) * config.moveSpeed;

            // Bounds
            if (p.x < 0 || p.x >= width || p.y < 0 || p.y >= height) {
                p.angle = Math.random() * Math.PI * 2;
                p.x = Math.max(0, Math.min(width - 1, p.x));
                p.y = Math.max(0, Math.min(height - 1, p.y));
            }

            // Deposit trail (Golden color)
            trailCtx.fillStyle = `rgba(212, 175, 55, 0.5)`;
            const tx = Math.floor(p.x * dpr);
            const ty = Math.floor(p.y * dpr);
            trailCtx.fillRect(tx, ty, 1, 1);
        }

        // 2. Trail Processing (Decay via alpha reduction)
        // Use destination-out to gradually erase the trail canvas
        trailCtx.globalCompositeOperation = 'destination-out';
        trailCtx.fillStyle = `rgba(0, 0, 0, ${1 - config.decay})`;
        trailCtx.fillRect(0, 0, trailCanvas.width, trailCanvas.height);
        trailCtx.globalCompositeOperation = 'source-over';

        // 3. Render to main canvas
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(trailCanvas, 0, 0, width, height);

        requestAnimationFrame(update);
    }

    update();

    // Reset interaction on click
    document.addEventListener('click', () => {
        particles.forEach(p => {
            p.angle = Math.random() * Math.PI * 2;
        });
    });


    // Navigation & Header
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(10, 10, 10, 0.95)';
            header.style.padding = '10px 0';
        } else {
            header.style.background = 'rgba(10, 10, 10, 0.8)';
            header.style.padding = '20px 0';
        }
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Contact Form Handling
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Get form data
            const formData = new FormData(contactForm);
            const name = formData.get('name'); // Assuming we add name attributes

            // Simulation of submission
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;

            submitBtn.disabled = true;
            submitBtn.innerText = 'Отправка...';

            setTimeout(() => {
                alert('Спасибо за заявку! Мы свяжемся с вами в ближайшее время.');
                contactForm.reset();
                submitBtn.disabled = false;
                submitBtn.innerText = originalText;
            }, 1000);
        });
    }
});

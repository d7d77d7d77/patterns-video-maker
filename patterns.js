// patterns.js - Global Pattern Registry

const PATTERN_REGISTRY = {};

// Helper functions for common drawing patterns
const MathDraw = {
    drawMandala: (ctx, t, complexity, hue, arms, radius, bend) => {
        for (let i = 0; i < arms; i++) {
            ctx.rotate((Math.PI * 2) / arms);
            ctx.beginPath();
            const x1 = Math.cos(t) * radius;
            const y1 = Math.sin(t * 0.7) * radius;
            const x2 = x1 + (radius * 1.5) * Math.sin(t * bend);
            const y2 = y1 + (radius * 1.5) * Math.cos(t * bend);
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(x1, y1, x2, y2);
            ctx.strokeStyle = `hsl(${(hue + i * (360 / arms)) % 360}, 100%, 65%)`;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(x2, y2, 8 + Math.sin(t * 3 + i) * 4, 0, Math.PI * 2);
            ctx.fillStyle = `hsl(${(hue + 50) % 360}, 100%, 75%)`;
            ctx.fill();
        }
    },
    drawWaveGrid: (ctx, t, complexity, hue, w, h, spacing, speedMultiplier) => {
        ctx.restore(); ctx.save(); // Reset center
        for (let x = 0; x <= w + spacing; x += spacing) {
            for (let y = 0; y <= h + spacing; y += spacing) {
                const dist = Math.hypot(x - w / 2, y - h / 2);
                const offset = dist * 0.005;
                const radiusMultipler = Math.sin(t * speedMultiplier - offset);
                const radius = ((radiusMultipler + 1) / 2) * (spacing * 0.45);

                if (radius > 0.5) {
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    const localHue = (hue + dist * 0.1 + t * 20) % 360;
                    ctx.fillStyle = `hsl(${localHue}, 80%, 60%)`;
                    ctx.fill();
                }
            }
        }
    },
    drawRings: (ctx, t, complexity, hue, maxRad, ringCount, speedMultipler) => {
        const gap = maxRad / ringCount;
        ctx.lineWidth = gap * 0.4;
        for (let i = 0; i < ringCount; i++) {
            ctx.beginPath();
            const dir = (i % 2 === 0) ? 1 : -1;
            const r = i * gap + (t * speedMultipler * 200) % gap;
            const dash1 = gap * 2 + Math.sin(t + i) * gap;
            ctx.setLineDash([Math.abs(dash1), gap]);
            ctx.arc(0, 0, r, t * dir, Math.PI * 2 + t * dir);
            ctx.strokeStyle = `hsl(${(hue + i * (360 / ringCount) - t * 50) % 360}, 90%, 55%)`;
            ctx.stroke();
        }
        ctx.setLineDash([]);
    },
    drawTunnel: (ctx, t, complexity, hue, layers, speed, shapeType) => {
        for (let i = layers; i > 0; i--) {
            const layerDepth = (i - (t * speed) % 1);
            if (layerDepth < 0.1) continue;
            const size = Math.pow(layerDepth, 1.5) * 8;
            ctx.beginPath();
            const offsetX = Math.sin(t * 2 + layerDepth * 0.1) * (layerDepth * 4);
            const offsetY = Math.cos(t * 1.5 + layerDepth * 0.1) * (layerDepth * 4);

            if (shapeType === 'square' || (shapeType === 'mixed' && complexity % 2 === 0)) {
                ctx.rect(offsetX - size / 2, offsetY - size / 2, size, size);
            } else if (shapeType === 'circle' || shapeType === 'mixed') {
                ctx.arc(offsetX, offsetY, size / 2, 0, Math.PI * 2);
            } else if (shapeType === 'triangle') {
                ctx.moveTo(offsetX, offsetY - size / 2);
                ctx.lineTo(offsetX + size / 2, offsetY + size / 2);
                ctx.lineTo(offsetX - size / 2, offsetY + size / 2);
                ctx.closePath();
            }

            ctx.strokeStyle = `hsl(${(hue + layerDepth * 10 - t * 50) % 360}, 100%, 60%)`;
            ctx.lineWidth = 2 + layerDepth * 0.2;
            ctx.stroke();
            if (i % 2 === 0) {
                ctx.fillStyle = `rgba(0,0,0,0.8)`;
                ctx.fill();
            }
        }
    },
    drawLissajous: (ctx, t, complexity, hue, a, b, delta) => {
        ctx.beginPath();
        const scale = 300 + complexity;
        for (let i = 0; i < 300; i++) {
            const t_val = t + i * 0.05;
            const x = scale * Math.sin(a * t_val + delta);
            const y = scale * Math.sin(b * t_val);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
        ctx.lineWidth = 4;
        ctx.stroke();
    }
}


function registerCategory(catName, idPrefix, generatorFunc, count = 10) {
    PATTERN_REGISTRY[catName] = [];
    for (let i = 1; i <= count; i++) {
        const item = generatorFunc(i, count);
        item.id = `${idPrefix}-${i}`;
        PATTERN_REGISTRY[catName].push(item);
    }
}

// 1. Mandalas (15 variations)
registerCategory('Sacred Mandalas', 'man', (i, total) => ({
    name: `Mandala Form ${i}`,
    draw: (ctx, t, c, hue, w, h) => MathDraw.drawMandala(ctx, t, c, hue, 3 + i, 100 + i * 10, 1 + i * 0.2)
}), 15);

// 2. Wave Grids (10 variations)
registerCategory('Quantum Wave Grids', 'wave', (i, total) => ({
    name: `Wave Interference ${i}`,
    draw: (ctx, t, c, hue, w, h) => MathDraw.drawWaveGrid(ctx, t, c, hue, w, h, 150 - (i * 8), 1 + i * 0.5)
}), 10);

// 3. Hypnotic Rings (10 variations)
// Using variations in ring counts and speeds
registerCategory('Hypnotic Pulsars', 'ring', (i, total) => ({
    name: `Pulsar Frequency ${i}`,
    draw: (ctx, t, c, hue, w, h) => MathDraw.drawRings(ctx, t, c, hue, Math.hypot(w, h) / 2, 5 + i * 3, 0.5 + i * 0.1)
}), 10);

// 4. Infinite Tunnels (15 variations of mixed shapes)
const shapes = ['circle', 'square', 'triangle', 'mixed'];
registerCategory('Infinite Tunnels', 'tun', (i, total) => ({
    name: `Wormhole ${shapes[i % 4].toUpperCase()} Var-${i}`,
    draw: (ctx, t, c, hue, w, h) => MathDraw.drawTunnel(ctx, t, c, hue, 15 + i * 2, 3 + i * 0.5, shapes[i % 4])
}), 15);

// 5. Lissajous Curves / Physics Attractors (15 variations)
registerCategory('Lissajous Physics Attractors', 'liss', (i, total) => ({
    name: `Harmonic Resonance ${i}: ${i + 1}/${i + 2}`,
    draw: (ctx, t, c, hue, w, h) => MathDraw.drawLissajous(ctx, t, c, hue, i + 1, i + 2, t * 0.5)
}), 15);

// 6. Fractal Zoomers (10 variations)
registerCategory('Fractal Infinity', 'frac', (i, total) => ({
    name: `Deep Dive Sub-Level ${i}`,
    draw: (ctx, t, c, hue, w, h) => {
        const numShapes = Math.max(8, c);
        ctx.lineJoin = 'round';
        for (let j = numShapes; j > 0; j--) {
            const progress = (j - (t * (1 + i * 0.2)) % 1);
            if (progress <= 0) continue;
            const scale = Math.pow(1.5, progress);
            ctx.save();
            ctx.rotate(t * 0.5 + progress * 0.1 * i);
            ctx.scale(scale, scale);
            ctx.beginPath();
            const points = 3 + i;
            for (let k = 0; k < points * 2; k++) {
                const angle = (k * Math.PI) / points;
                const r = (k % 2 === 0) ? 20 + i : 8;
                if (k === 0) ctx.moveTo(r * Math.cos(angle), r * Math.sin(angle));
                else ctx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
            }
            ctx.closePath();
            ctx.strokeStyle = `hsl(${(hue + progress * 30 - t * 20) % 360}, 100%, 55%)`;
            ctx.lineWidth = 0.5 + progress * 0.2;
            ctx.stroke();
            if (j % 2 === 0) {
                ctx.fillStyle = `hsla(${(hue + progress * 30 - t * 20 + 180) % 360}, 100%, 15%, 0.8)`;
                ctx.fill();
            }
            ctx.restore();
        }
    }
}), 10);

// 7. Starfield Warp Speeds (10 variations)
// Altering angle offsets, base seeds, and speed
registerCategory('Warp Speed Hyperdrives', 'warp', (i, total) => ({
    name: `Galaxy Sector ${i} Jump`,
    draw: (ctx, t, c, hue, w, h) => {
        const numStars = 100 + c * 10;
        const jumpSpeed = 1 + (i * 0.3); // Variant speed multiplier
        for (let j = 0; j < numStars; j++) {
            const randomX = Math.sin(j * 12.9898 + i) * 43758.5453 % 1;
            const randomY = Math.cos(j * 78.233 + i) * 43758.5453 % 1;
            const randomZ = Math.sin(j * 93.233 + i) * 43758.5453 % 1;
            const angle = randomX * Math.PI * 2 + (t * i * 0.05);
            let z = (Math.abs(randomZ) - (t * jumpSpeed)) % 1;
            if (z < 0) z += 1;
            if (z < 0.05) continue;
            const distance = Math.abs(randomY) * 1000;
            const x = (Math.cos(angle) * distance) / z;
            const y = (Math.sin(angle) * distance) / z;
            ctx.beginPath();
            const prevZ = z + jumpSpeed * 0.02;
            const prevX = (Math.cos(angle) * distance) / prevZ;
            const prevY = (Math.sin(angle) * distance) / prevZ;
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(x, y);
            const starHue = (hue + j % 60) % 360;
            const brightness = (1 - z) * 100;
            ctx.strokeStyle = `hsl(${starHue}, 100%, ${brightness}%)`;
            ctx.lineWidth = Math.max(0.5, 3 * (1 - z));
            ctx.stroke();
        }
    }
}), 10);


// 8. Hypnotic Optical Illusions (Precision Recreations)
// Simulating the user's specific requested image references
PATTERN_REGISTRY['Hypnotic Optical Illusions'] = [
    {
        id: 'hyp-1',
        name: 'Trippy Spiky Vortex',
        draw: (ctx, t, c, hue, w, h) => {
            const centerX = w / 2;
            const centerY = h / 2;
            const maxRadius = Math.hypot(w, h); // Cover whole screen
            ctx.restore(); ctx.save();
            ctx.translate(centerX, centerY);

            // Background black
            ctx.fillStyle = '#111';
            ctx.fillRect(-w / 2, -h / 2, w, h);

            const numSpikes = 24; // Standard optical illusion ray count
            const numRings = 30 + Math.floor(c / 2); // Density scales with complexity
            const ringSpacing = maxRadius / numRings;

            // Draw outward rings that zigzag
            for (let r = numRings; r > 0; r--) {
                const currentRadius = r * ringSpacing;

                // Pumping effect based on time
                const timeOffset = (t * 5) % ringSpacing;
                const activeRadius = currentRadius - timeOffset;
                if (activeRadius <= 0) continue;

                ctx.beginPath();
                for (let i = 0; i <= numSpikes * 2; i++) {
                    const angle = (i * Math.PI) / numSpikes;

                    // The zigzag offset gives it the "spiky" look
                    // Rotate the zigzag slightly on alternating rings to create the illusion of rotation/depth
                    let zipRadius = activeRadius;
                    if (i % 2 === 0) {
                        zipRadius += ringSpacing * 0.4; // spike out
                    } else {
                        zipRadius -= ringSpacing * 0.1; // spike in
                    }

                    // Spin the whole ring based on radius depth for the vortex feel
                    const spinAngle = angle + (activeRadius * 0.005) + (r % 2 === 0 ? t : -t) * 0.5;

                    const x = Math.cos(spinAngle) * zipRadius;
                    const y = Math.sin(spinAngle) * zipRadius;

                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();

                // Chromatic abberation colors / alternating black and white
                if (r % 2 === 0) {
                    ctx.fillStyle = 'white';
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = `hsl(${(hue + r * 10) % 360}, 100%, 50%)`; // Trippy neon edges
                } else {
                    ctx.fillStyle = 'black';
                    ctx.shadowBlur = 0;
                }
                ctx.fill();
            }
        }
    },
    {
        id: 'hyp-2',
        name: 'Concentric Infinite Tunnel',
        draw: (ctx, t, c, hue, w, h) => {
            const centerX = w / 2;
            const centerY = h / 2;
            const maxRadius = Math.hypot(w, h);
            ctx.restore(); ctx.save();
            ctx.translate(centerX, centerY);

            ctx.fillStyle = 'white';
            ctx.fillRect(-w / 2, -h / 2, w, h);

            const numRings = 40 + c; // High density rings

            for (let r = numRings; r > 0; r--) {
                // Exponential depth for 3D tunnel perspective
                const progress = (r - (t * 4) % 1) / numRings; // 0.0 to 1.0 (center to edge)
                if (progress <= 0) continue;

                // Exponential scale curve creates the "wall" perspective
                const radius = Math.pow(progress, 2) * maxRadius * 2;

                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);

                // Alternate black and white
                ctx.fillStyle = (r % 2 === 0) ? 'black' : 'white';
                ctx.fill();
            }

            // Tiny glow in center to look like light at end of tunnel
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'white';
            ctx.fill();
        }
    },
    {
        id: 'hyp-3',
        name: 'Classic Black & White Spiral',
        draw: (ctx, t, c, hue, w, h) => {
            const centerX = w / 2;
            const centerY = h / 2;
            const maxRadius = Math.hypot(w, h);
            ctx.restore(); ctx.save();
            ctx.translate(centerX, centerY);

            ctx.fillStyle = 'white';
            ctx.fillRect(-w / 2, -h / 2, w, h);

            // Draw a spinning Archimedean spiral
            const arms = 2; // Classic dual spiral
            const rotations = 10 + Math.floor(c / 10);

            for (let i = 0; i < arms; i++) {
                ctx.beginPath();
                ctx.moveTo(0, 0);

                const angleOffset = (i * Math.PI * 2) / arms;
                // Reverse rotation for hypnotic unwind
                const timeSpin = -t * 2;

                for (let angle = 0; angle <= Math.PI * 2 * rotations; angle += 0.1) {
                    const r = (angle / (Math.PI * 2)) * (maxRadius / rotations);

                    const x = r * Math.cos(angle + angleOffset + timeSpin);
                    const y = r * Math.sin(angle + angleOffset + timeSpin);

                    ctx.lineTo(x, y);
                }

                // To fill a spiral arm correctly, we must walk back down the *next* arm's path to close it
                const nextAngleOffset = ((i + 0.5) * Math.PI * 2) / arms; // The thickness of the black arm
                for (let angle = Math.PI * 2 * rotations; angle >= 0; angle -= 0.1) {
                    const r = (angle / (Math.PI * 2)) * (maxRadius / rotations);
                    const x = r * Math.cos(angle + nextAngleOffset + timeSpin);
                    const y = r * Math.sin(angle + nextAngleOffset + timeSpin);
                    ctx.lineTo(x, y);
                }

                ctx.closePath();
                ctx.fillStyle = 'black';
                ctx.fill();
            }
        }
    },
    {
        id: 'hyp-4',
        name: 'Trippy Rainbow Fractal Spiral',
        draw: (ctx, t, c, hue, w, h) => {
            const centerX = w / 2;
            const centerY = h / 2;
            ctx.restore(); ctx.save();
            ctx.translate(centerX, centerY);

            // This is a complex layered spiral with intense colors
            const arms = 8 + Math.floor(c / 20);
            const dotsPerArm = 150;

            // Rotate entire canvas wildly
            ctx.rotate(t * 0.5);

            for (let arm = 0; arm < arms; arm++) {
                const angleOffset = (arm * Math.PI * 2) / arms;

                for (let i = 0; i < dotsPerArm; i++) {
                    const p = i / dotsPerArm; // 0.0 to 1.0 (center to edge)

                    // Exponential math for out-rushing particles
                    const wavePhase = (p * 10 - t * 3);

                    // Radius pushes out
                    const radius = Math.pow(p, 1.5) * Math.hypot(w, h);
                    if (radius < 2) continue; // skip tiny center

                    // Spiral angle bends heavily
                    const angle = angleOffset + (p * Math.PI * 5) + Math.sin(wavePhase) * 0.2;

                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);

                    ctx.beginPath();
                    // Size gets wildly bigger towards edges
                    const dotSize = 2 + Math.pow(p, 2) * 50;
                    ctx.arc(x, y, dotSize, 0, Math.PI * 2);

                    // Intense rainbow colors that shift over time based on arm and radius
                    const spiralHue = (hue + p * 360 + arm * (360 / arms) - t * 100) % 360;

                    ctx.fillStyle = `hsl(${spiralHue}, 100%, 50%)`;
                    ctx.shadowBlur = dotSize * 0.5;
                    ctx.shadowColor = `hsl(${spiralHue}, 100%, 50%)`;

                    ctx.fill();
                    ctx.shadowBlur = 0;

                    // Add secondary inner dot for detail
                    if (dotSize > 5) {
                        ctx.beginPath();
                        ctx.arc(x, y, dotSize * 0.3, 0, Math.PI * 2);
                        // Contrasting color
                        ctx.fillStyle = `hsl(${(spiralHue + 180) % 360}, 100%, 70%)`;
                        ctx.fill();
                    }
                }
            }
        }
    }
];

// 9. Explicit Semantic Loops (Conceptual / Visual Scenes)
// The user specifically asked for an "apple falling from a tree and tree comes visible from fallen apple" type loop.
PATTERN_REGISTRY['Semantic Concept Loops'] = [
    {
        id: 'sem-1',
        name: 'The Apple & The Tree (Life Cycle Loop)',
        draw: (ctx, t, c, hue, w, h) => {
            // This is a 10 second loop if speed factor is standard.
            // We'll map t mod 10 into a continuous visual lifecycle loop.
            const loopDuration = 6.0; // 6 seconds per full cycle
            const cycleTime = t % loopDuration;
            const phase = cycleTime / loopDuration; // 0.0 to 1.0

            ctx.restore(); ctx.save(); // Back to screen coordinates

            // Ground
            ctx.fillStyle = `hsl(140, 50%, 20%)`; // Dark green grass
            ctx.fillRect(0, h * 0.8, w, h * 0.2);

            // Core coordinate origins
            const treeRootX = w / 2;
            const treeRootY = h * 0.8;

            // Define life cycle states:
            // 0.0 - 0.2: Big tree, apple grows
            // 0.2 - 0.4: Apple falls
            // 0.4 - 0.6: Apple sinks into ground, tree dies/disappears
            // 0.6 - 0.8: Sapling grows rapidly from apple spot
            // 0.8 - 1.0: Full tree matures, cycle prepares to restart

            let treeScale = 1;
            let showApple = true;
            let appleY = treeRootY - h * 0.45; // High in the tree
            let appleScale = 1;

            if (phase < 0.2) {
                // Growth of new apple
                appleScale = (phase / 0.2);
            } else if (phase >= 0.2 && phase < 0.4) {
                // Apple falling (gravity easing)
                const fallProgress = (phase - 0.2) / 0.2;
                // Easing in quadratic for gravity appearance
                appleY = (treeRootY - h * 0.45) + (fallProgress * fallProgress) * (h * 0.45);
            } else if (phase >= 0.4 && phase < 0.6) {
                // Old tree rapidly shrinks into the ground / rots
                const rotProgress = (phase - 0.4) / 0.2;
                treeScale = 1 - Math.pow(rotProgress, 3);

                // Apple hits ground and sinks/sprouts
                appleY = treeRootY;
                appleScale = 1 - (rotProgress * 0.5); // Shrinks slightly into a seed
            } else if (phase >= 0.6 && phase < 0.8) {
                // Apple is fully gone, sprout emerges
                showApple = false;
                const growProgress = (phase - 0.6) / 0.2;
                treeScale = Math.pow(growProgress, 2); // Accelerating growth
            } else if (phase >= 0.8) {
                // Tree is full, preparing for new apple
                showApple = false;
                treeScale = 1;
            }

            // --- DRAW TREE ---
            if (treeScale > 0.01) {
                ctx.save();
                ctx.translate(treeRootX, treeRootY);
                ctx.scale(treeScale, treeScale);

                // Trunk
                ctx.fillStyle = '#5C4033'; // Brown
                ctx.beginPath();
                ctx.moveTo(-20, 0);
                ctx.lineTo(-10, -h * 0.5);
                ctx.lineTo(10, -h * 0.5);
                ctx.lineTo(20, 0);
                ctx.fill();

                // Leaves (3 overlapping circles based on hue slider but green by default)
                ctx.fillStyle = `hsl(${hue % 360}, 60%, 40%)`;
                ctx.beginPath(); ctx.arc(0, -h * 0.5, 120, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(-70, -h * 0.4, 100, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(70, -h * 0.4, 100, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }

            // --- DRAW APPLE ---
            if (showApple && appleScale > 0.01) {
                ctx.save();
                ctx.translate(treeRootX, appleY);
                ctx.scale(appleScale, appleScale);

                // Red Apple Body
                ctx.fillStyle = '#E32636';
                ctx.beginPath();
                ctx.arc(0, -20, 20, 0, Math.PI * 2);
                ctx.fill();
                // Stem
                ctx.strokeStyle = '#5C4033';
                ctx.lineWidth = 4;
                ctx.beginPath(); ctx.moveTo(0, -40); ctx.quadraticCurveTo(5, -50, 15, -55); ctx.stroke();
                // Leaf
                ctx.fillStyle = '#4CAF50';
                ctx.beginPath(); ctx.moveTo(0, -40); ctx.quadraticCurveTo(15, -45, 20, -35); ctx.quadraticCurveTo(5, -30, 0, -40); ctx.fill();

                ctx.restore();
            }

            // Loop instruction HUD (fades in/out)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '20px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Cycle Progress: ${Math.floor(phase * 100)}%`, w / 2, 50);
        }
    },
    {
        id: 'sem-2',
        name: 'Day & Night Sunrise Loop',
        draw: (ctx, t, c, hue, w, h) => {
            const cycle = (t * 0.5) % (Math.PI * 2);
            ctx.restore(); ctx.save();

            // Sky Color shifts based on cycle
            const sunY = h / 2 + Math.cos(cycle) * (h / 2 + 100);

            // Sunset logic
            let skyHue = 210;
            let skyLight = 50;
            if (Math.cos(cycle) > 0) {
                // Sun is setting/rising (near horizon)
                skyHue = 210 - (Math.cos(cycle) * 180); // Shifts towards red/orange
                skyLight = 50 - (Math.cos(cycle) * 30);
            } else {
                // Night
                skyHue = 240;
                skyLight = 10;
            }

            ctx.fillStyle = `hsl(${skyHue}, 60%, ${skyLight}%)`;
            ctx.fillRect(0, 0, w, h);

            // Draw Sun
            ctx.fillStyle = '#FFD700'; // Gold
            ctx.beginPath();
            ctx.arc(w / 2, sunY, 150, 0, Math.PI * 2);
            ctx.fill();

            // Draw Ocean waves
            ctx.fillStyle = '#006994';
            ctx.beginPath();
            ctx.moveTo(0, h);
            for (let x = 0; x <= w; x += 50) {
                ctx.lineTo(x, h / 2 + 50 + Math.sin(x * 0.01 + t * 2) * 20);
            }
            ctx.lineTo(w, h);
            ctx.fill();
        }
    },
    {
        id: 'sem-3',
        name: 'The Endless Pendulum',
        draw: (ctx, t, c, hue, w, h) => {
            ctx.restore(); ctx.save();
            ctx.translate(w / 2, 100); // Anchor point

            const maxAngle = Math.PI / 3;
            const angle = Math.sin(t * 1.5) * maxAngle;

            const length = h * 0.6;

            ctx.rotate(angle);

            // Draw string
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, length); ctx.stroke();

            // Draw heavy weight
            ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
            ctx.beginPath(); ctx.arc(0, length, 60, 0, Math.PI * 2); ctx.fill();

            // Glowing core
            ctx.shadowBlur = 30;
            ctx.shadowColor = `hsl(${hue}, 80%, 80%)`;
            ctx.fillStyle = 'white';
            ctx.beginPath(); ctx.arc(0, length, 20, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        }
    },
    {
        id: 'sem-4',
        name: 'Breathing Geometric Flower',
        draw: (ctx, t, c, hue, w, h) => {
            const petals = 8;
            const cycle = Math.sin(t * 0.8) * 0.5 + 0.5; // 0 to 1 breathing

            for (let i = 0; i < petals; i++) {
                ctx.rotate((Math.PI * 2) / petals);
                ctx.beginPath();

                const extX = 150 + cycle * 200;
                const extY = cycle * 100;

                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(extX * 0.5, extY * 1.5, extX, 0);
                ctx.quadraticCurveTo(extX * 0.5, -extY * 1.5, 0, 0);

                ctx.strokeStyle = `hsl(${(hue + i * 20) % 360}, 80%, 60%)`;
                ctx.lineWidth = 3 + cycle * 5;
                ctx.fillStyle = `hsla(${(hue + i * 20) % 360}, 80%, 60%, 0.2)`;
                ctx.fill();
                ctx.stroke();
            }
        }
    },
    {
        id: 'sem-5',
        name: 'Infinite City Highway',
        draw: (ctx, t, c, hue, w, h) => {
            ctx.restore(); ctx.save();
            // Ground
            ctx.fillStyle = '#111'; ctx.fillRect(0, 0, w, h);

            // Perspetive road
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.moveTo(w / 2 - 50, h / 2); ctx.lineTo(w / 2 + 50, h / 2);
            ctx.lineTo(w / 2 + 400, h); ctx.lineTo(w / 2 - 400, h);
            ctx.fill();

            // Road lines moving fast
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 10;
            ctx.setLineDash([40, 40]);
            ctx.lineDashOffset = -(t * 200) % 80;
            ctx.beginPath(); ctx.moveTo(w / 2, h / 2); ctx.lineTo(w / 2, h); ctx.stroke();
            ctx.setLineDash([]);

            // Neon buildings on sides
            for (let i = 0; i < 10; i++) {
                // Buildings move towards camera and scale up
                const progress = (i - (t * 2) % 1) / 10;
                if (progress < 0) continue;

                const buildScale = 1 + (1 - progress) * 5;
                const bWidth = 80 * buildScale;
                const bHeight = 200 * buildScale;

                // Left building
                const leftX = (w / 2) - 100 - (1 - progress) * 600 - bWidth;
                const buildY = h - bHeight;
                ctx.fillStyle = `hsl(${hue}, 80%, ${20 + progress * 30}%)`;
                ctx.fillRect(leftX, buildY, bWidth, bHeight);
                ctx.strokeStyle = `hsl(${hue}, 100%, 70%)`;
                ctx.strokeRect(leftX, buildY, bWidth, bHeight);

                // Right building
                const rightX = (w / 2) + 100 + (1 - progress) * 600;
                ctx.fillStyle = `hsl(${(hue + 180) % 360}, 80%, ${20 + progress * 30}%)`;
                ctx.fillRect(rightX, buildY, bWidth, bHeight);
                ctx.strokeStyle = `hsl(${(hue + 180) % 360}, 100%, 70%)`;
                ctx.strokeRect(rightX, buildY, bWidth, bHeight);
            }
        }
    }
];

// Combine all logic into a predictable structure usable by the frontend
window.PATTERN_REGISTRY = PATTERN_REGISTRY;

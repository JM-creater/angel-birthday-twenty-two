import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export type SceneMode = 'envelope' | 'cake';

interface BirthdayScene3DProps {
  mode: SceneMode;
  isEnvelopeOpen: boolean;
  candlesLit: boolean;
  onEnvelopeTap: () => void;
  onCandleTap: () => void;
}

// Helper to create a 3D heart shape for the wax seal
function createHeartShape(scale = 1): THREE.Shape {
  const shape = new THREE.Shape();
  const x = 0;
  const y = 0;
  shape.moveTo(x, y + 0.25 * scale);
  shape.bezierCurveTo(
    x,
    y + 0.25 * scale,
    x - 0.2 * scale,
    y,
    x - 0.5 * scale,
    y
  );
  shape.bezierCurveTo(
    x - 0.95 * scale,
    y,
    x - 0.95 * scale,
    y + 0.55 * scale,
    x - 0.95 * scale,
    y + 0.55 * scale
  );
  shape.bezierCurveTo(
    x - 0.95 * scale,
    y + 0.9 * scale,
    x - 0.55 * scale,
    y + 1.25 * scale,
    x,
    y + 1.6 * scale
  );
  shape.bezierCurveTo(
    x + 0.55 * scale,
    y + 1.25 * scale,
    x + 0.95 * scale,
    y + 0.9 * scale,
    x + 0.95 * scale,
    y + 0.55 * scale
  );
  shape.bezierCurveTo(
    x + 0.95 * scale,
    y + 0.55 * scale,
    x + 0.95 * scale,
    y,
    x + 0.5 * scale,
    y
  );
  shape.bezierCurveTo(
    x + 0.2 * scale,
    y,
    x,
    y + 0.25 * scale,
    x,
    y + 0.25 * scale
  );
  return shape;
}

// Helper to create a canvas texture for the letter preview inside the 3D envelope
function createLetterCanvasTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  // Warm parchment background
  const grad = ctx.createLinearGradient(0, 0, 512, 384);
  grad.addColorStop(0, '#fff9f5');
  grad.addColorStop(1, '#fde8ef');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 384);

  // Gold border
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 8;
  ctx.strokeRect(20, 20, 472, 344);
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, 452, 324);

  // Title text
  ctx.fillStyle = '#8b2252';
  ctx.font = 'italic bold 36px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('For My Angel (Lablab)', 256, 95);

  ctx.fillStyle = '#c58b2b';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('✨ Happy 22nd Birthday ✨', 256, 140);

  // Decorative cursive lines
  ctx.fillStyle = '#5c3a47';
  ctx.font = 'italic 22px Georgia, serif';
  ctx.fillText('Tap to read your birthday letter...', 256, 205);

  // Heart emblem
  ctx.fillStyle = '#e11d48';
  ctx.font = '44px serif';
  ctx.fillText('💌', 256, 285);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createBadge22Texture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 256);

  // Glowing golden circle
  const grad = ctx.createRadialGradient(128, 128, 15, 128, 128, 118);
  grad.addColorStop(0, '#fff6d6');
  grad.addColorStop(0.55, '#f6c453');
  grad.addColorStop(1, 'rgba(246, 196, 83, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(128, 128, 118, 0, Math.PI * 2);
  ctx.fill();

  // Inner rose-gold disc
  ctx.fillStyle = '#9f1239';
  ctx.beginPath();
  ctx.arc(128, 128, 76, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 6;
  ctx.stroke();

  // "22" text
  ctx.fillStyle = '#fffbeb';
  ctx.font = 'bold 78px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('22', 128, 124);

  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#fde68a';
  ctx.fillText('ANGEL', 128, 174);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export const BirthdayScene3D: React.FC<BirthdayScene3DProps> = ({
  mode,
  isEnvelopeOpen,
  candlesLit,
  onEnvelopeTap,
  onCandleTap
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Keep latest props in refs for the requestAnimationFrame loop & event listeners
  const stateRef = useRef({
    mode,
    isEnvelopeOpen,
    candlesLit,
    onEnvelopeTap,
    onCandleTap
  });

  useEffect(() => {
    stateRef.current = {
      mode,
      isEnvelopeOpen,
      candlesLit,
      onEnvelopeTap,
      onCandleTap
    };
  }, [mode, isEnvelopeOpen, candlesLit, onEnvelopeTap, onCandleTap]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x140818, 0.036);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const aspect = width / height;

    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    const getResponsiveBaseZ = (asp: number, currentMode: SceneMode) => {
      const mobileFactor = asp < 0.85 ? (0.85 - asp) * 6.2 : 0;
      if (currentMode === 'cake') return 8.2 + mobileFactor;
      return 7.8 + mobileFactor;
    };
    camera.position.set(0, 0.4, getResponsiveBaseZ(aspect, stateRef.current.mode));

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffd6e7, 0.85);
    scene.add(ambientLight);

    const mainDirLight = new THREE.DirectionalLight(0xfff0f5, 1.6);
    mainDirLight.position.set(5, 8, 6);
    scene.add(mainDirLight);

    const rimLight = new THREE.PointLight(0xf43f5e, 2.2, 20);
    rimLight.position.set(-5, -2, 3);
    scene.add(rimLight);

    const goldHaloLight = new THREE.PointLight(0xfbbf24, 1.8, 16);
    goldHaloLight.position.set(0, 4.2, 2);
    scene.add(goldHaloLight);

    // Master rotatable world group
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // =========================================================================
    // A. SHARED ANGEL HALO (Crowns the active centerpiece)
    // =========================================================================
    const haloGroup = new THREE.Group();
    haloGroup.position.set(0, 2.25, 0);
    worldGroup.add(haloGroup);

    const haloGeo = new THREE.TorusGeometry(0.95, 0.065, 24, 90);
    const haloMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.55,
      metalness: 0.85,
      roughness: 0.15
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.rotation.x = Math.PI / 2;
    haloGroup.add(haloMesh);

    // Subtle glowing inner halo ring
    const innerHaloGeo = new THREE.TorusGeometry(0.95, 0.12, 16, 64);
    const innerHaloMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.22
    });
    const innerHaloMesh = new THREE.Mesh(innerHaloGeo, innerHaloMat);
    innerHaloMesh.rotation.x = Math.PI / 2;
    haloGroup.add(innerHaloMesh);

    // =========================================================================
    // B. 3D LOVE ENVELOPE GROUP (Centerpiece for 'envelope' mode)
    // =========================================================================
    const envelopeGroup = new THREE.Group();
    worldGroup.add(envelopeGroup);

    const envWidth = 3.2;
    const envHeight = 2.1;
    const envDepth = 0.14;

    // Envelope body
    const envBodyGeo = new THREE.BoxGeometry(envWidth, envHeight, envDepth);
    const envBodyMat = new THREE.MeshStandardMaterial({
      color: 0xffe4ec,
      roughness: 0.35,
      metalness: 0.08
    });
    const envBodyMesh = new THREE.Mesh(envBodyGeo, envBodyMat);
    envBodyMesh.userData = { type: 'envelope' };
    envelopeGroup.add(envBodyMesh);

    // Front folded pocket V-trim
    const pocketMat = new THREE.MeshStandardMaterial({
      color: 0xfbcfe8,
      roughness: 0.4,
      metalness: 0.1
    });
    const pocketGeo = new THREE.BoxGeometry(envWidth * 0.98, envHeight * 0.62, 0.025);
    const pocketMesh = new THREE.Mesh(pocketGeo, pocketMat);
    pocketMesh.position.set(0, -envHeight * 0.18, envDepth * 0.52);
    pocketMesh.userData = { type: 'envelope' };
    envelopeGroup.add(pocketMesh);

    // Gold border trim on front
    const borderGeo = new THREE.EdgesGeometry(envBodyGeo);
    const borderMat = new THREE.LineBasicMaterial({ color: 0xf59e0b });
    const borderLines = new THREE.LineSegments(borderGeo, borderMat);
    envelopeGroup.add(borderLines);

    // Envelope top flap (pivots along the top edge y = envHeight / 2)
    const flapPivot = new THREE.Group();
    flapPivot.position.set(0, envHeight / 2, envDepth / 2);
    envelopeGroup.add(flapPivot);

    const flapShape = new THREE.Shape();
    flapShape.moveTo(-envWidth / 2, 0);
    flapShape.lineTo(envWidth / 2, 0);
    flapShape.lineTo(0, -envHeight * 0.62);
    flapShape.closePath();

    const flapExtrude = new THREE.ExtrudeGeometry(flapShape, {
      depth: 0.025,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.01,
      bevelThickness: 0.01
    });
    const flapMat = new THREE.MeshStandardMaterial({
      color: 0xf9a8d4,
      roughness: 0.32,
      metalness: 0.12,
      side: THREE.DoubleSide
    });
    const flapMesh = new THREE.Mesh(flapExtrude, flapMat);
    flapMesh.userData = { type: 'envelope' };
    flapPivot.add(flapMesh);

    // 3D Crimson & Gold Heart Wax Seal on the tip of the flap
    const sealHeartShape = createHeartShape(0.28);
    const sealGeo = new THREE.ExtrudeGeometry(sealHeartShape, {
      depth: 0.07,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02
    });
    sealGeo.center();
    const sealMat = new THREE.MeshStandardMaterial({
      color: 0xbe123c,
      emissive: 0x881337,
      emissiveIntensity: 0.35,
      roughness: 0.25,
      metalness: 0.45
    });
    const sealMesh = new THREE.Mesh(sealGeo, sealMat);
    sealMesh.position.set(0, -envHeight * 0.54, 0.055);
    sealMesh.userData = { type: 'envelope' };
    flapPivot.add(sealMesh);

    // Sliding Letter Card inside the envelope
    const letterTexture = createLetterCanvasTexture();
    const letterGeo = new THREE.PlaneGeometry(envWidth * 0.88, envHeight * 0.86);
    const letterMat = new THREE.MeshStandardMaterial({
      map: letterTexture,
      roughness: 0.4,
      metalness: 0.05,
      side: THREE.DoubleSide
    });
    const letterCardMesh = new THREE.Mesh(letterGeo, letterMat);
    letterCardMesh.position.set(0, 0.02, 0.01);
    letterCardMesh.userData = { type: 'envelope' };
    envelopeGroup.add(letterCardMesh);

    // =========================================================================
    // C. 3D TWO-TIER 22nd BIRTHDAY CAKE GROUP (Centerpiece for 'cake' mode)
    // =========================================================================
    const cakeGroup = new THREE.Group();
    cakeGroup.position.set(0, -6, 0);
    cakeGroup.scale.setScalar(0.001);
    worldGroup.add(cakeGroup);

    // Golden cake stand plate
    const plateGeo = new THREE.CylinderGeometry(2.05, 1.85, 0.14, 48);
    const goldStandMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.78,
      roughness: 0.22
    });
    const plateMesh = new THREE.Mesh(plateGeo, goldStandMat);
    plateMesh.position.y = -1.25;
    plateMesh.userData = { type: 'cake' };
    cakeGroup.add(plateMesh);

    const pedestalGeo = new THREE.CylinderGeometry(0.45, 0.85, 0.55, 32);
    const pedestalMesh = new THREE.Mesh(pedestalGeo, goldStandMat);
    pedestalMesh.position.y = -1.55;
    cakeGroup.add(pedestalMesh);

    // Bottom Tier (Rose Velvet Frosting)
    const tier1Geo = new THREE.CylinderGeometry(1.65, 1.65, 1.05, 48);
    const tier1Mat = new THREE.MeshStandardMaterial({
      color: 0xfda4af,
      roughness: 0.42,
      metalness: 0.05
    });
    const tier1Mesh = new THREE.Mesh(tier1Geo, tier1Mat);
    tier1Mesh.position.y = -0.68;
    tier1Mesh.userData = { type: 'cake' };
    cakeGroup.add(tier1Mesh);

    // Top Tier (Cream Vanilla Frosting)
    const tier2Geo = new THREE.CylinderGeometry(1.18, 1.18, 0.92, 48);
    const tier2Mat = new THREE.MeshStandardMaterial({
      color: 0xfff1f2,
      roughness: 0.35,
      metalness: 0.05
    });
    const tier2Mesh = new THREE.Mesh(tier2Geo, tier2Mat);
    tier2Mesh.position.y = 0.28;
    tier2Mesh.userData = { type: 'cake' };
    cakeGroup.add(tier2Mesh);

    // Frosting Pearls & Berries around both tiers
    const pearlMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      roughness: 0.2,
      metalness: 0.3
    });
    const berryMat = new THREE.MeshStandardMaterial({
      color: 0xe11d48,
      roughness: 0.22,
      metalness: 0.1
    });

    for (let i = 0; i < 22; i++) {
      const angle = (i / 22) * Math.PI * 2;
      const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 14), pearlMat);
      pearl.position.set(
        Math.cos(angle) * 1.63,
        -0.18,
        Math.sin(angle) * 1.63
      );
      cakeGroup.add(pearl);
    }

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const berry = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), berryMat);
      berry.position.set(
        Math.cos(angle) * 1.02,
        0.76,
        Math.sin(angle) * 1.02
      );
      berry.userData = { type: 'cake' };
      cakeGroup.add(berry);
    }

    // "22 ANGEL" Medallion on the front of the cake
    const badgeTexture = createBadge22Texture();
    const badgeGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.06, 32);
    const badgeMat = new THREE.MeshStandardMaterial({
      map: badgeTexture,
      roughness: 0.25,
      metalness: 0.3
    });
    const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
    badgeMesh.rotation.x = Math.PI / 2;
    badgeMesh.position.set(0, 0.28, 1.18);
    badgeMesh.userData = { type: 'cake' };
    cakeGroup.add(badgeMesh);

    // 4 Interactive Candles on top of the cake
    const candlePositions = [
      new THREE.Vector3(-0.55, 1.08, 0.25),
      new THREE.Vector3(-0.18, 1.12, -0.22),
      new THREE.Vector3(0.18, 1.12, -0.22),
      new THREE.Vector3(0.55, 1.08, 0.25)
    ];

    const flameMeshes: THREE.Mesh[] = [];
    const candleLights: THREE.PointLight[] = [];

    candlePositions.forEach((pos, idx) => {
      // Candle wax cylinder
      const candleGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.68, 20);
      const candleMat = new THREE.MeshStandardMaterial({
        color: idx % 2 === 0 ? 0xf43f5e : 0xfbbf24,
        roughness: 0.3,
        metalness: 0.15
      });
      const candleMesh = new THREE.Mesh(candleGeo, candleMat);
      candleMesh.position.copy(pos);
      candleMesh.userData = { type: 'cake' };
      cakeGroup.add(candleMesh);

      // Wick
      const wickGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.09, 8);
      const wickMat = new THREE.MeshBasicMaterial({ color: 0x27272a });
      const wickMesh = new THREE.Mesh(wickGeo, wickMat);
      wickMesh.position.set(pos.x, pos.y + 0.36, pos.z);
      cakeGroup.add(wickMesh);

      // Flame
      const flameGeo = new THREE.ConeGeometry(0.095, 0.28, 16);
      const flameMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.95
      });
      const flameMesh = new THREE.Mesh(flameGeo, flameMat);
      flameMesh.position.set(pos.x, pos.y + 0.5, pos.z);
      flameMesh.userData = { type: 'cake', flameIndex: idx };
      cakeGroup.add(flameMesh);
      flameMeshes.push(flameMesh);

      // Warm candle PointLight
      const cLight = new THREE.PointLight(0xfbbf24, 1.1, 5.5);
      cLight.position.set(pos.x, pos.y + 0.55, pos.z);
      cakeGroup.add(cLight);
      candleLights.push(cLight);
    });

    // =========================================================================
    // D. MAGICAL STARDUST PARTICLES
    // =========================================================================
    const particleCount = 420;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const palette = [
      new THREE.Color(0xfda4af),
      new THREE.Color(0xfde047),
      new THREE.Color(0xf9a8d4),
      new THREE.Color(0xffffff)
    ];

    for (let i = 0; i < particleCount; i++) {
      const r = 2.5 + Math.random() * 11.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      positions[i * 3] = r * Math.cos(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi);
      positions[i * 3 + 2] = r * Math.cos(phi) * Math.sin(theta);

      const col = palette[i % palette.length];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particlesMat = new THREE.PointsMaterial({
      size: 0.085,
      vertexColors: true,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending
    });

    const starField = new THREE.Points(particlesGeo, particlesMat);
    scene.add(starField);

    // =========================================================================
    // E. POINTER / TOUCH INTERACTION (Orbit drag + Raycast tap)
    // =========================================================================
    let isDragging = false;
    let pointerDownPos = { x: 0, y: 0 };
    let previousPointerPos = { x: 0, y: 0 };
    let targetRotY = 0;
    let targetRotX = 0.08;
    let currentRotY = 0;
    let currentRotX = 0.08;

    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2();

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      pointerDownPos = { x: e.clientX, y: e.clientY };
      previousPointerPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - previousPointerPos.x;
      const dy = e.clientY - previousPointerPos.y;
      previousPointerPos = { x: e.clientX, y: e.clientY };

      targetRotY += dx * 0.0075;
      targetRotX = Math.max(-0.55, Math.min(0.65, targetRotX + dy * 0.0055));
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;

      const moveDist = Math.hypot(
        e.clientX - pointerDownPos.x,
        e.clientY - pointerDownPos.y
      );

      // Treat as a tap/click if finger/mouse moved less than 10px
      if (moveDist < 10) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(pointerNDC, camera);
        const intersects = raycaster.intersectObjects(worldGroup.children, true);

        for (const hit of intersects) {
          const data = hit.object.userData;
          if (data?.type === 'envelope' && stateRef.current.mode === 'envelope') {
            stateRef.current.onEnvelopeTap();
            return;
          }
          if (data?.type === 'cake' && stateRef.current.mode === 'cake') {
            stateRef.current.onCandleTap();
            return;
          }
        }
      }
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Resize listener
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || window.innerWidth;
      const newH = container.clientHeight || window.innerHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    // =========================================================================
    // F. ANIMATION LOOP
    // =========================================================================
    let animFrameId = 0;
    const clock = new THREE.Clock();

    // Smooth animated state variables
    let flapOpenProgress = 0;
    let envelopeScale = 1;
    let cakeScale = 0.001;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const {
        mode: activeMode,
        isEnvelopeOpen: envOpen,
        candlesLit: lit
      } = stateRef.current;

      // 1. Camera responsive distance interpolation
      const currentAspect =
        (container.clientWidth || window.innerWidth) /
        (container.clientHeight || window.innerHeight);
      const desiredZ = getResponsiveBaseZ(currentAspect, activeMode);
      camera.position.z += (desiredZ - camera.position.z) * 0.06;

      // 2. Gentle auto-rotation when not dragging
      if (!isDragging) {
        targetRotY += 0.0022;
      }
      currentRotY += (targetRotY - currentRotY) * 0.08;
      currentRotX += (targetRotX - currentRotX) * 0.08;

      worldGroup.rotation.y = currentRotY;
      worldGroup.rotation.x = currentRotX;

      // 3. Halo gentle float & shimmer
      const haloTargetY = activeMode === 'cake' ? 2.15 : 2.05;
      haloGroup.position.y +=
        (haloTargetY + Math.sin(elapsed * 2.2) * 0.1 - haloGroup.position.y) * 0.08;
      haloMesh.rotation.z = elapsed * 0.5;

      // 4. Envelope mode vs Cake mode transitions
      const targetEnvScale = activeMode === 'envelope' ? 1 : 0.001;
      const targetEnvY =
        activeMode === 'envelope' ? Math.sin(elapsed * 1.8) * 0.12 : 4.5;
      envelopeScale += (targetEnvScale - envelopeScale) * 0.09;
      envelopeGroup.scale.setScalar(Math.max(0.001, envelopeScale));
      envelopeGroup.position.y += (targetEnvY - envelopeGroup.position.y) * 0.09;
      envelopeGroup.visible = envelopeScale > 0.02;

      // Envelope flap & inner letter card animation
      const targetFlap = envOpen ? 1 : 0;
      flapOpenProgress += (targetFlap - flapOpenProgress) * 0.08;
      flapPivot.rotation.x = -flapOpenProgress * Math.PI * 0.82;
      letterCardMesh.position.y = 0.02 + flapOpenProgress * 0.95;
      letterCardMesh.position.z = 0.01 + flapOpenProgress * 0.18;

      // 5. Cake mode transitions & flickering candle flames
      const targetCakeScale = activeMode === 'cake' ? 1 : 0.001;
      const targetCakeY =
        activeMode === 'cake' ? -0.15 + Math.sin(elapsed * 1.6) * 0.08 : -5.5;
      cakeScale += (targetCakeScale - cakeScale) * 0.09;
      cakeGroup.scale.setScalar(Math.max(0.001, cakeScale));
      cakeGroup.position.y += (targetCakeY - cakeGroup.position.y) * 0.09;
      cakeGroup.visible = cakeScale > 0.02;

      flameMeshes.forEach((flame, idx) => {
        const light = candleLights[idx];
        if (lit) {
          flame.visible = true;
          const flicker =
            1 +
            Math.sin(elapsed * 14 + idx * 2.1) * 0.14 +
            Math.cos(elapsed * 23 + idx) * 0.08;
          flame.scale.set(1, flicker, 1);
          flame.rotation.z = Math.sin(elapsed * 10 + idx) * 0.08;
          light.intensity = 1.15 * flicker;
        } else {
          flame.scale.lerp(new THREE.Vector3(0.01, 0.01, 0.01), 0.15);
          if (flame.scale.y < 0.05) flame.visible = false;
          light.intensity += (0 - light.intensity) * 0.15;
        }
      });

      // 6. Slowly rotate background stardust
      starField.rotation.y = elapsed * 0.03;
      starField.rotation.x = Math.sin(elapsed * 0.15) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameId);
      domElem.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="three-canvas-container"
      aria-label="Interactive 3D 22nd Birthday Scene for Angel"
    />
  );
};

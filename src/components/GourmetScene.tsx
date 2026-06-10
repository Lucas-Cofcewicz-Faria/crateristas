'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

export default function GourmetScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeGeometriesRef = useRef<THREE.BufferGeometry[]>([]);
  const activeMaterialRef = useRef<THREE.Material | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    // Deep sunset violet fog for ambient atmospheric depth
    scene.fog = new THREE.FogExp2(0x160b19, 0.055);

    // 2. Camera Setup (Increased FOV to 70 for exaggerated wide-angle 3D depth)
    const camera = new THREE.PerspectiveCamera(
      70,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    // Camera starts looking from angled overview matching the FAU USP mockup (moved back slightly to show walk lines)
    camera.position.set(0, -12.5, 16.0);

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Refined Fine-Grained Concrete/Asphalt Texture Generator
    const createFineTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Base dark gray color (slightly lighter to show grain)
      ctx.fillStyle = '#222222';
      ctx.fillRect(0, 0, 512, 512);

      // Super fine grain noise (increased range for clear visible texture)
      const imgData = ctx.getImageData(0, 0, 512, 512);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 26;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
        data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise)); // G
        data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise)); // B
      }
      ctx.putImageData(imgData, 0, 0);

      // Add very subtle fine aggregate grains (increased count and contrast)
      for (let i = 0; i < 3500; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = Math.random() * 0.8 + 0.3; // Very small grains
        const isDark = Math.random() > 0.5;
        ctx.fillStyle = isDark ? 'rgba(0,0,0,0.32)' : 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Add organic cracks in the asphalt
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        let cx = Math.random() * 512;
        let cy = Math.random() * 512;
        ctx.moveTo(cx, cy);
        const steps = Math.floor(Math.random() * 5) + 3;
        for (let j = 0; j < steps; j++) {
          cx += (Math.random() - 0.5) * 35;
          cy += (Math.random() - 0.5) * 35;
          ctx.lineTo(cx, cy);
        }
        ctx.stroke();
      }

      // Add oil stains
      for (let i = 0; i < 15; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = Math.random() * 15 + 4;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, 'rgba(0,0,0,0.18)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(24, 24); // Fine tiling
      return texture;
    };

    const createConcreteTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Base concrete gray
      ctx.fillStyle = '#9c9c9c';
      ctx.fillRect(0, 0, 512, 512);

      // Fine grain noise
      const imgData = ctx.getImageData(0, 0, 512, 512);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 16;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
        data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise)); // G
        data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise)); // B
      }
      ctx.putImageData(imgData, 0, 0);

      // Draw vertical/horizontal brutalist formwork lines (board-marked concrete)
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1.2;
      
      // Horizontal joint lines (every 64px)
      for (let y = 64; y < 512; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }

      // Staggered vertical joint lines (every 128px)
      for (let y = 0; y < 512; y += 64) {
        const xOffset = (y / 64) % 2 === 0 ? 0 : 64;
        for (let x = xOffset; x < 512; x += 128) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + 64);
          ctx.stroke();
        }
      }

      // Concrete aggregate spots
      for (let i = 0; i < 800; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = Math.random() * 0.7 + 0.3;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Add concrete stains and weathering patches
      for (let i = 0; i < 8; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = Math.random() * 50 + 25;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, 'rgba(0,0,0,0.06)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(3, 2); // Tiling size
      return texture;
    };

    const fineTexture = createFineTexture();
    const concreteTexture = createConcreteTexture();

    // 5. Lighting - Sunset Theme (Refined to keep neutral grays crisp)
    // Ambient light with cool twilight lavender-indigo undertones to balance warm sun
    const ambientLight = new THREE.AmbientLight(0x8892b0, 0.5);
    scene.add(ambientLight);

    // Directional light representing the sunset sun casting warm golden-peach shadows
    const sunLight = new THREE.DirectionalLight(0xffe5cc, 2.0);
    sunLight.position.set(6, 9, 14); // Slanted light source to cast shadows forward-left
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 40;
    const d = 16;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0003;
    scene.add(sunLight);

    // Dynamic camera headlight (soft neutral-warm peach headlight)
    const cameraLight = new THREE.PointLight(0xfff0e0, 3.2, 25);
    camera.add(cameraLight);
    scene.add(camera);

    // Glowing orange core at the bottom of the crater (range restricted to 20 to prevent leakage)
    const coreLight = new THREE.PointLight(0xffaa44, 9, 20);
    coreLight.position.set(0, 0, -26);
    scene.add(coreLight);

    // Side lights for structural orange/purple sunset highlights in the tunnel
    // (moved deeper and range restricted to 12 to completely eliminate pink/orange light leak on the sloped ground)
    const sideLight1 = new THREE.PointLight(0xff5533, 4.0, 12);
    sideLight1.position.set(2, 2, -10);
    scene.add(sideLight1);

    const sideLight2 = new THREE.PointLight(0x772255, 3.0, 12);
    sideLight2.position.set(-2, -2, -18);
    scene.add(sideLight2);

    // 6. Geometry & Meshes

    // Parameters
    const tunnelLength = 40;
    const radiusBottom = 0.25; // Tapered bottom
    const radialSegments = 60;
    const heightSegments = 30;

    // Crater squircle parameters (defines the actual hole and the inner limit of the ground decline)
    // Reverted size to be compact but slightly smaller than the white outline
    const craterW = 2.8;
    const craterH = 2.2;
    const craterR = 0.65;

    // White ring squircle parameters (reduced proportionally, larger than crater hole)
    const ringW = 3.5;
    const ringH = 2.8;
    const ringR = 0.8;

    // Helper to calculate coordinates on any squircle boundary at any angle
    const getSquirclePoint = (angle: number, w: number, h: number, r: number) => {
      let theta = angle;
      while (theta < -Math.PI) theta += Math.PI * 2;
      while (theta > Math.PI) theta -= Math.PI * 2;

      const signX = Math.sign(Math.cos(theta)) || 1;
      const signY = Math.sign(Math.sin(theta)) || 1;

      const absCos = Math.abs(Math.cos(theta));
      const absSin = Math.abs(Math.sin(theta));
      const thetaQ = Math.atan2(absSin, absCos);

      const xc = w / 2 - r;
      const yc = h / 2 - r;

      const theta1 = Math.atan2(yc, w / 2);
      const theta2 = Math.atan2(h / 2, xc);

      let xq = 0;
      let yq = 0;

      if (thetaQ < theta1) {
        xq = w / 2;
        yq = xq * Math.tan(thetaQ);
      } else if (thetaQ > theta2) {
        yq = h / 2;
        xq = yq / Math.tan(thetaQ);
      } else {
        const cosQ = Math.cos(thetaQ);
        const sinQ = Math.sin(thetaQ);
        const B = xc * cosQ + yc * sinQ;
        const C = xc * xc + yc * yc - r * r;
        const k = B + Math.sqrt(Math.max(0, B * B - C));
        xq = k * cosQ;
        yq = k * sinQ;
      }

      return new THREE.Vector2(xq * signX, yq * signY);
    };

    // Helper to calculate the ground height at any (x, y) coordinate (sloped inside the outer ring)
    const getGroundHeight = (x: number, y: number) => {
      const angle = Math.atan2(y, x);
      const dist = Math.sqrt(x * x + y * y);

      // Inner squircle (crater hole boundary)
      const innerSqPt = getSquirclePoint(angle, craterW, craterH, craterR);
      const innerDist = innerSqPt.length();

      // Outer squircle (inner boundary of the outer white ring: w = 7.0, h = 5.6, r = 1.6)
      const outerSqPt = getSquirclePoint(angle, 7.0, 5.6, 1.6);
      const outerDist = outerSqPt.length();

      if (dist >= outerDist) {
        return 10.0; // Flat outer terrain
      } else if (dist <= innerDist) {
        return 7.0; // Bottom of the slope (crater mouth rim, matches the tunnel top rim at Z = 7.0)
      } else {
        // Strictly concave bowl-shaped curve:
        // u goes from 0 (at outerDist, Z=10.0) to 1 (at innerDist, Z=7.0).
        // Using a quadratic curve (u^2) makes the slope flat at the outer edge
        // and steeper at the crater mouth, eliminating the dome optical illusion.
        const u = (outerDist - dist) / (outerDist - innerDist);
        const smoothU = Math.pow(u, 2.0);
        return 10.0 - 3.0 * smoothU;
      }
    };

    // A. Clean Minimalist Dark Gray Ground Ring (Surrounds the crater entrance at Z = 10)
    // Increased phiSegments from 16 to 24 for a much smoother curve
    const groundGeom = new THREE.RingGeometry(1.0, 28.0, 64, 24);
    
    // Apply squircle morphing and the decline (depression) leading to the crater
    const groundPosAttr = groundGeom.attributes.position;
    const R_inner = 1.0;
    const R_outer = 28.0;
    for (let i = 0; i < groundPosAttr.count; i++) {
      const x = groundPosAttr.getX(i);
      const y = groundPosAttr.getY(i);
      const dist = Math.sqrt(x * x + y * y);
      const angle = Math.atan2(y, x);

      // Interpolation factor t from inner boundary (0) to outer boundary (1)
      const t = Math.min(1, Math.max(0, (dist - R_inner) / (R_outer - R_inner)));

      // Bias the vertices to cluster heavily near the center (using t^2.2) 
      // so we have high resolution to render the smooth sloped crater bowl curve.
      const t_morphed = Math.pow(t, 2.2);

      // Get squircle boundary distance for the actual crater mouth
      const sqPt = getSquirclePoint(angle, craterW, craterH, craterR);
      const sqDist = sqPt.length();

      // Morphed distance using the biased factor
      const newDist = (1 - t_morphed) * sqDist + t_morphed * R_outer;

      const newX = newDist * Math.cos(angle);
      const newY = newDist * Math.sin(angle);

      // Apply Z-decline (flat ground outside the crater mouth)
      const baseZ = getGroundHeight(newX, newY);
      const decline = baseZ - 10.0; // Relative to the main ground level of Z = 10.0

      groundPosAttr.setX(i, newX);
      groundPosAttr.setY(i, newY);
      groundPosAttr.setZ(i, decline);
    }
    groundGeom.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      map: fineTexture,
      bumpMap: fineTexture,
      bumpScale: 0.18, // Clearly visible textured asphalt feel
      color: 0x888c94, // Lighter base gray so asphalt texture renders as a beautiful neutral dark gray
      roughness: 0.98,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.position.set(0, 0, 10);
    ground.receiveShadow = true;
    scene.add(ground);

    // A2. White Squircle Ring around the crater (recreating the satellite view squircle shape)
    const createSquircleRing = (outerW: number, outerH: number, innerW: number, innerH: number, rOuter: number, rInner: number) => {
      const shape = new THREE.Shape();
      const ox = -outerW / 2;
      const oy = -outerH / 2;
      shape.moveTo(ox + rOuter, oy);
      shape.lineTo(ox + outerW - rOuter, oy);
      shape.quadraticCurveTo(ox + outerW, oy, ox + outerW, oy + rOuter);
      shape.lineTo(ox + outerW, oy + outerH - rOuter);
      shape.quadraticCurveTo(ox + outerW, oy + outerH, ox + outerW - rOuter, oy + outerH);
      shape.lineTo(ox + rOuter, oy + outerH);
      shape.quadraticCurveTo(ox, oy + outerH, ox, oy + outerH - rOuter);
      shape.lineTo(ox, oy + rOuter);
      shape.quadraticCurveTo(ox, oy, ox + rOuter, oy);

      const holePath = new THREE.Path();
      const ix = -innerW / 2;
      const iy = -innerH / 2;
      holePath.moveTo(ix + rInner, iy);
      holePath.lineTo(ix + innerW - rInner, iy);
      holePath.quadraticCurveTo(ix + innerW, iy, ix + innerW, iy + rInner);
      holePath.lineTo(ix + innerW, iy + innerH - rInner);
      holePath.quadraticCurveTo(ix + innerW, iy + innerH, ix + innerW - rInner, iy + innerH);
      holePath.lineTo(ix + rInner, iy + innerH);
      holePath.quadraticCurveTo(ix, iy + innerH, ix, iy + innerH - rInner);
      holePath.lineTo(ix, iy + rInner);
      holePath.quadraticCurveTo(ix, iy, ix + rInner, iy);
      
      shape.holes.push(holePath);
      return new THREE.ShapeGeometry(shape);
    };

    // Outer White Ring (Width = 7.4, Height = 6.0)
    const whiteRingOuterGeom = createSquircleRing(7.4, 6.0, 7.0, 5.6, 1.7, 1.6);
    
    // Inner White Ring (Width = 3.7, Height = 3.0)
    const whiteRingInnerGeom = createSquircleRing(3.7, 3.0, 3.5, 2.8, 0.85, 0.8);
    
    // Slopes both white rings down to match the ground decline
    const slopeRingGeometry = (geom: THREE.BufferGeometry) => {
      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const rx = pos.getX(i);
        const ry = pos.getY(i);
        const baseZ = getGroundHeight(rx, ry);
        pos.setZ(i, baseZ - 10.0);
      }
      geom.computeVertexNormals();
    };

    slopeRingGeometry(whiteRingOuterGeom);
    slopeRingGeometry(whiteRingInnerGeom);

    const whiteRingMat = new THREE.MeshStandardMaterial({
      bumpMap: fineTexture,
      bumpScale: 0.08,
      color: 0xffffff,
      roughness: 0.95,
      metalness: 0.05,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });

    const whiteRingOuter = new THREE.Mesh(whiteRingOuterGeom, whiteRingMat);
    whiteRingOuter.position.set(0, 0, 10.03); // Positioned slightly above ground plane to prevent Z-fighting
    whiteRingOuter.receiveShadow = true;
    scene.add(whiteRingOuter);

    const whiteRingInner = new THREE.Mesh(whiteRingInnerGeom, whiteRingMat);
    whiteRingInner.position.set(0, 0, 10.03);
    whiteRingInner.receiveShadow = true;
    scene.add(whiteRingInner);



    // B. Crater Tunnel
    const tunnelGeometry = new THREE.CylinderGeometry(
      1.0, // Base top radius (will be morphed)
      radiusBottom,    
      tunnelLength,
      radialSegments,
      heightSegments,
      true // openEnded
    );

    // Align with Z-axis
    tunnelGeometry.rotateX(Math.PI / 2);
    // Center it so the entrance is exactly at Z = 10 (matching the asphalt ground)
    tunnelGeometry.translate(0, 0, -10);

    // Morph coordinates to match the squircle mouth at the top (Z = 10) and a circle at the bottom (Z = -30)
    // while adding rough volcanic rock ridges and aligning the rim with the ground decline
    const posAttr = tunnelGeometry.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);

      const angle = Math.atan2(y, x);

      // Progress along the tunnel: 0 at z=10, 1 at z=-30
      const progress = Math.min(1, Math.max(0, (10 - z) / tunnelLength));

      // Get squircle boundary point at this angle
      const sqPt = getSquirclePoint(angle, craterW, craterH, craterR);

      // Get bottom circle point at this angle
      const x_bottom = radiusBottom * Math.cos(angle);
      const y_bottom = radiusBottom * Math.sin(angle);

      // Interpolate between squircle top and circular bottom
      const x_interp = (1 - progress) * sqPt.x + progress * x_bottom;
      const y_interp = (1 - progress) * sqPt.y + progress * y_bottom;
      const r_interp = Math.sqrt(x_interp * x_interp + y_interp * y_interp);

      // Create volcanic basalt rock ridges/noise
      const noise = Math.sin(z * 1.5) * 0.35 + Math.cos(z * 0.6) * 0.18;

      // Do not deform the very top rim to keep the seal with the asphalt perfectly aligned
      const rimFactor = Math.min(1, Math.max(0, (10 - z) / 2));
      const newRadius = r_interp + noise * rimFactor;

      const finalX = (x_interp / r_interp) * newRadius;
      const finalY = (y_interp / r_interp) * newRadius;

      // Align the top rim with the sloped ground decline (starts at Z = 7.0, bottom at Z = -30.0)
      const finalZ = -30.0 + (z + 30.0) * 37.0 / 40.0;
      posAttr.setX(i, finalX);
      posAttr.setY(i, finalY);
      posAttr.setZ(i, finalZ);
    }
    tunnelGeometry.computeVertexNormals();

    // Premium dark volcanic rock material for crater walls
    const tunnelMaterial = new THREE.MeshStandardMaterial({
      color: 0x121110,
      roughness: 0.9,
      metalness: 0.35,
      flatShading: true,
      side: THREE.BackSide, // Camera looks at inside walls
    });

    const tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
    scene.add(tunnel);

    // B2. Crater Floor (Basalt rock bottom at Z = -29.9)
    const floorGeom = new THREE.CircleGeometry(radiusBottom, radialSegments);
    const floorMat = new THREE.MeshStandardMaterial({
      map: fineTexture,
      bumpMap: fineTexture,
      bumpScale: 0.08,
      color: 0x121110, // Matching the volcanic rock walls
      roughness: 0.95,
      metalness: 0.2,
      flatShading: true,
    });
    const craterFloor = new THREE.Mesh(floorGeom, floorMat);
    craterFloor.position.set(0, 0, -29.9); // Slight offset inside the bottom of the cylinder
    scene.add(craterFloor);

    // B3. Low-Poly FAU USP Scene Group (Placed on top of ground at Z = 10)
    const lowPolyGroup = new THREE.Group();
    scene.add(lowPolyGroup);

    // B3.1. Simplified FAU USP Building
    const concreteMat = new THREE.MeshStandardMaterial({
      map: concreteTexture,
      bumpMap: concreteTexture,
      bumpScale: 0.08,
      color: 0xcccccc, // Neutral light gray
      emissive: 0x2b2b2b, // Low emissive to keep it light gray under warm sunset light
      roughness: 0.75,
    });

    const windowColor = 0x121a22;
    const glassMat = new THREE.MeshStandardMaterial({
      color: windowColor,
      roughness: 0.15,
      metalness: 0.85,
    });

    // Main Suspended Block (FAU Building)
    const blockGeom = new THREE.BoxGeometry(25, 4.2, 2.5); // Width: 25, Depth: 4.2, Height: 2.5
    const blockMesh = new THREE.Mesh(blockGeom, concreteMat);
    blockMesh.position.set(0, 11.5, 13.75); // Bottom sits at Z = 12.5
    blockMesh.castShadow = true;
    blockMesh.receiveShadow = true;
    lowPolyGroup.add(blockMesh);

    // Recessed Window Glass Stripe (Simple horizontal window band on the front)
    const windowGeom = new THREE.BoxGeometry(24.6, 0.1, 1.2);
    const windowMesh = new THREE.Mesh(windowGeom, glassMat);
    windowMesh.position.set(0, 9.35, 13.75); // Positioned on the front facade of the block
    windowMesh.castShadow = true;
    windowMesh.receiveShadow = true;
    lowPolyGroup.add(windowMesh);

    // Simple Columns (Cylinders supporting the suspended block)
    const colGeom = new THREE.CylinderGeometry(0.14, 0.14, 2.5, 6);
    colGeom.rotateX(Math.PI / 2); // Orient standing vertically along Z axis
    const colPositions = [-9.5, -5.7, -1.9, 1.9, 5.7, 9.5];
    colPositions.forEach(x => {
      const col = new THREE.Mesh(colGeom, concreteMat);
      col.position.set(x, 11.5, 11.25); // Stands from Z=10 to Z=12.5
      col.castShadow = true;
      col.receiveShadow = true;
      lowPolyGroup.add(col);
    });

    // B3.7. Missing FAU Lower Block & Walk Path (drawn in pink/purple in references)
    const lowerBlockGeom = new THREE.BoxGeometry(12.0, 2.0, 0.8);
    const lowerBlockMesh = new THREE.Mesh(lowerBlockGeom, concreteMat);
    lowerBlockMesh.position.set(0, 8.5, 10.4); // Bottom sits at Z=10.0, top at Z=10.8
    lowerBlockMesh.castShadow = true;
    lowerBlockMesh.receiveShadow = true;
    lowPolyGroup.add(lowerBlockMesh);

    const lowerBlockPathGeom = new THREE.BoxGeometry(1.2, 3.0, 0.02);
    const lowerBlockPathMesh = new THREE.Mesh(lowerBlockPathGeom, concreteMat);
    lowerBlockPathMesh.position.set(0, 6.0, 10.01);
    lowerBlockPathMesh.receiveShadow = true;
    lowPolyGroup.add(lowerBlockPathMesh);

    // B3.2. Detailed Slanted Parking Lot & Road Markings
    const parkingLinesGroup = new THREE.Group();
    const parkingLineMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, // Bright solid white
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });

    const roadGeometries: THREE.BufferGeometry[] = [];

    // Helper to create straight line segments for parking slots
    const createParkingLine = (p1: THREE.Vector2, p2: THREE.Vector2) => {
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const dist = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
      const rot = Math.atan2(p2.y - p1.y, p2.x - p1.x);

      const geom = new THREE.PlaneGeometry(dist, 0.05);
      geom.rotateZ(rot);
      
      const baseZ = getGroundHeight(midX, midY);
      const mesh = new THREE.Mesh(geom, parkingLineMat);
      mesh.position.set(midX, midY, baseZ + 0.03);
      
      roadGeometries.push(geom);
      return mesh;
    };

    // B3.3. New Layout from User's "recreatethis.png"
    const customLinesGroup = new THREE.Group();
    scene.add(customLinesGroup);

    // Helper to create straight road line meshes
    const createRoadLine = (p1: THREE.Vector2, p2: THREE.Vector2, material: THREE.Material, thickness = 0.04) => {
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const dist = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
      const rot = Math.atan2(p2.y - p1.y, p2.x - p1.x);

      const geom = new THREE.PlaneGeometry(dist, thickness);
      geom.rotateZ(rot);
      
      const baseZ = getGroundHeight(midX, midY);
      const mesh = new THREE.Mesh(geom, material);
      mesh.position.set(midX, midY, baseZ + 0.03);
      
      roadGeometries.push(geom);
      return mesh;
    };

    const createCurve = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number, segments: number, material: THREE.Material, thickness = 0.04) => {
      const group = new THREE.Group();
      for (let i = 0; i < segments; i++) {
        const theta1 = startAngle + (i / segments) * (endAngle - startAngle);
        const theta2 = startAngle + ((i + 1) / segments) * (endAngle - startAngle);
        const p1 = new THREE.Vector2(centerX + radius * Math.cos(theta1), centerY + radius * Math.sin(theta1));
        const p2 = new THREE.Vector2(centerX + radius * Math.cos(theta2), centerY + radius * Math.sin(theta2));
        const segment = createRoadLine(p1, p2, material, thickness);
        group.add(segment);
      }
      return group;
    };

    const createPillGeometry = (w: number, h: number, r: number) => {
      const shape = new THREE.Shape();
      const x = -w/2, y = -h/2;
      shape.moveTo(x + r, y);
      shape.lineTo(x + w - r, y);
      shape.quadraticCurveTo(x + w, y, x + w, y + r);
      shape.lineTo(x + w, y + h - r);
      shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      shape.lineTo(x + r, y + h);
      shape.quadraticCurveTo(x, y + h, x, y + h - r);
      shape.lineTo(x, y + r);
      shape.quadraticCurveTo(x, y, x + r, y);
      return new THREE.ShapeGeometry(shape);
    };

    // Rocks Material and Generator
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x828588, // Natural rock gray
      roughness: 0.95,
      metalness: 0.05,
      bumpMap: fineTexture,
      bumpScale: 0.08,
      side: THREE.DoubleSide,
    });

    const createRock = (scaleX: number, scaleY: number, scaleZ: number) => {
      const geom = new THREE.DodecahedronGeometry(1.0, 0); // Cool low-poly rock shape
      const pos = geom.attributes.position;
      // Jitter vertices to make each rock unique
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);
        const vz = pos.getZ(i);
        pos.setXYZ(
          i,
          vx + (Math.random() - 0.5) * 0.15,
          vy + (Math.random() - 0.5) * 0.15,
          vz + (Math.random() - 0.5) * 0.15
        );
      }
      geom.computeVertexNormals();
      const mesh = new THREE.Mesh(geom, stoneMat);
      mesh.scale.set(scaleX, scaleY, scaleZ);
      return mesh;
    };

    // Materials
    const whiteLineMat = new THREE.MeshStandardMaterial({
      bumpMap: fineTexture,
      bumpScale: 0.08,
      color: 0xf5f5f5, // Soft realistic off-white paint
      roughness: 0.95, // Very rough painted feel
      metalness: 0.05,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
    });
    const sidewalkTexture = concreteTexture!.clone();
    sidewalkTexture.repeat.set(30, 2); // Avoid horizontal stretching on the 18x1.2 sidewalk

    const grayPathMat = new THREE.MeshStandardMaterial({
      map: sidewalkTexture,
      bumpMap: sidewalkTexture,
      bumpScale: 0.16, // Pronounced bumps so it doesn't look flat
      color: 0xe8e8e8, // Crisp light gray concrete color
      emissive: 0x333333, // Keeps it light gray under warm sunset light
      roughness: 0.75, // Slightly lower roughness to allow light to catch the bumps
      metalness: 0.1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
    });
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x1c5232, // Dark grass green
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    const greenLineMat = new THREE.MeshStandardMaterial({
      bumpMap: fineTexture,
      bumpScale: 0.08,
      color: 0x34a853, // Beautiful vibrant grass green outline
      roughness: 0.95,
      metalness: 0.05,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
    });

    const roadLineMat = new THREE.MeshStandardMaterial({
      bumpMap: fineTexture,
      bumpScale: 0.08,
      color: 0xffaa00, // Bright yellow/orange center road line
      roughness: 0.95,
      metalness: 0.05,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
    });
    const roadBoundaryMat = new THREE.MeshStandardMaterial({
      bumpMap: fineTexture,
      bumpScale: 0.08,
      color: 0xffffff, // Bright solid white road boundaries
      roughness: 0.95,
      metalness: 0.05,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });

    // 1. Foreground Sidewalks & Center Hatched Island (Y = -6.5)
    // Left Sidewalk Fill (Grass Pill Geometry with Green Outline and dense 3D grass)
    const leftSidewalkGeom = createPillGeometry(18.0, 1.2, 0.6);
    const leftSidewalkMesh = new THREE.Mesh(leftSidewalkGeom, grassMat);
    leftSidewalkMesh.position.set(-16.0, -6.5, getGroundHeight(-16.0, -6.5) + 0.02);
    customLinesGroup.add(leftSidewalkMesh);
    roadGeometries.push(leftSidewalkGeom);

    // Left Sidewalk Gray Concrete Path (centered, follows the pill geometry all the way to the ends)
    const leftPathGeom = createPillGeometry(17.7, 0.5, 0.25);
    const leftPathMesh = new THREE.Mesh(leftPathGeom, grayPathMat);
    leftPathMesh.position.set(-16.0, -6.5, getGroundHeight(-16.0, -6.5) + 0.04);
    customLinesGroup.add(leftPathMesh);
    roadGeometries.push(leftPathGeom);

    // Left Sidewalk Green Outline (Pill outline - thickened)
    const greenOutlineThick = 0.18;
    customLinesGroup.add(createRoadLine(new THREE.Vector2(-24.4, -5.9), new THREE.Vector2(-7.6, -5.9), greenLineMat, greenOutlineThick));
    customLinesGroup.add(createRoadLine(new THREE.Vector2(-24.4, -7.1), new THREE.Vector2(-7.6, -7.1), greenLineMat, greenOutlineThick));
    customLinesGroup.add(createCurve(-24.4, -6.5, 0.6, Math.PI / 2, 3 * Math.PI / 2, 12, greenLineMat, greenOutlineThick));
    customLinesGroup.add(createCurve(-7.6, -6.5, 0.6, -Math.PI / 2, Math.PI / 2, 12, greenLineMat, greenOutlineThick));

    // Right Sidewalk Fill (Grass Pill Geometry with Green Outline and dense 3D grass)
    const rightSidewalkGeom = createPillGeometry(18.0, 1.2, 0.6);
    const rightSidewalkMesh = new THREE.Mesh(rightSidewalkGeom, grassMat);
    rightSidewalkMesh.position.set(16.0, -6.5, getGroundHeight(16.0, -6.5) + 0.02);
    customLinesGroup.add(rightSidewalkMesh);
    roadGeometries.push(rightSidewalkGeom);

    // Right Sidewalk Gray Concrete Path (centered, follows the pill geometry all the way to the ends)
    const rightPathGeom = createPillGeometry(17.7, 0.5, 0.25);
    const rightPathMesh = new THREE.Mesh(rightPathGeom, grayPathMat);
    rightPathMesh.position.set(16.0, -6.5, getGroundHeight(16.0, -6.5) + 0.04);
    customLinesGroup.add(rightPathMesh);
    roadGeometries.push(rightPathGeom);

    // Right Sidewalk Green Outline (Pill outline - thickened)
    customLinesGroup.add(createRoadLine(new THREE.Vector2(7.6, -5.9), new THREE.Vector2(24.4, -5.9), greenLineMat, greenOutlineThick));
    customLinesGroup.add(createRoadLine(new THREE.Vector2(7.6, -7.1), new THREE.Vector2(24.4, -7.1), greenLineMat, greenOutlineThick));
    customLinesGroup.add(createCurve(7.6, -6.5, 0.6, Math.PI / 2, 3 * Math.PI / 2, 12, greenLineMat, greenOutlineThick));
    customLinesGroup.add(createCurve(24.4, -6.5, 0.6, -Math.PI / 2, Math.PI / 2, 12, greenLineMat, greenOutlineThick));


    // Center Hatched Island Outline (Pill outline - thickened to 0.10)
    const whiteOutlineThick = 0.10;
    customLinesGroup.add(createRoadLine(new THREE.Vector2(-4.4, -5.9), new THREE.Vector2(4.4, -5.9), whiteLineMat, whiteOutlineThick));
    customLinesGroup.add(createRoadLine(new THREE.Vector2(-4.4, -7.1), new THREE.Vector2(4.4, -7.1), whiteLineMat, whiteOutlineThick));
    customLinesGroup.add(createCurve(-4.4, -6.5, 0.6, Math.PI / 2, 3 * Math.PI / 2, 8, whiteLineMat, whiteOutlineThick));
    customLinesGroup.add(createCurve(4.4, -6.5, 0.6, -Math.PI / 2, Math.PI / 2, 8, whiteLineMat, whiteOutlineThick));

    // Center Hatched Island Stripes (orange/yellow diagonal ////) - thickened, evenly spaced
    for (let i = 0; i < 7; i++) {
      const x = -3.6 + i * 1.2;
      customLinesGroup.add(createRoadLine(new THREE.Vector2(x - 0.35, -7.1), new THREE.Vector2(x + 0.35, -5.9), roadLineMat, 0.22));
    }

    // 2. Crosswalks (Zebra crossings in the gaps - white, thicker, aligned)
    const stripeGeom = new THREE.PlaneGeometry(0.28, 1.2);
    roadGeometries.push(stripeGeom);

    // Left Crosswalk (between -7.0 and -5.0, with a 0.26 gap on both ends)
    for (let i = 0; i < 4; i++) {
      const x = -6.6 + i * 0.4;
      const stripe = new THREE.Mesh(stripeGeom, whiteLineMat);
      stripe.position.set(x, -6.5, getGroundHeight(x, -6.5) + 0.04);
      customLinesGroup.add(stripe);
    }
 
    // Right Crosswalk (between 5.0 and 7.0, with a 0.26 gap on both ends)
    for (let i = 0; i < 4; i++) {
      const x = 5.4 + i * 0.4;
      const stripe = new THREE.Mesh(stripeGeom, whiteLineMat);
      stripe.position.set(x, -6.5, getGroundHeight(x, -6.5) + 0.04);
      customLinesGroup.add(stripe);
    }

    // 2.5. Scattered Low-Poly Rocks (strictly around/outside the sidewalks, not in them)
    const rocksData = [
      // Left sidewalk surrounds (outside the X:[-25,-7], Y:[-7.1,-5.9] range)
      { x: -18.5, y: -7.6, z: 0.04, scale: [0.15, 0.18, 0.12] }, // Below Left Sidewalk
      { x: -21.0, y: -5.4, z: 0.05, scale: [0.22, 0.20, 0.18] }, // Above Left Sidewalk
      { x: -14.0, y: -5.3, z: 0.04, scale: [0.18, 0.16, 0.14] }, // Above Left Sidewalk (middle-left)
      { x: -25.6, y: -6.5, z: 0.08, scale: [0.25, 0.22, 0.20] }, // Just left of outer curve
      { x: -7.5, y: -5.3, z: 0.04, scale: [0.14, 0.15, 0.12] },  // Just above inner curve
      { x: -7.5, y: -7.6, z: 0.03, scale: [0.13, 0.12, 0.10] },  // Just below inner curve near crosswalk

      // Right sidewalk surrounds (outside the X:[7,25], Y:[-7.1,-5.9] range)
      { x: 18.5, y: -7.6, z: 0.04, scale: [0.16, 0.15, 0.13] },  // Below Right Sidewalk
      { x: 21.0, y: -5.4, z: 0.05, scale: [0.24, 0.22, 0.20] },  // Above Right Sidewalk
      { x: 14.0, y: -5.3, z: 0.04, scale: [0.18, 0.16, 0.14] },  // Above Right Sidewalk (middle-right)
      { x: 25.6, y: -6.5, z: 0.08, scale: [0.26, 0.24, 0.22] },  // Just right of outer curve
      { x: 7.5, y: -5.3, z: 0.04, scale: [0.15, 0.13, 0.11] },   // Just above inner curve
      { x: 7.5, y: -7.6, z: 0.03, scale: [0.13, 0.12, 0.10] },   // Just below inner curve near crosswalk

      // Top left grass island
      { x: -10.5, y: 0.8, z: 0.06, scale: [0.16, 0.15, 0.12] },
      { x: -7.5, y: 0.7, z: 0.04, scale: [0.11, 0.13, 0.09] },
      // Top right grass island
      { x: 10.5, y: 0.9, z: 0.08, scale: [0.18, 0.16, 0.14] },
      { x: 7.5, y: 0.7, z: 0.04, scale: [0.12, 0.11, 0.09] },
      // Flat asphalt ground areas
      { x: -14.0, y: 4.8, z: 0.12, scale: [0.35, 0.28, 0.25] },
      { x: -14.8, y: 5.2, z: 0.06, scale: [0.15, 0.18, 0.10] },
      { x: 14.0, y: 4.8, z: 0.13, scale: [0.32, 0.30, 0.22] },
      { x: 14.8, y: 4.5, z: 0.07, scale: [0.14, 0.16, 0.12] },
      // Outer terrain sides
      { x: -26.0, y: 1.5, z: 0.16, scale: [0.45, 0.35, 0.30] },
      { x: -25.0, y: -2.5, z: 0.14, scale: [0.38, 0.42, 0.28] },
      { x: 26.0, y: 1.5, z: 0.18, scale: [0.48, 0.36, 0.32] },
      { x: 25.0, y: -2.5, z: 0.12, scale: [0.40, 0.38, 0.26] }
    ];

    rocksData.forEach(data => {
      const rock = createRock(data.scale[0], data.scale[1], data.scale[2]);
      const baseZ = getGroundHeight(data.x, data.y);
      rock.position.set(data.x, data.y, baseZ + data.z);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      customLinesGroup.add(rock);
    });

    // 3. Midground Grass Islands and Parking Lots
    // Left Grass Island Fill & Outline
    const leftGrassGeom = createPillGeometry(6.0, 0.8, 0.4);
    const leftGrassMesh = new THREE.Mesh(leftGrassGeom, grassMat);
    leftGrassMesh.position.set(-9.0, 0.8, getGroundHeight(-9.0, 0.8) + 0.01);
    customLinesGroup.add(leftGrassMesh);
    roadGeometries.push(leftGrassGeom);

    customLinesGroup.add(createRoadLine(new THREE.Vector2(-11.6, 1.2), new THREE.Vector2(-6.4, 1.2), whiteLineMat));
    customLinesGroup.add(createRoadLine(new THREE.Vector2(-11.6, 0.4), new THREE.Vector2(-6.4, 0.4), whiteLineMat));
    customLinesGroup.add(createCurve(-11.6, 0.8, 0.4, Math.PI / 2, 3 * Math.PI / 2, 8, whiteLineMat));
    customLinesGroup.add(createCurve(-6.4, 0.8, 0.4, -Math.PI / 2, Math.PI / 2, 8, whiteLineMat));

    // Left Parking Lines (5 top, 5 bottom)
    const leftParkingXs = [-11.6, -10.3, -9.0, -7.7, -6.4];
    leftParkingXs.forEach(x => {
      customLinesGroup.add(createRoadLine(new THREE.Vector2(x, 1.2), new THREE.Vector2(x, 2.4), whiteLineMat));
      customLinesGroup.add(createRoadLine(new THREE.Vector2(x, 0.4), new THREE.Vector2(x, -0.8), whiteLineMat));
    });

    // Right Grass Island Fill & Outline
    const rightGrassGeom = createPillGeometry(6.0, 0.8, 0.4);
    const rightGrassMesh = new THREE.Mesh(rightGrassGeom, grassMat);
    rightGrassMesh.position.set(9.0, 0.8, getGroundHeight(9.0, 0.8) + 0.01);
    customLinesGroup.add(rightGrassMesh);
    roadGeometries.push(rightGrassGeom);

    customLinesGroup.add(createRoadLine(new THREE.Vector2(6.4, 1.2), new THREE.Vector2(11.6, 1.2), whiteLineMat));
    customLinesGroup.add(createRoadLine(new THREE.Vector2(6.4, 0.4), new THREE.Vector2(11.6, 0.4), whiteLineMat));
    customLinesGroup.add(createCurve(6.4, 0.8, 0.4, Math.PI / 2, 3 * Math.PI / 2, 8, whiteLineMat));
    customLinesGroup.add(createCurve(11.6, 0.8, 0.4, -Math.PI / 2, Math.PI / 2, 8, whiteLineMat));

    // Right Parking Lines (5 top, 5 bottom)
    const rightParkingXs = [6.4, 7.7, 9.0, 10.3, 11.6];
    rightParkingXs.forEach(x => {
      customLinesGroup.add(createRoadLine(new THREE.Vector2(x, 1.2), new THREE.Vector2(x, 2.4), whiteLineMat));
      customLinesGroup.add(createRoadLine(new THREE.Vector2(x, 0.4), new THREE.Vector2(x, -0.8), whiteLineMat));
    });

    // Helper to create 3D low-poly grass tufts
    const createGrassTuft = () => {
      const group = new THREE.Group();
      const bladeGeom = new THREE.ConeGeometry(0.04, 0.22, 3);
      bladeGeom.translate(0, 0.11, 0); // Center pivot at bottom of blade

      const grassColors = [0x275f34, 0x367c45, 0x489b58, 0x1d4a27];
      const bladeCount = 3 + Math.floor(Math.random() * 3);

      for (let i = 0; i < bladeCount; i++) {
        const color = grassColors[Math.floor(Math.random() * grassColors.length)];
        const bladeMat = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.9,
          flatShading: true,
        });
        const blade = new THREE.Mesh(bladeGeom, bladeMat);

        // Stand perfectly upright (no random tilts)
        blade.rotation.x = Math.PI / 2; 
        blade.rotation.y = 0;
        blade.rotation.z = Math.random() * Math.PI * 2;

        const s = 0.55 + Math.random() * 0.55;
        blade.scale.set(s, s * 1.5, s); // Stretched height for low-poly look

        group.add(blade);
      }
      return group;
    };

    const grassTufts: THREE.Group[] = [];

    const placeGrassTuftsOnIsland = (centerX: number, centerY: number, w: number, h: number, r: number, count: number) => {
      const rectHalfW = (w / 2) - r;
      const xMin = centerX - rectHalfW;
      const xMax = centerX + rectHalfW;
      const r2 = r * r;

      for (let i = 0; i < count; i++) {
        const rx = (centerX - w/2) + Math.random() * w;
        let yHalfRange = h / 2;
        if (rx < xMin) {
          const dx = xMin - rx;
          yHalfRange = Math.sqrt(Math.max(0, r2 - dx * dx));
        } else if (rx > xMax) {
          const dx = rx - xMax;
          yHalfRange = Math.sqrt(Math.max(0, r2 - dx * dx));
        }

        const ry = centerY + (Math.random() - 0.5) * 2 * yHalfRange;
        const tuft = createGrassTuft();
        tuft.position.set(rx, ry, getGroundHeight(rx, ry));
        customLinesGroup.add(tuft);
        grassTufts.push(tuft);
      }
    };

    // Populate grass islands with dense 3D grass tufts
    placeGrassTuftsOnIsland(-9.0, 0.8, 6.0, 0.8, 0.4, 95);
    placeGrassTuftsOnIsland(9.0, 0.8, 6.0, 0.8, 0.4, 95);

    // Populate both foreground sidewalks with dense 3D grass tufts
    placeGrassTuftsOnIsland(-16.0, -6.5, 18.0, 1.2, 0.6, 180);
    placeGrassTuftsOnIsland(16.0, -6.5, 18.0, 1.2, 0.6, 180);

    // B3.4. Parked Cars (Positioned correctly in slots)
    const carsGroup = new THREE.Group();
    const createCarModel = (colorHex: number) => {
      const car = new THREE.Group();

      const bodyGeom = new THREE.BoxGeometry(0.7, 1.45, 0.28);
      const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.45, metalness: 0.2 });
      const body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.set(0, 0, 0.2);
      body.castShadow = true;
      body.receiveShadow = true;
      car.add(body);

      const cabinGeom = new THREE.BoxGeometry(0.58, 0.82, 0.22);
      const cabinMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.85 });
      const cabin = new THREE.Mesh(cabinGeom, cabinMat);
      cabin.position.set(0, -0.08, 0.44);
      cabin.castShadow = true;
      cabin.receiveShadow = true;
      car.add(cabin);

      const wheelGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 8);
      wheelGeom.rotateZ(Math.PI / 2);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
      
      const wheelPositions = [
        { x: -0.36, y: 0.42, z: 0.12 },
        { x: 0.36, y: 0.42, z: 0.12 },
        { x: -0.36, y: -0.42, z: 0.12 },
        { x: 0.36, y: -0.42, z: 0.12 }
      ];

      wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeom, wheelMat);
        wheel.position.set(pos.x, pos.y, pos.z);
        wheel.castShadow = true;
        car.add(wheel);
      });

      const lightGeom = new THREE.BoxGeometry(0.12, 0.04, 0.06);
      const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff0aa });
      
      const lightL = new THREE.Mesh(lightGeom, lightMat);
      lightL.position.set(-0.22, 0.72, 0.22);
      car.add(lightL);

      const lightR = new THREE.Mesh(lightGeom, lightMat);
      lightR.position.set(0.22, 0.72, 0.22);
      car.add(lightR);

      const tailMat = new THREE.MeshBasicMaterial({ color: 0xdd2222 });
      
      const tailL = new THREE.Mesh(lightGeom, tailMat);
      tailL.position.set(-0.22, -0.72, 0.22);
      car.add(tailL);

      const tailR = new THREE.Mesh(lightGeom, tailMat);
      tailR.position.set(0.22, -0.72, 0.22);
      car.add(tailR);

      return car;
    };

    // B3.4. Parked Cars (populating the group declared on line 756)
    const parkedCarsData = [
      // Left Top side: 4th slot
      { x: -7.05, y: 1.8, rot: 0, color: 0x2244aa },
      // Left Bottom side: 2nd slot, 4th slot
      { x: -9.65, y: -0.2, rot: 0, color: 0xcc3333 },
      { x: -7.05, y: -0.2, rot: 0, color: 0xe8e8e8 },
      
      // Right Top side: 1st slot
      { x: 7.05, y: 1.8, rot: 0, color: 0x222222 },
      // Right Bottom side: 4th slot
      { x: 10.95, y: -0.2, rot: 0, color: 0x886622 },

      // Angled flanking cars near crater (moved out slightly to clear the larger white outline)
      { x: -4.8, y: 2.6, rot: Math.PI / 5, color: 0xcc3333 },
      { x: 4.8, y: 2.6, rot: -Math.PI / 5, color: 0x3366aa }
    ];

    parkedCarsData.forEach(data => {
      const car = createCarModel(data.color);
      const baseZ = getGroundHeight(data.x, data.y);
      car.position.set(data.x, data.y, baseZ - 0.04);
      car.rotation.z = data.rot;
      carsGroup.add(car);
    });
    scene.add(carsGroup);

    // B3.5. Procedural Low-Poly Trees (Dense background forest + frame, middle cleared)
    const createProceduralTree = (typeIndex: number, leavesColor: number) => {
      const tree = new THREE.Group();

      let trunkHeight = 1.0;
      let trunkRadTop = 0.16;
      let trunkRadBot = 0.25;
      
      if (typeIndex === 0) {
        trunkHeight = 1.2;
        trunkRadTop = 0.18;
        trunkRadBot = 0.28;
      } else if (typeIndex === 1) {
        trunkHeight = 1.1;
        trunkRadTop = 0.22;
        trunkRadBot = 0.32;
      } else {
        trunkHeight = 0.9;
        trunkRadTop = 0.15;
        trunkRadBot = 0.24;
      }

      const trunkGeom = new THREE.CylinderGeometry(trunkRadTop, trunkRadBot, trunkHeight, 5);
      trunkGeom.translate(0, trunkHeight / 2, 0);

      const trunkMat = new THREE.MeshStandardMaterial({
        color: 0x3d2714,
        roughness: 0.9,
        flatShading: true,
      });
      const trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      tree.add(trunk);

      const leavesMat = new THREE.MeshStandardMaterial({
        color: leavesColor,
        roughness: 0.75,
        flatShading: true,
      });

      const leavesGroup = new THREE.Group();

      if (typeIndex === 0) {
        const segments = 5;
        const cone1 = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.4, segments), leavesMat);
        cone1.position.set(0, trunkHeight + 0.4, 0);
        cone1.castShadow = true;
        cone1.receiveShadow = true;
        leavesGroup.add(cone1);

        const cone2 = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.1, segments), leavesMat);
        cone2.position.set(0, trunkHeight + 1.0, 0);
        cone2.rotation.y = 0.6;
        cone2.castShadow = true;
        cone2.receiveShadow = true;
        leavesGroup.add(cone2);

        const cone3 = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.8, segments), leavesMat);
        cone3.position.set(0, trunkHeight + 1.6, 0);
        cone3.rotation.y = -0.3;
        cone3.castShadow = true;
        cone3.receiveShadow = true;
        leavesGroup.add(cone3);

        const cone4 = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.6, segments), leavesMat);
        cone4.position.set(0, trunkHeight + 2.1, 0);
        cone4.rotation.y = 0.9;
        cone4.castShadow = true;
        cone4.receiveShadow = true;
        leavesGroup.add(cone4);

      } else if (typeIndex === 1) {
        const geom1 = new THREE.DodecahedronGeometry(1.2, 0);
        const mesh1 = new THREE.Mesh(geom1, leavesMat);
        mesh1.position.set(0, trunkHeight + 0.6, 0);
        mesh1.castShadow = true;
        mesh1.receiveShadow = true;
        leavesGroup.add(mesh1);

        const geom2 = new THREE.DodecahedronGeometry(0.85, 0);
        const mesh2 = new THREE.Mesh(geom2, leavesMat);
        mesh2.position.set(-0.7, trunkHeight + 0.5, 0.5);
        mesh2.castShadow = true;
        mesh2.receiveShadow = true;
        leavesGroup.add(mesh2);

        const geom3 = new THREE.DodecahedronGeometry(0.85, 0);
        const mesh3 = new THREE.Mesh(geom3, leavesMat);
        mesh3.position.set(0.7, trunkHeight + 0.5, -0.5);
        mesh3.castShadow = true;
        mesh3.receiveShadow = true;
        leavesGroup.add(mesh3);

        const geom4 = new THREE.DodecahedronGeometry(0.7, 0);
        const mesh4 = new THREE.Mesh(geom4, leavesMat);
        mesh4.position.set(0.6, trunkHeight + 0.9, 0.6);
        mesh4.castShadow = true;
        mesh4.receiveShadow = true;
        leavesGroup.add(mesh4);

        const geom5 = new THREE.DodecahedronGeometry(0.7, 0);
        const mesh5 = new THREE.Mesh(geom5, leavesMat);
        mesh5.position.set(-0.6, trunkHeight + 0.9, -0.6);
        mesh5.castShadow = true;
        mesh5.receiveShadow = true;
        leavesGroup.add(mesh5);

        const geom6 = new THREE.DodecahedronGeometry(0.75, 0);
        const mesh6 = new THREE.Mesh(geom6, leavesMat);
        mesh6.position.set(0, trunkHeight + 1.3, 0);
        mesh6.castShadow = true;
        mesh6.receiveShadow = true;
        leavesGroup.add(mesh6);

      } else {
        const geom1 = new THREE.IcosahedronGeometry(0.95, 0);
        const mesh1 = new THREE.Mesh(geom1, leavesMat);
        mesh1.scale.set(0.9, 1.8, 0.9);
        mesh1.position.set(0, trunkHeight + 0.7, 0);
        mesh1.castShadow = true;
        mesh1.receiveShadow = true;
        leavesGroup.add(mesh1);

        const geom2 = new THREE.IcosahedronGeometry(0.8, 0);
        const mesh2 = new THREE.Mesh(geom2, leavesMat);
        mesh2.scale.set(0.85, 1.5, 0.85);
        mesh2.position.set(0, trunkHeight + 1.5, 0);
        mesh2.rotation.y = 0.4;
        mesh2.castShadow = true;
        mesh2.receiveShadow = true;
        leavesGroup.add(mesh2);

        const geom3 = new THREE.IcosahedronGeometry(0.55, 0);
        const mesh3 = new THREE.Mesh(geom3, leavesMat);
        mesh3.scale.set(0.75, 1.2, 0.75);
        mesh3.position.set(0, trunkHeight + 2.2, 0);
        mesh3.rotation.y = -0.6;
        mesh3.castShadow = true;
        mesh3.receiveShadow = true;
        leavesGroup.add(mesh3);
      }

      tree.add(leavesGroup);
      return tree;
    };

    const treePositions: { x: number, y: number, scale: number }[] = [];

    // Background forest (fewer trees placed strategically to block the cut-off terrain horizon)
    const bgTreeCount = 45;
    for (let i = 0; i < bgTreeCount; i++) {
      const x = -28.0 + (i / (bgTreeCount - 1)) * 56.0 + (Math.random() - 0.5) * 1.2;
      const y = 14.5 + Math.random() * 2.0; // Placed right at the terrain cutoff behind FAU
      const scale = 1.35 + Math.random() * 0.5; // Scaled up to hide the edge
      treePositions.push({ x, y, scale });
    }

    // Left forest framing (X = -20 to -11, Y = -4 to 12)
    const leftFraming = [
      { x: -12.5, y: -4.0, scale: 1.2 },
      { x: -14.0, y: -2.0, scale: 1.1 },
      { x: -11.5, y: 0.0, scale: 1.05 },
      { x: -15.0, y: 1.0, scale: 1.3 },
      { x: -13.0, y: 3.0, scale: 1.15 },
      { x: -16.5, y: 4.5, scale: 1.2 },
      { x: -14.2, y: 6.0, scale: 1.0 },
      { x: -17.0, y: 7.5, scale: 1.25 },
      { x: -13.8, y: 9.0, scale: 1.1 },
      { x: -16.0, y: 10.5, scale: 1.3 },
      { x: -12.0, y: 12.0, scale: 1.15 },
      { x: -15.0, y: 13.0, scale: 1.2 },
      { x: -18.5, y: 2.0, scale: 1.3 },
      { x: -19.0, y: 6.0, scale: 1.25 },
      { x: -18.0, y: 10.0, scale: 1.35 },
    ];
    leftFraming.forEach(p => treePositions.push(p));

    // Right forest framing (X = 11 to 20, Y = -4 to 12)
    const rightFraming = [
      { x: 12.5, y: -4.0, scale: 1.15 },
      { x: 14.0, y: -2.0, scale: 1.2 },
      { x: 11.5, y: 0.0, scale: 1.1 },
      { x: 15.0, y: 1.0, scale: 1.25 },
      { x: 13.0, y: 3.0, scale: 1.0 },
      { x: 16.5, y: 4.5, scale: 1.3 },
      { x: 14.2, y: 6.0, scale: 1.1 },
      { x: 17.0, y: 7.5, scale: 1.25 },
      { x: 13.8, y: 9.0, scale: 1.15 },
      { x: 16.0, y: 10.5, scale: 1.2 },
      { x: 12.0, y: 12.0, scale: 1.25 },
      { x: 15.0, y: 13.0, scale: 1.15 },
      { x: 18.5, y: 2.0, scale: 1.3 },
      { x: 19.0, y: 6.0, scale: 1.2 },
      { x: 18.0, y: 10.0, scale: 1.3 },
    ];
    rightFraming.forEach(p => treePositions.push(p));

    // Plazas/Islands framing (avoiding the middle X=[-3, 3] for Y < 14)
    const plazaFraming = [
      { x: -5.0, y: 8.3, scale: 0.95 },
      { x: -7.5, y: 8.5, scale: 1.15 },
      { x: -10.0, y: 8.3, scale: 1.0 },
      { x: 5.0, y: 8.3, scale: 1.05 },
      { x: 7.5, y: 8.5, scale: 1.0 },
      { x: 10.0, y: 8.3, scale: 1.1 },
    ];
    plazaFraming.forEach(p => treePositions.push(p));

    // Instantiate and place trees (perfectly upright)
    treePositions.forEach((pos, idx) => {
      const typeIndex = (idx) % 3;
      const leavesColors = [
        0x425d26, 0x556e33, 0x6a8241, 0x838e4a, 0x9c7a3d, 0xa66332
      ];
      const leavesColor = leavesColors[Math.floor(Math.random() * leavesColors.length)];

      const tree = createProceduralTree(typeIndex, leavesColor);
      
      const targetHeight = 4.2 * pos.scale;
      let localHeight = 2.4;
      if (typeIndex === 0) localHeight = 3.6;
      else if (typeIndex === 1) localHeight = 3.15;
      else localHeight = 3.43;

      const s = targetHeight / localHeight;
      tree.scale.set(s, s, s);

      // Stand perfectly upright (rotate local Y-up to world Z-up, and rotate around local Y for randomized canopy orientation)
      tree.rotation.x = Math.PI / 2;
      tree.rotation.y = Math.random() * Math.PI * 2;
      tree.rotation.z = 0; // Keeping local Z-rotation at 0 guarantees no tilting!

      const baseZ = getGroundHeight(pos.x, pos.y);
      tree.position.set(pos.x, pos.y, baseZ);

      lowPolyGroup.add(tree);
    });

    // C. Concentric Glowing Golden Ribs (Circular Rings)
    const ringsGroup = new THREE.Group();
    const ringCount = 10;
    const rings: THREE.Mesh[] = [];

    for (let i = 0; i < ringCount; i++) {
      const ratio = i / (ringCount - 1);
      const ringZ = 7.5 - ratio * 32.5; // Positioned down the tunnel (deeper to avoid popping out)
      const progress = Math.min(1, Math.max(0, (10 - ringZ) / tunnelLength));
      
      // Target nominal radius
      const ringRadius = 1.0 - ratio * (1.0 - radiusBottom) * 0.88;

      const ringGeometry = new THREE.TorusGeometry(ringRadius, 0.025, 8, 64);
      
      // Morph the torus geometry to match the squircle/circle tunnel walls
      const ringPosAttr = ringGeometry.attributes.position;
      for (let j = 0; j < ringPosAttr.count; j++) {
        const rx = ringPosAttr.getX(j);
        const ry = ringPosAttr.getY(j);
        const rAngle = Math.atan2(ry, rx);

        const sqPt = getSquirclePoint(rAngle, craterW, craterH, craterR);
        const x_bottom = radiusBottom * Math.cos(rAngle);
        const y_bottom = radiusBottom * Math.sin(rAngle);

        const x_interp = (1 - progress) * sqPt.x + progress * x_bottom;
        const y_interp = (1 - progress) * sqPt.y + progress * y_bottom;
        const r_interp = Math.sqrt(x_interp * x_interp + y_interp * y_interp);

        // Scale the torus coordinates to wrap around the morphed radius
        const scaleFactor = r_interp / ringRadius;
        ringPosAttr.setX(j, rx * scaleFactor);
        ringPosAttr.setY(j, ry * scaleFactor);
      }
      ringGeometry.computeVertexNormals();

      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xcda45e,
        transparent: true,
        opacity: 0.3 - ratio * 0.18,
      });

      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
      ringMesh.position.set(0, 0, ringZ);
      ringsGroup.add(ringMesh);
      rings.push(ringMesh);
    }
    scene.add(ringsGroup);

    // D. Floating Gold Dust Particles (animated rising from crater)
    const particleCount = 180;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = new Float32Array(particleCount * 3); // vx, vy, vz per particle
    const particleBaseAngles = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const z = Math.random() * 40 - 25; // Z between -25 and 15
      
      const progress = Math.min(1, Math.max(0, (10 - z) / 40));
      const sqPt = getSquirclePoint(angle, craterW, craterH, craterR);
      const sqDist = sqPt.length();
      const maxRadius = (1 - progress) * sqDist + progress * radiusBottom;
      const radius = Math.random() * maxRadius * 0.85;

      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = Math.sin(angle) * radius;
      particlePositions[i * 3 + 2] = z;

      // Each particle rises upward (Z+) with slight XY drift
      particleVelocities[i * 3] = (Math.random() - 0.5) * 0.008;
      particleVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.008;
      particleVelocities[i * 3 + 2] = 0.01 + Math.random() * 0.025; // Rising speed
      particleBaseAngles[i] = angle;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xcda45e,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // E. Clouds Removed (Clouds look bad as per feedback)

    // E1. Flying Birds (silhouettes that cross the screen periodically)
    const birdsGroup = new THREE.Group();
    const birdMeshes: THREE.Group[] = [];
    const birdSpeeds: number[] = [];
    const birdDelays: number[] = [];

    const createBird = () => {
      const bird = new THREE.Group();
      const wingMat = new THREE.MeshBasicMaterial({
        color: 0x0c0d0e, // Dark charcoal bird silhouette
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
        fog: false, // Turn off fog so they remain crisp black silhouettes!
      });

      // Left wing (larger triangle for silhouette visibility)
      const leftWingShape = new THREE.Shape();
      leftWingShape.moveTo(0, 0);
      leftWingShape.lineTo(-0.48, 0.16);
      leftWingShape.lineTo(-0.16, 0);
      leftWingShape.closePath();
      const leftWingGeom = new THREE.ShapeGeometry(leftWingShape);
      const leftWing = new THREE.Mesh(leftWingGeom, wingMat);
      bird.add(leftWing);

      // Right wing (larger triangle for silhouette visibility)
      const rightWingShape = new THREE.Shape();
      rightWingShape.moveTo(0, 0);
      rightWingShape.lineTo(0.48, 0.16);
      rightWingShape.lineTo(0.16, 0);
      rightWingShape.closePath();
      const rightWingGeom = new THREE.ShapeGeometry(rightWingShape);
      const rightWing = new THREE.Mesh(rightWingGeom, wingMat);
      bird.add(rightWing);

      bird.rotation.x = Math.PI / 2;
      return { group: bird, leftWing, rightWing };
    };

    // Create 6 birds with staggered start positions and delays
    for (let i = 0; i < 6; i++) {
      const { group } = createBird();
      const s = 0.55 + Math.random() * 0.45; // Make them larger so they stand out
      group.scale.set(s, s, s);
      // Spawn them close to the camera (Y=-4 to 4) at heights Z=12 to 16, crossing right over the crater
      group.position.set(-25 + Math.random() * 35, -4 + Math.random() * 8, 12 + Math.random() * 4);
      birdsGroup.add(group);
      birdMeshes.push(group);
      birdSpeeds.push(0.06 + Math.random() * 0.05); // Faster crossing speed
      birdDelays.push(i * 1.5 + Math.random() * 2.0); // Stagger delays
    }
    scene.add(birdsGroup);

    // E3. Minimalist Sunset Sky Backdrop Sphere (liquid-motion ShaderMaterial)
    const skyGeom = new THREE.SphereGeometry(60, 32, 16);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uOpacity: { value: 0.95 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uOpacity;
        varying vec2 vUv;
        void main() {
          // Multiply UVs by a larger frequency to see multiple swirling waves/bands at the same time
          vec2 uv = vUv * 7.5;
          float t = uTime * 0.5; // Smooth slow fluid animation
          
          // Domain warping with nested sines/cosines for a fluid marble/liquid flow
          float wx = uv.x + sin(uv.y + t * 1.2) * 1.5;
          float wy = uv.y + cos(uv.x + t * 1.0) * 1.5;
          
          float w2x = wx + sin(wy * 1.5 - t * 0.9) * 1.2;
          float w2y = wy + cos(wx * 1.5 + t * 1.1) * 1.2;
          
          float factor1 = sin(w2x + t) * 0.5 + 0.5;
          float factor2 = cos(w2y - t * 0.8) * 0.5 + 0.5;
          float factor3 = sin(w2x * 0.5 + w2y * 0.5 + t * 0.4) * 0.5 + 0.5;
          
          // High-contrast, vibrant, and dramatic psychedelic sunset colors:
          vec3 sunGold = vec3(1.0, 0.88, 0.2);          // Saturated bright gold (#ffe033)
          vec3 orangeCoral = vec3(1.0, 0.38, 0.1);      // Deep vibrant orange (#ff611a)
          vec3 magentaPink = vec3(0.95, 0.12, 0.52);     // Intense hot magenta-pink (#f21e85)
          vec3 deepIndigo = vec3(0.12, 0.06, 0.5);      // Deep twilight purple-indigo (#1e0f80)
          
          // Blend colors in a highly liquid swirling style
          vec3 finalColor = mix(sunGold, orangeCoral, factor1);
          finalColor = mix(finalColor, magentaPink, factor2 * 0.9);
          finalColor = mix(finalColor, deepIndigo, factor3 * 0.85);
          
          gl_FragColor = vec4(finalColor, uOpacity);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
      transparent: true,
    });
    const skyMesh = new THREE.Mesh(skyGeom, skyMat);
    // Positioned centered at the horizon (Z = 10)
    skyMesh.position.set(0, 0, 10);
    skyMesh.rotation.x = Math.PI / 2;
    skyMesh.renderOrder = -10;
    scene.add(skyMesh);

    // E2. Twinkling Background Stars (Three independent particle groups for asynchronous twinkling)
    const starGroupsCount = 3;
    const starsGroups: THREE.Points[] = [];
    const starsMaterials: THREE.PointsMaterial[] = [];
    const starsGeometries: THREE.BufferGeometry[] = [];

    for (let g = 0; g < starGroupsCount; g++) {
      const gStarCount = 45; // 45 stars per group, total 135 stars
      const starGeometry = new THREE.BufferGeometry();
      const starPositions = new Float32Array(gStarCount * 3);
      const starColors = new Float32Array(gStarCount * 3);
      
      for (let i = 0; i < gStarCount; i++) {
        // Distribute stars: X goes from -30 (upper left) to 4 (middle is 0, so 4 is slightly right of middle)
        const x = -30.0 + Math.random() * 34.0;
        // Y: depth/forward direction in world, 33 to 45
        const y = 33.0 + Math.random() * 12.0;
        // Z: height (up), 11 to 28
        const z = 11.0 + Math.random() * 17.0;

        starPositions[i * 3] = x;
        starPositions[i * 3 + 1] = y;
        starPositions[i * 3 + 2] = z;

        // Calculate brightness based on position:
        // Stars start appearing from the middle (X=0) to the upper left (X=-30, Z=28)
        // Normalize X from [-30, 4] to [1, 0] (denser/brighter on the left)
        const xFactor = Math.max(0, Math.min(1, (4 - x) / 34.0));
        // Normalize Z from [11, 28] to [0.2, 1.0] (brighter/more visible higher up in the sky)
        const zFactor = 0.2 + 0.8 * Math.max(0, Math.min(1, (z - 11) / 17.0));
        
        // Non-linear brightness curve for a smooth transition from dark to starry sky
        const brightness = Math.pow(xFactor, 1.8) * Math.pow(zFactor, 0.8) * (0.3 + Math.random() * 0.7);
        
        let r = 1.0, g_col = 1.0, b = 1.0;
        if (g === 1) { r = 0.92; g_col = 0.96; b = 1.0; } // cool white
        else if (g === 2) { r = 1.0; g_col = 0.94; b = 0.85; } // warm twinkle
        
        starColors[i * 3] = r * brightness;
        starColors[i * 3 + 1] = g_col * brightness;
        starColors[i * 3 + 2] = b * brightness;
      }
      
      starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
      
      const starMaterial = new THREE.PointsMaterial({
        size: 0.12 + Math.random() * 0.08,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      
      const stars = new THREE.Points(starGeometry, starMaterial);
      scene.add(stars);
      
      starsGroups.push(stars);
      starsMaterials.push(starMaterial);
      starsGeometries.push(starGeometry);
    }

    // F. Glowing Sunset Sun (Bigger, blurred sprite in the background)
    const createSunTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
      grad.addColorStop(0.0, 'rgba(255, 221, 89, 1.0)');   // Solid bright sun gold core
      grad.addColorStop(0.25, 'rgba(255, 200, 70, 0.9)');
      grad.addColorStop(0.55, 'rgba(255, 150, 40, 0.5)');   // Orange halo
      grad.addColorStop(0.85, 'rgba(255, 100, 30, 0.15)');  // Faint red-orange edge integration
      grad.addColorStop(1.0, 'rgba(255, 100, 30, 0.0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(256, 256, 256, 0, Math.PI * 2);
      ctx.fill();

      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    };

    const sunTexture = createSunTexture();
    const sunMat = new THREE.SpriteMaterial({
      map: sunTexture,
      transparent: true,
      opacity: 0.95,
      fog: false, // Prevent fog from hiding the sun!
    });
    const sunMesh = new THREE.Sprite(sunMat);
    // Positioned in the upper-right corner of the camera viewport
    sunMesh.scale.set(8.5, 8.5, 1.0); // Bigger sun (was radius 2.0, now diameter 8.5)
    sunMesh.position.set(11.5, 26.0, 17.5);
    scene.add(sunMesh);

    // 7. Animation & Interactive Loop
    let animationFrameId: number;
    let currentZ = camera.position.z;
    let targetZ = currentZ;
    let mouseX = 0;
    let mouseY = 0;
    let camTargetX = 0;
    let camTargetY = 0;

    const onMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      mouseY = (event.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    };
    window.addEventListener('mousemove', onMouseMove);
    const startTime = Date.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Calculate progress locally from window scroll depth
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const triggerHeight = viewportHeight * 1.4; // Matches the 140vh scroll spacer
      const progress = Math.min(scrollY / triggerHeight, 1);
      const timeSec = (Date.now() - startTime) * 0.001;

      // Camera Animation Phases
      let targetX = 0;
      let targetY = 0;
      let targetZVal = 0;
      let lookX = 0;
      let lookY = 0;
      let lookZ = 0;

      if (progress < 0.45) {
        // Phase 1: Descending from angled overview to mouth of the crater
        const p = progress / 0.45;
        // Smooth sine ease-out interpolation
        const ease = Math.sin(p * Math.PI / 2);
        
        targetX = 0;
        targetY = -12.5 * (1 - ease);
        targetZVal = 16.0 * (1 - ease) + 12.0 * ease;

        lookX = 0;
        lookY = 4.5 * (1 - ease);
        lookZ = 8.5 * (1 - ease);
      } else {
        // Phase 2: Flying inside the crater tunnel
        const p = (progress - 0.45) / 0.55;
        // Fast cubic plunge down the tunnel
        const ease = Math.pow(p, 1.8);
        
        targetX = 0;
        targetY = 0;
        targetZVal = 12.0 - ease * 36.5; // Z goes from 12.0 to -24.5

        lookX = 0;
        lookY = 0;
        lookZ = targetZVal - 10;
      }

      // Smooth camera interpolation
      camera.position.x += (targetX - camera.position.x) * 0.08;
      camera.position.y += (targetY - camera.position.y) * 0.08;
      camera.position.z += (targetZVal - camera.position.z) * 0.08;

      // Calculate light fade factor starting from progress 0.4 down to 1.0
      const lightFade = progress < 0.4 ? 1.0 : 1.0 - (progress - 0.4) / 0.6;

      // Pulse and fade core lighting (range limited to 20 to prevent leak)
      coreLight.intensity = (9 + Math.sin(Date.now() * 0.0035) * 1.5) * lightFade;
      
      // Fade other light intensities (ranges are 12 to prevent leaks)
      sideLight1.intensity = 4.0 * lightFade;
      sideLight2.intensity = 3.0 * lightFade;
      sunLight.intensity = 2.6 * lightFade;
      cameraLight.intensity = 4.5 * lightFade;

      // Fade particles
      particleMaterial.opacity = 0.6 * lightFade;

      // Animate particles: rise upward with drift and respawn at bottom
      const pPos = particleGeometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        let px = pPos.getX(i) + particleVelocities[i * 3];
        let py = pPos.getY(i) + particleVelocities[i * 3 + 1];
        let pz = pPos.getZ(i) + particleVelocities[i * 3 + 2];

        // Add gentle swirl
        const swirl = Math.sin(timeSec * 1.5 + i * 0.7) * 0.003;
        px += swirl;
        py += Math.cos(timeSec * 1.2 + i * 0.5) * 0.002;

        // Respawn at bottom of tunnel when particle rises above mouth
        if (pz > 12.0) {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * radiusBottom * 0.6;
          px = Math.cos(angle) * r;
          py = Math.sin(angle) * r;
          pz = -25 + Math.random() * 5;
        }

        pPos.setXYZ(i, px, py, pz);
      }
      pPos.needsUpdate = true;

      // Mouse Parallax (Tilts camera based on mouse coordinates, adjusted for extremely tight tunnel)
      camTargetX = mouseX * 0.15;
      camTargetY = -mouseY * 0.15;
      
      camera.lookAt(new THREE.Vector3(lookX + camTargetX, lookY + camTargetY, lookZ));

      // Rings and particles remain static (no orbital spin)
      // ringsGroup.rotation.z += 0.0008;
      // particles.rotation.z -= 0.0004;

      // Fade sunset sun
      sunMat.opacity = 0.95 * lightFade;

      // Update liquid sky uniforms
      skyMat.uniforms.uTime.value = timeSec;
      skyMat.uniforms.uOpacity.value = 0.95 * lightFade;



      // Animate birds flying across the screen (and flapping wing rotation around Y)
      const elapsedSec = timeSec;
      birdMeshes.forEach((bird, idx) => {
        if (elapsedSec < birdDelays[idx]) return; // wait for stagger delay
        bird.position.x += birdSpeeds[idx];
        bird.position.z += Math.sin(elapsedSec * 4.0 + idx) * 0.005; // gentle vertical bobbing

        // Wing flap animation around the Y-axis (up and down)
        const flapAngle = Math.sin(elapsedSec * 14.0 + idx * 2.0) * 0.45;
        if (bird.children[0]) bird.children[0].rotation.y = flapAngle;
        if (bird.children[1]) bird.children[1].rotation.y = -flapAngle;

        // Respawn on the left when bird exits right side
        if (bird.position.x > 30) {
          bird.position.x = -30 - Math.random() * 10;
          bird.position.y = -4 + Math.random() * 8;
          bird.position.z = 12 + Math.random() * 4;
          birdDelays[idx] = elapsedSec + Math.random() * 4.0; // wait before re-entering
        }
      });

      // Twinkle star groups independently
      const timeMs = Date.now();
      starsMaterials.forEach((mat, idx) => {
        let twinkleFactor = 0.5;
        if (idx === 0) {
          twinkleFactor = 0.55 + Math.sin(timeMs * 0.002) * 0.35;
        } else if (idx === 1) {
          twinkleFactor = 0.5 + Math.cos(timeMs * 0.0035 + 1.2) * 0.35;
        } else {
          twinkleFactor = 0.45 + Math.sin(timeMs * 0.0017 - 0.8) * 0.4;
        }
        mat.opacity = Math.max(0.1, Math.min(1.0, twinkleFactor)) * lightFade;
      });

      // Twist / sway grass tufts to simulate wind (subtle sway, pointing mostly straight up)
      grassTufts.forEach(tuft => {
        // Wind wave traveling from left to right (X direction)
        const windWave = Math.sin(timeSec * 2.2 + tuft.position.x * 0.75) * 0.045;
        const windSway = Math.cos(timeSec * 1.5 + tuft.position.y * 0.5) * 0.025;
        tuft.rotation.x = Math.PI / 2 + windWave;
        tuft.rotation.z = windSway;
      });

      renderer.render(scene, camera);
    };

    animate();

    // 8. Window Resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      // Dispose of low-poly elements programmatically to avoid memory leaks
      lowPolyGroup.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });

      // Dispose of loaded OBJ tree geometries and materials
      activeGeometriesRef.current.forEach(geom => geom.dispose());
      activeMaterialRef.current?.dispose();

      // Dispose of custom lines, grass tufts, and marks
      customLinesGroup.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });

      groundGeom.dispose();
      groundMat.dispose();
      fineTexture?.dispose();
      concreteTexture?.dispose();
      sidewalkTexture?.dispose();
      
      whiteRingOuterGeom.dispose();
      whiteRingInnerGeom.dispose();
      whiteRingMat.dispose();

      roadGeometries.forEach(geom => geom.dispose());
      roadLineMat.dispose();
      roadBoundaryMat.dispose();

      // sidewalkGeom.dispose();
      // sidewalkMat.dispose();
      whiteLineMat.dispose();
      greenLineMat.dispose();
      grayPathMat.dispose();
      grassMat.dispose();
      // parkingLineMat.dispose();
      // crosswalkMat.dispose();
      // markerMat.dispose();

      tunnelGeometry.dispose();
      tunnelMaterial.dispose();
      floorGeom.dispose();
      floorMat.dispose();
      
      particleGeometry.dispose();
      particleMaterial.dispose();
      
      rings.forEach(ring => {
        ring.geometry.dispose();
        (ring.material as THREE.Material).dispose();
      });

      starsGeometries.forEach(geom => geom.dispose());
      starsMaterials.forEach(mat => mat.dispose());

      skyGeom.dispose();
      skyMat.dispose();

      sunTexture?.dispose();
      sunMat.dispose();

      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    />
  );
}

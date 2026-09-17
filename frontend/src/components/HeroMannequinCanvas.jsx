import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useLanguage } from "../i18n.jsx";

export default function HeroMannequinCanvas({ mousePos }) {
  const { t } = useLanguage();
  const mountRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  // References for animation state
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const baseGroupRef = useRef(null);
  const modelPivotRef = useRef(null);
  const modelRef = useRef(null);
  const modelSizeRef = useRef(null);
  const modelCenterRef = useRef(null);
  const modelBBoxMinRef = useRef(null);
  const contactShadowRef = useRef(null);
  const cursorLightRef = useRef(null);

  // Smoothed tracking coordinates
  const currentTracking = useRef({
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    lightX: 0,
    lightY: 0,
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera with responsive vertical FOV
    // Camera placed at z = 3.2, centered horizontally
    const cameraZ = 3.2;
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0, cameraZ);
    cameraRef.current = camera;

    // 3. Renderer with high-end photographic tone mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Studio Lighting tailored for silhouette separation
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.45);
    scene.add(ambientLight);

    // Key front-top light
    const keyLight = new THREE.DirectionalLight(0xfff8f0, 2.9);
    keyLight.position.set(1.5, 3.2, 3.0);
    scene.add(keyLight);

    // Soft cool fill light
    const fillLight = new THREE.DirectionalLight(0xd9e2ec, 1.5);
    fillLight.position.set(-2.0, 1.4, 2.2);
    scene.add(fillLight);

    // High-contrast rim light from behind/top to pop silhouette off background
    const rimLight = new THREE.DirectionalLight(0xffebd2, 3.8);
    rimLight.position.set(0, 3.5, -2.5);
    scene.add(rimLight);

    // Dynamic light tracking the cursor
    const cursorLight = new THREE.PointLight(0xfff4e6, 2.4, 6, 1.1);
    cursorLight.position.set(0, 0.4, 1.8);
    scene.add(cursorLight);
    cursorLightRef.current = cursorLight;

    // 5. Model Hierarchy
    // BaseGroup is placed on the rug surface
    const baseGroup = new THREE.Group();
    scene.add(baseGroup);
    baseGroupRef.current = baseGroup;

    // PivotGroup allows natural rotation while feet stay grounded
    const pivotGroup = new THREE.Group();
    baseGroup.add(pivotGroup);
    modelPivotRef.current = pivotGroup;

    // Feathered contact shadow directly on the rug under mannequin's feet
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext("2d");
    const sGrad = sCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
    sGrad.addColorStop(0, "rgba(0, 0, 0, 0.75)");
    sGrad.addColorStop(0.35, "rgba(0, 0, 0, 0.45)");
    sGrad.addColorStop(0.7, "rgba(0, 0, 0, 0.15)");
    sGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 128, 128);

    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(0.88, 0.42);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    scene.add(contactShadow);
    contactShadowRef.current = contactShadow;

    // 6. Dynamic Responsive Layout Calculator (70–75% of visible hero height)
    const updateModelLayout = (w, h) => {
      if (!cameraRef.current) return;
      const cam = cameraRef.current;
      const fovRad = (cam.fov * Math.PI) / 360;
      const visibleHeight = 2 * cam.position.z * Math.tan(fovRad);

      // Responsive height ratio:
      // Desktop: ~71-73% of visible height so head is never cut off
      // Shorter laptop screens (<750px): ~68-70% for extra clearance
      // Compact screens (<650px): ~65-67%
      let ratio = 0.72;
      if (h < 640) {
        ratio = 0.66;
      } else if (h < 760) {
        ratio = 0.69;
      } else if (h < 900) {
        ratio = 0.71;
      } else {
        ratio = 0.73;
      }

      // Check aspect ratio to ensure model doesn't overflow horizontally on narrow screens
      const aspect = w / h;
      if (aspect < 1.35) {
        ratio *= Math.max(0.82, aspect / 1.35);
      }

      const targetHeight = visibleHeight * ratio;

      // Rug standing plane:
      // Moved 5% down as requested (from 17% to 12% from bottom)
      const rugBottomRatio = 0.12;
      const groundY = -visibleHeight / 2 + visibleHeight * rugBottomRatio;

      if (modelRef.current && modelSizeRef.current) {
        const originalHeight = modelSizeRef.current.y || 1;
        const scale = targetHeight / originalHeight;
        modelRef.current.scale.set(scale, scale, scale);

        // Position feet precisely at groundY
        const center = modelCenterRef.current;
        const bboxMin = modelBBoxMinRef.current;
        modelRef.current.position.set(
          -center.x * scale,
          -bboxMin.y * scale,
          -center.z * scale
        );
      }

      if (baseGroupRef.current) {
        baseGroupRef.current.position.set(0, groundY, 0);
      }

      if (contactShadowRef.current) {
        contactShadowRef.current.position.set(0, groundY + 0.005, 0);
        const shadowScale = targetHeight / 1.7;
        contactShadowRef.current.scale.set(shadowScale, shadowScale, shadowScale);
      }
    };

    // 7. Load GLB Model
    const loader = new GLTFLoader();
    const modelUrl = "/3D-model/fashion%20mannequin%203d model.glb";

    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        modelRef.current = model;

        // Calculate exact bounding box
        const bbox = new THREE.Box3().setFromObject(model);
        modelCenterRef.current = bbox.getCenter(new THREE.Vector3());
        modelSizeRef.current = bbox.getSize(new THREE.Vector3());
        modelBBoxMinRef.current = bbox.min.clone();

        // Enhance materials for realism
        model.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.roughness = Math.max(child.material.roughness || 0.35, 0.32);
            child.material.metalness = Math.min(child.material.metalness || 0.25, 0.35);
            child.material.envMapIntensity = 1.3;
          }
        });

        pivotGroup.add(model);
        updateModelLayout(width, height);
        setLoaded(true);
      },
      (xhr) => {
        if (xhr.total > 0) {
          setProgress(Math.round((xhr.loaded / xhr.total) * 100));
        }
      },
      (error) => {
        console.error("Error loading fashion mannequin model:", error);
      }
    );

    // 8. Animation Loop with smooth lerp
    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      if (modelPivotRef.current) {
        // Natural subtle idle breathing and sway
        const idleBreathing = Math.sin(elapsedTime * 1.6) * 0.007;
        const idleSway = Math.cos(elapsedTime * 0.8) * 0.005;

        // Head/eyes follow cursor:
        const targetRotY = (mousePos?.current?.normX || 0) * 0.38 + idleSway;
        const targetRotX = -(mousePos?.current?.normY || 0) * 0.14 + idleBreathing;
        const targetRotZ = -(mousePos?.current?.normX || 0) * 0.035;

        // Smooth lerp
        const lerpFactor = 0.07;
        const t = currentTracking.current;

        t.rotX += (targetRotX - t.rotX) * lerpFactor;
        t.rotY += (targetRotY - t.rotY) * lerpFactor;
        t.rotZ += (targetRotZ - t.rotZ) * lerpFactor;

        modelPivotRef.current.rotation.set(t.rotX, t.rotY, t.rotZ);

        // Move dynamic cursor light
        if (cursorLightRef.current) {
          const targetLightX = (mousePos?.current?.normX || 0) * 1.5;
          const targetLightY = -(mousePos?.current?.normY || 0) * 1.1 + 0.4;
          t.lightX += (targetLightX - t.lightX) * 0.09;
          t.lightY += (targetLightY - t.lightY) * 0.09;
          cursorLightRef.current.position.set(t.lightX, t.lightY, 1.8);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 9. Responsive Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || window.innerWidth;
      const newH = container.clientHeight || window.innerHeight;

      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();

      renderer.setSize(newW, newH);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      updateModelLayout(newW, newH);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    // Model keeps z-index: 1000 as requested
    <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center overflow-hidden">
      {/* Three.js canvas container */}
      <div
        ref={mountRef}
        className={`h-full w-full transition-opacity duration-700 ease-out ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Editorial loader during initial stream with white and green theme */}
      {!loaded && (
        <div className="pointer-events-none absolute bottom-8 right-8 z-[1020] flex items-center gap-3 rounded-full border border-mintSoft bg-white/90 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-mintDeep shadow-glass backdrop-blur-md">
          <span className="h-2 w-2 animate-ping rounded-full bg-mintDeep" />
          <span>{t("hero.loadingMannequin")} {progress > 0 ? `${progress}%` : ""}</span>
        </div>
      )}
    </div>
  );
}

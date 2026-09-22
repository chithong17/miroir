import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { applyUnlitMaterials } from "./modelUnlitMaterials.js";

const MODEL_URL = "/3D-model/green%20cargo%20pants%203d%20model.glb";
// Three-quarter view facing screen-left, with the shoulder bag visible.
const DEFAULT_YAW = THREE.MathUtils.degToRad(-35);

export default function HeroCargoPantsCanvas() {
  const mountRef = useRef(null);
  const interactionRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const container = mountRef.current;
    const interactionSurface = interactionRef.current;
    if (!container || !interactionSurface) return undefined;

    const scene = new THREE.Scene();
    // Pixel-space projection keeps the artwork anchor exact at every viewport/DPR.
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10000);
    camera.position.set(0, 0, 5000);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xf8fff1, 0x76806c, 2.1));

    const keyLight = new THREE.DirectionalLight(0xfff8e9, 3.2);
    keyLight.position.set(-2.5, 4, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xd9edff, 2.1);
    fillLight.position.set(3, 1, 2.5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xdff4bd, 2.7);
    rimLight.position.set(1.5, 3, -3);
    scene.add(rimLight);

    const pivot = new THREE.Group();
    scene.add(pivot);
    // Normalize using a wrapper so authored root transforms stay intact.
    const normalizedModel = new THREE.Group();
    pivot.add(normalizedModel);

    let model = null;
    let originalModelSize = null;
    let originalModelCenter = null;
    let frameId = 0;
    let isInViewport = true;
    let disposed = false;
    let currentYaw = DEFAULT_YAW;
    let targetYaw = DEFAULT_YAW;
    let pointerRatio = 0;
    let interactionYaw = DEFAULT_YAW;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartYaw = DEFAULT_YAW;
    pivot.rotation.y = DEFAULT_YAW;

    const updateSize = () => {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      camera.left = -width / 2;
      camera.right = width / 2;
      camera.top = height / 2;
      camera.bottom = -height / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    };

    const fitModel = () => {
      if (!model || !originalModelSize || !originalModelCenter) return;

      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);

      // Keep the garment locked to a point in the source artwork. Reproducing
      // CSS object-cover here prevents fullscreen/windowed mode from shifting it.
      const artworkWidth = 1678;
      const artworkHeight = 937;
      const artworkScale = Math.max(width / artworkWidth, height / artworkHeight);
      const renderedWidth = artworkWidth * artworkScale;
      const renderedHeight = artworkHeight * artworkScale;
      const cropX = (renderedWidth - width) / 2;
      const cropY = (renderedHeight - height) / 2;

      // Reference: full figure between the preview card and category rail.
      // Head y=194, shoe soles y=898 in the 1678x937 source artwork.
      const footX = 1040 * artworkScale - cropX;
      const footY = 898 * artworkScale - cropY;
      const targetHeightPixels = 704 * artworkScale;
      const scale = targetHeightPixels / Math.max(originalModelSize.y, 0.001);

      normalizedModel.scale.setScalar(scale);
      normalizedModel.position.set(
        -originalModelCenter.x * scale,
        -(originalModelCenter.y - originalModelSize.y / 2) * scale,
        -originalModelCenter.z * scale
      );

      pivot.position.set(
        footX - width / 2,
        height / 2 - footY,
        0
      );
      // The drag target follows the same artwork crop as the model.
      const hitWidth = Math.max(originalModelSize.x, originalModelSize.z) * scale + 24;
      Object.assign(interactionSurface.style, {
        left: `${footX - hitWidth / 2}px`,
        top: `${footY - targetHeightPixels}px`,
        width: `${hitWidth}px`,
        height: `${targetHeightPixels}px`,
      });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
      fitModel();
    });
    resizeObserver.observe(container);

    const loader = new GLTFLoader();
    loader.load(
      MODEL_URL,
      (gltf) => {
        if (disposed) return;
        model = gltf.scene;
        model.updateMatrixWorld(true);
        const originalBounds = new THREE.Box3().setFromObject(model, true);
        originalModelSize = originalBounds.getSize(new THREE.Vector3());
        originalModelCenter = originalBounds.getCenter(new THREE.Vector3());
        applyUnlitMaterials(model);
        normalizedModel.add(model);
        fitModel();
        setLoaded(true);
      },
      (event) => {
        if (!disposed && event.total > 0) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
      (error) => console.error("Unable to load the cargo pants model:", error)
    );

    const handleWindowPointerMove = (event) => {
      pointerRatio = THREE.MathUtils.clamp((event.clientX / window.innerWidth) * 2 - 1, -1, 1);
      if (!isDragging) targetYaw = interactionYaw + pointerRatio * 0.28;
    };

    const handlePointerDown = (event) => {
      isDragging = true;
      dragStartX = event.clientX;
      dragStartYaw = interactionYaw;
      interactionSurface.setPointerCapture?.(event.pointerId);
      interactionSurface.classList.add("is-dragging");
    };

    const handlePointerMove = (event) => {
      if (!isDragging) return;
      interactionYaw = dragStartYaw + (event.clientX - dragStartX) * 0.012;
      targetYaw = interactionYaw;
    };

    const finishDrag = (event) => {
      if (!isDragging) return;
      isDragging = false;
      targetYaw = interactionYaw + pointerRatio * 0.28;
      if (interactionSurface.hasPointerCapture?.(event.pointerId)) {
        interactionSurface.releasePointerCapture(event.pointerId);
      }
      interactionSurface.classList.remove("is-dragging");
    };

    window.addEventListener("pointermove", handleWindowPointerMove, { passive: true });
    interactionSurface.addEventListener("pointerdown", handlePointerDown);
    interactionSurface.addEventListener("pointermove", handlePointerMove);
    interactionSurface.addEventListener("pointerup", finishDrag);
    interactionSurface.addEventListener("pointercancel", finishDrag);

    const animate = () => {
      frameId = 0;
      if (disposed || !isInViewport || document.hidden) return;

      currentYaw += (targetYaw - currentYaw) * 0.09;
      pivot.rotation.set(0, currentYaw, 0);
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    const startRendering = () => {
      if (!frameId && !disposed && isInViewport && !document.hidden) {
        frameId = requestAnimationFrame(animate);
      }
    };

    const stopRendering = () => {
      if (!frameId) return;
      cancelAnimationFrame(frameId);
      frameId = 0;
    };

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isInViewport = entry.isIntersecting;
        if (isInViewport) startRendering();
        else stopRendering();
      },
      { threshold: 0 }
    );
    intersectionObserver.observe(container);

    const handleVisibilityChange = () => {
      if (document.hidden) stopRendering();
      else startRendering();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    startRendering();

    return () => {
      disposed = true;
      stopRendering();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", handleWindowPointerMove);
      interactionSurface.removeEventListener("pointerdown", handlePointerDown);
      interactionSurface.removeEventListener("pointermove", handlePointerMove);
      interactionSurface.removeEventListener("pointerup", finishDrag);
      interactionSurface.removeEventListener("pointercancel", finishDrag);

      scene.traverse((object) => {
        if (!object.isMesh) return;
        object.geometry?.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.filter(Boolean).forEach((material) => {
          Object.values(material).forEach((value) => {
            if (value?.isTexture) value.dispose();
          });
          material.dispose();
        });
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 hidden select-none lg:block"
      aria-label="Mô hình 3D quần cargo xanh, kéo ngang để xoay 360 độ"
    >
      <div
        ref={mountRef}
        className={`h-full w-full transition-opacity duration-700 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        ref={interactionRef}
        className="pointer-events-auto absolute touch-none cursor-grab [&.is-dragging]:cursor-grabbing"
        role="img"
        aria-label="Kéo ngang để xoay mô hình 3D 360 độ"
      />

      {!loaded && (
        <div className="pointer-events-none absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/60 bg-white/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#506247] shadow-sm backdrop-blur-md">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#8EAD5A]" />
          Đang tải mẫu 3D{progress > 0 ? ` ${progress}%` : ""}
        </div>
      )}
    </div>
  );
}

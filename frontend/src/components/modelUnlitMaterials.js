import * as THREE from "three";

// Per-load caches preserve sharing within an instance without mutating source
// materials or texture settings that another GLTF instance may still use.
export function applyUnlitMaterials(scene) {
  const materials = new Map();
  const colorTextures = new Map();
  const alphaTextures = new Map();

  function cloneTexture(texture, cache, colorSpace) {
    if (!texture) return null;
    if (!cache.has(texture)) {
      const clone = texture.clone();
      if (colorSpace !== undefined) clone.colorSpace = colorSpace;
      clone.needsUpdate = true;
      cache.set(texture, clone);
    }
    return cache.get(texture);
  }

  function convert(original) {
    if (!original || !(original.isMeshStandardMaterial || original.isMeshBasicMaterial)) {
      return original;
    }
    // MeshPhysicalMaterial also inherits isMeshStandardMaterial.
    if (materials.has(original)) return materials.get(original);

    const unlit = new THREE.MeshBasicMaterial();
    // Preserve Material render state (alpha, blending, depth, side, visibility,
    // vertex colors, clipping, stencil, name, etc.) without copying PBR maps.
    THREE.Material.prototype.copy.call(unlit, original);
    unlit.color.copy(original.color);
    unlit.map = cloneTexture(original.map, colorTextures, THREE.SRGBColorSpace);
    unlit.alphaMap = cloneTexture(original.alphaMap, alphaTextures);
    unlit.wireframe = original.wireframe;
    unlit.wireframeLinewidth = original.wireframeLinewidth;
    // Keep renderer settings for other objects. Only this material bypasses
    // exposure/ACES; output conversion still encodes linear color into sRGB.
    unlit.toneMapped = false;
    unlit.fog = false;
    // No AO/light maps or environment maps: display base color + vertex color.
    materials.set(original, unlit);
    return unlit;
  }

  scene.traverse((object) => {
    // SkinnedMesh inherits isMesh; geometry, skeleton, morphs and clips stay intact.
    if (!object.isMesh) return;
    object.material = Array.isArray(object.material)
      ? object.material.map(convert)
      : convert(object.material);
  });
}

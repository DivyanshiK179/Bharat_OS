'use client';

import * as THREE from 'three';
import mapboxgl from 'mapbox-gl';

export function createThreeLayer(lng: number, lat: number): mapboxgl.CustomLayerInterface {
  let camera: THREE.Camera;
  let scene: THREE.Scene;
  let renderer: THREE.WebGLRenderer;
  let marker: THREE.Mesh;

  const modelOrigin: [number, number] = [lng, lat];
  const modelAltitude = 20;
  const merc = mapboxgl.MercatorCoordinate.fromLngLat(modelOrigin, modelAltitude);
  const scale = merc.meterInMercatorCoordinateUnits();

  return {
    id: 'ucer-marker-3d',
    type: 'custom',
    renderingMode: '3d',
    onAdd(map, gl) {
      camera = new THREE.Camera();
      scene = new THREE.Scene();
      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(0, -1, 1);
      scene.add(light);
      const geometry = new THREE.SphereGeometry(3, 16, 16);
      const material = new THREE.MeshStandardMaterial({ color: 0xff4444 });
      marker = new THREE.Mesh(geometry, material);
      scene.add(marker);
      renderer = new THREE.WebGLRenderer({ canvas: map.getCanvas(), context: gl, antialias: true });
      renderer.autoClear = false;
    },
    render(gl, matrix) {
      const m = new THREE.Matrix4().fromArray(matrix);
      const l = new THREE.Matrix4()
        .makeTranslation(merc.x, merc.y, merc.z)
        .scale(new THREE.Vector3(scale, -scale, scale));
      camera.projectionMatrix = m.multiply(l);
      const t = performance.now() * 0.002;
      marker.scale.setScalar(1 + 0.2 * Math.sin(t));
      renderer.resetState();
      renderer.render(scene, camera);
      map.triggerRepaint();
    },
  };
}
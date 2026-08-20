'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import L from 'leaflet';

interface ThreeMarkerLayerProps {
  map: L.Map | null;
  lat: number;
  lng: number;
  size?: number; // canvas size in pixels
}

export default function ThreeMarkerLayer({ map, lat, lng, size = 80 }: ThreeMarkerLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const markerRef = useRef<THREE.Mesh | null>(null);
  const frameRef = useRef<number>(0);

  // Set up the Three.js scene once
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 8;

    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(0, 1, 1);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x888888));

    const geometry = new THREE.SphereGeometry(2, 24, 24);
    const material = new THREE.MeshStandardMaterial({ color: 0xff4444 });
    const marker = new THREE.Mesh(geometry, material);
    scene.add(marker);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(size, size);
    renderer.setPixelRatio(window.devicePixelRatio);

    sceneRef.current = scene;
    cameraRef.current = camera;
    markerRef.current = marker;
    rendererRef.current = renderer;

    function animate() {
      const t = performance.now() * 0.002;
      if (markerRef.current) {
        markerRef.current.scale.setScalar(1 + 0.2 * Math.sin(t));
        markerRef.current.rotation.y = t;
      }
      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, [size]);

  // Reposition the canvas to follow the map's lat/lng
  useEffect(() => {
    if (!map || !canvasRef.current) return;

    function updatePosition() {
      const point = map!.latLngToContainerPoint([lat, lng]);
      const el = canvasRef.current;
      if (el) {
        el.style.left = `${point.x - size / 2}px`;
        el.style.top = `${point.y - size / 2}px`;
      }
    }

    updatePosition();
    map.on('move', updatePosition);
    map.on('zoom', updatePosition);
    map.on('viewreset', updatePosition);

    return () => {
      map.off('move', updatePosition);
      map.off('zoom', updatePosition);
      map.off('viewreset', updatePosition);
    };
  }, [map, lat, lng, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        zIndex: 500,
      }}
    />
  );
}
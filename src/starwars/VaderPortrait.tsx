import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

function disposeModel(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      Object.values(material).forEach(value => { if (value instanceof THREE.Texture) textures.add(value); });
    }
  });
  geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose());
  textures.forEach(texture => {
    texture.dispose();
    const data = texture.source?.data;
    if (typeof ImageBitmap !== 'undefined' && data instanceof ImageBitmap) data.close();
  });
}

export default function VaderPortrait({ paused }: { paused: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const state = useRef({ paused, sync: () => {} });
  state.current.paused = paused;
  useEffect(() => state.current.sync(), [paused]);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }); }
    catch { element.dataset.ready = 'failed'; return; }
    const coarsePointer = matchMedia('(pointer: coarse)').matches;
    renderer.setPixelRatio(Math.min(devicePixelRatio, coarsePointer ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .9;
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, .05, 100);
    camera.position.set(0, .1, 3.9); camera.lookAt(0, 0, 0);
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(room, .04);
    scene.environment = environment.texture; scene.environmentIntensity = .65;
    room.dispose(); pmrem.dispose();
    const key = new THREE.DirectionalLight(0xd7e6ff, 3.5); key.position.set(-3, 5, 4);
    const rim = new THREE.DirectionalLight(0xff2946, 4); rim.position.set(3, 1, -2);
    scene.add(key, rim, new THREE.HemisphereLight(0xdde7ff, 0x090b15, .8));
    let model: THREE.Group | undefined;
    let disposed = false, failed = false, visible = false, frame = 0, last = 0, elapsed = 0;
    const finePointer = matchMedia('(any-hover: hover) and (any-pointer: fine)');
    let pointerX = 0, pointerY = 0, pointerActive = false, clientX = 0, clientY = 0, centerX = 0, centerY = 0;
    const render = () => {
      if (disposed || failed) return;
      if (model) {
        element.dataset.yaw = model.rotation.y.toFixed(4);
        element.dataset.pitch = model.rotation.x.toFixed(4);
      }
      renderer.render(scene, camera);
    };
    const tick = (now: number) => {
      frame = 0;
      if (!model || disposed || failed || !visible || document.hidden || state.current.paused) return;
      if (coarsePointer && last && now - last < 1000 / 30) { frame = requestAnimationFrame(tick); return; }
      const dt = last ? Math.min((now - last) / 1000, .05) : 0;
      last = now; elapsed += dt;
      const angle = pointerActive ? pointerX : Math.sin(elapsed * .3) * .06;
      model.rotation.y = THREE.MathUtils.damp(model.rotation.y, angle, 8, dt);
      model.rotation.x = THREE.MathUtils.damp(model.rotation.x, pointerY, 8, dt);
      model.position.y = Math.sin(elapsed * .7) * .018;
      element.dataset.time = elapsed.toFixed(3);
      render(); frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame); frame = 0; last = 0;
      const running = !!model && visible && !document.hidden && !state.current.paused && !failed;
      element.dataset.running = String(running);
      if (running) frame = requestAnimationFrame(tick);
    };
    state.current.sync = sync;
    const aim = () => {
      const depth = Math.max(innerWidth * .42, 360);
      pointerX = pointerActive ? THREE.MathUtils.clamp(Math.atan2(clientX - centerX, depth), -.55, .55) : 0;
      // Positive pitch tips the forward-facing model down toward a lower screen point.
      pointerY = pointerActive ? THREE.MathUtils.clamp(Math.atan2(clientY - centerY, depth), -.32, .32) : 0;
      element.dataset.tracking = pointerActive ? 'pointer' : 'idle';
    };
    const reframe = () => {
      const rect = element.getBoundingClientRect();
      centerX = rect.left + rect.width / 2; centerY = rect.top + rect.height / 2;
      aim();
    };
    const resize = () => {
      const { width, height } = element.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height; camera.updateProjectionMatrix(); render();
      reframe();
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !finePointer.matches) { leave(); return; }
      clientX = event.clientX; clientY = event.clientY; pointerActive = true; aim();
    };
    const leave = () => { pointerActive = false; aim(); };
    const out = (event: PointerEvent) => { if (!event.relatedTarget) leave(); };
    const visibility = () => { if (document.hidden) leave(); sync(); };
    const lost = (event: Event) => { event.preventDefault(); failed = true; element.dataset.ready = 'failed'; sync(); };
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }); observer.observe(element);
    const sizing = new ResizeObserver(resize); sizing.observe(element);
    window.addEventListener('pointermove', move, { passive: true }); window.addEventListener('pointerout', out);
    window.addEventListener('scroll', reframe, { passive: true }); window.addEventListener('resize', reframe);
    window.addEventListener('blur', leave); window.addEventListener('keydown', leave); window.addEventListener('pointercancel', leave);
    finePointer.addEventListener('change', leave); document.addEventListener('visibilitychange', visibility);
    renderer.domElement.addEventListener('webglcontextlost', lost);
    new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(`${import.meta.env.BASE_URL}models/vader-helmet.glb`).then(gltf => {
      if (disposed) { disposeModel(gltf.scene); return; }
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const size = box.getSize(new THREE.Vector3());
      const scale = 2 / Math.max(size.x, size.y, size.z);
      gltf.scene.position.copy(box.getCenter(new THREE.Vector3()).multiplyScalar(-scale));
      gltf.scene.scale.setScalar(scale);
      model = new THREE.Group(); model.add(gltf.scene); scene.add(model);
      element.dataset.ready = 'true'; element.dataset.time = '0.000';
      resize(); sync();
    }).catch(() => { if (!disposed) { failed = true; element.dataset.ready = 'failed'; sync(); } });
    resize();
    return () => {
      disposed = true; state.current.sync = () => {};
      cancelAnimationFrame(frame); observer.disconnect(); sizing.disconnect();
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerout', out);
      window.removeEventListener('scroll', reframe); window.removeEventListener('resize', reframe);
      window.removeEventListener('blur', leave); window.removeEventListener('keydown', leave); window.removeEventListener('pointercancel', leave);
      finePointer.removeEventListener('change', leave); document.removeEventListener('visibilitychange', visibility);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      disposeModel(scene); environment.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  return <div ref={host} className="vader-portrait" data-ready="loading" aria-hidden="true" />;
}

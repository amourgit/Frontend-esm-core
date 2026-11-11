import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

/** Distance de caméra pour cadrer un objet de taille `size` avec un champ de vision vertical `fovDeg`. */
export function frameDistance(size: [number, number, number], fovDeg: number, margin = 1.25): number {
  const maxDim = Math.max(size[0], size[1], size[2]);
  if (!(maxDim > 0)) return 1;
  return ((maxDim / 2) / Math.tan((fovDeg * Math.PI) / 360)) * margin;
}

/**
 * Visionneuse d'aperçu d'UNE ressource. Un seul contexte WebGL, créé à l'ouverture et libéré à la fermeture.
 * Dépend de three, pas de React (règle d'architecture : runtime/).
 * NON VALIDÉ EN NAVIGATEUR à ce jour (pas de navigateur dans l'environnement de développement).
 */
export class PreviewViewer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
  private model: THREE.Object3D | null = null;
  private raf = 0;
  private disposed = false;
  private loadToken = 0;
  private observer: ResizeObserver | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x666666, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(1, 2, 3);
    this.scene.add(key);
    this.resize();
    if (typeof ResizeObserver !== 'undefined' && canvas.parentElement) {
      this.observer = new ResizeObserver(() => this.resize());
      this.observer.observe(canvas.parentElement);
    }
    const tick = () => {
      if (this.disposed) return;
      this.raf = requestAnimationFrame(tick);
      if (this.model) this.model.rotation.y += 0.008;
      this.renderer.render(this.scene, this.camera);
    };
    tick();
  }

  private resize() {
    const parent = this.canvas.parentElement;
    const width = parent?.clientWidth || 300;
    const height = parent?.clientHeight || 300;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  async load(uri: string): Promise<void> {
    const token = ++this.loadToken;
    this.clearModel();
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    const gltf = await loader.loadAsync(uri);
    if (this.disposed || token !== this.loadToken) return; // fermé ou remplacé pendant le chargement
    const vrm = (gltf.userData as any).vrm;
    if (vrm) (VRMUtils as any).rotateVRM0?.(vrm);
    const model: THREE.Object3D = vrm?.scene ?? gltf.scene;
    this.scene.add(model);
    this.model = model;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    this.camera.position.set(0, 0, frameDistance([size.x, size.y, size.z], this.camera.fov));
    this.camera.lookAt(0, 0, 0);
  }

  private clearModel() {
    if (!this.model) return;
    this.scene.remove(this.model);
    this.model.traverse((o: any) => {
      o.geometry?.dispose?.();
      (Array.isArray(o.material) ? o.material : o.material ? [o.material] : []).forEach((m: any) => {
        Object.values(m).forEach((v: any) => v?.isTexture && v.dispose());
        m.dispose?.();
      });
    });
    this.model = null;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.observer?.disconnect();
    this.clearModel();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}

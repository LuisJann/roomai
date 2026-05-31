"use client";

import React, { useEffect, useState, Suspense, useRef } from "react";
import { Object3D, Scene, Box3, Vector3, Group, Mesh, BoxGeometry, Shape, ExtrudeGeometry } from "three"; // <-- IMPORT SPOSTATO IN CIMA
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, useGLTF, Center, Environment, TransformControls, PivotControls, GizmoHelper, GizmoViewport } from "@react-three/drei";
import { Ruler, RefreshCw, Layers, Move, RotateCw, Maximize, Magnet, Trash2, Settings2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useWorkspaceStore, Interactive3DObject } from "@/store/workspaceStore";
import { get as idbGet } from "idb-keyval";

class ModelErrorBoundary extends React.Component<{ fallback: React.ReactNode; children: React.ReactNode; onError?: () => void }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    if (this.props.onError) this.props.onError();
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Wrapper component to seamlessly convert idb:// URLs to blob: URLs
function IDBWrapper({ url, children }: { url: string; children: (resolvedUrl: string) => React.ReactNode }) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(
    url && !url.startsWith("idb://") ? url : null
  );

  useEffect(() => {
    if (!url) return;
    if (url.startsWith("idb://")) {
      const fileId = url.replace("idb://", "");
      let objectUrl: string | null = null;
      
      idbGet(fileId).then((file) => {
        if (file instanceof File || file instanceof Blob) {
          objectUrl = URL.createObjectURL(file);
          setResolvedUrl(objectUrl);
        } else {
          // Trigger error boundary if file is lost from IndexedDB
          setResolvedUrl("file-not-found-in-db");
        }
      });

      return () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      };
    } else {
      setResolvedUrl(url);
    }
  }, [url]);

  if (!resolvedUrl) return null; // Wait for IDB extraction

  return <>{children(resolvedUrl)}</>;
}

const getLocalSize = (obj: Object3D) => {
  try {
    const clone = obj.clone();
    clone.position.set(0, 0, 0);
    clone.rotation.set(0, 0, 0);
    clone.scale.set(1, 1, 1); // Get true base size without user scale
    const box = new Box3().setFromObject(clone);
    return box.getSize(new Vector3());
  } catch (e) {
    return new Vector3(0, 0, 0);
  }
};

function ModelLoader({ url, OrbitControlsRef, fixRotation = false, floorOffset = 0, setSelectedId }: { url: string; OrbitControlsRef?: React.MutableRefObject<any>; fixRotation?: boolean; floorOffset?: number; setSelectedId: (id: string | null) => void; }) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<Group>(null);
  const innerGroupRef = useRef<Group>(null);
  const [selectedNode, setSelectedNode] = useState<Object3D | null>(null);
  const transformMode = useWorkspaceStore(state => state.transformMode);
  const [snapRotation, setSnapRotation] = useState(true);
  
  const selectedObjectId = useWorkspaceStore(state => state.selectedObjectId);
  
  const nodeTransformations = useWorkspaceStore(state => state.nodeTransformations);
  const updateNodeTransformation = useWorkspaceStore(state => state.updateNodeTransformation);
  const setRoomNodes = useWorkspaceStore(state => state.setRoomNodes);
  const setNodeDimensions = useWorkspaceStore(state => state.setNodeDimensions);

  // Apply transformations when scene or transformations change
  useEffect(() => {
    const nodes: { id: string; name: string }[] = [];
    const dims: Record<string, [number, number, number]> = {};
    
    scene.traverse((child) => {
      // 1. Centra il pivot (l'origine) della geometria al suo centro visivo
      // Questo è fondamentale per i modelli scannerizzati dove l'origine è 0,0,0 della stanza!
      if ((child as Mesh).isMesh) {
        const key = child.name || child.uuid;
        // Avoid duplicate ids if any
        if (!nodes.find(n => n.id === key)) {
            nodes.push({ id: key, name: child.name || "Mesh" });
            const size = getLocalSize(child);
            dims[key] = [size.x, size.y, size.z];
        }
        
        if (!child.userData.pivotCentered) {
        const mesh = child as Mesh;
        const oldGeo = mesh.geometry;
        mesh.geometry = mesh.geometry.clone();
        if (oldGeo) oldGeo.dispose();
        mesh.geometry.computeBoundingBox();
        const box = mesh.geometry.boundingBox;
        if (box && !box.isEmpty()) {
          const center = new Vector3();
          box.getCenter(center);
          
          // Sposta la geometria in modo che l'origine sia al centro
          mesh.geometry.translate(-center.x, -center.y, -center.z);
          
          // Compensa spostando la posizione locale della mesh
          mesh.position.add(center);
        }
        child.userData.pivotCentered = true;
        child.userData.originalPosition = mesh.position.clone(); // Salva la nuova posizione base
      }
    }

      // 2. Applica le trasformazioni utente
      const key = child.name || child.uuid;
      const t = nodeTransformations[key];
      if (t) {
        if (t.position) child.position.fromArray(t.position);
        if (t.rotation) child.rotation.fromArray(t.rotation);
        if (t.scale) child.scale.fromArray(t.scale);
        if (t.visible !== undefined) {
          child.visible = t.visible;
          // Disable raycasting on hidden meshes so clicks pass through
          if (!t.visible) {
            if (!child.userData._originalRaycast) {
              child.userData._originalRaycast = child.raycast.bind(child);
            }
            child.raycast = () => {};
          } else if (child.userData._originalRaycast) {
            child.raycast = child.userData._originalRaycast;
          }
        }
      } else if (child.userData.pivotCentered && child.userData.originalPosition) {
        // Ripristina allo stato originale centrato se rimosso dallo store (es. Reset)
        child.position.copy(child.userData.originalPosition);
        child.rotation.set(0, 0, 0);
        child.scale.set(1, 1, 1);
        child.visible = true;
        if (child.userData._originalRaycast) {
          child.raycast = child.userData._originalRaycast;
        }
      }
    });
    
    // Aggiorna lo store solo se i nodi sono cambiati
    setRoomNodes(nodes);
    setNodeDimensions(dims);
  }, [scene, nodeTransformations, setRoomNodes, setNodeDimensions]);

  useEffect(() => {
    if (groupRef.current && innerGroupRef.current) {
      // 1. Azzeriamo la posizione del gruppo padre
      groupRef.current.position.set(0, 0, 0);
      // 2. Aggiorniamo le matrici assolute del mondo
      groupRef.current.updateMatrixWorld(true);

      // 3. Ora calcoliamo il vero bounding box del modello orientato
      const box = new Box3().setFromObject(innerGroupRef.current);
      const center = box.getCenter(new Vector3());
      
      // 4. Riapplichiamo l'offset inverso per centrare e appoggiare a terra
      groupRef.current.position.x = -center.x;
      groupRef.current.position.z = -center.z;
      groupRef.current.position.y = -box.min.y + floorOffset;
    }
  }, [scene, fixRotation, floorOffset]);

  // Sync with global store selection
  useEffect(() => {
    if (selectedObjectId) {
      let foundNode: Object3D | null = null;
      scene.traverse((child) => {
        const key = child.name || child.uuid;
        if (key === selectedObjectId) foundNode = child;
      });
      setSelectedNode(foundNode);
    } else {
      setSelectedNode(null);
    }
  }, [selectedObjectId, scene]);

  const handlePointerDown = (e: any) => {
    e.stopPropagation(); // Evita che il click passi agli oggetti dietro
    
    // R3F Raycaster sometimes intercepts clicks on invisible objects or their descendants.
    // We traverse up the tree to ensure the clicked object and all its ancestors are visible.
    let node = e.object;
    let isHidden = false;
    while (node) {
      if (node.visible === false) {
        isHidden = true;
        break;
      }
      node = node.parent;
    }
    
    if (isHidden) return; // Ignore clicks on invisible nodes

    const key = e.object.name || e.object.uuid;
    setSelectedId(key); // Sincronizza lo store globale
    setSelectedNode(e.object);
  };

  const handlePointerMissed = () => {
    setSelectedNode(null);
    setSelectedId(null);
  };

  const handleHideNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedNode) {
      const key = selectedNode.name || selectedNode.uuid;
      updateNodeTransformation(key, { visible: false });
      setSelectedNode(null);
    }
  };

  return (
    <>
      <group ref={groupRef}>
        <group ref={innerGroupRef} rotation={[fixRotation ? -Math.PI / 2 : 0, 0, 0]}>
          <primitive 
            object={scene} 
            onClick={handlePointerDown} 
            onPointerMissed={handlePointerMissed}
          />
        </group>
      </group>
        
        {/* TransformControls per il nodo GLB interno selezionato */}
        {selectedNode && !isReadOnly && (
          <>
            <TransformControls
              object={selectedNode}
              mode={transformMode}
              space={transformMode === "translate" ? "world" : "local"}
              rotationSnap={snapRotation ? Math.PI / 12 : null}
              onMouseDown={() => {
                if (OrbitControlsRef?.current) OrbitControlsRef.current.enabled = false;
              }}
              onMouseUp={() => {
                if (OrbitControlsRef?.current) OrbitControlsRef.current.enabled = true;
                const key = selectedNode.name || selectedNode.uuid;
                updateNodeTransformation(key, {
                  position: [selectedNode.position.x, selectedNode.position.y, selectedNode.position.z],
                  rotation: [selectedNode.rotation.x, selectedNode.rotation.y, selectedNode.rotation.z],
                  scale: [selectedNode.scale.x, selectedNode.scale.y, selectedNode.scale.z]
                });
              }}
            />
          </>
        )}
      
      {/* Aggiungiamo un'illuminazione ambientale fotorealistica */}
      <Environment preset="city" />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
    </>
  );
}


function CatalogModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  // Clone the scene so we can have multiple instances of the same model!
  const clonedScene = React.useMemo(() => scene.clone(), [scene]);
  
  return <primitive object={clonedScene} />;
}

function PrimitiveFurniture({ type, color, intensity }: { type: string; color?: string; intensity?: number; }) {
  // Funzione helper per creare mobili di base partendo da forme primitive
  switch(type) {
    case 'light_point':
      return (
        <group>
          {/* Rosetta a soffitto moderna */}
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.03, 32]} />
            <meshStandardMaterial color="#18181b" roughness={0.2} metalness={0.8} />
          </mesh>
          {/* Cavo sottile elegante */}
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.002, 0.002, 0.2, 8]} />
            <meshStandardMaterial color="#18181b" roughness={0.8} />
          </mesh>
          {/* Paralume a cono moderno */}
          <mesh position={[0, -0.04, 0]}>
            <coneGeometry args={[0.15, 0.12, 32]} />
            <meshStandardMaterial color="#27272a" roughness={0.1} metalness={0.6} side={2} />
          </mesh>
          {/* Diffusore interno luminoso */}
          <mesh position={[0, -0.09, 0]}>
            <cylinderGeometry args={[0.14, 0.14, 0.01, 32]} />
            <meshStandardMaterial
              color={color || "#fffbeb"}
              emissive={color || "#fffbeb"}
              emissiveIntensity={intensity ?? 2}
              roughness={0.4}
            />
          </mesh>
          {/* Luce puntuale */}
          <pointLight
            color={color || "#fffbeb"}
            intensity={(intensity ?? 1.5) * 80}
            distance={0}
            decay={2}
            castShadow
          />
        </group>
      );
    case 'door':
      return (
        <group position={[0, 105, 0]}>
          {/* Telaio superiore */}
          <mesh castShadow position={[0, 105, 0]}>
            <boxGeometry args={[96, 4, 16]} />
            <meshStandardMaterial color={color || "#e7e5e4"} roughness={0.4} />
          </mesh>
          {/* Telaio sinistro */}
          <mesh castShadow position={[-46, 0, 0]}>
            <boxGeometry args={[4, 210, 16]} />
            <meshStandardMaterial color={color || "#e7e5e4"} roughness={0.4} />
          </mesh>
          {/* Telaio destro */}
          <mesh castShadow position={[46, 0, 0]}>
            <boxGeometry args={[4, 210, 16]} />
            <meshStandardMaterial color={color || "#e7e5e4"} roughness={0.4} />
          </mesh>
          {/* Anta della porta (Modern flat) */}
          <mesh castShadow position={[0, 0, 2]}>
            <boxGeometry args={[88, 206, 4]} />
            <meshStandardMaterial color={color || "#fafaf9"} roughness={0.5} />
          </mesh>
          {/* Dettaglio scanalatura anta centrale */}
          <mesh position={[0, 0, 4.01]}>
            <boxGeometry args={[2, 206, 0.1]} />
            <meshStandardMaterial color="#e5e5e5" roughness={0.6} />
          </mesh>
          {/* Maniglia moderna */}
          <group position={[35, 5, 5]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[2.5, 2.5, 1, 32]} />
              <meshStandardMaterial color="#3f3f46" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, 3]}>
              <boxGeometry args={[14, 2, 2]} />
              <meshStandardMaterial color="#3f3f46" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[-6, 0, 1.5]}>
              <boxGeometry args={[2, 2, 3]} />
              <meshStandardMaterial color="#3f3f46" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        </group>
      );
    case 'window':
      return (
        <group position={[0, 60, 0]}>
          {/* Telaio Superiore */}
          <mesh castShadow position={[0, 60, 0]}>
            <boxGeometry args={[126, 6, 16]} />
            <meshStandardMaterial color={color || "#27272a"} roughness={0.3} metalness={0.2} />
          </mesh>
          {/* Telaio Inferiore (Davanzale) */}
          <mesh castShadow position={[0, -60, 0]}>
            <boxGeometry args={[130, 8, 20]} />
            <meshStandardMaterial color={color || "#e4e4e7"} roughness={0.6} />
          </mesh>
          {/* Telaio Sinistro */}
          <mesh castShadow position={[-60, 0, 0]}>
            <boxGeometry args={[6, 114, 16]} />
            <meshStandardMaterial color={color || "#27272a"} roughness={0.3} metalness={0.2} />
          </mesh>
          {/* Telaio Destro */}
          <mesh castShadow position={[60, 0, 0]}>
            <boxGeometry args={[6, 114, 16]} />
            <meshStandardMaterial color={color || "#27272a"} roughness={0.3} metalness={0.2} />
          </mesh>
          {/* Vetro intero */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[114, 114, 2]} />
            <meshStandardMaterial color="#bae6fd" transparent opacity={0.3} metalness={0.9} roughness={0.05} />
          </mesh>
          {/* Traversa orizzontale sottile (stile moderno) */}
          <mesh position={[0, -10, 1]}>
            <boxGeometry args={[114, 2, 4]} />
            <meshStandardMaterial color={color || "#27272a"} roughness={0.3} metalness={0.2} />
          </mesh>
        </group>
      );
    case 'sofa':
      return (
        <group position={[0, 20, 0]}>
          {/* Base divano */}
          <mesh castShadow receiveShadow position={[0, -10, 0]}>
            <boxGeometry args={[200, 20, 90]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          {/* Schienale */}
          <mesh castShadow receiveShadow position={[0, 15, -35]}>
            <boxGeometry args={[200, 30, 20]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          {/* Braccioli */}
          <mesh castShadow receiveShadow position={[-90, 5, 0]}>
            <boxGeometry args={[20, 20, 90]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh castShadow receiveShadow position={[90, 5, 0]}>
            <boxGeometry args={[20, 20, 90]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
        </group>
      );
    case 'bed':
      return (
        <group position={[0, 15, 0]}>
          {/* Materasso */}
          <mesh castShadow receiveShadow position={[0, 5, 0]}>
            <boxGeometry args={[160, 20, 200]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          {/* Base letto */}
          <mesh castShadow receiveShadow position={[0, -10, 0]}>
            <boxGeometry args={[160, 10, 200]} />
            <meshStandardMaterial color="#8b5cf6" />
          </mesh>
          {/* Testiera */}
          <mesh castShadow receiveShadow position={[0, 30, -95]}>
            <boxGeometry args={[160, 60, 10]} />
            <meshStandardMaterial color="#7c3aed" />
          </mesh>
          {/* Cuscini */}
          <mesh castShadow receiveShadow position={[-40, 17, -70]}>
            <boxGeometry args={[60, 5, 35]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>
          <mesh castShadow receiveShadow position={[40, 17, -70]}>
            <boxGeometry args={[60, 5, 35]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>
        </group>
      );
    case 'table':
      return (
        <group position={[0, 37.5, 0]}>
          {/* Piano tavolo */}
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[160, 5, 90]} />
            <meshStandardMaterial color="#fbbf24" />
          </mesh>
          {/* Gambe */}
          <mesh castShadow receiveShadow position={[-70, -18.75, -35]}>
            <boxGeometry args={[8, 37.5, 8]} />
            <meshStandardMaterial color="#451a03" />
          </mesh>
          <mesh castShadow receiveShadow position={[70, -18.75, -35]}>
            <boxGeometry args={[8, 37.5, 8]} />
            <meshStandardMaterial color="#451a03" />
          </mesh>
          <mesh castShadow receiveShadow position={[-70, -18.75, 35]}>
            <boxGeometry args={[8, 37.5, 8]} />
            <meshStandardMaterial color="#451a03" />
          </mesh>
          <mesh castShadow receiveShadow position={[70, -18.75, 35]}>
            <boxGeometry args={[8, 37.5, 8]} />
            <meshStandardMaterial color="#451a03" />
          </mesh>
        </group>
      );
    case 'chair':
      return (
        <group position={[0, 22.5, 0]}>
          {/* Seduta */}
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[45, 5, 45]} />
            <meshStandardMaterial color="#facc15" />
          </mesh>
          {/* Gambe */}
          <mesh castShadow receiveShadow position={[-18, -11.25, -18]}>
            <boxGeometry args={[4, 22.5, 4]} />
            <meshStandardMaterial color="#451a03" />
          </mesh>
          <mesh castShadow receiveShadow position={[18, -11.25, -18]}>
            <boxGeometry args={[4, 22.5, 4]} />
            <meshStandardMaterial color="#451a03" />
          </mesh>
          <mesh castShadow receiveShadow position={[-18, -11.25, 18]}>
            <boxGeometry args={[4, 22.5, 4]} />
            <meshStandardMaterial color="#451a03" />
          </mesh>
          <mesh castShadow receiveShadow position={[18, -11.25, 18]}>
            <boxGeometry args={[4, 22.5, 4]} />
            <meshStandardMaterial color="#451a03" />
          </mesh>
          {/* Schienale */}
          <mesh castShadow receiveShadow position={[0, 20, -18]}>
            <boxGeometry args={[45, 40, 4]} />
            <meshStandardMaterial color="#facc15" />
          </mesh>
        </group>
      );
    case 'closet':
      return (
        <group position={[0, 100, 0]}>
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[120, 200, 60]} />
            <meshStandardMaterial color="#d4d4d8" />
          </mesh>
          {/* Ante */}
          <mesh position={[-30, 0, 31]}>
            <boxGeometry args={[58, 196, 2]} />
            <meshStandardMaterial color="#e4e4e7" />
          </mesh>
          <mesh position={[30, 0, 31]}>
            <boxGeometry args={[58, 196, 2]} />
            <meshStandardMaterial color="#e4e4e7" />
          </mesh>
          {/* Maniglie */}
          <mesh position={[-5, 0, 33]}>
            <boxGeometry args={[2, 20, 2]} />
            <meshStandardMaterial color="#71717a" />
          </mesh>
          <mesh position={[5, 0, 33]}>
            <boxGeometry args={[2, 20, 2]} />
            <meshStandardMaterial color="#71717a" />
          </mesh>
        </group>
      );
    default:
      return (
        <mesh castShadow receiveShadow position={[0, 20, 0]}>
          <boxGeometry args={[40, 40, 40]} />
          <meshStandardMaterial color="#eab308" />
        </mesh>
      );
  }
}

function InteractiveObjects({ 
  OrbitControlsRef,
  selectedId,
  setSelectedId
}: { 
  OrbitControlsRef: React.MutableRefObject<any>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}) {
  const objects = useWorkspaceStore(state => state.addedObjects);
  const updateObject = useWorkspaceStore(state => state.update3DObject);
  const removeObject = useWorkspaceStore(state => state.remove3DObject);
  const nodeDimensions = useWorkspaceStore(state => state.nodeDimensions);
  const setNodeDimension = useWorkspaceStore(state => state.setNodeDimension);
  const nodeTransformations = useWorkspaceStore(state => state.nodeTransformations);
  const transformMode = useWorkspaceStore(state => state.transformMode);
  const isReadOnly = useWorkspaceStore(state => state.isReadOnly);
  const setTransformMode = useWorkspaceStore(state => state.setTransformMode);
  
  const [selectedNode, setSelectedNode] = useState<Object3D | null>(null);
  const [snapRotation, setSnapRotation] = useState(true);
  const [isMobileMenuExpanded, setIsMobileMenuExpanded] = useState(false);

  useEffect(() => {
    setIsMobileMenuExpanded(false);
  }, [selectedId]);

  // MIGRATION: Auto-remove any old broken modelviewer.dev URLs from the user's local storage
  useEffect(() => {
    objects.forEach(obj => {
      if (obj.modelUrl && obj.modelUrl.includes('modelviewer.dev')) {
        console.warn('Auto-removing broken object:', obj.id);
        removeObject(obj.id);
      }
    });
  }, [objects, removeObject]);


  const selectedObject = objects.find(o => o.id === selectedId);

  return (
    <>
      {objects.map((obj) => {
        const isSelected = selectedId === obj.id;

        return (
          <group key={obj.id}>
            {isSelected && selectedNode && !isReadOnly && (
              <TransformControls
                object={selectedNode}
                mode={transformMode}
                space={transformMode === "translate" ? "world" : "local"}
                rotationSnap={snapRotation ? Math.PI / 12 : null}
                onMouseDown={() => {
                  if (OrbitControlsRef.current) OrbitControlsRef.current.enabled = false;
                }}
                onMouseUp={(e: any) => {
                  if (OrbitControlsRef.current) OrbitControlsRef.current.enabled = true;
                  const controls = e?.target;
                  if (controls && controls.object) {
                    updateObject(obj.id, {
                      position: [controls.object.position.x, controls.object.position.y, controls.object.position.z],
                      rotation: [controls.object.rotation.x, controls.object.rotation.y, controls.object.rotation.z],
                      scale: [controls.object.scale.x, controls.object.scale.y, controls.object.scale.z]
                    });
                  }
                }}
              />
            )}

            <group
              position={obj.position}
              rotation={obj.rotation}
              scale={obj.scale || [1, 1, 1]}
              visible={nodeTransformations[obj.id]?.visible !== false}
              ref={(el) => {
                if (isSelected && el && selectedNode !== el) setSelectedNode(el);
                // If we don't have the base dimension yet, try to compute it
                if (el && !nodeDimensions[obj.id]) {
                  // Temporarily remove scale to compute base size
                  const currentScale = el.scale.clone();
                  el.scale.set(1, 1, 1);
                  const baseSize = getLocalSize(el);
                  el.scale.copy(currentScale);
                  if (baseSize.lengthSq() > 0) {
                    setNodeDimension(obj.id, [baseSize.x, baseSize.y, baseSize.z]);
                  }
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(obj.id);
              }}
            >
                {obj.modelUrl ? (
                  <ModelErrorBoundary 
                    fallback={<mesh><boxGeometry args={[30, 30, 30]} /><meshStandardMaterial color="#ef4444" wireframe /></mesh>}
                    onError={() => {
                      // Se il modello personalizzato è rotto (es. blob scaduto), rimuovi l'oggetto
                      const store = useWorkspaceStore.getState();
                      store.remove3DObject(obj.id);
                    }}
                  >
                    <Suspense fallback={<mesh><boxGeometry args={[30, 30, 30]} /><meshStandardMaterial color="#666" wireframe /></mesh>}>
                      <IDBWrapper url={obj.modelUrl}>
                        {(resolvedUrl) => <CatalogModel url={resolvedUrl} />}
                      </IDBWrapper>
                    </Suspense>
                  </ModelErrorBoundary>
                ) : (
                  // Fallback geometrico in centimetri (scalato a metri: 0.01 per i mobili, non per le luci)
                  <group scale={obj.type === 'light_point' ? [1, 1, 1] : [0.01, 0.01, 0.01]}>
                    <PrimitiveFurniture 
                      type={obj.type} 
                      color={nodeTransformations[obj.id]?.color}
                      intensity={nodeTransformations[obj.id]?.intensity}
                    />
                  </group>
                )}




              </group>
          </group>
        );
      })}
    </>
  );
}

interface FurnitureItem {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  status: "keep" | "evaluate" | "replace" | "proposed";
}

interface RoomViewer3DProps {
  length: number;
  width: number;
  height: number;
  doorsCount: number;
  windowsCount: number;
  furniture: FurnitureItem[];
  customModelUrl?: string | null;
  fixRotation?: boolean;
  floorOffset?: number;
}

function ShapeFloor({ node, isSelected, color, thickness, onClick }: any) {
  const geometry = React.useMemo(() => {
    const shape = new Shape();
    node.points.forEach((p: any, i: number) => {
      if (i === 0) shape.moveTo(p.x, -p.z);
      else shape.lineTo(p.x, -p.z);
    });
    const geo = new ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
    geo.translate(0, 0, -thickness);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [node.points, thickness]);

  return (
    <mesh position={node.pos} rotation={node.rot} onClick={onClick}>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
      {isSelected && (
        <lineSegments>
          <edgesGeometry attach="geometry" args={[geometry]} />
          <lineBasicMaterial color="#3b82f6" linewidth={2} />
        </lineSegments>
      )}
    </mesh>
  );
}

function ShapeWall({ node, isSelected, color, thickness, onClick }: any) {
  const geometry = React.useMemo(() => {
    const shape = new Shape();
    const l = node.len;
    shape.moveTo(-l/2, 0);
    shape.lineTo(l/2, 0);
    shape.lineTo(l/2, node.rightHeight);
    shape.lineTo(-l/2, node.leftHeight);
    shape.lineTo(-l/2, 0);

    const geo = new ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
    geo.translate(0, 0, -thickness/2);
    return geo;
  }, [node.len, node.leftHeight, node.rightHeight, thickness]);

  return (
    <mesh position={node.pos} rotation={node.rot} onClick={onClick}>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial color={color} roughness={0.75} metalness={0} />
      {isSelected && (
        <lineSegments>
          <edgesGeometry attach="geometry" args={[geometry]} />
          <lineBasicMaterial color="#3b82f6" linewidth={2} />
        </lineSegments>
      )}
    </mesh>
  );
}

function ProceduralRoom({ config, setSelectedId, floorOffset = 0 }: { config: any; setSelectedId: (id: string | null) => void; floorOffset?: number }) {
  const nodeTransformations = useWorkspaceStore(state => state.nodeTransformations);
  const setRoomNodes = useWorkspaceStore(state => state.setRoomNodes);
  const selectedObjectId = useWorkspaceStore(state => state.selectedObjectId);

  const { shape = 'rectangular', width: w, length: l, height: h, wingWidth, wingLength, chamferSize, kneeHeight } = config;
  const wallThickness = 0.1;

  const nodes = React.useMemo(() => {
      let points: {x: number, z: number}[] = [];
      let wallHeights: {l: number, r: number}[] = [];
      
      if (shape === 'rectangular') {
        points = [ {x: -w/2, z: -l/2}, {x: w/2, z: -l/2}, {x: w/2, z: l/2}, {x: -w/2, z: l/2} ];
        wallHeights = [ {l: h, r: h}, {l: h, r: h}, {l: h, r: h}, {l: h, r: h} ];
      } else if (shape === 'l-shape') {
        const ww = wingWidth || w/2;
        const wl = wingLength || l/2;
        points = [ 
           {x: -w/2, z: -l/2}, 
           {x: w/2, z: -l/2}, 
           {x: w/2, z: l/2 - wl}, 
           {x: -w/2 + ww, z: l/2 - wl}, 
           {x: -w/2 + ww, z: l/2}, 
           {x: -w/2, z: l/2} 
        ];
        for(let i=0; i<6; i++) wallHeights.push({l: h, r: h});
      } else if (shape === 'chamfered') {
        const c = chamferSize || Math.min(w, l)/3;
        points = [ 
           {x: -w/2, z: -l/2}, 
           {x: w/2 - c, z: -l/2}, 
           {x: w/2, z: -l/2 + c}, 
           {x: w/2, z: l/2}, 
           {x: -w/2, z: l/2} 
        ];
        for(let i=0; i<5; i++) wallHeights.push({l: h, r: h});
      } else if (shape === 'attic') {
        const knee = kneeHeight || 1.2;
        points = [ {x: -w/2, z: -l/2}, {x: w/2, z: -l/2}, {x: w/2, z: l/2}, {x: -w/2, z: l/2} ];
        wallHeights = [ 
          {l: h, r: h}, 
          {l: h, r: knee}, 
          {l: knee, r: knee}, 
          {l: knee, r: h} 
        ];
      }

      const generatedNodes: any[] = [];
      
      generatedNodes.push({
        id: 'floor',
        name: 'Pavimento',
        type: 'floor',
        points: points,
        pos: [0, -wallThickness/2, 0] as [number,number,number],
        rot: [0, 0, 0] as [number,number,number],
        color: '#d6cfc5'
      });

      for(let i=0; i<points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i+1)%points.length];
        const dx = p2.x - p1.x;
        const dz = p2.z - p1.z;
        const len = Math.hypot(dx, dz) + wallThickness;
        const angle = Math.atan2(-dz, dx); 
        const cx = (p1.x + p2.x)/2;
        const cz = (p1.z + p2.z)/2;

        generatedNodes.push({
          id: `wall_${i}`,
          name: `Parete ${i+1}`,
          type: 'wall',
          len: len,
          leftHeight: wallHeights[i].l,
          rightHeight: wallHeights[i].r,
          pos: [cx, 0, cz] as [number,number,number],
          rot: [0, angle, 0] as [number,number,number],
          color: '#f1f5f9'
        });
      }

      return generatedNodes;
  }, [shape, w, l, h, wingWidth, wingLength, chamferSize, kneeHeight]);

  React.useEffect(() => {
    setRoomNodes(nodes.map(n => ({ id: n.id, name: n.name })));
  }, [nodes, setRoomNodes]);

  return (
    <group position={[0, floorOffset, 0]}>
      {nodes.map(node => {
        const t = nodeTransformations[node.id];
        const isVisible = t?.visible !== false;
        if (!isVisible) return null;
        
        const isSelected = selectedObjectId === node.id;
        const color = t?.color || (isSelected ? "#93c5fd" : node.color);
        
        if (node.type === 'floor') {
          return (
            <ShapeFloor 
              key={node.id}
              node={node}
              isSelected={isSelected}
              color={color}
              thickness={wallThickness}
              onClick={(e: any) => { e.stopPropagation(); setSelectedId(node.id); }}
            />
          );
        } else {
          return (
            <ShapeWall 
              key={node.id}
              node={node}
              isSelected={isSelected}
              color={color}
              thickness={wallThickness}
              onClick={(e: any) => { e.stopPropagation(); setSelectedId(node.id); }}
            />
          );
        }
      })}
    </group>
  );
}
export function RoomViewer3D({
  length = 450,
  width = 350,
  height = 270,
  doorsCount = 1,
  windowsCount = 2,
  furniture = [],
  customModelUrl = null,
  fixRotation = false,
  floorOffset = 0
}: RoomViewer3DProps) {
  const orbitRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const selectedId = useWorkspaceStore(state => state.selectedObjectId);
  const setSelectedId = useWorkspaceStore(state => state.setSelectedObjectId);
  const customRoomConfig = useWorkspaceStore(state => state.customRoomConfig);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center text-white/50 text-xs gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        <span>Inizializzazione vista 3D...</span>
      </div>
    );
  }

  const lenM = length / 100;
  const widM = width / 100;
  const heiM = height / 100;

  // Let's import useRef if it's not imported or just use React.useRef
  return (
    <div className="relative w-full h-full bg-[#0a0a0c] overflow-hidden touch-none overscroll-none">
      {/* The Legend has been moved to the floating bottom bar */}
      
      <Canvas 
        className="relative z-20 w-full h-full"
        gl={{ preserveDrawingBuffer: true }}
        camera={{ position: [lenM * 1.5, heiM * 1.8, widM * 1.5], fov: 50 }}
        onPointerMissed={() => {
          setSelectedId(null);
          // We can't clear selectedNode here because it's local to ModelLoader.
          // But clicking background will trigger handlePointerMissed in ModelLoader anyway!
        }}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 15, 10]} intensity={1.5} />
        <directionalLight position={[-10, 10, -10]} intensity={0.5} />

        <GizmoHelper
          key={isMobile ? 'mobile' : 'desktop'} // Forces unmount & remount to apply new margin prop instantly
          alignment="bottom-left"
          margin={isMobile ? [40, 210] : [60, 60]}
        >
          <GizmoViewport 
            scale={isMobile ? 30 : 40}
            axisColors={['#ef4444', '#22c55e', '#3b82f6']} 
            labels={['X', 'Y', 'Z']} 
            labelColor="white" 
            hideNegativeAxes={true} // Native Drei prop to hide negative axis head circles
          />
        </GizmoHelper>

        <OrbitControls 
          ref={orbitRef}
          makeDefault
          enablePan={true} 
          enableZoom={true} 
          minDistance={1.5} 
          maxDistance={25}
          maxPolarAngle={Math.PI / 2 - 0.05} 
        />
        
        <InteractiveObjects OrbitControlsRef={orbitRef} selectedId={selectedId} setSelectedId={setSelectedId} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <planeGeometry args={[lenM * 1.8, widM * 1.8]} />
          <meshStandardMaterial color="#141418" roughness={0.9} />
        </mesh>
        
        <gridHelper args={[Math.max(lenM, widM) * 2, 20, "#334155", "#1e293b"]} position={[0, -0.01, 0]} />

        {customModelUrl ? (
          <ModelErrorBoundary 
            fallback={
              <Html center>
                <div className="bg-red-500/90 text-white px-4 py-2 rounded-lg backdrop-blur text-sm flex items-center gap-2">
                  ❌ Errore nel caricamento del modello. (File scaduto)
                </div>
              </Html>
            }
            onError={() => {
              const store = useWorkspaceStore.getState();
              store.setCustom3DModelUrl(null);
            }}
          >
            <Suspense fallback={
              <Html center>
                <div className="bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur border border-white/20 text-sm flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Caricamento modello 3D...
                </div>
              </Html>
            }>
              <IDBWrapper url={customModelUrl}>
                {(resolvedUrl) => (
                  <ModelLoader 
                    url={resolvedUrl} 
                    OrbitControlsRef={orbitRef} 
                    fixRotation={fixRotation} 
                    floorOffset={floorOffset} 
                    setSelectedId={setSelectedId} 
                  />
                )}
              </IDBWrapper>
            </Suspense>
          </ModelErrorBoundary>
        ) : customRoomConfig ? (
          <ProceduralRoom config={customRoomConfig} setSelectedId={setSelectedId} floorOffset={floorOffset} />
        ) : (
          <>
            <mesh position={[0, heiM / 2, 0]}>
              <boxGeometry args={[lenM, heiM, widM]} />
              <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.35} />
            </mesh>

            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[lenM, widM]} />
              <meshStandardMaterial color="#27272a" roughness={0.7} />
            </mesh>

            {doorsCount > 0 && Array.from({ length: doorsCount }).map((_, i) => {
              const spacing = lenM / (doorsCount + 1);
              const posX = -lenM / 2 + spacing * (i + 1);
              return (
                <group key={`door-${i}`} position={[posX, 0, -widM / 2]}>
                  {/* Telaio superiore */}
                  <mesh castShadow position={[0, 2.1, 0]}>
                    <boxGeometry args={[0.96, 0.04, 0.16]} />
                    <meshStandardMaterial color="#e7e5e4" roughness={0.4} />
                  </mesh>
                  {/* Telaio sinistro */}
                  <mesh castShadow position={[-0.46, 1.05, 0]}>
                    <boxGeometry args={[0.04, 2.1, 0.16]} />
                    <meshStandardMaterial color="#e7e5e4" roughness={0.4} />
                  </mesh>
                  {/* Telaio destro */}
                  <mesh castShadow position={[0.46, 1.05, 0]}>
                    <boxGeometry args={[0.04, 2.1, 0.16]} />
                    <meshStandardMaterial color="#e7e5e4" roughness={0.4} />
                  </mesh>
                  {/* Anta porta */}
                  <mesh castShadow position={[0, 1.05, 0.02]}>
                    <boxGeometry args={[0.88, 2.06, 0.04]} />
                    <meshStandardMaterial color="#fafaf9" roughness={0.5} />
                  </mesh>
                  {/* Maniglia */}
                  <group position={[0.35, 1.05, 0.05]}>
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[0.025, 0.025, 0.01, 32]} />
                      <meshStandardMaterial color="#3f3f46" metalness={0.8} roughness={0.2} />
                    </mesh>
                    <mesh position={[0, 0, 0.03]}>
                      <boxGeometry args={[0.14, 0.02, 0.02]} />
                      <meshStandardMaterial color="#3f3f46" metalness={0.8} roughness={0.2} />
                    </mesh>
                    <mesh position={[-0.06, 0, 0.015]}>
                      <boxGeometry args={[0.02, 0.02, 0.03]} />
                      <meshStandardMaterial color="#3f3f46" metalness={0.8} roughness={0.2} />
                    </mesh>
                  </group>
                  <Html distanceFactor={4} position={[0, 2.35, 0]}>
                    <span className="bg-amber-800 text-white px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest pointer-events-none">
                      Porta {i + 1}
                    </span>
                  </Html>
                </group>
              );
            })}

            {windowsCount > 0 && Array.from({ length: windowsCount }).map((_, i) => {
              const spacing = lenM / (windowsCount + 1);
              const posX = -lenM / 2 + spacing * (i + 1);
              return (
                <group key={`window-${i}`} position={[posX, 1.1, widM / 2]}>
                  {/* Telaio Superiore */}
                  <mesh castShadow position={[0, 0.6, 0]}>
                    <boxGeometry args={[1.26, 0.06, 0.16]} />
                    <meshStandardMaterial color="#27272a" roughness={0.3} metalness={0.2} />
                  </mesh>
                  {/* Telaio Inferiore */}
                  <mesh castShadow position={[0, -0.6, 0]}>
                    <boxGeometry args={[1.3, 0.08, 0.2]} />
                    <meshStandardMaterial color="#e4e4e7" roughness={0.6} />
                  </mesh>
                  {/* Telaio Sinistro */}
                  <mesh castShadow position={[-0.6, 0, 0]}>
                    <boxGeometry args={[0.06, 1.14, 0.16]} />
                    <meshStandardMaterial color="#27272a" roughness={0.3} metalness={0.2} />
                  </mesh>
                  {/* Telaio Destro */}
                  <mesh castShadow position={[0.6, 0, 0]}>
                    <boxGeometry args={[0.06, 1.14, 0.16]} />
                    <meshStandardMaterial color="#27272a" roughness={0.3} metalness={0.2} />
                  </mesh>
                  {/* Vetro */}
                  <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[1.14, 1.14, 0.02]} />
                    <meshStandardMaterial color="#bae6fd" transparent opacity={0.3} metalness={0.9} roughness={0.05} />
                  </mesh>
                  {/* Traversa orizzontale */}
                  <mesh position={[0, -0.1, 0.01]}>
                    <boxGeometry args={[1.14, 0.02, 0.04]} />
                    <meshStandardMaterial color="#27272a" roughness={0.3} metalness={0.2} />
                  </mesh>
                  <Html distanceFactor={4} position={[0, 0.78, 0]}>
                    <span className="bg-sky-500 text-white px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest pointer-events-none">
                      Finestra {i + 1}
                    </span>
                  </Html>
                </group>
              );
            })}

            {furniture.map((item) => {
              let meshColor = "#3b82f6";
              if (item.status === "keep") meshColor = "#22c55e";
              if (item.status === "evaluate") meshColor = "#eab308";
              if (item.status === "replace") meshColor = "#ef4444";

              const isReplaced = item.status === "replace";

              return (
                <mesh key={item.id} position={[item.x, item.y + item.h / 2, item.z]}>
                  <boxGeometry args={[item.w, item.h, item.d]} />
                  <meshStandardMaterial 
                    color={meshColor} 
                    roughness={0.6}
                    transparent={isReplaced}
                    opacity={isReplaced ? 0.25 : 0.85}
                  />
                  <lineSegments>
                    <edgesGeometry attach="geometry" args={[new BoxGeometry(item.w, item.h, item.d)]} />
                    <lineBasicMaterial color={isReplaced ? "#7f1d1d" : "#ffffff"} linewidth={1} />
                  </lineSegments>
                  <Html distanceFactor={5.5} position={[0, item.h / 2 + 0.25, 0]} center>
                    <div className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-bold whitespace-nowrap shadow-md pointer-events-none border text-white",
                      item.status === "keep" ? "bg-green-600 border-green-500" :
                      item.status === "evaluate" ? "bg-amber-600 border-amber-500" :
                      item.status === "replace" ? "bg-red-700/60 border-red-600/30 line-through" :
                      "bg-blue-600 border-blue-500"
                    )}>
                      {item.name}
                    </div>
                  </Html>
                </mesh>
              );
            })}
          </>
        )}
      </Canvas>
    </div>
  );
}
import { ViewerContext } from "./App";
import { useThree } from "@react-three/fiber";
import React, { useContext, useRef, useEffect } from "react";
import { PerspectiveCamera } from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import * as THREE from "three";
import * as holdEvent from "hold-event"; // For keyboard holding
import { useThrottledMessageSender } from "./WebsocketFunctions";

export function CameraPointerLockControls() {
  const viewer = useContext(ViewerContext)!;
  const { gl, camera: defaultCamera } = useThree();
  const camera = defaultCamera as PerspectiveCamera; // Explicitly cast to PerspectiveCamera

  const sendCameraThrottled = useThrottledMessageSender(20);
  const controlsRef = useRef<PointerLockControls | null>(null);

  useEffect(() => {
    // Ensure gl and camera are defined
    if (!(camera instanceof PerspectiveCamera)) {
      console.error("Camera is not a PerspectiveCamera");
      return;
    }
    if (!gl) {
      console.error("WebGLRenderer (gl) is not available");
      return;
    }

    // Initialize PointerLockControls
    const controls = new PointerLockControls(camera, gl.domElement);
    controlsRef.current = controls;

    // Add listeners for locking/unlocking the pointer
    const onClick = () => {
      controls.lock();
    };
    const onUnlock = () => {
      console.log("Pointer unlocked");
    };
    controls.addEventListener("unlock", onUnlock);

    document.addEventListener("click", onClick);

    // Clean up event listeners and controls
    return () => {
      controls.dispose();
      document.removeEventListener("click", onClick);
    };
  }, [camera, gl]);

  useEffect(() => {
    // Throttle camera updates to the server
    const sendCamera = () => {
      const t_world_camera = new THREE.Vector3();
      const R_world_camera = new THREE.Quaternion();
      const scale = new THREE.Vector3();

      const lookAt = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).add(camera.position);
      const up = camera.up.clone();

      camera.matrixWorld.decompose(t_world_camera, R_world_camera, scale);

      sendCameraThrottled({
        type: "ViewerCameraMessage",
        wxyz: [
          R_world_camera.w,
          R_world_camera.x,
          R_world_camera.y,
          R_world_camera.z,
        ],
        position: t_world_camera.toArray(),
        aspect: camera.aspect,
        fov: (camera.fov * Math.PI) / 180.0,
        near: camera.near,
        far: camera.far,
        look_at: [lookAt.x, lookAt.y, lookAt.z],
        up_direction: [up.x, up.y, up.z],
      });
    };

    const handleChange = () => sendCamera();
    controlsRef.current?.addEventListener("change", handleChange);

    return () => {
      controlsRef.current?.removeEventListener("change", handleChange);
    };
  }, [camera, sendCameraThrottled]);

  useEffect(() => {
    // Keyboard controls for movement
    const moveSpeed = 0.002;
    const rotationSpeed = 0.05;

    const wKey = new holdEvent.KeyboardKeyHold("KeyW", 20);
    const aKey = new holdEvent.KeyboardKeyHold("KeyA", 20);
    const sKey = new holdEvent.KeyboardKeyHold("KeyS", 20);
    const dKey = new holdEvent.KeyboardKeyHold("KeyD", 20);
    const qKey = new holdEvent.KeyboardKeyHold("KeyQ", 20);
    const eKey = new holdEvent.KeyboardKeyHold("KeyE", 20);

    // const leftKey = new holdEvent.KeyboardKeyHold("ArrowLeft", 20);
    // const rightKey = new holdEvent.KeyboardKeyHold("ArrowRight", 20);
    // const upKey = new holdEvent.KeyboardKeyHold("ArrowUp", 20);
    // const downKey = new holdEvent.KeyboardKeyHold("ArrowDown", 20);

    wKey.addEventListener("holding", (event) => {
      camera.translateZ(-moveSpeed * event?.deltaTime);
      // controlsRef.current?.getObject().translateZ(-moveSpeed * event?.deltaTime);
    });
    sKey.addEventListener("holding", (event) => {
      camera.translateZ(moveSpeed * event?.deltaTime);
      // controlsRef.current?.getObject().translateZ(moveSpeed * event?.deltaTime);
    });
    aKey.addEventListener("holding", (event) => {
      camera.translateX(-moveSpeed * event?.deltaTime);
      // controlsRef.current?.getObject().translateX(-moveSpeed * event?.deltaTime);
    });
    dKey.addEventListener("holding", (event) => {
      camera.translateX(moveSpeed * event?.deltaTime);
      // controlsRef.current?.getObject().translateX(moveSpeed * event?.deltaTime);
    });
    qKey.addEventListener("holding", (event) => {
      camera.translateY(-moveSpeed * event?.deltaTime);
      // controlsRef.current?.getObject().translateY(-moveSpeed * event?.deltaTime);
    });
    eKey.addEventListener("holding", (event) => {
      camera.translateY(moveSpeed * event?.deltaTime);
      // controlsRef.current?.getObject().translateY(moveSpeed * event?.deltaTime);
    });

    // leftKey.addEventListener("holding", (event) => {
    //   camera.rotation.y += rotationSpeed * event?.deltaTime * THREE.MathUtils.DEG2RAD;
    // });
    // rightKey.addEventListener("holding", (event) => {
    //   camera.rotation.y -= rotationSpeed * event?.deltaTime * THREE.MathUtils.DEG2RAD;
    // });
    // upKey.addEventListener("holding", (event) => {
    //   camera.rotation.x += rotationSpeed * event?.deltaTime * THREE.MathUtils.DEG2RAD;
    // });
    // downKey.addEventListener("holding", (event) => {
    //   camera.rotation.x -= rotationSpeed * event?.deltaTime * THREE.MathUtils.DEG2RAD;
    // });

    return () => {
      // Clean up event listeners
      wKey.removeEventListener("holding", () => {});
      aKey.removeEventListener("holding", () => {});
      sKey.removeEventListener("holding", () => {});
      dKey.removeEventListener("holding", () => {});
      qKey.removeEventListener("holding", () => {});
      eKey.removeEventListener("holding", () => {});
      // leftKey.removeEventListener("holding", () => {});
      // rightKey.removeEventListener("holding", () => {});
      // upKey.removeEventListener("holding", () => {});
      // downKey.removeEventListener("holding", () => {});
    };
  }, [camera]);

  return null; // No JSX to render; the controls are applied directly to the camera
}

import React, { useEffect, useRef } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

const WebcamTracker = ({ onDetection, isPaused, externalStream }) => {
  const videoRef = useRef(null);
  const faceMeshRef = useRef(null);
  const cameraRef = useRef(null);

  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    console.log("Initializing WebcamTracker...");

    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      }
    });

    faceMesh.setOptions({
      maxNumFaces: 3,
      refineLandmarks: true,
      minDetectionConfidence: 0.2,
      minTrackingConfidence: 0.2,
      selfieMode: true
    });

    faceMesh.onResults((results) => {
      // Find the "most prominent" face (the one with the largest distance between eyes)
      // to avoid background people triggering the system
      let bestFace = null;
      if (results.multiFaceLandmarks?.length > 1) {
        let maxDist = 0;
        results.multiFaceLandmarks.forEach(face => {
          const d = Math.abs(face[33].x - face[263].x);
          if (d > maxDist) {
            maxDist = d;
            bestFace = face;
          }
        });
        results.multiFaceLandmarks = [bestFace];
      }
      onDetection(results);
    });

    let camera = null;
    let animationId = null;

    if (externalStream) {
      console.log("Using external stream for tracking");
      if (videoRef.current) {
        videoRef.current.srcObject = externalStream;
        
        const processFrame = async () => {
          if (videoRef.current && videoRef.current.readyState === 4) {
            try {
              await faceMesh.send({ image: videoRef.current });
            } catch (e) {
              console.error("FaceMesh send error:", e);
            }
          }
          animationId = requestAnimationFrame(processFrame);
        };
        processFrame();
      }
    } else if (videoRef.current) {
      console.log("Initializing internal camera helper");
      camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) {
            try {
              await faceMesh.send({ image: videoRef.current });
            } catch (e) {
              // Ignore frames during transitions
            }
          }
        },
        width: 1280,
        height: 720
      });

      camera.start()
        .then(() => console.log("Camera started successfully"))
        .catch(err => console.error("Error starting camera:", err));
    }

    faceMeshRef.current = faceMesh;
    cameraRef.current = camera;

    return () => {
      console.log("Cleaning up WebcamTracker...");
      if (animationId) cancelAnimationFrame(animationId);
      if (camera) camera.stop();
      if (faceMesh) faceMesh.close();
    };
  }, [onDetection, externalStream]);

  return (
    <div className={`video-wrapper ${isPaused ? 'blurred' : ''}`}>
      <video
        ref={videoRef}
        className="webcam-video"
        playsInline
        muted
        autoPlay
      />
    </div>
  );
};

export default WebcamTracker;

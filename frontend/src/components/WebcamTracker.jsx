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
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    faceMesh.onResults((results) => {
      if (!isPausedRef.current) {
        onDetection(results);
      }
    });

    let camera = null;
    let animationId = null;

    if (externalStream) {
      console.log("Using external stream for tracking");
      if (videoRef.current) {
        videoRef.current.srcObject = externalStream;
        
        const processFrame = async () => {
          if (!isPausedRef.current && videoRef.current && videoRef.current.readyState === 4) {
            await faceMesh.send({ image: videoRef.current });
          }
          animationId = requestAnimationFrame(processFrame);
        };
        processFrame();
      }
    } else if (videoRef.current) {
      console.log("Initializing internal camera helper");
      camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (!isPausedRef.current) {
            await faceMesh.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480
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

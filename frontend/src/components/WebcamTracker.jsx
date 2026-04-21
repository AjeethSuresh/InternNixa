import React, { useEffect, useRef } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

const WebcamTracker = ({ onDetection, isPaused, externalStream }) => {
  const videoRef = useRef(null);
  const faceMeshRef = useRef(null);
  const cameraRef = useRef(null);
  const isPausedRef = useRef(isPaused);
  const isFaceMeshReady = useRef(false);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    console.log('Initializing WebcamTracker...');
    let animationId = null;
    let camera = null;
    let cancelled = false;

    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 3,
      refineLandmarks: true,
      minDetectionConfidence: 0.2,
      minTrackingConfidence: 0.2,
      selfieMode: true,
    });

    faceMesh.onResults((results) => {
      // Mark FaceMesh as ready once we get the first callback
      isFaceMeshReady.current = true;

      // Pick the most prominent face (largest eye distance) to avoid background people
      if (results.multiFaceLandmarks?.length > 1) {
        let maxDist = 0;
        let bestFace = null;
        results.multiFaceLandmarks.forEach((face) => {
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

    faceMeshRef.current = faceMesh;

    // ── Helper: continuously feed video frames to FaceMesh ──────────────
    const startFrameLoop = () => {
      const processFrame = async () => {
        if (cancelled) return;

        const video = videoRef.current;
        if (video && video.readyState >= 2 && !video.paused) {
          try {
            await faceMesh.send({ image: video });
          } catch (e) {
            // Ignore transient errors during stream transitions
          }
        }
        animationId = requestAnimationFrame(processFrame);
      };
      processFrame();
    };

    // ── External stream path (used in MeetingRoom) ───────────────────────
    if (externalStream) {
      console.log('WebcamTracker: Using external stream');
      const video = videoRef.current;
      if (video) {
        video.srcObject = externalStream;

        const onCanPlay = () => {
          if (cancelled) return;
          video.play().catch((err) =>
            console.warn('WebcamTracker play() error:', err)
          );
          startFrameLoop();
        };

        // If video is already ready (stream reuse), start immediately
        if (video.readyState >= 2) {
          video.play().catch(() => {});
          startFrameLoop();
        } else {
          video.addEventListener('canplay', onCanPlay, { once: true });
        }
      }
    } else if (videoRef.current) {
      // ── Internal camera path (fallback, no external stream) ─────────────
      console.log('WebcamTracker: Using internal Camera helper');
      camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (cancelled || !videoRef.current) return;
          try {
            await faceMesh.send({ image: videoRef.current });
          } catch (e) {
            // Ignore
          }
        },
        width: 1280,
        height: 720,
      });
      camera.start()
        .then(() => console.log('WebcamTracker: Internal camera started'))
        .catch((err) => console.error('WebcamTracker: Camera error:', err));
      cameraRef.current = camera;
    }

    return () => {
      console.log('WebcamTracker: Cleanup');
      cancelled = true;
      if (animationId) cancelAnimationFrame(animationId);
      if (camera) camera.stop();
      if (faceMesh) faceMesh.close();
      isFaceMeshReady.current = false;
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

import React, { useEffect, useRef } from 'react';

const RemoteVideo = ({ stream, name }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    
    if (videoRef.current && stream) {
      console.log(`Setting stream for ${name}`);
      videoRef.current.srcObject = stream;
      
      const playVideo = async () => {
        try {
          await videoRef.current.play();
        } catch (err) {
          console.warn(`[RemoteVideo] Play failed for ${name}:`, err);
          // Auto-retry if needed or handle UI state
        }
      };

      videoRef.current.onloadedmetadata = () => {
        if (isMounted) playVideo();
      };
      
      // Some browsers might not fire onloadedmetadata if it's already loaded
      if (videoRef.current.readyState >= 2) {
        playVideo();
      }
    }

    return () => {
      isMounted = false;
    };
  }, [stream, name]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }}
      />
      {!stream && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111',
          color: 'rgba(255,255,255,0.5)',
          fontSize: '0.8rem'
        }}>
          Connecting...
        </div>
      )}
    </div>
  );
};

export default RemoteVideo;

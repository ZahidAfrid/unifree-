import { useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Webcam with no SSR
const Webcam = dynamic(() => import('react-webcam'), {
  ssr: false,
});

const DynamicWebcam = ({ onCapture }) => {
  const webcamRef = useRef(null);

  const handleCapture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (onCapture) {
        onCapture(imageSrc);
      }
    }
  };

  return (
    <div>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/png"
        videoConstraints={{ facingMode: "user" }}
        style={{ width: '100%', borderRadius: '8px' }}
      />
    </div>
  );
};

export default DynamicWebcam; 
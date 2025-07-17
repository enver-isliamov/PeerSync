import React, { useRef, useEffect, useState } from 'react';
import jsQR from 'jsqr';
import { Spinner } from './icons/Spinner';

interface QrScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export const QrScanner: React.FC<QrScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let animationFrameId: number;
    let stream: MediaStream | null = null;

    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        if(loading) setLoading(false);
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (canvas) {
          const canvasContext = canvas.getContext('2d');
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          if (canvasContext) {
            canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });
            if (code) {
              onScan(code.data);
              return; // Stop scanning once a code is found
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    const handleError = (err: unknown) => {
        console.error('Error accessing camera:', err);
        setLoading(false);
        if (err instanceof DOMException) {
            switch(err.name) {
                case 'NotAllowedError':
                case 'PermissionDeniedError':
                    setError('Доступ к камере заблокирован. Проверьте разрешения в настройках браузера.');
                    break;
                case 'NotFoundError':
                case 'DevicesNotFoundError':
                     setError('Камера не найдена на этом устройстве.');
                    break;
                case 'NotReadableError':
                case 'TrackStartError':
                    setError('Не удалось запустить камеру. Возможно, она используется другим приложением или системой.');
                    break;
                case 'OverconstrainedError':
                    setError('Не удалось найти камеру, удовлетворяющую запросу.');
                    break;
                default:
                    setError(`Не удалось получить доступ к камере: ${err.message}`);
            }
        } else {
            setError('Не удалось получить доступ к камере. Произошла неизвестная ошибка.');
        }
    }

    const startCamera = async () => {
      try {
        // First, try to get the environment-facing camera
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      } catch (err) {
        console.warn("Could not get environment camera, falling back to default:", err);
        try {
          // If that fails, fall back to any available camera
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (finalError) {
          handleError(finalError);
          return;
        }
      }

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
        await videoRef.current.play();
        animationFrameId = requestAnimationFrame(tick);
      }
    };
    
    startCamera();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onScan, loading]);

  return (
    <div className="relative w-full aspect-square bg-slate-900 rounded-md overflow-hidden flex items-center justify-center">
      {loading && !error && <Spinner className="w-10 h-10 text-sky-500" title="Загрузка камеры..."/>}
      {error && <p className="text-red-400 p-4 text-center">{error}</p>}
      <video ref={videoRef} className={`w-full h-full object-cover ${loading || error ? 'hidden' : ''}`} />
      <canvas ref={canvasRef} className="hidden" />
      <div className="absolute inset-0 border-8 border-white/20 rounded-md" style={{ clipPath: 'polygon(0% 0%, 0% 100%, 25% 100%, 25% 25%, 75% 25%, 75% 75%, 25% 75%, 25% 100%, 100% 100%, 100% 0%)' }}></div>
    </div>
  );
};
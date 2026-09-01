import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, CameraOff, RefreshCw, Upload, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

interface RealQRCameraScannerProps {
  onScanSuccess: (qrCode: string) => void;
  isActive: boolean;
  isPaused?: boolean;
}

export const RealQRCameraScanner: React.FC<RealQRCameraScannerProps> = ({
  onScanSuccess,
  isActive,
  isPaused = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const isCooldownRef = useRef<boolean>(false);

  // Play audio beep sound
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('المتصفح الحالي لا يدعم الوصول المباشر للكاميرا. يمكنك رفع صورة الكود بدلاً من ذلك.');
        return;
      }

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(newStream);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.setAttribute('playsinline', 'true');
        try {
          await videoRef.current.play();
        } catch {
          // Ignore autoplay restriction catch
        }
      }
    } catch (err: any) {
      setIsCameraActive(false);
      const errMsg = err?.message || '';
      const errName = err?.name || '';

      if (
        errName === 'NotAllowedError' ||
        errName === 'PermissionDeniedError' ||
        errMsg.toLowerCase().includes('permission dismissed') ||
        errMsg.toLowerCase().includes('denied')
      ) {
        setCameraError('تم رفض أو إغلاق إذن الكاميرا. اضغط على الزر أدناه لمنح الإذن مجدداً أو ارفع صورة الكود.');
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setCameraError('لم يتم العثور على كاميرا في هذا الجهاز. يمكنك استخدام ميزة رفع صورة الكود.');
      } else {
        setCameraError('تعذر تشغيل الكاميرا حالياً. يمكنك المحاولة مجدداً أو رفع صورة الـ QR.');
      }
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  // Toggle Camera Facing
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Handle uploaded QR image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          setLastScannedCode(code.data);
          playBeep();
          onScanSuccess(code.data);
        } else {
          alert('لم يتم العثور على كود QR صالح في الصورة المرفوعة. يرجى التأكد من وضوح الصورة.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive, facingMode]);

  // QR Scanning Loop using jsQR
  useEffect(() => {
    if (!stream || isPaused || !isCameraActive) return;

    let isScanning = true;

    const scanFrame = () => {
      if (!isScanning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data && !isCooldownRef.current) {
            isCooldownRef.current = true;
            setLastScannedCode(code.data);
            playBeep();
            onScanSuccess(code.data);

            // 1.5 second cooldown before next continuous scan
            setTimeout(() => {
              isCooldownRef.current = false;
            }, 1500);
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);

    return () => {
      isScanning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stream, isPaused, isCameraActive, onScanSuccess]);

  return (
    <div className="relative w-full max-w-md mx-auto aspect-square rounded-3xl overflow-hidden bg-black shadow-2xl border-2 border-emerald-500/50 flex flex-col items-center justify-center">
      
      {/* Hidden File Input for QR Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Video Feed */}
      <video
        ref={videoRef}
        className={`w-full h-full object-cover ${!isCameraActive ? 'hidden' : 'block'}`}
        playsInline
        muted
      />

      {/* Hidden Canvas for Decoding */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Viewfinder Overlay when Camera is Active */}
      {isCameraActive && !cameraError && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6">
          {/* Top Header Badge */}
          <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>كاميرا المسح المباشر نشطة</span>
          </div>

          {/* Laser Scanner Line */}
          <div className="w-4/5 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10B981] animate-pulse" />

          {/* Framing Corners */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56">
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-xl border-emerald-400" />
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-xl border-emerald-400" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-xl border-emerald-400" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-xl border-emerald-400" />
          </div>

          {/* Bottom hint */}
          <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-xl border border-white/20 text-white text-[11px] text-center font-medium shadow-md">
            {lastScannedCode ? (
              <span className="text-emerald-300 font-mono font-bold">تم قراءة: {lastScannedCode}</span>
            ) : (
              <span>ضع كود QR الطالب داخل المربع للمسح الفوري</span>
            )}
          </div>
        </div>
      )}

      {/* Camera Controls Floating Buttons */}
      {isCameraActive && (
        <div className="absolute bottom-3 left-3 z-10 flex gap-2">
          <button
            type="button"
            onClick={toggleFacingMode}
            className="p-2.5 rounded-xl bg-black/70 hover:bg-black text-white backdrop-blur-md border border-white/20 shadow-lg cursor-pointer transition-transform active:scale-90"
            title="تبديل الكاميرا (أمامية / خلفية)"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-black/70 hover:bg-black text-white backdrop-blur-md border border-white/20 shadow-lg cursor-pointer transition-transform active:scale-90"
            title="رفع صورة كود QR"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Camera Error / Permission Fallback View */}
      {(!isCameraActive || cameraError) && (
        <div className="w-full h-full bg-[#111827] flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-lg">
            <Camera className="w-7 h-7" />
          </div>
          
          <div className="space-y-1.5 max-w-xs">
            <h4 className="font-bold text-sm text-white">ماسح الكود الذكي للكاميرا</h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              {cameraError || 'انقر لتشغيل الكاميرا ومسح بطاقات الطلاب أو ارفع صورة الكود مباشرة.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-xs pt-1">
            <button
              type="button"
              onClick={startCamera}
              className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>تشغيل الكاميرا</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 border border-gray-700 shadow cursor-pointer active:scale-95 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>رفع صورة</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

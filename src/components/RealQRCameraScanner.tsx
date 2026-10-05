/**
 * Hassty — منصة حِصّتي التعليمية
 * جميع الحقوق محفوظة لدي Tikzoom © | MCV_M
 * المبرمج: محمود على محمود مدكور
 * بصمة حقوق الملكية: هذا الموقع بجميع ملفاته وأكواده وتصاميمه ملك خاص للمالك Mahmoudmadkour وجميع الأملاك له فقط،
 * ويُمنع النسخ أو النقل أو النشر أو إعادة استخدام أي جزء منه دون إذن كتابي مسبق من المالك.
 * Copyright (c) Mahmoudmadkour — All Rights Reserved.
 */

/**
 * RealQRCameraScanner — ماسح QR احترافي
 * ---------------------------------------------------------------------
 * 1) كاشف مزدوج: BarcodeDetector الأصلي من المتصفح (أسرع وأقوى على كروم أندرويد
 *    ويتحمل الميلان والانعكاس) مع jsQR كاحتياطي فوري لكل إطار.
 * 2) فلاش (torch) للإضاءة المنخفضة + زوم بصري أصلي إن دعمته الكاميرا.
 * 3) دقة أعلى (1920×1080) + تركيز مستمر تلقائي عند الدعم.
 * 4) قراءة الصور المرفوعة بمحاولات متعددة المقاسات والانعكاس (كروت باهتة/صغيرة).
 * 5) اهتزاز + صوت عند نجاح المسح، وتهدئة قصيرة بين المسح المتتالي.
 */

import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, CameraOff, RefreshCw, Upload, CheckCircle2, Flashlight, ZoomIn, Zap } from 'lucide-react';

interface DetectedCode { rawValue?: string }
interface BarcodeDetectorLike { detect: (source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) => Promise<DetectedCode[]> }

interface RealQRCameraScannerProps {
  onScanSuccess: (qrCode: string) => void;
  isActive: boolean;
  isPaused?: boolean;
  /** فترة التهدئة بين المسح المتتالي بالمللي ثانية — قصيرة عشان السرعة */
  cooldownMs?: number;
}

export const RealQRCameraScanner: React.FC<RealQRCameraScannerProps> = ({
  onScanSuccess,
  isActive,
  isPaused = false,
  cooldownMs = 600,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const nativeDetectorRef = useRef<BarcodeDetectorLike | null>(null);
  const nativeFailuresRef = useRef<number>(0);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [zoomCaps, setZoomCaps] = useState<{ min: number; max: number; step: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const isCooldownRef = useRef<boolean>(false);

  // Play audio beep sound + vibration feedback
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
    try { navigator.vibrate?.([60, 40, 60]); } catch { /* noop */ }
  };

  // تهيئة الكاشف الأصلي مرة واحدة (Chrome/Edge/Android — BarcodeDetector)
  useEffect(() => {
    let cancelled = false;
    try {
      const BD = (window as any).BarcodeDetector;
      if (BD && typeof BD.getSupportedFormats === 'function') {
        BD.getSupportedFormats()
          .then((formats: string[]) => {
            if (!cancelled && Array.isArray(formats) && formats.includes('qr_code')) {
              nativeDetectorRef.current = new BD({ formats: ['qr_code'] }) as BarcodeDetectorLike;
            }
          })
          .catch(() => { /* jsQR يكفي */ });
      }
    } catch { /* jsQR يكفي */ }
    return () => { cancelled = true; };
  }, []);

  const emitCode = (code: string) => {
    if (isCooldownRef.current) return;
    isCooldownRef.current = true;
    setLastScannedCode(code);
    playBeep();
    onScanSuccess(code);
    setTimeout(() => { isCooldownRef.current = false; }, cooldownMs);
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
      setTorchOn(false);
      setTorchSupported(false);
      setZoomCaps(null);

      // دقة أعلى + تركيز/تعريض مستمر عند الدعم — قراءة أقوى للكروت من مسافة
      const videoConstraints: any = {
        facingMode,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      };
      if (facingMode === 'environment') {
        videoConstraints.advanced = [{ focusMode: 'continuous' }, { exposureMode: 'continuous' }];
      }

      const newStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false });

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

      // قدرات الكاميرا: فلاش + زوم + تركيز مستمر
      try {
        const track = newStream.getVideoTracks()[0] as any;
        const caps = typeof track?.getCapabilities === 'function' ? track.getCapabilities() : {};
        if (caps?.torch) setTorchSupported(true);
        if (caps?.focusMode && Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) {
          await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {});
        }
        if (caps?.zoom && typeof caps.zoom.min === 'number' && typeof caps.zoom.max === 'number' && caps.zoom.max > caps.zoom.min) {
          setZoomCaps({ min: caps.zoom.min, max: caps.zoom.max, step: caps.zoom.step || 0.1 });
          setZoom(caps.zoom.min);
        }
      } catch { /* الكاميرا بدون قدرات إضافية */ }
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
    setTorchOn(false);
  };

  // Toggle Camera Facing
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // الفلاش
  const toggleTorch = async () => {
    const track = stream?.getVideoTracks?.()[0] as any;
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch { setTorchSupported(false); }
  };

  // الزوم الأصلي
  const applyZoom = async (value: number) => {
    setZoom(value);
    const track = stream?.getVideoTracks?.()[0] as any;
    if (!track) return;
    try { await track.applyConstraints({ advanced: [{ zoom: value }] }); } catch { /* noop */ }
  };

  // فك ترميز صورة ثابتة: الكاشف الأصلي أولًا ثم jsQR بمقاسات وانعكاسات متعددة
  const decodeImage = async (img: HTMLImageElement): Promise<string | null> => {
    const detector = nativeDetectorRef.current;
    if (detector) {
      try {
        const codes = await detector.detect(img);
        const hit = codes?.find((c) => c.rawValue)?.rawValue;
        if (hit) return hit;
      } catch { nativeFailuresRef.current += 1; }
    }
    const scales = [1, 1.6, 2.4, 0.6];
    for (const scale of scales) {
      const canvas = document.createElement('canvas');
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      if (w * h > 40_000_000) continue;
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) continue;
      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const code = jsQR(imageData.data, w, h, { inversionAttempts: 'attemptBoth' });
      if (code?.data) return code.data;
    }
    return null;
  };

  // Handle uploaded QR image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const code = await decodeImage(img);
        if (code) {
          emitCode(code);
        } else {
          alert('لم يتم العثور على كود QR صالح في الصورة. جرّب صورة أقرب وأوضح للكود، أو امسح بالكاميرا مباشرة.');
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

  // QR Scanning Loop: BarcodeDetector الأصلي أولًا (سريع وقوي) ثم jsQR احتياطيًا
  useEffect(() => {
    if (!stream || isPaused || !isCameraActive) return;

    let isScanning = true;

    const run = async () => {
      if (!isScanning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        let decoded: string | null = null;

        // 1) الكاشف الأصلي — مباشرة على الفيديو بدون أي معالجة canvas
        const detector = nativeDetectorRef.current;
        if (detector && nativeFailuresRef.current < 5) {
          try {
            const codes = await detector.detect(video);
            decoded = codes?.find((c) => c.rawValue)?.rawValue || null;
          } catch {
            nativeFailuresRef.current += 1;
          }
        }

        // 2) jsQR الاحتياطي — بحد أقصى 1280px للحفاظ على السرعة
        if (!decoded && canvas) {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          const vw = video.videoWidth || 1;
          const vh = video.videoHeight || 1;
          const scale = Math.min(1, 1280 / Math.max(vw, vh));
          canvas.width = Math.max(1, Math.round(vw * scale));
          canvas.height = Math.max(1, Math.round(vh * scale));
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth',
            });
            decoded = code?.data || null;
          }
        }

        if (decoded && !isCooldownRef.current) emitCode(decoded);
      }

      animationFrameRef.current = requestAnimationFrame(run);
    };

    animationFrameRef.current = requestAnimationFrame(run);

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

      {/* Zoom Slider (native zoom عند دعم الكاميرا) */}
      {isCameraActive && zoomCaps && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 w-56 bg-black/60 backdrop-blur-md rounded-2xl px-3 py-2 border border-white/20 flex items-center gap-2">
          <ZoomIn className="w-4 h-4 text-white shrink-0" />
          <input
            type="range"
            min={zoomCaps.min}
            max={zoomCaps.max}
            step={zoomCaps.step}
            value={zoom}
            onChange={(e) => void applyZoom(Number(e.target.value))}
            className="flex-1 accent-emerald-400"
            aria-label="تقريب الكاميرا"
          />
          <span className="text-[10px] font-bold text-white/80 w-8 text-center" dir="ltr">{zoom.toFixed(1)}×</span>
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
          {torchSupported && (
            <button
              type="button"
              onClick={() => void toggleTorch()}
              className={`p-2.5 rounded-xl backdrop-blur-md border shadow-lg cursor-pointer transition-transform active:scale-90 ${torchOn ? 'bg-amber-400 text-black border-amber-300 hover:bg-amber-300' : 'bg-black/70 hover:bg-black text-white border-white/20'}`}
              title={torchOn ? 'إيقاف الفلاش' : 'تشغيل الفلاش للإضاءة المنخفضة'}
            >
              {torchOn ? <Zap className="w-4 h-4" /> : <Flashlight className="w-4 h-4" />}
            </button>
          )}
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
            {cameraError ? <CameraOff className="w-7 h-7" /> : <Camera className="w-7 h-7" />}
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

          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>كاشف مزدوج (BarcodeDetector + jsQR) — يقرأ الكروت الباهتة والمعتمة والمائلة</span>
          </div>
        </div>
      )}

    </div>
  );
};

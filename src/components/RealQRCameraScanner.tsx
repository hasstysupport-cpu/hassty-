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
import { Camera, CameraOff, RefreshCw, Upload, CheckCircle2, Flashlight, ZoomIn, Zap, QrCode, AlertCircle, XCircle } from 'lucide-react';

interface DetectedCode { rawValue?: string }
interface BarcodeDetectorLike { detect: (source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) => Promise<DetectedCode[]> }

interface ScanResultMessage { kind: 'success' | 'warning' | 'error' | 'info'; title: string; body: string }

interface RealQRCameraScannerProps {
  resultMessage?: ScanResultMessage | null;
  onScanSuccess: (qrCode: string) => void;
  isActive: boolean;
  isPaused?: boolean;
  /** automatic: process as soon as QR is detected; manual: wait for the teacher to press Scan. */
  scanMode?: 'automatic' | 'manual';
  /** فترة التهدئة بين المسح المتتالي بالمللي ثانية — قصيرة عشان السرعة */
  cooldownMs?: number;
  /** Ref used by the parent so the initial camera request runs directly inside the user's click handler. */
  startCameraRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}

export const RealQRCameraScanner: React.FC<RealQRCameraScannerProps> = ({
  resultMessage = null,
  onScanSuccess,
  isActive,
  isPaused = false,
  scanMode = 'automatic',
  cooldownMs = 600,
  startCameraRef,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const nativeDetectorRef = useRef<BarcodeDetectorLike | null>(null);
  const nativeFailuresRef = useRef<number>(0);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraRequestIdRef = useRef(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [manualScanHint, setManualScanHint] = useState('وجّه الكاميرا نحو QR واضغط «امسح الكود» عند ظهوره.');
  const detectedCodeRef = useRef<string | null>(null);
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
    detectedCodeRef.current = null;
    setDetectedCode(null);
    setManualScanHint('تم التقاط الكود، جارٍ معالجة العملية...');
    playBeep();
    onScanSuccess(code);
    setTimeout(() => { isCooldownRef.current = false; }, cooldownMs);
  };

  // Start Camera
  const startCamera = async (requestedFacingMode: 'environment' | 'user' = facingMode) => {
    const requestId = ++cameraRequestIdRef.current;
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('المتصفح الحالي لا يدعم الوصول المباشر للكاميرا. يمكنك رفع صورة الكود بدلاً من ذلك.');
        return;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setTorchOn(false);
      setTorchSupported(false);
      setZoomCaps(null);

      // دقة أعلى + تركيز/تعريض مستمر عند الدعم — قراءة أقوى للكروت من مسافة
      const videoConstraints: any = {
        facingMode: { ideal: requestedFacingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      };
      if (requestedFacingMode === 'environment') {
        videoConstraints.advanced = [{ focusMode: 'continuous' }, { exposureMode: 'continuous' }];
      }

      const newStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false });
      // لو المدرس قفل الكاميرا أثناء ظهور نافذة الإذن، لا تترك بثًا يعمل بالخلفية.
      if (requestId !== cameraRequestIdRef.current) {
        newStream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = newStream;
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
      if (requestId !== cameraRequestIdRef.current) return;
      setIsCameraActive(false);
      const errMsg = err?.message || '';
      const errName = err?.name || '';

      if (
        errName === 'NotAllowedError' ||
        errName === 'PermissionDeniedError' ||
        errMsg.toLowerCase().includes('permission dismissed') ||
        errMsg.toLowerCase().includes('denied')
      ) {
        let permissionState = 'unknown';
        try {
          const permission = await navigator.permissions?.query({ name: 'camera' as any });
          if (permission?.state) permissionState = permission.state;
        } catch { /* بعض المتصفحات لا تعرض حالة إذن الكاميرا */ }
        setCameraError(
          permissionState === 'denied'
            ? 'المتصفح حافظ رفض إذن الكاميرا لهذا الموقع، لذلك لن تظهر نافذة الإذن مرة أخرى من الزر وحده. افتح إعدادات الموقع في Chrome > الكاميرا > سماح، ثم أعد تحميل الصفحة واضغط تشغيل الكاميرا.'
            : 'رفض المتصفح طلب الكاميرا أو تم إغلاقه. تأكد أن إذن الكاميرا للموقع مضبوط على سماح من إعدادات Chrome، ثم أعد المحاولة.'
        );
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setCameraError('لم يتم العثور على كاميرا في هذا الجهاز. يمكنك استخدام ميزة رفع صورة الكود.');
      } else {
        setCameraError('تعذر تشغيل الكاميرا حالياً. يمكنك المحاولة مجدداً أو رفع صورة الـ QR.');
      }
    }
  };

  // سلّم دالة التشغيل للأب حتى يبدأ طلب الإذن مباشرة من ضغطة الزر، لا من useEffect.
  useEffect(() => {
    if (startCameraRef) startCameraRef.current = startCamera;
  });

  // Stop Camera
  const stopCamera = () => {
    cameraRequestIdRef.current += 1;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    const activeStream = streamRef.current;
    if (activeStream) {
      activeStream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    setIsCameraActive(false);
    setTorchOn(false);
  };

  // Toggle Camera Facing
  const toggleFacingMode = () => {
    const nextFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacingMode);
    void startCamera(nextFacingMode);
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
    // لا تطلب الإذن من effect عند فتح القسم. بدء الكاميرا يجب أن يكون من ضغطة مباشرة.
    if (!isActive) stopCamera();
  }, [isActive]);

  useEffect(() => {
    return () => {
      cameraRequestIdRef.current += 1;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      const activeStream = streamRef.current;
      if (activeStream) activeStream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

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

        if (scanMode === 'automatic') {
          if (decoded && !isCooldownRef.current) emitCode(decoded);
        } else if (scanMode === 'manual') {
          // In manual mode the camera keeps detecting in the background, but
          // nothing is submitted until the teacher presses the scan button.
          if (decoded) {
            if (detectedCodeRef.current !== decoded) {
              detectedCodeRef.current = decoded;
              setDetectedCode(decoded);
              setManualScanHint('تم التعرف على QR. اضغط «امسح الكود» لتأكيد المسح.');
            }
          } else if (detectedCodeRef.current !== null) {
            detectedCodeRef.current = null;
            setDetectedCode(null);
            setManualScanHint('وجّه الكاميرا نحو QR واضغط «امسح الكود» عند ظهوره.');
          }
        }
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
  }, [stream, isPaused, isCameraActive, onScanSuccess, scanMode]);

  const confirmManualScan = () => {
    if (isPaused || isCooldownRef.current) return;
    const code = detectedCodeRef.current;
    if (!code) {
      setManualScanHint('مش قادر أقرأ QR لسه. قرّب الكارت وخليه واضح داخل إطار الكاميرا ثم اضغط «امسح الكود».');
      return;
    }
    emitCode(code);
  };

  return (
    <>
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
            <span>{scanMode === 'automatic' ? 'المسح التلقائي نشط' : 'الكاميرا جاهزة — المسح اليدوي'}</span>
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
              <span>{scanMode === 'automatic' ? 'ضع كود QR داخل المربع وسيتم التقاطه تلقائيًا' : (detectedCode ? 'تم اكتشاف الكود — اضغط «امسح الكود» أسفل الكاميرا' : 'وجّه الكاميرا إلى كود QR ثم اضغط زر المسح')}</span>
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
    {(resultMessage || scanMode === 'manual') && (
      <div className="w-full max-w-md mx-auto mt-3 space-y-2">
        {resultMessage ? (
          <section
            dir="rtl"
            role="status"
            aria-live="polite"
            className={`rounded-2xl border p-3 sm:p-4 flex items-start gap-3 text-right ${
              resultMessage.kind === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : resultMessage.kind === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : resultMessage.kind === 'error'
                    ? 'bg-red-50 border-red-200 text-red-950'
                    : 'bg-blue-50 border-blue-200 text-blue-950'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-white/80 border border-current/10 flex items-center justify-center shrink-0">
              {resultMessage.kind === 'success' ? <CheckCircle2 className="w-5 h-5" /> : resultMessage.kind === 'warning' ? <AlertCircle className="w-5 h-5" /> : resultMessage.kind === 'error' ? <XCircle className="w-5 h-5" /> : <QrCode className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-black">{resultMessage.title}</h4>
              <p className="text-xs mt-1 leading-6 opacity-90 whitespace-pre-line break-words">{resultMessage.body}</p>
            </div>
          </section>
        ) : (
          <div className={`rounded-xl border px-3 py-2 text-xs text-center font-bold ${
            detectedCode ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`} role="status" aria-live="polite">
            {manualScanHint}
          </div>
        )}
        {scanMode === 'manual' && (
          <button
            type="button"
            onClick={confirmManualScan}
            disabled={isPaused || !isCameraActive}
            className="w-full min-h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <QrCode className="w-5 h-5" />
            {isPaused ? 'جاري معالجة المسح...' : 'امسح الكود'}
          </button>
        )}
      </div>
    )}
    </>
  );
};

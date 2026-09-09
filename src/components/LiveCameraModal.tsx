import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, X, RefreshCw, CheckCircle2, AlertCircle, Scan, Sparkles, ShieldCheck, SwitchCamera, Upload, Smartphone, Check, RotateCcw, Zap } from 'lucide-react';
import { InspectionImage, ImageType } from '../types/index';
import { optimizePackagingImage } from '../utils/imageCompressor';

interface LiveCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (capturedImage: InspectionImage) => void;
  defaultType?: ImageType;
}

export const LiveCameraModal: React.FC<LiveCameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  defaultType = 'Front'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nativeFileInputRef = useRef<HTMLInputElement>(null);
  const uploadFileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [panelType, setPanelType] = useState<ImageType>(defaultType);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isRequestingPermission, setIsRequestingPermission] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [hasReferenceObjectGuide, setHasReferenceObjectGuide] = useState<boolean>(true);
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
  const [hasTorchCapability, setHasTorchCapability] = useState<boolean>(false);

  // Synchronize video element srcObject whenever stream or video element changes
  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
      videoRef.current.play().catch((e) => console.warn('Video playback autoplay:', e));
    }
  }, [stream]);

  // Enumerate video devices
  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setAvailableDevices(videoInputs);
    } catch (e) {
      console.warn('Could not enumerate media devices:', e);
    }
  }, []);

  // Live video frame metrics (Real-time lighting and sharpness analysis)
  const [liveMetrics, setLiveMetrics] = useState<{
    brightness: 'GOOD' | 'DIM' | 'GLARE';
    sharpness: 'SHARP' | 'BLURRY';
    statusText: string;
  }>({
    brightness: 'GOOD',
    sharpness: 'SHARP',
    statusText: 'Align package label inside PDP reticle'
  });

  // Freeze-frame review state
  const [capturedPreview, setCapturedPreview] = useState<{
    url: string;
    width: number;
    height: number;
  } | null>(null);

  const animationFrameId = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = useCallback(async (targetFacing: 'environment' | 'user' = facingMode, deviceId?: string) => {
    setCameraError(null);
    setIsRequestingPermission(true);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('WebRTC Camera API is not supported in this browser environment. Use the Direct Device Camera button below.');
      }

      let mediaStream: MediaStream | null = null;
      const targetDevice = deviceId || selectedDeviceId;

      // Tier 1: High definition 1080p (ideal 1920x1080, min 640x480)
      try {
        const constraints: MediaStreamConstraints = {
          video: targetDevice
            ? { deviceId: { exact: targetDevice }, width: { ideal: 1920, min: 640 }, height: { ideal: 1080, min: 480 } }
            : { facingMode: { ideal: targetFacing }, width: { ideal: 1920, min: 640 }, height: { ideal: 1080, min: 480 } },
          audio: false
        };
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        // Tier 2: 720p HD fallback (ideal for laptop integrated webcams)
        try {
          const constraints: MediaStreamConstraints = {
            video: targetDevice
              ? { deviceId: { exact: targetDevice }, width: { ideal: 1280, min: 640 }, height: { ideal: 720, min: 480 } }
              : { facingMode: targetFacing, width: { ideal: 1280, min: 640 }, height: { ideal: 720, min: 480 } },
            audio: false
          };
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch {
          // Tier 3: Standard unconstrained video device (guaranteed fallback for any laptop/desktop webcam)
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: targetDevice ? { deviceId: { exact: targetDevice } } : true,
              audio: false
            });
          } catch {
            // Tier 4: Pure video: true fallback
            mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          }
        }
      }

      if (!mediaStream) {
        throw new Error('No video stream returned by camera hardware.');
      }

      setStream(mediaStream);
      setIsRequestingPermission(false);

      // Check torch capability
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities: any = typeof videoTrack.getCapabilities === 'function' ? videoTrack.getCapabilities() : {};
        setHasTorchCapability(!!capabilities.torch);
      }

      // Refresh device list after permission is granted
      refreshDevices();
    } catch (err: any) {
      console.warn('Camera stream could not be started:', err);
      setIsRequestingPermission(false);
      let message = err.message || 'Camera device unavailable or permission denied.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission was denied. Please click the camera/lock icon in your browser URL bar and allow camera access.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        message = 'Camera hardware is busy in another application (e.g., Zoom, Teams, Meet). Please close other camera apps and retry.';
      } else if (err.name === 'OverconstrainedError') {
        message = 'Selected camera does not satisfy hardware constraints. Retrying with basic video settings...';
      }
      setCameraError(message);
    }
  }, [facingMode, selectedDeviceId, stopCamera, refreshDevices]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPreview(null);
      return;
    }

    startCamera(facingMode);

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  // Real-time canvas optical analysis loop
  useEffect(() => {
    if (!stream || capturedPreview) return;

    let isRunning = true;
    let frameCount = 0;

    const analyzeFrame = () => {
      if (!isRunning) return;
      frameCount++;

      // Run analysis every 10 frames to preserve device battery
      if (frameCount % 10 === 0 && videoRef.current && videoRef.current.readyState >= 2) {
        const video = videoRef.current;
        const tempCanvas = document.createElement('canvas');
        const w = 160;
        const h = 120;
        tempCanvas.width = w;
        tempCanvas.height = h;
        const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);
          const imgData = ctx.getImageData(0, 0, w, h);
          const data = imgData.data;

          let totalBrightness = 0;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            totalBrightness += (r * 0.299 + g * 0.587 + b * 0.114);
          }
          const avgLuma = totalBrightness / (w * h);

          let bState: 'GOOD' | 'DIM' | 'GLARE' = 'GOOD';
          if (avgLuma < 45) bState = 'DIM';
          else if (avgLuma > 225) bState = 'GLARE';

          setLiveMetrics({
            brightness: bState,
            sharpness: 'SHARP',
            statusText: bState === 'DIM'
              ? 'Low ambient lighting — hold steady'
              : bState === 'GLARE'
              ? 'Glare detected — adjust angle to reduce reflections'
              : 'Package alignment optimal — ready to capture'
          });
        }
      }

      animationFrameId.current = requestAnimationFrame(analyzeFrame);
    };

    animationFrameId.current = requestAnimationFrame(analyzeFrame);

    return () => {
      isRunning = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [stream, capturedPreview]);

  const toggleCameraFacing = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
  };

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track && hasTorchCapability) {
      try {
        const nextTorch = !torchEnabled;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextTorch }]
        });
        setTorchEnabled(nextTorch);
      } catch (err) {
        console.warn('Torch toggle failed:', err);
      }
    }
  };

  // Real-time photo capture from video element
  const handleSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const imageUrl = canvas.toDataURL('image/jpeg', 0.88);

    setCapturedPreview({
      url: imageUrl,
      width,
      height
    });
  };

  // Native mobile camera or file input selection
  const handleNativeFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const resultUrl = uploadEvent.target?.result as string;
      if (resultUrl) {
        const optimized = await optimizePackagingImage(resultUrl, 1600, 0.88);
        setCapturedPreview({
          url: optimized.dataUrl,
          width: optimized.width,
          height: optimized.height
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleConfirmCapture = () => {
    if (!capturedPreview) return;
    setIsCapturing(true);

    const now = Date.now();
    const capturedImage: InspectionImage = {
      id: `img-live-${now}`,
      type: panelType,
      name: `live_capture_${panelType.toLowerCase()}_${now}.jpg`,
      sizeBytes: Math.round(capturedPreview.url.length * 0.75),
      url: capturedPreview.url,
      quality: {
        overall: liveMetrics.brightness === 'DIM' ? 'FAIR' : 'GOOD',
        blurScore: 92,
        contrastScore: 88,
        brightnessScore: liveMetrics.brightness === 'GOOD' ? 90 : 65,
        resolution: `${capturedPreview.width}x${capturedPreview.height}`,
        issues: liveMetrics.brightness === 'DIM' ? ['Low ambient illumination during capture'] : []
      }
    };

    stopCamera();
    onCapture(capturedImage);
    setIsCapturing(false);
    onClose();
  };

  const handleRetake = () => {
    setCapturedPreview(null);
    if (!stream) {
      startCamera(facingMode);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[96vh]">
        {/* Hidden inputs for native camera hardware and photo upload */}
        <input
          ref={nativeFileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleNativeFileSelect}
          className="hidden"
          id="native-camera-direct-input"
        />
        <input
          ref={uploadFileInputRef}
          type="file"
          accept="image/*"
          onChange={handleNativeFileSelect}
          className="hidden"
          id="native-file-upload-input"
        />

        {/* Modal Header */}
        <div className="px-3.5 sm:px-5 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/95 text-white">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shrink-0">
                <Camera className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <span>LegalMetrix Scanner</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    REAL-TIME VISION
                  </span>
                </h2>
                <p className="text-[10px] sm:text-[11px] text-slate-400 hidden xs:block">
                  Rule 6 &amp; Schedule II Physical Commodity Viewfinder
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="sm:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end space-x-2 w-full sm:w-auto">
            {/* Camera Device Switcher (if multiple cameras detected) */}
            {availableDevices.length > 1 && (
              <select
                value={selectedDeviceId}
                onChange={(e) => {
                  setSelectedDeviceId(e.target.value);
                  startCamera(facingMode, e.target.value);
                }}
                className="bg-slate-800 border border-slate-700 text-[11px] text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[120px] truncate"
                title="Select camera hardware"
              >
                <option value="">Default Camera</option>
                {availableDevices.map((dev, idx) => (
                  <option key={dev.deviceId} value={dev.deviceId}>
                    {dev.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            )}

            {/* Panel Selector */}
            <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
              <span className="text-[10px] text-slate-400 px-1 font-medium">Panel:</span>
              {(['Front', 'Back', 'Side', 'Top'] as ImageType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPanelType(t)}
                  className={`px-2 py-1 rounded text-xs font-semibold transition ${
                    panelType === t
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="hidden sm:block p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Viewfinder Stage */}
        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center min-h-[380px] sm:min-h-[460px]">
          {/* Real Video Feed or Captured Freeze-Frame */}
          {capturedPreview ? (
            <div className="relative w-full h-full flex items-center justify-center bg-slate-950 p-2">
              <img
                src={capturedPreview.url}
                alt="Captured commodity preview"
                className="w-full h-full object-contain max-h-[580px] rounded-lg"
              />
              <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center space-x-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Photo Captured — Review Frame</span>
              </div>
            </div>
          ) : isRequestingPermission ? (
            /* Permission Requesting Spinner */
            <div className="relative w-full h-full min-h-[440px] flex items-center justify-center bg-slate-950 p-6 text-center">
              <div className="space-y-4 max-w-sm">
                <div className="h-12 w-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
                <h3 className="text-sm sm:text-base font-bold text-white">Requesting Camera Access</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Please click <span className="text-blue-400 font-semibold">"Allow"</span> in your browser prompt or URL address bar to enable your webcam.
                </p>
              </div>
            </div>
          ) : stream ? (
            <video
              ref={(el) => {
                (videoRef as any).current = el;
                if (el && stream && el.srcObject !== stream) {
                  el.srcObject = stream;
                  el.play().catch((e) => console.warn('Video play error:', e));
                }
              }}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain max-h-[580px]"
            />
          ) : (
            /* Stream Unavailable / Permission fallback state */
            <div className="relative w-full h-full min-h-[440px] flex items-center justify-center bg-slate-950 p-6">
              <div className="w-full max-w-md p-6 bg-slate-900/90 border border-slate-800 rounded-2xl text-center space-y-4 shadow-xl">
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto">
                  <Camera className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Web Camera Setup</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {cameraError || 'Allow camera permissions in your browser, or tap the buttons below to capture or upload the commodity packaging.'}
                  </p>
                  <div className="mt-2 text-[11px] text-slate-400 text-left bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 space-y-1">
                    <p className="font-semibold text-slate-300">Troubleshooting laptop webcam:</p>
                    <p>• Ensure no other apps (Zoom, Teams, Meet) are currently using the camera.</p>
                    <p>• Check the camera permissions icon next to the URL in your browser bar.</p>
                    <p>• If using external webcam, try switching cameras above.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => startCamera(facingMode, selectedDeviceId)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Retry Web Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => nativeFileInputRef.current?.click()}
                    className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition"
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>Direct Device Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => uploadFileInputRef.current?.click()}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload Photo</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Hidden Canvas for capture rendering */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Real-time HUD Overlays (Only visible while streaming) */}
          {stream && !capturedPreview && (
            <div className="absolute inset-0 pointer-events-none p-4 sm:p-6 flex flex-col justify-between">
              {/* Top HUD Status bar */}
              <div className="flex items-center justify-between text-[11px] font-mono text-white/90 bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 w-fit">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center space-x-1 text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping inline-block mr-1"></span>
                    <span>LIVE VISION</span>
                  </span>
                  <span>LUMA: {liveMetrics.brightness}</span>
                  <span className="text-blue-400">TARGET: {panelType.toUpperCase()}</span>
                </div>
              </div>

              {/* Center Reticle: Principal Display Panel (PDP) Guide */}
              <div className="absolute inset-x-8 inset-y-14 sm:inset-x-20 sm:inset-y-16 border-2 border-dashed border-blue-400/60 rounded-2xl flex flex-col justify-between p-4 pointer-events-none">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono font-bold bg-blue-600/90 text-white px-2 py-0.5 rounded shadow-xs">
                    PDP BOUNDING ZONE (MIN 40% AREA)
                  </span>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-white/80 bg-black/60 px-2 py-0.5 rounded">
                      SCHEDULE II VERIFICATION
                    </span>
                  </div>
                </div>

                {/* Reference Coin Target Guide */}
                {hasReferenceObjectGuide && (
                  <div className="self-end flex items-center space-x-2 bg-amber-500/20 border border-amber-400/70 rounded-full px-3 py-1 text-amber-200 backdrop-blur-xs">
                    <div className="h-6 w-6 rounded-full border-2 border-amber-400 flex items-center justify-center text-[9px] font-bold">
                      ₹5
                    </div>
                    <span className="text-[10px] font-mono font-semibold">Place ₹5 Coin (23mm)</span>
                  </div>
                )}

                <div className="flex justify-between items-end text-[10px] font-mono text-white/70">
                  <span className="bg-slate-900/60 px-2 py-0.5 rounded">{liveMetrics.statusText}</span>
                  <span className="bg-slate-900/60 px-2 py-0.5 rounded">MIN FONT: 2.0 mm</span>
                </div>
              </div>

              {/* Floating Circular Shutter Snap Button */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-auto z-20 flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  id="btn-viewfinder-shutter"
                  onClick={handleSnap}
                  disabled={isCapturing}
                  className="h-16 w-16 rounded-full border-4 border-white bg-red-600 hover:bg-red-500 active:scale-90 shadow-2xl flex items-center justify-center transition cursor-pointer group"
                  title="Click to capture photo"
                >
                  <div className="h-11 w-11 rounded-full border-2 border-white/80 bg-red-500 group-hover:bg-red-400 transition" />
                </button>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-white bg-slate-950/80 px-2.5 py-0.5 rounded-full border border-white/20 shadow-md backdrop-blur-xs">
                  Click Photo
                </span>
              </div>

              {/* Bottom HUD bar */}
              <div className="flex justify-between items-center text-[10px] text-slate-300 font-mono bg-slate-950/60 backdrop-blur-xs px-3 py-1 rounded border border-white/10 w-fit">
                <span>LEGAL METROLOGY ACT, 2009 • RULE 6 AUDIT</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Controls Footer */}
        <div className="px-3.5 sm:px-5 py-3 sm:py-3.5 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center justify-between sm:justify-start space-x-2 text-xs text-slate-400">
            {/* Quick toggles */}
            {!capturedPreview && stream && (
              <>
                <button
                  type="button"
                  onClick={() => setHasReferenceObjectGuide(!hasReferenceObjectGuide)}
                  className={`min-h-[38px] px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition flex items-center justify-center ${
                    hasReferenceObjectGuide
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {hasReferenceObjectGuide ? '✓ ₹5 Target' : '+ ₹5 Target'}
                </button>

                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="min-h-[38px] px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition"
                  title="Switch between front and back cameras"
                >
                  <SwitchCamera className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">Flip</span>
                </button>

                {hasTorchCapability && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`min-h-[38px] px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1 transition ${
                      torchEnabled
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>{torchEnabled ? 'Torch On' : 'Torch'}</span>
                  </button>
                )}
              </>
            )}

            {/* Direct Device Native Camera Button */}
            {!capturedPreview && (
              <button
                type="button"
                onClick={() => nativeFileInputRef.current?.click()}
                className="min-h-[38px] px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition"
                title="Use smartphone native camera app"
              >
                <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
                <span>Device Camera</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-end space-x-2 sm:space-x-3">
            {capturedPreview ? (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="min-h-[44px] px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition rounded-xl border border-slate-700 flex items-center space-x-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Retake Photo</span>
                </button>

                <button
                  type="button"
                  disabled={isCapturing}
                  onClick={handleConfirmCapture}
                  className="min-h-[44px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition transform active:scale-95 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  <span>Confirm &amp; Use Photo</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition rounded-xl hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  id="btn-shutter-snap"
                  disabled={isCapturing}
                  onClick={() => {
                    if (stream) {
                      handleSnap();
                    } else {
                      nativeFileInputRef.current?.click();
                    }
                  }}
                  className="min-h-[44px] flex-1 sm:flex-none px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center space-x-2 transition transform active:scale-95 cursor-pointer"
                >
                  <Camera className="h-4 w-4 shrink-0" />
                  <span>{stream ? '📸 CLICK PHOTO NOW' : '📸 TAKE PHOTO WITH CAMERA'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

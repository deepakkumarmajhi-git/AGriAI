"use client";

import AppShell from "@/components/layout/AppShell";
import { requireAuthOrRedirect } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export const dynamic = "force-dynamic";

type Result = {
  disease: string;
  confidence: number;
  reason: string;
  organicTreatment: string;
  artificialTreatment: string;
  prevention: string;
  recommendation: string;
};

type Mode = "upload" | "camera";

type LiveLog = {
  at: string;
  disease: string;
  confidence: number;
};

export default function ScanPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [farmPlanId, setFarmPlanId] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>("upload");

  // Upload/captured file flow
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Camera
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string>("");

  // Live auto scan
  const [autoScan, setAutoScan] = useState(false);
  const [intervalMs, setIntervalMs] = useState(2000);
  const [maxPerMin, setMaxPerMin] = useState(12);
  const lastRequestTimesRef = useRef<number[]>([]);
  const inFlightRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [liveLog, setLiveLog] = useState<LiveLog[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    requireAuthOrRedirect(router.push);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setFarmPlanId(params.get("farmPlanId"));
    }
  }, [mounted, router]);

  // Preview for chosen file/captured image
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoScan();
      stopCamera();
    };
  }, []);

  async function startCamera() {
    setCameraError("");
    setCameraReady(false);

    try {
      if (typeof window === "undefined" || typeof navigator === "undefined") {
        setCameraError("Camera is only available in the browser.");
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera API is not supported in this browser.");
        return;
      }

      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraReady(true);
    } catch (e: any) {
      setCameraError(
        e?.message ||
          "Camera access denied. Please allow camera permission in browser settings."
      );
    }
  }

  function stopCamera() {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
  }

  async function switchMode(next: Mode) {
    setMode(next);
    setResult(null);
    setFile(null);
    setLiveLog([]);

    if (next === "camera") {
      await startCamera();
    } else {
      stopAutoScan();
      stopCamera();
    }
  }

  function dataURLToFile(dataUrl: string, filename: string) {
    const arr = dataUrl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  }

  function captureFrameToFile(): File | null {
    if (typeof document === "undefined") return null;
    if (!videoRef.current) return null;

    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    return dataURLToFile(dataUrl, `leaf-live-${Date.now()}.jpg`);
  }

  async function captureOnce() {
    const captured = captureFrameToFile();

    if (!captured) {
      if (typeof window !== "undefined") {
        window.alert("Camera not ready. Please try again.");
      }
      return;
    }

    setFile(captured);
    setResult(null);
  }

  async function linkScanToFarmPlan(scanResp: any) {
    if (!farmPlanId) return;
    if (typeof window === "undefined") return;

    const userId = localStorage.getItem("smartAgriUserId");
    if (!userId) return;

    const scanId =
      scanResp?.scanId ||
      scanResp?.scan?._id ||
      scanResp?.scan?.id ||
      scanResp?.savedScanId ||
      scanResp?.id ||
      scanResp?._id;

    if (!scanId) return;

    const disease = scanResp?.result?.disease || "";
    const confidence = Number(scanResp?.result?.confidence || 0);

    await fetch(`/api/farm-plans/${farmPlanId}/link-scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        scanId,
        result: disease,
        confidence,
        scannedAt: new Date().toISOString(),
      }),
    }).catch(() => {});
  }

  function canSendNow() {
    const now = Date.now();
    lastRequestTimesRef.current = lastRequestTimesRef.current.filter(
      (t) => now - t < 60_000
    );
    return lastRequestTimesRef.current.length < maxPerMin;
  }

  function markSent() {
    lastRequestTimesRef.current.push(Date.now());
  }

  async function predictWithFile(f: File, isLive: boolean) {
    if (typeof window === "undefined") return;

    const userId = localStorage.getItem("smartAgriUserId");
    if (!userId) {
      window.alert("UserId missing. Please login again.");
      router.push("/auth/login");
      return;
    }

    if (inFlightRef.current) return;
    if (!canSendNow()) return;

    inFlightRef.current = true;
    if (!isLive) setLoading(true);

    try {
      markSent();

      const formData = new FormData();
      formData.append("image", f);
      formData.append("userId", userId);

      const res = await fetch("/api/predict", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Prediction failed");
      }

      setResult(data.result);

      if (isLive && data?.result) {
        setLiveLog((prev) => {
          const entry: LiveLog = {
            at: new Date().toLocaleTimeString(),
            disease: data.result.disease,
            confidence: Number(data.result.confidence || 0),
          };
          return [entry, ...prev].slice(0, 8);
        });
      }

      await linkScanToFarmPlan(data);

      window.dispatchEvent(new Event("smartagri:alerts-updated"));
    } catch (e: any) {
      if (!isLive) {
        window.alert(e?.message || "Something went wrong");
      }
    } finally {
      inFlightRef.current = false;
      if (!isLive) setLoading(false);
    }
  }

  async function onDetect() {
    if (!file) {
      if (typeof window !== "undefined") {
        window.alert("Please upload or capture a leaf image first.");
      }
      return;
    }

    await predictWithFile(file, false);
  }

  function startAutoScan() {
    if (!cameraReady) {
      if (typeof window !== "undefined") {
        window.alert("Camera not ready. Start camera first.");
      }
      return;
    }

    if (timerRef.current) return;

    setAutoScan(true);

    void (async () => {
      const f = captureFrameToFile();
      if (f) {
        setFile(f);
        await predictWithFile(f, true);
      }
    })();

    timerRef.current = setInterval(() => {
      void (async () => {
        const f = captureFrameToFile();
        if (!f) return;

        setFile(f);
        await predictWithFile(f, true);
      })();
    }, intervalMs);
  }

  function stopAutoScan() {
    setAutoScan(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    inFlightRef.current = false;
    lastRequestTimesRef.current = [];
  }

  useEffect(() => {
    if (!autoScan) return;

    stopAutoScan();
    startAutoScan();
  }, [intervalMs, maxPerMin]);

  const tip = useMemo(() => {
    if (mode === "camera") {
      return autoScan
        ? "Auto Scan is running. Keep the leaf steady and well-lit."
        : "Use good lighting. Keep leaf centered and steady before capture.";
    }
    return "Upload a clear leaf image (avoid blur).";
  }, [mode, autoScan]);

  const remainingThisMinute = useMemo(() => {
    const now = Date.now();
    const arr = lastRequestTimesRef.current.filter((t) => now - t < 60_000);
    return Math.max(0, maxPerMin - arr.length);
  }, [maxPerMin, autoScan, loading, result, liveLog.length]);

  if (!mounted) {
    return (
      <AppShell>
        <div className="min-h-[calc(100vh-80px)] bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-slate-900">Scan Leaf</h1>
              <p className="mt-2 text-slate-600">Loading scanner...</p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-80px)] bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Scan Leaf</h1>
                <p className="mt-1 text-slate-600">
                  Upload or capture a leaf photo. The API stores scan in MongoDB
                  and returns prediction.
                </p>

                {farmPlanId && (
                  <div className="mt-3 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    Linked to Farm AI Plan:
                    <span className="ml-2 font-mono">{farmPlanId}</span>
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <div className="text-xs font-semibold text-slate-600">Tip</div>
                <div className="mt-1 text-sm font-bold text-slate-900">{tip}</div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => void switchMode("upload")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold border ${
                  mode === "upload"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-900 hover:bg-slate-50"
                }`}
              >
                Upload Image
              </button>
              <button
                onClick={() => void switchMode("camera")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold border ${
                  mode === "camera"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-900 hover:bg-slate-50"
                }`}
              >
                Live Camera
              </button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              {mode === "upload" ? (
                <>
                  <h2 className="text-lg font-bold text-slate-900">Upload</h2>

                  <div className="mt-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-green-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-green-700"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-slate-900">
                      Live Camera
                    </h2>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => void startCamera()}
                        className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                      >
                        Restart
                      </button>
                      <button
                        onClick={() => {
                          stopAutoScan();
                          stopCamera();
                        }}
                        className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                      >
                        Stop
                      </button>
                    </div>
                  </div>

                  {cameraError && (
                    <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                      {cameraError}
                      <div className="mt-2 text-xs text-red-700">
                        Note: Camera works best on <b>HTTPS</b> or <b>localhost</b>.
                      </div>
                    </div>
                  )}

                  <div className="mt-4 overflow-hidden rounded-xl border bg-slate-50">
                    <video
                      ref={videoRef}
                      className="w-full aspect-video object-cover"
                      playsInline
                      muted
                    />
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <button
                      onClick={() => void captureOnce()}
                      disabled={!cameraReady}
                      className="w-full rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
                    >
                      Capture Once
                    </button>

                    {!autoScan ? (
                      <button
                        onClick={startAutoScan}
                        disabled={!cameraReady}
                        className="w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                      >
                        Start Auto Scan
                      </button>
                    ) : (
                      <button
                        onClick={stopAutoScan}
                        className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black"
                      >
                        Pause Auto Scan
                      </button>
                    )}
                  </div>

                  <div className="mt-4 rounded-2xl border bg-slate-50 p-4">
                    <div className="text-sm font-bold text-slate-900">
                      Auto Scan Settings
                    </div>
                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold text-slate-600">
                          Interval
                        </div>
                        <select
                          value={intervalMs}
                          onChange={(e) => setIntervalMs(Number(e.target.value))}
                          className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
                        >
                          <option value={1500}>1.5 seconds</option>
                          <option value={2000}>2 seconds</option>
                          <option value={3000}>3 seconds</option>
                          <option value={5000}>5 seconds (recommended)</option>
                        </select>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-600">
                          Max requests / min
                        </div>
                        <select
                          value={maxPerMin}
                          onChange={(e) => setMaxPerMin(Number(e.target.value))}
                          className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
                        >
                          <option value={6}>6 / min (safer)</option>
                          <option value={12}>12 / min</option>
                          <option value={20}>20 / min (fast)</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-slate-600">
                      Remaining this minute: <b>{remainingThisMinute}</b> • Auto
                      Scan: <b>{autoScan ? "ON" : "OFF"}</b>
                    </div>
                  </div>
                </>
              )}

              <div className="mt-4 rounded-xl border border-dashed bg-slate-50 p-4">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="preview"
                    className="max-h-72 w-full rounded-lg object-contain"
                  />
                ) : (
                  <p className="text-sm text-slate-600">
                    {mode === "camera"
                      ? "Capture (or auto-scan) to preview frames here."
                      : "No image selected. Choose a leaf photo to preview it here."}
                  </p>
                )}
              </div>

              <button
                onClick={() => void onDetect()}
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white hover:bg-black disabled:opacity-60"
              >
                {loading ? "Detecting..." : "Detect Disease (Manual)"}
              </button>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900">Result</h2>
                {mode === "camera" && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      autoScan
                        ? "bg-green-50 text-green-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    Auto Scan: {autoScan ? "Running" : "Paused"}
                  </span>
                )}
              </div>

              {!result ? (
                <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  {mode === "camera"
                    ? "Start camera → start Auto Scan (or capture once) to get live results."
                    : "Upload image → click Detect Disease."}
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border p-4">
                    <p className="text-sm font-semibold text-slate-600">
                      Prediction
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {result.disease}
                    </p>
                  </div>

                  <div className="rounded-xl border p-4">
                    <p className="text-sm font-semibold text-slate-600">
                      Confidence
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {(result.confidence * 100).toFixed(0)}%
                    </p>
                  </div>

                  <div className="rounded-xl border p-4">
                    <p className="text-sm font-semibold text-slate-600">
                      Reason for Disease
                    </p>
                    <p className="mt-1 text-slate-700">
                      {result.reason || "No reason available."}
                    </p>
                  </div>

                  <div className="rounded-xl border p-4">
                    <p className="text-sm font-semibold text-slate-600">
                      Organic Treatment (Zero/Low Cost)
                    </p>
                    <p className="mt-1 text-slate-700">
                      {result.organicTreatment ||
                        "No organic treatment available."}
                    </p>
                  </div>

                  <div className="rounded-xl border p-4">
                    <p className="text-sm font-semibold text-slate-600">
                      Artificial Treatment (Chemical)
                    </p>
                    <p className="mt-1 text-slate-700">
                      {result.artificialTreatment ||
                        "No artificial treatment available."}
                    </p>
                  </div>

                  <div className="rounded-xl border p-4">
                    <p className="text-sm font-semibold text-slate-600">
                      Prevention and Follow-up
                    </p>
                    <p className="mt-1 text-slate-700">
                      {result.prevention ||
                        "No prevention guidance available."}
                    </p>
                  </div>

                  <div className="rounded-xl border p-4">
                    <p className="text-sm font-semibold text-slate-600">
                      Recommendation
                    </p>
                    <p className="mt-1 text-slate-700">
                      {result.recommendation}
                    </p>
                  </div>

                  <p className="text-xs text-slate-500">
                    ✅ Stored in MongoDB via <code>/api/predict</code>.
                  </p>
                </div>
              )}

              {mode === "camera" && (
                <div className="mt-6">
                  <div className="text-sm font-bold text-slate-900">
                    Live Scan Log
                  </div>

                  {liveLog.length === 0 ? (
                    <div className="mt-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                      No live detections yet.
                    </div>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {liveLog.map((l, idx) => (
                        <div key={idx} className="rounded-xl border bg-white p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold text-slate-900">
                              {l.disease}
                            </div>
                            <div className="text-xs text-slate-600">{l.at}</div>
                          </div>
                          <div className="mt-1 text-xs text-slate-600">
                            Confidence: <b>{Math.round(l.confidence * 100)}%</b>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setLiveLog([])}
                    className="mt-3 rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                  >
                    Clear Log
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm text-xs text-slate-600">
            Live Auto Scan is rate-limited to protect your server. For best
            results, keep the leaf steady, use bright natural light, and avoid
            motion blur.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
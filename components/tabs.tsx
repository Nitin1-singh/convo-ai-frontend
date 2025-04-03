"use client";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { YoloDetectionType } from "./dashboard";
import ReactPlayer from "react-player";
import { API_URL } from "@/contants";

type detectionStatsType = {
  totalFrames: number;
  totalDetections: number;
  avgConfidence: string;
};
type prop = {
  videoId: string;
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
  detections: YoloDetectionType[];
  detectionStats: detectionStatsType;
};

export function TabVideoAndResult({
  videoId,
  activeTab,
  setActiveTab,
  detections,
  detectionStats,
}: prop) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerRef = useRef<ReactPlayer | null>(null);
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(0);

  const [videoSize, setVideoSize] = useState<{ width: number; height: number }>(
    { width: 0, height: 0 }
  );
  const handleVideoReady = () => {
    if (playerRef.current) {
      const videoElement =
        playerRef.current.getInternalPlayer() as HTMLVideoElement;
      setVideoSize({
        width: videoElement.videoWidth,
        height: videoElement.videoHeight,
      });
    }
  };

  const filterOverlappingBoxes = (
    detections: YoloDetectionType[],
    threshold = 10
  ) => {
    const filtered: YoloDetectionType[] = [];

    detections.forEach((det) => {
      const isOverlapping = filtered.some((existing) => {
        const dx = Math.abs(det.bbox_x - existing.bbox_x);
        const dy = Math.abs(det.bbox_y - existing.bbox_y);
        return dx < threshold && dy < threshold;
      });

      if (!isOverlapping) {
        filtered.push(det);
      }
    });

    return filtered;
  };

  // Draw detection overlays based on timestamp
  useEffect(() => {
    console.log(currentTimestamp, canvasRef, videoSize);

    if (!canvasRef.current || !videoSize.width) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = videoSize.width;
    canvas.height = videoSize.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const relevantDetections = filterOverlappingBoxes(
      detections.filter(
        (det) => Math.abs(det.timestamp - currentTimestamp) < 0.1
      ),
      20 // Increase this threshold to filter out more overlapping boxes
    );

    relevantDetections.forEach((det) => {
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(det.bbox_x, det.bbox_y, det.bbox_width, det.bbox_height);

      ctx.fillStyle = "transparent";
      ctx.fillRect(det.bbox_x, det.bbox_y, det.bbox_width, det.bbox_height);

      ctx.fillStyle = "white";
      ctx.font = "12px Arial";
      ctx.fillText(
        `${det.item_name} (${(det.confidence * 100).toFixed(1)}%)`,
        det.bbox_x,
        det.bbox_y - 5
      );
    });
  }, [detections, videoSize, currentTimestamp]);

  const handleVideoProgress = (state: { playedSeconds: number }) => {
    console.log(state);
    setCurrentTimestamp(state.playedSeconds);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`px-6 py-3 text-lg font-medium ${
            activeTab === "video"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("video")}
        >
          Video View
        </button>
        <button
          className={`px-6 py-3 text-lg font-medium ${
            activeTab === "data"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("data")}
        >
          Detection Data
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "video" ? (
        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800">
                Frames with Detections
              </h3>
              <p className="text-2xl font-bold text-blue-900">
                {detectionStats.totalFrames}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-800">
                Total Detections
              </h3>
              <p className="text-2xl font-bold text-green-900">
                {detectionStats.totalDetections}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-purple-800">
                Average Confidence
              </h3>
              <p className="text-2xl font-bold text-purple-900">
                {detectionStats.avgConfidence}
              </p>
            </div>
          </div>

          {/* Video Player with Overlay */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <ReactPlayer
                  ref={playerRef}
                  url={`${API_URL}/uploads/${videoId}`}
                  controls
                  width="100%"
                  height="auto"
                  onReady={handleVideoReady}
                  onProgress={handleVideoProgress}
                  className="aspect-video"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6">
          {detections.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 p-3 text-left">
                      Frame
                    </th>
                    <th className="border border-gray-200 p-3 text-left">
                      Confidence
                    </th>
                    <th className="border border-gray-200 p-3 text-left">
                      Timestamp
                    </th>
                    <th className="border border-gray-200 p-3 text-left">
                      Position (x, y)
                    </th>
                    <th className="border border-gray-200 p-3 text-left">
                      Size (w × h)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detections.map((det, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-200 p-3">
                        {det.frame_number}
                      </td>
                      <td className="border border-gray-200 p-3">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className={`h-2 rounded-full ${
                                det.confidence > 0.8
                                  ? "bg-green-500"
                                  : det.confidence > 0.6
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{
                                width: `${det.confidence * 100}%`,
                              }}
                            ></div>
                          </div>
                          {det.confidence.toFixed(2)}
                        </div>
                      </td>
                      <td className="border border-gray-200 p-3">
                        {det.timestamp.toFixed(2)}s
                      </td>
                      <td className="border border-gray-200 p-3">
                        ({det.bbox_x}, {det.bbox_y})
                      </td>
                      <td className="border border-gray-200 p-3">
                        {det.bbox_width} × {det.bbox_height}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No detection data available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import { TabVideoAndResult } from "./tabs";
import { API_URL } from "@/contants";

export type YoloDetectionType = {
  item_name: string; // Detected object label (e.g., "car", "person")
  confidence: number; // Confidence score (0 to 1)
  timestamp: number; // Time in the video when detection occurred (in seconds)
  bbox_x: number; // X-coordinate of the bounding box (top-left)
  bbox_y: number; // Y-coordinate of the bounding box (top-left)
  bbox_width: number; // Width of the bounding box
  frame_number: number;
  bbox_height: number; // Height of the bounding box
};

export const Dashboard = () => {
  const [videoId, setVideoId] = useState<string | null>("");
  const [activeTab, setActiveTab] = useState<string>("video");
  const [detections, setDetections] = useState<YoloDetectionType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({
      accept: { "video/mp4": [], "video/webm": [] },
      onDrop: (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
          setUploadedFile(acceptedFiles[0]);
        }
      },
    });

  const handleUpload = async () => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/upload/`, formData);
      setVideoId(res.data.video_id);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!videoId) return;
    const fetchDetections = async () => {
      try {
        const res = await axios.get(`${API_URL}/detections/${videoId}`);
        setDetections(res.data);
      } catch (error) {
        console.error("Error fetching detections:", error);
      }
    };
    fetchDetections();
  }, [videoId]);

  // Calculate statistics
  const detectionStats = {
    totalFrames: Array.from(new Set(detections.map((d) => d.frame_number)))
      .length,
    totalDetections: detections.length,
    avgConfidence:
      detections.length > 0
        ? (
            detections.reduce((sum, det) => sum + det.confidence, 0) /
            detections.length
          ).toFixed(2)
        : "N/A",
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            YOLO Detection Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Upload video files and visualize object detection results
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload Video</h2>
          <div
            {...getRootProps()}
            className={`border-2 ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-dashed border-gray-300"
            } rounded-lg p-8 text-center transition-colors`}
          >
            <input {...getInputProps()} />
            <p className="text-lg text-gray-700">
              Drag & drop a video file here
            </p>
          </div>
          {uploadedFile && (
            <div className="border rounded-lg p-2 mt-3">
              <p>{uploadedFile.name}</p>
              <p>{(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={loading || acceptedFiles.length === 0}
            className={`mt-4 px-6 py-2 rounded-md text-white font-medium ${
              loading || acceptedFiles.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="w-5 h-5 mr-2 text-white animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
                Processing...
              </div>
            ) : (
              "Upload Video"
            )}
          </button>
        </div>

        {videoId && (
          <TabVideoAndResult
            videoId={videoId}
            detections={detections}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            detectionStats={detectionStats}
          />
        )}
      </div>
    </div>
  );
};

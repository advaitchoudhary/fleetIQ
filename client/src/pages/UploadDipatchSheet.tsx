import React from "react";
// import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
// import { API_BASE_URL } from "../utils/env";

const UploadDispatchSheet: React.FC = () => {
    // const [file, setFile] = useState<File | null>(null);
    // const [setDispatchData] = useState<any[]>([]);
    // const [setLoading] = useState<boolean>(false);

    // const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     if (event.target.files && event.target.files.length > 0) {
    //         setFile(event.target.files[0]);
    //         console.log("✅ File selected:", event.target.files[0].name);
    //     }
    // };

    // const handleUpload = async () => {
    //     if (!file) {
    //         alert("Please select a file first.");
    //         console.warn("⚠️ No file selected for upload.");
    //         return;
    //     }

    //     setLoading(true);
    //     console.log("📤 Uploading file:", file.name);

    //     const formData = new FormData();
    //     formData.append("file", file);

    //     try {
    //         const response = await fetch(`${API_BASE_URL}/upload`, {
    //             method: "POST",
    //             body: formData,
    //         });

    //         const result = await response.json();
    //         console.log("✅ Upload response:", result); // Log API response

    //         fetchDispatchData();
    //     } catch (error) {
    //         console.error("❌ Error uploading file:", error);
    //         alert("Failed to upload file.");
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // const fetchDispatchData = async () => {
    //     try {
    //         console.log("🔄 Fetching dispatch data...");
    //         const response = await fetch(`${API_BASE_URL}/dispatches`);
    //         const data = await response.json();
    //         console.log("✅ Fetched Dispatch Data:", data); // Log fetched data
    //         setDispatchData(data);
    //     } catch (error) {
    //         console.error("❌ Error fetching data:", error);
    //     }
    // };

    // useEffect(() => {
    //     fetchDispatchData();
    // }, []);

    return (
      <div style={{ fontFamily: "Inter, system-ui, sans-serif", backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
        <Navbar />
        <div style={{ padding: "80px 20px", textAlign: "center" }}>
          <p style={{ fontSize: "18px", fontWeight: 600, color: "#6b7280" }}>Coming Soon</p>
        </div>
      </div>
    );
};

export default UploadDispatchSheet;
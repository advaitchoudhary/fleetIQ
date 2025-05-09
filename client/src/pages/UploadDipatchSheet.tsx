import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { API_BASE_URL } from "../utils/env";

const UploadDispatchSheet: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [dispatchData, setDispatchData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setFile(event.target.files[0]);
            console.log("✅ File selected:", event.target.files[0].name);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            alert("Please select a file first.");
            console.warn("⚠️ No file selected for upload.");
            return;
        }

        setLoading(true);
        console.log("📤 Uploading file:", file.name);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch(`${API_BASE_URL}/upload`, {
                method: "POST",
                body: formData,
            });

            const result = await response.json();
            console.log("✅ Upload response:", result); // Log API response

            fetchDispatchData();
        } catch (error) {
            console.error("❌ Error uploading file:", error);
            alert("Failed to upload file.");
        } finally {
            setLoading(false);
        }
    };

    const fetchDispatchData = async () => {
        try {
            console.log("🔄 Fetching dispatch data...");
            const response = await fetch(`${API_BASE_URL}/dispatches`);
            const data = await response.json();
            console.log("✅ Fetched Dispatch Data:", data); // Log fetched data
            setDispatchData(data);
        } catch (error) {
            console.error("❌ Error fetching data:", error);
        }
    };

    useEffect(() => {
        fetchDispatchData();
    }, []);

    return (
        <div>
            <Navbar />
            <div style={{ padding: "20px", maxWidth: "900px", margin: "auto" }}>
                <h2>Upload Dispatch Sheet</h2>
                <input type="file" onChange={handleFileChange} accept=".pdf" />
                <button onClick={handleUpload} style={{ marginLeft: "10px" }}>
                    {loading ? "Uploading..." : "Upload & Extract"}
                </button>

                <h3>Extracted Data</h3>
                {dispatchData.length === 0 ? (
                    <p>No extracted data available.</p>
                ) : (
                    <table border={1} width="100%">
                        <thead>
                            <tr>
                                <th>Route</th>
                                <th>Load ID</th>
                                <th>Trailer Type</th>
                                <th>Trip Date</th>
                                <th>Store #</th>
                                <th>Store Name</th>
                                <th>ETA</th>
                                <th>City</th>
                                <th>Stop #</th>
                                <th>Window In</th>
                                <th>Window Out</th>
                                <th>Commodity</th>
                                <th>Total PCS</th>
                                <th>Total Cube</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dispatchData.map((row, index) => (
                                <tr key={index}>
                                    <td>{row.route}</td>
                                    <td>{row.loadId}</td>
                                    <td>{row.trailerType}</td>
                                    <td>{row.tripDate}</td>
                                    <td>{row.storeNumber}</td>
                                    <td>{row.storeName}</td>
                                    <td>{row.eta}</td>
                                    <td>{row.city}</td>
                                    <td>{row.stopNumber}</td>
                                    <td>{row.windowIn}</td>
                                    <td>{row.windowOut}</td>
                                    <td>{row.commodity}</td>
                                    <td>{row.totalPCS}</td>
                                    <td>{row.totalCube}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default UploadDispatchSheet;
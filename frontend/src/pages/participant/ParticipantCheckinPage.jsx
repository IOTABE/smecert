// frontend/src/pages/participant/ParticipantCheckinPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
// import axios from 'axios'; // TODO: Setup axios instance for API calls

const ParticipantCheckinPage = () => {
    const [scanResult, setScanResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isScanning, setIsScanning] = useState(true);
    const scannerRef = useRef(null); // Ref to control the scanner instance

    // Function to handle successful scan
    const onScanSuccess = (decodedText, decodedResult) => {
        console.log(`Scan result: ${decodedText}`, decodedResult);
        setScanResult(decodedText);
        setIsScanning(false); // Stop scanning after a successful scan
        // --- TODO: Send decodedText (QR data) and potentially event ID to backend --- 
        // Example: Assume QR code contains event ID or a specific token
        // const eventId = extractEventIdFromQrData(decodedText); // Implement this logic
        // const qrToken = extractTokenFromQrData(decodedText); // Implement this logic
        
        // Placeholder: Simulate API call
        setSuccessMessage(`Check-in iniciado para dados: ${decodedText}. Aguardando confirmação do servidor...`);
        setErrorMessage('');

        // --- Actual API Call --- 
        /*
        getGeolocation().then(({ latitude, longitude }) => {
            axios.post('/api/attendances/check-in/', { 
                qr_code_data: decodedText, 
                event_id: 1, // Replace with actual event ID logic
                latitude: latitude,
                longitude: longitude
            })
            .then(response => {
                setSuccessMessage(response.data.status || 'Check-in realizado com sucesso!');
                setScanResult(null); // Clear result after successful API call
            })
            .catch(error => {
                console.error("Check-in error:", error.response?.data);
                setErrorMessage(error.response?.data?.error || 'Falha ao realizar check-in.');
                setSuccessMessage('');
                // Optionally restart scanning on error?
                // setIsScanning(true);
            });
        }).catch(geoError => {
            console.error("Geolocation error:", geoError);
            setErrorMessage('Não foi possível obter a localização. Check-in não realizado.');
            setSuccessMessage('');
            // Proceed without geolocation or deny check-in?
        });
        */
    };

    // Function to handle scan errors
    const onScanError = (error) => {
        // console.warn(`Scan error: ${error}`);
        // Don't display frequent errors, only maybe if it fails consistently
    };

    // Function to get geolocation
    const getGeolocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject('Geolocalização não é suportada por este navegador.');
            } else {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        });
                    },
                    (error) => {
                        reject(`Erro ao obter localização: ${error.message}`);
                    }
                );
            }
        });
    };

    useEffect(() => {
        if (isScanning) {
            // Ensure the cleanup function runs correctly
            let html5QrcodeScanner;
            try {
                html5QrcodeScanner = new Html5QrcodeScanner(
                    "qr-reader", // ID of the container element
                    {
                        fps: 10, // Frames per second for scanning
                        qrbox: { width: 250, height: 250 }, // Size of the scanning box
                        rememberLastUsedCamera: true,
                        supportedScanTypes: [0] // 0 for Camera
                    },
                    false // verbose = false
                );
                
                scannerRef.current = html5QrcodeScanner; // Store instance in ref
                html5QrcodeScanner.render(onScanSuccess, onScanError);
                setErrorMessage(''); // Clear previous errors on start
                setSuccessMessage('');
            } catch (error) {
                console.error("Failed to initialize scanner:", error);
                setErrorMessage("Falha ao iniciar o scanner. Verifique as permissões da câmera.");
            }

            // Cleanup function to stop the scanner when component unmounts or scanning stops
            return () => {
                if (scannerRef.current) {
                    scannerRef.current.clear().catch(error => {
                        console.error("Failed to clear scanner", error);
                    });
                    scannerRef.current = null;
                }
            };
        } else {
             // If scanning is stopped manually, ensure cleanup
             if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear scanner on stop", error);
                });
                scannerRef.current = null;
            }
        }
    }, [isScanning]); // Rerun effect if isScanning changes

    const handleRescan = () => {
        setScanResult(null);
        setErrorMessage('');
        setSuccessMessage('');
        setIsScanning(true);
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4 text-center">Check-in por QR Code</h1>
            
            {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Erro!</strong>
                    <span className="block sm:inline"> {errorMessage}</span>
                </div>
            )}
            {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Sucesso!</strong>
                    <span className="block sm:inline"> {successMessage}</span>
                </div>
            )}

            {isScanning && (
                <div id="qr-reader" className="w-full max-w-md mx-auto border-2 border-gray-300 rounded-lg overflow-hidden"></div>
            )}

            {!isScanning && scanResult && (
                <div className="text-center mt-4">
                    <p className="text-lg">QR Code lido com sucesso!</p>
                    {/* <p className="text-sm text-gray-600 break-all">Dados: {scanResult}</p> */} 
                    {/* Display success/error message from API call instead */} 
                    <button 
                        onClick={handleRescan}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-200"
                    >
                        Escanear Novamente
                    </button>
                </div>
            )}
             {!isScanning && !scanResult && (
                 <div className="text-center mt-4">
                    <button 
                        onClick={handleRescan}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-200"
                    >
                        Iniciar Scanner
                    </button>
                </div>
            )}
        </div>
    );
};

export default ParticipantCheckinPage;


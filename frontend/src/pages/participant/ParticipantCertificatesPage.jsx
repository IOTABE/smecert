// frontend/src/pages/participant/ParticipantCertificatesPage.jsx
import React, { useState, useEffect } from 'react';
// import apiService from '../../services/api'; // TODO: Create and import API service

const ParticipantCertificatesPage = () => {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // --- TODO: Replace with actual API call --- 
        // apiService.get('/api/certificates/')
        //     .then(response => {
        //         setCertificates(response.data.results || response.data); // Handle pagination if needed
        //         setLoading(false);
        //     })
        //     .catch(err => {
        //         console.error("Error fetching certificates:", err);
        //         setError('Falha ao carregar certificados.');
        //         setLoading(false);
        //     });

        // Placeholder data
        const placeholderData = [
            { id: 1, participant: 1, participant_username: 'user1', unique_code: 'uuid-123-abc', issue_date: '2025-05-29', total_hours_at_generation: '20.50', pdf_file: null, attended_events_details: [{event_name: 'Evento Alpha', hours: 10.00}, {event_name: 'Workshop Beta', hours: 10.50}] },
            { id: 2, participant: 1, participant_username: 'user1', unique_code: 'uuid-456-def', issue_date: '2025-04-15', total_hours_at_generation: '8.00', pdf_file: null, attended_events_details: [{event_name: 'Palestra Gamma', hours: 8.00}] },
        ];
        setTimeout(() => { // Simulate network delay
             setCertificates(placeholderData);
             setLoading(false);
        }, 1000);

    }, []);

    const handleDownload = (certificateId, uniqueCode, username) => {
        // --- TODO: Implement actual download API call --- 
        // The backend endpoint /api/certificates/{id}/download_pdf/ should return the PDF file
        // Use window.open(apiUrl) or fetch the blob and create a download link
        
        // Example using fetch:
        /*
        apiService.get(`/api/certificates/${certificateId}/download_pdf/`, { responseType: 'blob' })
            .then(response => {
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `certificado_${username}_${uniqueCode}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
                window.URL.revokeObjectURL(url);
            })
            .catch(err => {
                console.error("Error downloading certificate:", err);
                setError('Falha ao baixar o certificado.');
            });
        */
       alert(`Simulando download do certificado ID: ${certificateId}`);
    };

    if (loading) {
        return <div className="text-center p-4">Carregando certificados...</div>;
    }

    if (error) {
        return <div className="text-center p-4 text-red-600">{error}</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Meus Certificados</h1>
            {certificates.length === 0 ? (
                <p>Você ainda não possui certificados.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {certificates.map(cert => (
                        <div key={cert.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                            <h2 className="text-lg font-semibold mb-2">Certificado #{cert.id}</h2>
                            <p className="text-sm text-gray-600 mb-1">Emitido em: {new Date(cert.issue_date).toLocaleDateString('pt-BR')}</p>
                            <p className="text-sm text-gray-600 mb-3">Total de Horas: {cert.total_hours_at_generation}</p>
                            <p className="text-xs text-gray-500 break-all mb-4">Código: {cert.unique_code}</p>
                            <button 
                                onClick={() => handleDownload(cert.id, cert.unique_code, cert.participant_username)}
                                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-200 text-sm"
                            >
                                Baixar PDF
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ParticipantCertificatesPage;


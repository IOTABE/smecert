// frontend/src/pages/public/CertificateValidationPage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
// import apiService from '../../services/api'; // TODO: Create and import API service

const CertificateValidationPage = () => {
    const [searchParams] = useSearchParams();
    const [requestCode, setRequestCode] = useState(searchParams.get('code') || '');
    const [validationResult, setValidationResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [inputCode, setInputCode] = useState(searchParams.get('code') || '');

    const handleValidation = (codeToValidate) => {
        if (!codeToValidate) {
            setError('Por favor, insira um código de validação.');
            return;
        }
        setLoading(true);
        setError('');
        setValidationResult(null);

        // --- TODO: Replace with actual API call --- 
        // apiService.post('/api/certificates/validate/', { unique_code: codeToValidate })
        //     .then(response => {
        //         setValidationResult(response.data);
        //         setLoading(false);
        //     })
        //     .catch(err => {
        //         console.error("Validation error:", err.response?.data);
        //         setValidationResult({ is_valid: false }); // Explicitly set invalid on error
        //         setError(err.response?.data?.error || 'Código inválido ou erro na validação.');
        //         setLoading(false);
        //     });

        // Placeholder logic
        setTimeout(() => {
            if (codeToValidate === 'uuid-123-abc') {
                setValidationResult({
                    is_valid: true,
                    participant_name: 'Usuário Exemplo Um',
                    total_hours: '20.50',
                    issue_date: '2025-05-29',
                    attended_events: [
                        { event_name: 'Evento Alpha', hours: 10.00 },
                        { event_name: 'Workshop Beta', hours: 10.50 }
                    ]
                });
            } else {
                setValidationResult({ is_valid: false });
                setError('Código de certificado inválido ou não encontrado.');
            }
            setLoading(false);
        }, 1500);
    };

    // Automatically validate if code is present in URL query params on initial load
    useEffect(() => {
        if (requestCode) {
            handleValidation(requestCode);
        }
    }, [requestCode]); // Depend on requestCode derived from searchParams

    const handleSubmit = (event) => {
        event.preventDefault();
        // Update URL potentially, or just validate
        // setSearchParams({ code: inputCode }); // Optional: update URL
        setRequestCode(inputCode); // Trigger validation via useEffect or call directly
        handleValidation(inputCode); // Call validation directly on submit
    };

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <h1 className="text-3xl font-bold mb-6 text-center">Validar Certificado</h1>
            
            <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded shadow-md">
                <label htmlFor="certificateCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Validação:
                </label>
                <input 
                    type="text"
                    id="certificateCode"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="Insira o código único do certificado"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                />
                <button 
                    type="submit"
                    disabled={loading}
                    className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition duration-200"
                >
                    {loading ? 'Validando...' : 'Validar'}
                </button>
            </form>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Erro!</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
            )}

            {validationResult && (
                <div className={`p-6 rounded shadow-md ${validationResult.is_valid ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'} border`}>
                    <h2 className={`text-xl font-semibold mb-4 ${validationResult.is_valid ? 'text-green-800' : 'text-red-800'}`}>
                        {validationResult.is_valid ? 'Certificado Válido' : 'Certificado Inválido'}
                    </h2>
                    {validationResult.is_valid ? (
                        <div>
                            <p><strong>Participante:</strong> {validationResult.participant_name}</p>
                            <p><strong>Data de Emissão:</strong> {new Date(validationResult.issue_date).toLocaleDateString('pt-BR')}</p>
                            <p><strong>Total de Horas:</strong> {validationResult.total_hours}</p>
                            <h3 className="font-semibold mt-4 mb-2">Eventos Computados:</h3>
                            {validationResult.attended_events && validationResult.attended_events.length > 0 ? (
                                <ul className="list-disc list-inside text-sm text-gray-700">
                                    {validationResult.attended_events.map((event, index) => (
                                        <li key={index}>{event.event_name} ({event.hours} horas)</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-600">Nenhum detalhe de evento disponível.</p>
                            )}
                        </div>
                    ) : (
                        <p className="text-red-700">O código fornecido não corresponde a um certificado válido em nosso sistema.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default CertificateValidationPage;


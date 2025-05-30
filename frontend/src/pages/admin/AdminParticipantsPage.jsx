// filepath: /home/ctic/Development/smecert/frontend/src/pages/admin/AdminParticipantsPage.jsx
import React, { useState, useEffect } from 'react';
import ParticipantForm from './components/ParticipantForm';
import * as XLSX from 'xlsx'; // Importar a biblioteca xlsx
// import { getParticipants, createParticipant, updateParticipant, deleteParticipant, importParticipantsBatch } from '../../services/participantService'; // Mocked

// Mock de serviços - substitua por chamadas de API reais
const mockParticipants = [
    { id: 1, name: 'Alice Silva', email: 'alice@example.com', cpf: '111.111.111-11' },
    { id: 2, name: 'Bruno Costa', email: 'bruno@example.com', cpf: '222.222.222-22' },
];
const getParticipants = async () => Promise.resolve(mockParticipants);
const createParticipant = async (participant) => Promise.resolve({ ...participant, id: Date.now() });
const updateParticipant = async (id, participant) => Promise.resolve({ ...participant, id });
const deleteParticipant = async (id) => Promise.resolve();
// Mock para importação - no serviço real, esta função fará a chamada de API
const importParticipantsBatch = async (participantsToImport) => {
    console.log('Enviando para importação (mock):', participantsToImport);
    // Simula uma resposta do backend
    const results = participantsToImport.map(p => ({ ...p, importStatus: 'success', id: Math.random() * 10000 }));
    const newImported = results.filter(r => r.importStatus === 'success');
    mockParticipants.push(...newImported); // Adiciona ao mock local
    return Promise.resolve({
        success: true,
        message: `${newImported.length} participantes importados com sucesso.`,
        results: results
    });
};


const AdminParticipantsPage = () => {
    const [participants, setParticipants] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingParticipant, setEditingParticipant] = useState(null);
    const [importFeedback, setImportFeedback] = useState(null);
    const [fileToImport, setFileToImport] = useState(null);

    const fetchParticipants = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getParticipants(); // API real
            setParticipants(data); // Mock
        } catch (err) {
            setError('Falha ao carregar participantes.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchParticipants();
    }, []);

    const handleCreateNew = () => {
        setEditingParticipant(null);
        setShowForm(true);
        setImportFeedback(null);
    };

    const handleEdit = (participant) => {
        setEditingParticipant(participant);
        setShowForm(true);
        setImportFeedback(null);
    };

    const handleDelete = async (participantId) => {
        if (window.confirm('Tem certeza que deseja excluir este participante?')) {
            try {
                await deleteParticipant(participantId); // API real
                setParticipants(prev => prev.filter(p => p.id !== participantId)); // Mock
                alert('Participante excluído com sucesso!');
            } catch (err) {
                alert('Falha ao excluir participante.');
                console.error(err);
            }
        }
    };

    const handleSubmitForm = async (participantData) => {
        setIsLoading(true);
        try {
            if (editingParticipant && editingParticipant.id) {
                const updated = await updateParticipant(editingParticipant.id, participantData); // API real
                setParticipants(prev => prev.map(p => p.id === editingParticipant.id ? updated : p));
                alert('Participante atualizado com sucesso!');
            } else {
                const created = await createParticipant(participantData); // API real
                setParticipants(prev => [...prev, created]);
                alert('Participante adicionado com sucesso!');
            }
            setShowForm(false);
            setEditingParticipant(null);
        } catch (err) {
            alert(`Falha ao ${editingParticipant ? 'atualizar' : 'adicionar'} participante.`);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleFileSelected = (event) => {
        const file = event.target.files[0];
        if (file) {
            setFileToImport(file);
            setImportFeedback(null); // Limpa feedback anterior
        }
    };

    const processAndImportFile = async () => {
        if (!fileToImport) {
            setImportFeedback({ type: 'error', message: 'Nenhum arquivo selecionado.' });
            return;
        }

        setIsLoading(true);
        setImportFeedback({ type: 'info', message: 'Processando arquivo...' });

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0]; // Pega a primeira planilha
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // header: 1 para array de arrays

                if (jsonData.length < 2) { // Verifica se há cabeçalho e pelo menos uma linha de dados
                    setImportFeedback({ type: 'error', message: 'Planilha vazia ou sem dados após o cabeçalho.' });
                    setIsLoading(false);
                    return;
                }

                const headers = jsonData[0].map(header => String(header).trim().toLowerCase());
                // Defina os nomes das colunas esperadas (em minúsculas) e seus mapeamentos para as chaves do objeto
                const columnMapping = {
                    'nome': 'name',
                    'nome completo': 'name',
                    'email': 'email',
                    'e-mail': 'email',
                    'cpf': 'cpf',
                    // Adicione outros mapeamentos conforme necessário (ex: 'telefone': 'phone')
                };

                const participantsToImport = jsonData.slice(1).map((row, rowIndex) => {
                    const participant = {};
                    let hasEssentialData = false;
                    headers.forEach((header, index) => {
                        const modelKey = columnMapping[header];
                        if (modelKey) {
                            participant[modelKey] = row[index] ? String(row[index]).trim() : null;
                            if (modelKey === 'name' && participant[modelKey]) hasEssentialData = true;
                            if (modelKey === 'email' && participant[modelKey]) hasEssentialData = true;
                        }
                    });
                    // Adiciona um identificador temporário para feedback, se necessário
                    participant.tempId = `row-${rowIndex + 2}`; 
                    return hasEssentialData ? participant : null;
                }).filter(p => p !== null); // Remove linhas que não tinham dados essenciais

                if (participantsToImport.length === 0) {
                    setImportFeedback({ type: 'error', message: 'Nenhum participante válido encontrado na planilha. Verifique os cabeçalhos (ex: Nome, Email, CPF) e os dados.' });
                    setIsLoading(false);
                    return;
                }
                
                setImportFeedback({ type: 'info', message: `Enviando ${participantsToImport.length} participantes para importação...` });

                // Enviar para o backend (usando o mock por enquanto)
                const response = await importParticipantsBatch(participantsToImport);
                
                if (response.success) {
                    setImportFeedback({ type: 'success', message: response.message });
                    fetchParticipants(); // Re-busca a lista atualizada
                } else {
                    setImportFeedback({ type: 'error', message: response.message || 'Falha na importação.' });
                }
                // Aqui você pode querer mostrar detalhes dos resultados da importação (response.results)

            } catch (error) {
                console.error("Erro ao processar o arquivo Excel:", error);
                setImportFeedback({ type: 'error', message: 'Erro ao ler ou processar o arquivo Excel. Verifique o formato.' });
            } finally {
                setIsLoading(false);
                setFileToImport(null); // Limpa o arquivo selecionado após o processamento
                // Limpa o input de arquivo para permitir selecionar o mesmo arquivo novamente se necessário
                if (document.getElementById('excel-file-input')) {
                    document.getElementById('excel-file-input').value = '';
                }
            }
        };
        reader.onerror = () => {
            setImportFeedback({ type: 'error', message: 'Erro ao ler o arquivo.' });
            setIsLoading(false);
        };
        reader.readAsArrayBuffer(fileToImport);
    };


    if (isLoading && !showForm && !importFeedback) return <p>Carregando participantes...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Gerenciar Participantes</h2>
                {!showForm && (
                    <button 
                        onClick={handleCreateNew}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-200">
                        Adicionar Novo
                    </button>
                )}
            </div>

            {importFeedback && (
                <div className={`p-4 mb-4 text-sm rounded-lg ${
                    importFeedback.type === 'success' ? 'bg-green-100 text-green-700' :
                    importFeedback.type === 'error' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                }`} role="alert">
                    {importFeedback.message}
                </div>
            )}

            {showForm ? (
                <ParticipantForm 
                    onSubmit={handleSubmitForm} 
                    initialData={editingParticipant || {}}
                    onCancel={() => { setShowForm(false); setEditingParticipant(null); }}
                />
            ) : (
                <>
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                        <ul className="divide-y divide-gray-200">
                            {participants.length === 0 && !isLoading && <li className="px-6 py-4">Nenhum participante encontrado.</li>}
                            {participants.map(participant => (
                                <li key={participant.id} className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg leading-6 font-medium text-gray-900">{participant.name}</h3>
                                            <p className="text-sm text-gray-500">Email: {participant.email}</p>
                                            {participant.cpf && <p className="text-sm text-gray-500">CPF: {participant.cpf}</p>}
                                        </div>
                                        <div className="space-x-2">
                                            <button onClick={() => handleEdit(participant)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                                            <button onClick={() => handleDelete(participant.id)} className="text-red-600 hover:text-red-900">Excluir</button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    {/* Seção para Importação de Excel */}
                    <div className="mt-6 p-4 border border-gray-300 rounded shadow-sm bg-white">
                        <h3 className="text-xl font-semibold mb-3">Importar Participantes de Planilha Excel</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            Selecione um arquivo Excel (.xlsx, .xls). A planilha deve ter cabeçalhos como 'Nome Completo', 'Email', 'CPF'.
                        </p>
                        <input 
                            type="file" 
                            id="excel-file-input"
                            accept=".xlsx, .xls" 
                            onChange={handleFileSelected}
                            className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100 mb-3
                            "/>
                        <button 
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200 disabled:opacity-50"
                            onClick={processAndImportFile}
                            disabled={!fileToImport || isLoading}
                        >
                            {isLoading && importFeedback && importFeedback.message.includes("Processando") ? 'Processando...' : 'Importar Planilha'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminParticipantsPage;
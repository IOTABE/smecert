// Supondo que você tenha uma URL base para sua API
const API_URL = '/api'; // Ou sua URL completa: 'http://localhost:5000/api'

// ... (outras funções como getParticipants, createParticipant, etc.)

export const getParticipants = async () => {
    // Substitua pelo mock ou implementação real
    // const response = await fetch(`${API_URL}/participants`);
    // if (!response.ok) throw new Error('Failed to fetch participants');
    // return response.json();
    return Promise.resolve([ // Mock data
        { id: 1, name: 'Alice Silva', email: 'alice@example.com', cpf: '111.111.111-11' },
        { id: 2, name: 'Bruno Costa', email: 'bruno@example.com', cpf: '222.222.222-22' },
    ]);
};

export const createParticipant = async (participantData) => {
    // const response = await fetch(`${API_URL}/participants`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(participantData),
    // });
    // if (!response.ok) throw new Error('Failed to create participant');
    // return response.json();
    return Promise.resolve({ ...participantData, id: Date.now() }); // Mock
};

export const updateParticipant = async (id, participantData) => {
    // const response = await fetch(`${API_URL}/participants/${id}`, {
    //     method: 'PUT',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(participantData),
    // });
    // if (!response.ok) throw new Error('Failed to update participant');
    // return response.json();
     return Promise.resolve({ ...participantData, id }); // Mock
};

export const deleteParticipant = async (id) => {
    // const response = await fetch(`${API_URL}/participants/${id}`, {
    //     method: 'DELETE',
    // });
    // if (!response.ok) throw new Error('Failed to delete participant');
    // return response.json(); // Ou apenas verificar o status
    return Promise.resolve({ message: 'Deleted' }); // Mock
};


// Nova função para importação em lote
export const importParticipantsBatch = async (participantsArray) => {
    const response = await fetch(`${API_URL}/participants/import`, { // Endpoint do backend
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Adicione headers de autenticação se necessário (ex: 'Authorization': `Bearer ${token}`)
        },
        body: JSON.stringify(participantsArray),
    });

    if (!response.ok) {
        // Tenta pegar uma mensagem de erro do corpo da resposta, se houver
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido na importação.' }));
        throw new Error(errorData.message || `Falha na importação. Status: ${response.status}`);
    }
    return response.json(); // Espera uma resposta como { success: true, message: "...", results: [...] }
};
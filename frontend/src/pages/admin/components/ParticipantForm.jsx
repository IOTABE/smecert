// filepath: /home/ctic/Development/smecert/frontend/src/pages/admin/components/ParticipantForm.jsx
import React, { useState, useEffect } from 'react';

const ParticipantForm = ({ onSubmit, initialData = {}, onCancel }) => {
    const [participant, setParticipant] = useState({
        name: '',
        email: '',
        // Adicione outros campos conforme o modelo Participant do backend (ex: 'cpf', 'organization', 'role_type')
    });

    useEffect(() => {
        if (initialData) {
            setParticipant({
                name: initialData.name || '',
                email: initialData.email || '',
                // ... outros campos
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setParticipant(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(participant);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow-md">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome Completo</label>
                <input type="text" name="name" id="name" value={participant.name} onChange={handleChange} required
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" name="email" id="email" value={participant.email} onChange={handleChange} required
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            {/* Adicione outros campos aqui (ex: CPF, Organização, Tipo de Inscrição) */}
            <div className="flex justify-end space-x-3">
                 {onCancel && (
                    <button type="button" onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                        Cancelar
                    </button>
                )}
                <button type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                    {initialData && initialData.id ? 'Atualizar Participante' : 'Adicionar Participante'}
                </button>
            </div>
        </form>
    );
};

export default ParticipantForm;
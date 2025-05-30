import React from 'react';

const ParticipantList = ({ participants, onEdit, onDelete }) => {
    if (!participants || participants.length === 0) {
        return <p className="text-gray-600">Nenhum participante encontrado.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-lg">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        {/* Adicione outros cabeçalhos se necessário */}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {participants.map(participant => (
                        <tr key={participant.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{participant.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{participant.email}</td>
                            {/* Adicione outras células se necessário */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <button
                                    onClick={() => onEdit(participant)}
                                    className="text-indigo-600 hover:text-indigo-900"
                                >
                                    Editar
                                </button>
                                <button
                                    onClick={() => onDelete(participant.id)}
                                    className="text-red-600 hover:text-red-900"
                                >
                                    Excluir
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ParticipantList;
// filepath: /home/ctic/Development/smecert/frontend/src/pages/admin/AdminAttendancePage.jsx
import React, { useState, useEffect } from 'react';
// import { getEvents } from '../../services/eventService'; // Mocked
// import { getParticipantsForEvent, markAttendance } from '../../services/attendanceService'; // Mocked

// Mock de serviços
const mockEventsForAttendance = [
    { id: 1, name: 'Conferência de Tecnologia' },
    { id: 2, name: 'Workshop de Design UX' },
];
const mockParticipantsForEvent = {
    1: [ // Event ID 1
        { id: 1, name: 'Alice Silva', email: 'alice@example.com', present: false },
        { id: 3, name: 'Carlos Pereira', email: 'carlos@example.com', present: true },
    ],
    2: [ // Event ID 2
        { id: 2, name: 'Bruno Costa', email: 'bruno@example.com', present: false },
    ],
};

const getEventsForAttendance = async () => Promise.resolve(mockEventsForAttendance);
const getParticipantsForEvent = async (eventId) => Promise.resolve(mockParticipantsForEvent[eventId] || []);
const markAttendance = async (eventId, participantId, isPresent) => {
    console.log(`Marcando presença para evento ${eventId}, participante ${participantId}: ${isPresent}`);
    // Atualizar mock (ou estado local)
    const eventParticipants = mockParticipantsForEvent[eventId];
    if (eventParticipants) {
        const pIndex = eventParticipants.findIndex(p => p.id === participantId);
        if (pIndex > -1) {
            mockParticipantsForEvent[eventId][pIndex].present = isPresent;
        }
    }
    return Promise.resolve({ success: true });
};


const AdminAttendancePage = () => {
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [participants, setParticipants] = useState([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoadingEvents(true);
            try {
                // const data = await getEvents(); // API real
                setEvents(mockEventsForAttendance); // Mock
            } catch (err) {
                setError('Falha ao carregar eventos.');
                console.error(err);
            } finally {
                setIsLoadingEvents(false);
            }
        };
        fetchEvents();
    }, []);

    useEffect(() => {
        if (!selectedEventId) {
            setParticipants([]);
            return;
        }
        const fetchParticipants = async () => {
            setIsLoadingParticipants(true);
            setError(null);
            try {
                // const data = await getParticipantsForEvent(selectedEventId); // API real
                const data = await getParticipantsForEvent(parseInt(selectedEventId)); // Mock
                setParticipants(data);
            } catch (err) {
                setError(`Falha ao carregar participantes para o evento ${selectedEventId}.`);
                console.error(err);
                setParticipants([]);
            } finally {
                setIsLoadingParticipants(false);
            }
        };
        fetchParticipants();
    }, [selectedEventId]);

    const handleAttendanceChange = async (participantId, isPresent) => {
        try {
            // await markAttendance(selectedEventId, participantId, isPresent); // API real
            await markAttendance(parseInt(selectedEventId), participantId, isPresent); // Mock
            // Atualiza o estado local para refletir a mudança imediatamente
            setParticipants(prev => 
                prev.map(p => p.id === participantId ? { ...p, present: isPresent } : p)
            );
            alert('Presença atualizada!');
        } catch (err) {
            alert('Falha ao atualizar presença.');
            console.error(err);
            // Reverter a mudança no UI se a API falhar (opcional)
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-6">Gerenciar Frequência</h2>

            <div className="mb-6">
                <label htmlFor="event-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Selecione um Evento:
                </label>
                {isLoadingEvents ? <p>Carregando eventos...</p> : (
                    <select
                        id="event-select"
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="">-- Selecione --</option>
                        {events.map(event => (
                            <option key={event.id} value={event.id}>{event.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            {selectedEventId && (
                isLoadingParticipants ? <p>Carregando participantes...</p> : (
                    participants.length > 0 ? (
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                            <h3 className="text-xl font-medium p-4">Participantes do Evento: {events.find(e=>e.id === parseInt(selectedEventId))?.name}</h3>
                            <ul className="divide-y divide-gray-200">
                                {participants.map(participant => (
                                    <li key={participant.id} className="px-6 py-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-lg font-medium text-gray-900">{participant.name}</p>
                                            <p className="text-sm text-gray-500">{participant.email}</p>
                                        </div>
                                        <div className="flex items-center">
                                            <input 
                                                type="checkbox"
                                                id={`attendance-${participant.id}`}
                                                checked={participant.present}
                                                onChange={(e) => handleAttendanceChange(participant.id, e.target.checked)}
                                                className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                            />
                                            <label htmlFor={`attendance-${participant.id}`} className="ml-2 block text-sm text-gray-900">
                                                Presente
                                            </label>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p>Nenhum participante encontrado para este evento ou o evento não tem participantes inscritos.</p>
                    )
                )
            )}
        </div>
    );
};

export default AdminAttendancePage;
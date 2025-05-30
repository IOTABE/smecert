import React, { useState, useEffect, useCallback } from 'react';
// Supondo que você tenha serviços para buscar eventos, participantes de um evento e registrar frequência
// import { fetchEvents, fetchParticipantsForEvent, recordAttendance } from '../../../services/api';

// Mock API functions (substitua com chamadas reais)
const mockAttendanceAPIService = {
    fetchEvents: async () => { // Reutilizando o mock de eventos
        const localEvents = localStorage.getItem('mock_events');
        if (localEvents) return JSON.parse(localEvents);
        return [
            { id: 1, name: 'Conferência de Tecnologia', date: new Date(2025, 10, 15, 9, 0).toISOString() },
            { id: 2, name: 'Workshop de React', date: new Date(2025, 11, 5, 14, 0).toISOString() },
        ];
    },
    fetchParticipantsForEvent: async (eventId) => {
        console.log(`API: Fetching participants for event ${eventId}...`);
        await new Promise(resolve => setTimeout(resolve, 400));
        // Simula participantes inscritos e seu status de presença (carregado do localStorage se existir)
        const allParticipants = JSON.parse(localStorage.getItem('mock_participants') || '[]');
        const attendanceRecords = JSON.parse(localStorage.getItem(`mock_attendance_event_${eventId}`) || '{}');

        // Simula que alguns participantes estão inscritos em certos eventos
        if (eventId === 1) { // Conferência de Tecnologia
            return allParticipants.slice(0, 2).map(p => ({ ...p, isPresent: attendanceRecords[p.id] || false }));
        }
        if (eventId === 2) { // Workshop de React
             return allParticipants.slice(1, 2).map(p => ({ ...p, isPresent: attendanceRecords[p.id] || false }));
        }
        return [];
    },
    recordAttendance: async (eventId, participantId, isPresent) => {
        console.log(`API: Recording attendance for event ${eventId}, participant ${participantId}, present: ${isPresent}`);
        await new Promise(resolve => setTimeout(resolve, 200));
        // Salva no localStorage
        const attendanceRecords = JSON.parse(localStorage.getItem(`mock_attendance_event_${eventId}`) || '{}');
        attendanceRecords[participantId] = isPresent;
        localStorage.setItem(`mock_attendance_event_${eventId}`, JSON.stringify(attendanceRecords));
        return { success: true, eventId, participantId, isPresent };
    }
};


const AttendanceManager = () => {
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [participants, setParticipants] = useState([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(false);
    const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
    const [error, setError] = useState(null);

    // Carregar eventos
    useEffect(() => {
        const loadEvents = async () => {
            setIsLoadingEvents(true);
            setError(null);
            try {
                // const data = await fetchEvents(); // TODO: API call
                const data = await mockAttendanceAPIService.fetchEvents();
                setEvents(data);
            } catch (err) {
                console.error("Erro ao carregar eventos:", err);
                setError("Falha ao carregar eventos.");
            } finally {
                setIsLoadingEvents(false);
            }
        };
        loadEvents();
    }, []);

    // Carregar participantes quando um evento é selecionado
    useEffect(() => {
        if (!selectedEventId) {
            setParticipants([]);
            return;
        }
        const loadParticipants = async () => {
            setIsLoadingParticipants(true);
            setError(null);
            try {
                // const data = await fetchParticipantsForEvent(selectedEventId); // TODO: API call
                const data = await mockAttendanceAPIService.fetchParticipantsForEvent(Number(selectedEventId));
                setParticipants(data.map(p => ({ ...p, isPresent: p.isPresent || false })));
            } catch (err) {
                console.error(`Erro ao carregar participantes para o evento ${selectedEventId}:`, err);
                setError("Falha ao carregar participantes.");
                setParticipants([]);
            } finally {
                setIsLoadingParticipants(false);
            }
        };
        loadParticipants();
    }, [selectedEventId]);

    const handleEventChange = (e) => {
        setSelectedEventId(e.target.value);
    };

    const handleAttendanceChange = async (participantId, isPresent) => {
        // Atualiza o estado local imediatamente para feedback visual
        setParticipants(prev =>
            prev.map(p => (p.id === participantId ? { ...p, isPresent } : p))
        );
        try {
            // await recordAttendance(selectedEventId, participantId, isPresent); // TODO: API call
            await mockAttendanceAPIService.recordAttendance(Number(selectedEventId), participantId, isPresent);
            // Poderia adicionar um feedback de sucesso aqui
        } catch (err) {
            console.error("Erro ao registrar frequência:", err);
            // Reverte a mudança no estado em caso de erro
            setParticipants(prev =>
                prev.map(p => (p.id === participantId ? { ...p, isPresent: !isPresent } : p))
            );
        }
    };

    return (
        <div>
            <h1>Gerenciador de Frequência</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div>
                <label>Selecione um evento:</label>
                <select value={selectedEventId} onChange={handleEventChange}>
                    <option value="">--Selecione--</option>
                    {events.map(event => (
                        <option key={event.id} value={event.id}>{event.name}</option>
                    ))}
                </select>
            </div>
            {isLoadingParticipants ? (
                <p>Carregando participantes...</p>
            ) : (
                <ul>
                    {participants.map(participant => (
                        <li key={participant.id}>
                            {participant.name}
                            <label>
                                <input
                                    type="checkbox"
                                    checked={participant.isPresent}
                                    onChange={() => handleAttendanceChange(participant.id, !participant.isPresent)}
                                />
                                Presente
                            </label>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AttendanceManager;
// filepath: /home/ctic/Development/smecert/frontend/src/pages/admin/AdminEventsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import EventList from './events/EventList';
import EventForm from './events/EventForm';
// import { fetchEvents, createEvent, updateEvent, deleteEvent } from '../../services/api'; // Exemplo de serviço de API

// Mock API functions (substitua com chamadas reais)
const mockAPIService = {
    fetchEvents: async () => {
        console.log('API: Fetching events...');
        // Simula um delay da API
        await new Promise(resolve => setTimeout(resolve, 500));
        // Tenta carregar do localStorage ou usa dados mock
        const localEvents = localStorage.getItem('mock_events');
        if (localEvents) return JSON.parse(localEvents);
        return [
            { id: 1, name: 'Conferência de Tecnologia', date: new Date(2025, 10, 15, 9, 0).toISOString(), location: 'Centro de Convenções', description: 'Discussão sobre o futuro da IA.' },
            { id: 2, name: 'Workshop de React', date: new Date(2025, 11, 5, 14, 0).toISOString(), location: 'Online', description: 'Aprenda React avançado.' },
        ];
    },
    createEvent: async (eventData) => {
        console.log('API: Creating event...', eventData);
        await new Promise(resolve => setTimeout(resolve, 300));
        const newEvent = { ...eventData, id: Date.now() }; // Simula ID do backend
        // Salva no localStorage
        const events = JSON.parse(localStorage.getItem('mock_events') || '[]');
        events.push(newEvent);
        localStorage.setItem('mock_events', JSON.stringify(events));
        return newEvent;
    },
    updateEvent: async (eventId, eventData) => {
        console.log('API: Updating event...', eventId, eventData);
        await new Promise(resolve => setTimeout(resolve, 300));
        // Atualiza no localStorage
        let events = JSON.parse(localStorage.getItem('mock_events') || '[]');
        events = events.map(e => e.id === eventId ? { ...e, ...eventData, id: eventId } : e);
        localStorage.setItem('mock_events', JSON.stringify(events));
        return { ...eventData, id: eventId };
    },
    deleteEvent: async (eventId) => {
        console.log('API: Deleting event...', eventId);
        await new Promise(resolve => setTimeout(resolve, 300));
        // Remove do localStorage
        let events = JSON.parse(localStorage.getItem('mock_events') || '[]');
        events = events.filter(e => e.id !== eventId);
        localStorage.setItem('mock_events', JSON.stringify(events));
        return { success: true };
    }
};


const AdminEventsPage = () => {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null); // Para edição

    const loadEvents = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // const data = await fetchEvents(); // TODO: API call
            const data = await mockAPIService.fetchEvents();
            setEvents(data);
            localStorage.setItem('mock_events', JSON.stringify(data)); // Salva no localStorage para persistência da simulação
        } catch (err) {
            console.error("Erro ao carregar eventos:", err);
            setError("Falha ao carregar eventos. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    const handleCreateNew = () => {
        setEditingEvent(null);
        setShowForm(true);
    };

    const handleEdit = (event) => {
        setEditingEvent(event);
        setShowForm(true);
    };

    const handleDelete = async (eventId) => {
        if (window.confirm('Tem certeza que deseja excluir este evento?')) {
            setIsLoading(true);
            try {
                // await deleteEvent(eventId); // TODO: API call
                await mockAPIService.deleteEvent(eventId);
                // setEvents(prev => prev.filter(e => e.id !== eventId)); // Atualiza o estado localmente
                loadEvents(); // Recarrega para refletir a mudança
                alert('Evento excluído com sucesso!');
            } catch (err) {
                console.error("Erro ao excluir evento:", err);
                setError("Falha ao excluir evento.");
                alert('Erro ao excluir evento.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSubmitForm = async (eventData) => {
        setIsLoading(true);
        setError(null);
        try {
            if (editingEvent) {
                // await updateEvent(editingEvent.id, eventData); // TODO: API call
                await mockAPIService.updateEvent(editingEvent.id, eventData);
                alert('Evento atualizado com sucesso!');
            } else {
                // await createEvent(eventData); // TODO: API call
                await mockAPIService.createEvent(eventData);
                alert('Evento criado com sucesso!');
            }
            setShowForm(false);
            setEditingEvent(null);
            loadEvents(); // Recarrega a lista
        } catch (err) {
            console.error("Erro ao salvar evento:", err);
            setError("Falha ao salvar evento.");
            alert(`Erro ao salvar evento: ${err.message || 'Verifique o console.'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Gerenciar Eventos</h2>
                <button
                    onClick={handleCreateNew}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-200"
                >
                    Adicionar Novo Evento
                </button>
            </div>

            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert"><p>{error}</p></div>}
            
            {showForm && (
                <div className="mb-6">
                    <EventForm
                        onSubmit={handleSubmitForm}
                        initialData={editingEvent}
                        onCancel={() => { setShowForm(false); setEditingEvent(null); }}
                    />
                </div>
            )}

            {isLoading && <p>Carregando eventos...</p>}
            {!isLoading && !error && <EventList events={events} onEdit={handleEdit} onDelete={handleDelete} />}
        </div>
    );
};

export default AdminEventsPage;
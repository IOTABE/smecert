// filepath: /home/ctic/Development/smecert/frontend/src/pages/admin/AdminEventsPage.jsx
import React, { useState, useEffect } from 'react';
import EventForm from './components/EventForm';
// import { getEvents, createEvent, updateEvent, deleteEvent } from '../../services/eventService'; // Mocked

// Mock de serviços - substitua por chamadas de API reais
const mockEvents = [
    { id: 1, name: 'Conferência de Tecnologia', date: '2025-07-15', location: 'Centro de Convenções', description: 'Discussão sobre o futuro da IA.' },
    { id: 2, name: 'Workshop de Design UX', date: '2025-08-02', location: 'Online', description: 'Aprenda os princípios do design centrado no usuário.' },
];

const getEvents = async () => Promise.resolve(mockEvents);
const createEvent = async (event) => Promise.resolve({ ...event, id: Date.now() }); // Simula criação
const updateEvent = async (id, event) => Promise.resolve({ ...event, id });
const deleteEvent = async (id) => Promise.resolve();


const AdminEventsPage = () => {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null); // Para edição

    const fetchEvents = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // const data = await getEvents(); // Chamada de API real
            setEvents(mockEvents); // Usando mock
        } catch (err) {
            setError('Falha ao carregar eventos.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

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
            try {
                // await deleteEvent(eventId); // Chamada de API real
                setEvents(prev => prev.filter(e => e.id !== eventId)); // Atualiza mock
                alert('Evento excluído com sucesso!');
            } catch (err) {
                alert('Falha ao excluir evento.');
                console.error(err);
            }
        }
    };

    const handleSubmitForm = async (eventData) => {
        setIsLoading(true);
        try {
            if (editingEvent && editingEvent.id) {
                // await updateEvent(editingEvent.id, eventData); // Chamada de API real
                setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...eventData, id: editingEvent.id } : e));
                alert('Evento atualizado com sucesso!');
            } else {
                // await createEvent(eventData); // Chamada de API real
                setEvents(prev => [...prev, { ...eventData, id: Date.now() }]); // Adiciona ao mock
                alert('Evento criado com sucesso!');
            }
            setShowForm(false);
            setEditingEvent(null);
            // fetchEvents(); // Re-fetch ou atualize o estado localmente
        } catch (err) {
            alert(`Falha ao ${editingEvent ? 'atualizar' : 'criar'} evento.`);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !showForm) return <p>Carregando eventos...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Gerenciar Eventos</h2>
                {!showForm && (
                    <button 
                        onClick={handleCreateNew}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-200">
                        Criar Novo Evento
                    </button>
                )}
            </div>

            {showForm ? (
                <EventForm 
                    onSubmit={handleSubmitForm} 
                    initialData={editingEvent || {}} 
                    onCancel={() => { setShowForm(false); setEditingEvent(null); }}
                />
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <ul className="divide-y divide-gray-200">
                        {events.length === 0 && !isLoading && <li className="px-6 py-4">Nenhum evento encontrado.</li>}
                        {events.map(event => (
                            <li key={event.id} className="px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">{event.name}</h3>
                                        <p className="text-sm text-gray-500">Data: {new Date(event.date).toLocaleDateString()}</p>
                                        <p className="text-sm text-gray-500">Local: {event.location}</p>
                                    </div>
                                    <div className="space-x-2">
                                        <button onClick={() => handleEdit(event)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                                        <button onClick={() => handleDelete(event.id)} className="text-red-600 hover:text-red-900">Excluir</button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default AdminEventsPage;
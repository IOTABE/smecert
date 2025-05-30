import React, { useState, useEffect } from 'react';

const EventForm = ({ onSubmit, initialData = null, onCancel }) => {
    const [event, setEvent] = useState({
        name: '',
        date: '',
        location: '',
        description: '',
    });

    useEffect(() => {
        if (initialData) {
            setEvent({
                name: initialData.name || '',
                // Formate a data para o input datetime-local se necessário
                date: initialData.date ? new Date(initialData.date).toISOString().slice(0, 16) : '',
                location: initialData.location || '',
                description: initialData.description || '',
            });
        } else {
            setEvent({ name: '', date: '', location: '', description: '' }); // Reset for new event
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEvent(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: Adicionar validação mais robusta
        if (!event.name || !event.date) {
            alert('Nome e Data do evento são obrigatórios.');
            return;
        }
        onSubmit(event);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow-md">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome do Evento</label>
                <input
                    type="text"
                    name="name"
                    id="name"
                    value={event.name}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>
            <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">Data e Hora</label>
                <input
                    type="datetime-local"
                    name="date"
                    id="date"
                    value={event.date}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>
            <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">Local</label>
                <input
                    type="text"
                    name="location"
                    id="location"
                    value={event.location}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
                <textarea
                    name="description"
                    id="description"
                    rows="3"
                    value={event.description}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                ></textarea>
            </div>
            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    {initialData ? 'Atualizar Evento' : 'Criar Evento'}
                </button>
            </div>
        </form>
    );
};

export default EventForm;
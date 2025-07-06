import React, { useState, useMemo, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useSupabaseAuth, useUserSettings, useTasks } from './supabaseService';
import { PlusCircle, Edit, Trash2, X } from "lucide-react";
import './App.css';

// Registro do Chart.js (corrigido)
ChartJS.register(ArcElement, Tooltip, Legend);

// --- Componente Principal da Aplicação ---
export default function App() {
    // --- Estados do Supabase ---
    const { userId, isAuthReady, error: authError } = useSupabaseAuth();
    const { totalWeeklyHours, error: settingsError, handleTotalHoursChange } = useUserSettings(userId, isAuthReady);
    const { tasks, isLoading, error: tasksError, handleSaveTask, handleDeleteTask } = useTasks(userId, isAuthReady);
    
    // --- Estados de UI ---
    const [editingTask, setEditingTask] = useState(null);
    const [currentTheme, setCurrentTheme] = useState(1);
    const [isCardFlipped, setIsCardFlipped] = useState(false);

    // --- Theme Management ---
    useEffect(() => {
        document.body.className = `theme-${currentTheme}`;
    }, [currentTheme]);

    const themes = [
        { id: 1, name: 'Ocean Blue', bg: '#0B1D3A', card: '#7FA1C2' },
        { id: 2, name: 'Forest Green', bg: '#1B3B2F', card: '#A9DCC3' },
        { id: 3, name: 'Royal Purple', bg: '#2C1A47', card: '#CAB8FF' },
        { id: 4, name: 'Lavender', bg: '#3A2E39', card: '#D9C4DD' },
        { id: 5, name: 'Steel Blue', bg: '#223843', card: '#9DB4C0' }
    ];

    const handleThemeChange = (themeId) => {
        setCurrentTheme(themeId);
    };

    // --- Error Handling ---
    const error = authError || settingsError || tasksError;

    // --- Cálculos de Tempo ---
    const { usedHours, remainingHours } = useMemo(() => {
        const used = tasks.reduce((acc, task) => acc + (Number(task.duration) || 0), 0);
        const total = Number(totalWeeklyHours) || 0;
        return {
            usedHours: used,
            remainingHours: Math.max(0, total - used),
        };
    }, [tasks, totalWeeklyHours]);

    // --- Funções do Modal com Card Flip ---
    const openModal = (task = null) => {
        setEditingTask(task);
        setIsCardFlipped(true);
    };

    const closeModal = () => {
        setIsCardFlipped(false);
        setTimeout(() => {
        setEditingTask(null);
        }, 400); // Wait for animation to complete
    };

    // --- Dados para o Gráfico ---
    const chartData = useMemo(() => {
        const labels = tasks.map(task => task.name);
        const data = tasks.map(task => task.duration);
        const colors = tasks.map(task => task.color);

        if (remainingHours > 0) {
            labels.push('Tempo Livre');
            data.push(remainingHours);
            colors.push('#d1d5db'); // Cinza para tempo livre
        }

        return {
            labels,
            datasets: [{
                label: 'Horas',
                data,
                backgroundColor: colors,
                borderColor: '#1f2937', // Borda escura
                borderWidth: 2,
            }],
        };
    }, [tasks, remainingHours]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed !== null) {
                            label += `${context.parsed}h`;
                        }
                        return label;
                    }
                }
            }
        },
    };
    
    // --- Componente de Carregamento ---
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <div className="text-center">
                    <svg className="animate-spin h-10 w-10 text-blue-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-4 text-lg">Carregando seus dados...</p>
                </div>
            </div>
        );
    }

    // --- Tratamento de erros ---
    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <div className="text-center p-8 bg-gray-800 rounded-xl max-w-md">
                    <h2 className="text-2xl font-bold text-red-400 mb-4">Erro</h2>
                    <p className="mb-6">{error}</p>
                    <button 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        onClick={() => window.location.reload()}
                    >
                        Tentar novamente
                    </button>
                </div>
            </div>
        );
    }

    // --- Renderização Principal ---
    return (
        <div className="main-layout">
            <div className="left-column">
                {/* Top left card: Doughnut chart and total hours */}
                <div className="card">
                    <div className="card-title">Horas Semanais</div>
                    <div className="doughnut-container">
                        <Doughnut data={chartData} options={chartOptions} />
                        <div style={{ marginTop: '1rem', fontSize: '1.1rem' }}>
                            Total disponível: <strong>{totalWeeklyHours}h</strong>
                        </div>
                    </div>
                </div>
                {/* Bottom left card: Edit total hours, show free/occupied */}
                <div className="card">
                    <div className="card-title">Editar Horas Semanais</div>
                    <div className="input-group">
                        <label htmlFor="total-hours" className="input-label">Total de Horas na Semana</label>
                        <input
                            type="number"
                            id="total-hours"
                            value={totalWeeklyHours}
                            onChange={handleTotalHoursChange}
                            className="input-field"
                        />
                    </div>
                    <div className="hours-info">
                        <div className="hours-row">
                            <span>Horas Livres:</span>
                            <span style={{ color: '#22d3ee', fontWeight: 'bold' }}>{remainingHours}h</span>
                        </div>
                        <div className="hours-row">
                            <span>Horas Ocupadas:</span>
                            <span style={{ color: '#f472b6', fontWeight: 'bold' }}>{usedHours}h</span>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Right side: Task manager card with flip animation */}
            <div className="task-card">
                <div className="card-flip-container">
                    <div className={`card-flip ${isCardFlipped ? 'flipped' : ''}`}>
                        {/* Front of card - Task List */}
                        <div className="card-front">
                            <div className="card-content-transition">
                                <div className="card-title">Gerenciador de Tarefas</div>
                                <div className="flex justify-between items-center mb-6">
                                    <button
                                        onClick={() => openModal()}
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105"
                                    >
                                        <PlusCircle className="h-5 w-5" />
                                        <span>Adicionar</span>
                                    </button>
                                </div>
                                <div className="task-list">
                                    {tasks.length > 0 ? (
                                        tasks.map(task => (
                                            <TaskItem key={task.id} task={task} onEdit={openModal} onDelete={handleDeleteTask} />
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-gray-500">
                                            <p>Nenhuma tarefa cadastrada ainda.</p>
                                            <p className="text-sm">Clique em "Adicionar" para criar sua primeira tarefa.</p>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Theme Switcher */}
                                <div className="theme-switcher">
                                    <h4>Escolha um tema</h4>
                                    <div className="theme-options">
                                        {themes.map(theme => (
                                            <button
                                                key={theme.id}
                                                className={`theme-option ${currentTheme === theme.id ? 'active' : ''}`}
                                                onClick={() => handleThemeChange(theme.id)}
                                                title={theme.name}
                                                style={{
                                                    '--bg-color': theme.bg,
                                                    '--card-color': theme.card
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Back of card - Task Form */}
                        <div className="card-back">
                            <div className="card-content-transition">
                                <TaskForm
                                    task={editingTask}
                                    onSave={(taskData) => {
                                        handleSaveTask(taskData, () => {
                                            // Immediate feedback - the real-time subscription will handle the actual update
                                            closeModal();
                                        });
                                    }}
                                    onClose={closeModal}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Componente do Item da Tarefa ---
function TaskItem({ task, onEdit, onDelete }) {
    return (
        <div className="task-item">
            <div className="task-info">
                <div className="task-color-indicator" style={{ backgroundColor: task.color }}></div>
                <div className="task-details">
                    <h4>{task.name}</h4>
                    <p>{task.duration}h por semana</p>
                </div>
            </div>
            <div className="task-actions">
                <button onClick={() => onEdit(task)} title="Editar">
                    <Edit className="h-5 w-5" />
                </button>
                <button onClick={() => onDelete(task.id)} title="Excluir">
                    <Trash2 className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}

// --- Componente do Formulário da Tarefa (Modal) ---
function TaskForm({ task, onSave, onClose }) {
    const [formData, setFormData] = useState({
        id: task?.id || crypto.randomUUID(),
        name: task?.name || '',
        duration: task?.duration || '',
        color: task?.color || '#3b82f6',
        description: task?.description || '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validação de campos
        if (!formData.name.trim()) {
            alert('Por favor, informe o nome da tarefa.');
            return;
        }
        
        const duration = Number(formData.duration);
        if (isNaN(duration) || duration <= 0) {
            alert('Por favor, informe uma duração válida (maior que zero).');
            return;
        }
        
        onSave({
            ...formData,
            duration: duration
        });
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">{task ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                    <X className="h-6 w-6" />
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                <div className="space-y-6 flex-1">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-2">Nome da Tarefa *</label>
                        <input 
                            type="text" 
                            name="name" 
                            id="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            required 
                            className="w-full bg-white/90 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all" 
                            placeholder="Digite o nome da tarefa"
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-grow">
                            <label htmlFor="duration" className="block text-sm font-medium mb-2">Duração (horas/semana) *</label>
                            <input 
                                type="number" 
                                name="duration" 
                                id="duration" 
                                value={formData.duration} 
                                onChange={handleChange} 
                                required 
                                min="0.1" 
                                step="0.1" 
                                className="w-full bg-white/90 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all" 
                                placeholder="0.0"
                            />
                        </div>
                        <div>
                            <label htmlFor="color" className="block text-sm font-medium mb-2">Cor</label>
                            <input 
                                type="color" 
                                name="color" 
                                id="color" 
                                value={formData.color} 
                                onChange={handleChange} 
                                className="w-16 h-12 p-1 bg-white/90 border border-gray-300 rounded-lg cursor-pointer transition-all hover:scale-105" 
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium mb-2">Observação (Opcional)</label>
                        <textarea 
                            name="description" 
                            id="description" 
                            value={formData.description} 
                            onChange={handleChange} 
                            rows="4" 
                            className="w-full bg-white/90 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all resize-none"
                            placeholder="Adicione uma observação sobre a tarefa..."
                        ></textarea>
                    </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="py-3 px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                    >
                        {task ? 'Atualizar' : 'Criar'} Tarefa
                    </button>
                </div>
            </form>
        </div>
    );
}

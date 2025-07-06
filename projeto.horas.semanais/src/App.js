import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useSupabaseAuth, useUserSettings, useTasks } from './supabaseService';
import { PlusCircle, Edit, Trash2, X } from "lucide-react";
import './App.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// --- Componente Principal da Aplicação ---
export default function App() {
    // --- Estados do Supabase ---
    const { userId, isAuthReady } = useSupabaseAuth();
    const { totalWeeklyHours, handleTotalHoursChange } = useUserSettings(userId, isAuthReady);
    const { tasks, isLoading, handleSaveTask, handleDeleteTask } = useTasks(userId, isAuthReady);
    
    // --- Estados de UI ---
    const [editingTask, setEditingTask] = useState(null);
    const [currentTheme, setCurrentTheme] = useState(1);
    const [isCardFlipped, setIsCardFlipped] = useState(false);
    const leftColRef = useRef(null);
    const bottomLeftCardRef = useRef(null);
    const [rightCardHeight, setRightCardHeight] = useState('auto');

    // --- Theme Management ---
    useEffect(() => {
        document.body.className = `theme-${currentTheme}`;
    }, [currentTheme]);

    // --- Sync Task Card Height with Bottom Left Card using ResizeObserver ---
    useEffect(() => {
        if (!bottomLeftCardRef.current) return;
        const updateHeight = () => {
            setRightCardHeight(bottomLeftCardRef.current.offsetHeight + 'px');
        };
        updateHeight();
        const observer = new window.ResizeObserver(updateHeight);
        observer.observe(bottomLeftCardRef.current);
        return () => observer.disconnect();
    }, [tasks, totalWeeklyHours, isLoading, isCardFlipped]);

    const themes = [
        { id: 1, name: 'Nord Night', bg: '#1C1F26', card: '#2E3440' },
        { id: 2, name: 'Oceanic', bg: '#1E2D3D', card: '#3B4C5E' },
        { id: 3, name: 'Slate', bg: '#2A2E35', card: '#43484F' },
        { id: 4, name: 'Graphite', bg: '#202124', card: '#3C4043' },
        { id: 5, name: 'Blue Steel', bg: '#2C3E50', card: '#34495E' }
    ];

    const handleThemeChange = (themeId) => {
        setCurrentTheme(themeId);
    };

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

    // --- Dados para o Gráfico (Chart.js Doughnut) ---
    const chartData = useMemo(() => {
        const labels = tasks.map(task => task.name);
        const data = tasks.map(task => task.duration);
        const colors = tasks.map(task => task.color);
        if (remainingHours > 0) {
            labels.push('Tempo Livre');
            data.push(remainingHours);
            colors.push('#d1d5db');
        }
        return {
            labels,
            datasets: [{
                label: 'Horas',
                data,
                backgroundColor: colors,
                borderColor: '#1f2937',
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

    // --- Renderização Principal ---
    return (
        <>
            <div className="main-layout">
                <div className="left-column" ref={leftColRef}>
                    {/* Top left card: Doughnut chart and total hours */}
                    <div className="card">
                        <div className="card-title">Horas Semanais</div>
                        <div className="doughnut-container" style={{ minHeight: 260 }}>
                            <Doughnut data={chartData} options={chartOptions} />
                            <div style={{ marginTop: '1rem', fontSize: '1.1rem', fontWeight: 500 }}>
                                Horas livres para usar: <strong>{remainingHours}h</strong>
                            </div>
                        </div>
                    </div>
                    {/* Bottom left card: Edit total hours, show free/occupied */}
                    <div className="card" ref={bottomLeftCardRef}>
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
                {/* Right side: Task manager card with fade animation and synced height */}
                <div className="task-card" style={{ height: rightCardHeight }}>
                    <div className="card-fade-container">
                        {/* Task List View */}
                        <div className={`card-fade-content${!isCardFlipped ? ' active' : ''}`}>
                            <div className="card-title">Gerenciador de Tarefas</div>
                            <div className="flex justify-between items-center mb-6">
                                <button
                                    onClick={() => openModal()}
                                    className="modern-btn"
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
                                                background: `linear-gradient(45deg, ${theme.bg} 50%, ${theme.card} 50%)`
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        {/* Task Form View */}
                        <div className={`card-fade-content${isCardFlipped ? ' active centered-form' : ''}`}>
                            <TaskForm
                                task={editingTask}
                                onSave={(taskData) => {
                                    handleSaveTask(taskData, () => {
                                        closeModal();
                                    });
                                }}
                                onClose={closeModal}
                                totalWeeklyHours={totalWeeklyHours}
                                currentTasks={tasks}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
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
                <button onClick={() => onEdit(task)} title="Editar" className="modern-btn--icon">
                    <Edit className="h-5 w-5" />
                </button>
                <button onClick={() => onDelete(task.id)} title="Excluir" className="modern-btn--icon">
                    <Trash2 className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}

// --- Componente do Formulário da Tarefa (Modal) ---
function TaskForm({ task, onSave, onClose, totalWeeklyHours, currentTasks }) {
    const [formData, setFormData] = useState({
        id: task?.id || null,
        name: task?.name || '',
        duration: task?.duration || '',
        color: task?.color || '#3b82f6',
        description: task?.description || '',
    });

    // Calculate current used hours (excluding the task being edited)
    const currentUsedHours = currentTasks
        .filter(t => t.id !== task?.id) // Exclude the task being edited
        .reduce((acc, t) => acc + (Number(t.duration) || 0), 0);

    // Calculate available hours for new tasks
    const availableHours = totalWeeklyHours - currentUsedHours;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert('Por favor, informe o nome da tarefa.');
            return;
        }
        const duration = Number(formData.duration);
        if (isNaN(duration) || duration <= 0) {
            alert('Por favor, informe uma duração válida (maior que zero).');
            return;
        }
        const newTotalHours = currentUsedHours + duration;
        if (newTotalHours > totalWeeklyHours) {
            alert(`Não é possível adicionar ${duration}h. Você tem apenas ${availableHours}h disponíveis de ${totalWeeklyHours}h totais.`);
            return;
        }
        onSave({ ...formData, duration });
    };

    return (
        <div className="h-full flex flex-col task-form-card">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold tracking-tight text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
                <button
                    onClick={onClose}
                    className="modern-btn--icon"
                >
                    <X className="h-6 w-6" />
                </button>
            </div>
            {/* Hours Info */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
                <div className="flex justify-between items-center text-sm">
                    <span>Horas disponíveis:</span>
                    <span className="font-semibold text-blue-700">{availableHours}h de {totalWeeklyHours}h</span>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                    {availableHours <= 0 ?
                        'Você não tem horas disponíveis. Remova algumas tarefas ou aumente o total de horas semanais.' :
                        `Você pode adicionar até ${availableHours}h nesta tarefa.`
                    }
                </div>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-semibold mb-2 text-gray-700">Nome da Tarefa *</label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm font-medium input-sm"
                        placeholder="Digite o nome da tarefa"
                        style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.01em' }}
                    />
                </div>
                <div className="flex gap-4">
                    <div className="flex-grow">
                        <label htmlFor="duration" className="block text-sm font-semibold mb-2 text-gray-700">Duração (horas/semana) *</label>
                        <input
                            type="number"
                            name="duration"
                            id="duration"
                            value={formData.duration}
                            onChange={handleChange}
                            required
                            min="1"
                            max={availableHours}
                            step="1"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm font-medium input-sm"
                            placeholder="0"
                            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.01em' }}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                            Máximo: {availableHours}h
                        </div>
                    </div>
                    <div>
                        <label htmlFor="color" className="block text-sm font-semibold mb-2 text-gray-700">Cor</label>
                        <input
                            type="color"
                            name="color"
                            id="color"
                            value={formData.color}
                            onChange={handleChange}
                            className="w-16 h-12 p-1 bg-white border border-gray-300 rounded-lg cursor-pointer transition-all hover:scale-105 shadow-sm"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-semibold mb-2 text-gray-700">Observação (Opcional)</label>
                    <textarea
                        name="description"
                        id="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm font-medium resize-none input-sm"
                        placeholder="Adicione uma observação sobre a tarefa..."
                        style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.01em' }}
                    ></textarea>
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="modern-btn modern-btn--sm"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={availableHours <= 0}
                        className={`modern-btn modern-btn--sm${availableHours <= 0 ? ' cursor-not-allowed' : ''}`}
                        style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                        {task ? 'Atualizar' : 'Criar'} Tarefa
                    </button>
                </div>
            </form>
        </div>
    );
}

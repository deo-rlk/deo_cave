import React, { useState, useMemo, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useSupabaseAuth, useUserSettings, useTasks } from './supabaseService';
import { PlusCircle, X, LogOut, User } from "lucide-react";
import LoginPage from './LoginPage';
import { supabase } from './supabaseClient';
import './App.css';
import TaskList from './TaskList';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// --- Componente Principal da Aplicação ---
export default function App() {
    // --- Estados do Supabase ---
    const { userId, user, isAuthReady } = useSupabaseAuth();
    const { totalWeeklyHours, handleTotalHoursChange, currentTheme, handleThemeChange } = useUserSettings(userId, isAuthReady);
    const { tasks, handleSaveTask, handleDeleteTask } = useTasks(userId, isAuthReady);
    
    // --- Estados de UI ---
    const [editingTask, setEditingTask] = useState(null);
    const [isCardFlipped, setIsCardFlipped] = useState(false);

    // --- Theme Management ---
    useEffect(() => {
        const themeBackgroundCard = document.querySelector('.theme-background-card');
        if (themeBackgroundCard) {
            // Remove any existing theme classes
            themeBackgroundCard.className = themeBackgroundCard.className.replace(/theme-\d+/g, '');
            // Add the current theme class
            themeBackgroundCard.classList.add(`theme-${currentTheme}`);
            console.log('Applied theme class:', `theme-${currentTheme}`);
        }
        
        // Apply theme to body for background smoke effect
        document.body.className = document.body.className.replace(/theme-\d+/g, '');
        document.body.classList.add(`theme-${currentTheme}`);
    }, [currentTheme]);

    const themes = [
        { id: 1, name: 'Nord Night', bg: '#183D2A', card: '#647E68' },
        { id: 2, name: 'Oceanic', bg: '#2D1E2F', card: '#A37D9E' },
        { id: 3, name: 'Slate', bg: '#14213D', card: '#7D8597' },
        { id: 4, name: 'Graphite', bg: '#1E1B18', card: '#736B60' },
        { id: 5, name: 'Blue Steel', bg: '#183D3D', card: '#88A09E' }
    ];

    // --- Handle Logout ---
    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error logging out:', error);
        } else {
            window.location.reload();
        }
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

    // --- Dados para o Gráfico (Chart.js Doughnut) ---
    const chartData = useMemo(() => {
        const labels = [];
        const data = [];
        const colors = [];
        
        // Add tasks
        tasks.forEach(task => {
            labels.push(task.name);
            data.push(task.duration);
            colors.push(task.color);
        });
        
        // Add remaining time if there's any
        if (remainingHours > 0) {
            labels.push('Tempo Livre');
            data.push(remainingHours);
            colors.push('rgba(209, 213, 219, 0.8)'); // Semi-transparent gray
        }
        return {
            labels,
            datasets: [{
                label: 'Horas',
                data,
                backgroundColor: colors,
                borderColor: 'rgba(255, 255, 255, 0.15)',
                borderWidth: 3,
                hoverBorderWidth: 4,
                hoverBorderColor: 'rgba(255, 255, 255, 0.25)',
                hoverBackgroundColor: colors.map(color => {
                    // Make colors slightly brighter on hover
                    if (color.startsWith('rgba')) {
                        return color.replace('0.8)', '0.9)');
                    }
                    return color;
                })
            }],
        };
    }, [tasks, remainingHours]);

    // --- Handle Login Success ---
    const handleLoginSuccess = (user) => {
        console.log('User logged in:', user);
    };

    // --- Show login page if not authenticated ---
    if (isAuthReady && !userId) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    // --- Show loading while auth is initializing ---
    if (!isAuthReady) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Carregando...</p>
            </div>
        );
    }

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

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12,
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
        animation: {
            duration: 2200,
            easing: 'easeOutCubic'
        },
        hover: {
            animationDuration: 300
        },
        elements: {
            arc: {
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                hoverBorderWidth: 2,
                hoverBorderColor: 'rgba(255, 255, 255, 0.2)'
            }
        }
    };

    // --- Renderização Principal ---
    return (
        <>
            <div className="main-app-container">
                <div className={`theme-background-card theme-${currentTheme}`}>
                    {/* Header with user info and logout */}
                    <div className="app-header">
                        <div className="user-info">
                            <User className="user-icon" />
                            <span className="user-name">
                                {user?.user_metadata?.full_name || user?.email || 'Usuário'}
                            </span>
                        </div>
                        <button onClick={handleLogout} className="logout-btn">
                            <LogOut className="logout-icon" />
                            <span>Sair</span>
                        </button>
                    </div>

                    <div className="app-container">
                        <div className="cards-layout">
                            {/* Left Column Container */}
                            <div className="left-column-container">
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
                                <div className="card">
                                    <div className="card-title">Editar Horas Semanais</div>
                                    {/* Mini Card: Total de Horas na Semana with controls */}
                                    <div className="miniCard">
                                        <div className="miniCardTitle">Total de Horas na Semana</div>
                                        <div className="miniCardRow">
                                            <button
                                                type="button"
                                                className="modern-btn--icon"
                                                onClick={() => handleTotalHoursChange(Math.max(1, Number(totalWeeklyHours) - 5))}
                                                disabled={Number(totalWeeklyHours) <= 1}
                                                aria-label="Diminuir 5"
                                            >
                                                -5
                                            </button>
                                            <button
                                                type="button"
                                                className="modern-btn--icon"
                                                onClick={() => handleTotalHoursChange(Math.max(1, Number(totalWeeklyHours) - 1))}
                                                disabled={Number(totalWeeklyHours) <= 1}
                                                aria-label="Diminuir duração"
                                            >
                                                –
                                            </button>
                                            <div style={{ minWidth: 36, textAlign: 'center', fontWeight: 900, fontSize: '1.5rem', color: themes[currentTheme-1].bg, background: 'transparent', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', border: 'none', fontFamily: 'Montserrat, Inter, Arial, sans-serif', letterSpacing: '0.02em' }}>
                                                {totalWeeklyHours}
                                            </div>
                                            <button
                                                type="button"
                                                className="modern-btn--icon"
                                                onClick={() => handleTotalHoursChange(Math.min(Number(totalWeeklyHours) + 1, 168))}
                                                disabled={Number(totalWeeklyHours) >= 168}
                                                aria-label="Aumentar duração"
                                            >
                                                +
                                            </button>
                                            <button
                                                type="button"
                                                className="modern-btn--icon"
                                                onClick={() => handleTotalHoursChange(Math.min(Number(totalWeeklyHours) + 5, 168))}
                                                disabled={Number(totalWeeklyHours) >= 168}
                                                aria-label="Aumentar 5"
                                            >
                                                +5
                                            </button>
                                        </div>
                                    </div>
                                    {/* Mini Card: Horas Livres/Ocupadas (side by side) */}
                                    <div className="miniCard">
                                        <div className="miniCardRow">
                                            <div className="miniCardTitle">Horas Livres:</div>
                                            <div className="miniCardContent" style={{ color: themes[currentTheme-1].bg, marginLeft: 8 }}>{remainingHours}h</div>
                                            <div className="miniCardTitle" style={{marginLeft: 24}}>Horas Ocupadas:</div>
                                            <div className="miniCardContent" style={{ color: themes[currentTheme-1].bg, marginLeft: 8 }}>{usedHours}h</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column Container */}
                            <div className="right-column-container">
                                <div className="task-card">
                                    <div className="card-fade-container">
                                        {/* Task List View */}
                                        <div className={`card-fade-content${!isCardFlipped ? ' active' : ''}`}>
                                            <div className="card-title">Gerenciador de Tarefas</div>
                                            <div className="flex justify-between items-center mb-6" style={{ marginBottom: '1.5rem' }}>
                                                <button
                                                    onClick={() => openModal()}
                                                    className="modern-btn"
                                                    style={{
                                                        background: `linear-gradient(0deg, rgba(255,255,255,0.10), rgba(255,255,255,0.10)), ${themes[currentTheme-1].bg}`,
                                                        color: '#fff',
                                                        border: 'none',
                                                        backdropFilter: 'blur(6px)',
                                                        WebkitBackdropFilter: 'blur(6px)'
                                                    }}
                                                >
                                                    <PlusCircle className="h-5 w-5" />
                                                    <span>Adicionar</span>
                                                </button>
                                            </div>
                                            <TaskList
                                                tasks={tasks}
                                                onEdit={openModal}
                                                onDelete={handleDeleteTask}
                                                themeBg={themes[currentTheme-1].bg}
                                                themeCard={themes[currentTheme-1].card}
                                            />
                                        </div>

                                        {/* Task Form View */}
                                        <div className={`card-fade-content${isCardFlipped ? ' active' : ''}`}>
                                            <TaskForm
                                                task={editingTask}
                                                onSave={(taskData) => handleSaveTask(taskData, closeModal)}
                                                onClose={closeModal}
                                                totalWeeklyHours={totalWeeklyHours}
                                                currentTasks={tasks}
                                                themes={themes}
                                                currentTheme={currentTheme}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {/* Mini Card: Escolha um tema (now below TaskList) */}
                                <div className="miniCard themeCard" style={{marginTop: '1.25rem'}}>
                                    <div className="miniCardTitle">Escolha um tema</div>
                                    <div className="miniCardRow">
                                        {themes.map(theme => (
                                            <button
                                                key={theme.id}
                                                className={`theme-option ${currentTheme === theme.id ? 'active' : ''}`}
                                                onClick={() => handleThemeChange(theme.id)}
                                                title={theme.name}
                                                style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: '50%',
                                                    border: currentTheme === theme.id ? `2px solid ${theme.bg}` : '2px solid transparent',
                                                    background: `radial-gradient(circle, ${theme.bg} 0%, ${theme.card} 100%)`,
                                                    marginRight: 8,
                                                    outline: 'none',
                                                    cursor: 'pointer'
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// --- Componente do Formulário da Tarefa (Modal) ---
function TaskForm({ task, onSave, onClose, totalWeeklyHours, currentTasks, themes, currentTheme }) {
    const [formData, setFormData] = useState({
        id: task?.id || null,
        name: task?.name || '',
        duration: task?.duration || '',
        color: task?.color || '#3b82f6',
        description: task?.description || '',
    });

    // Update form data when task changes (for editing)
    useEffect(() => {
        if (task) {
            setFormData({
                id: task.id,
                name: task.name,
                duration: task.duration,
                color: task.color,
                description: task.description || '',
            });
        } else {
            // Reset form for new task
            setFormData({
                id: null,
                name: '',
                duration: '',
                color: '#3b82f6',
                description: '',
            });
        }
    }, [task]);

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
        
        console.log('TaskForm submitting with data:', { ...formData, duration });
        onSave({ ...formData, duration });
    };

    return (
        <div className="h-full flex flex-col task-form-card">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold tracking-tight text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
                <button
                    onClick={onClose}
                    className="modern-btn--icon"
                    style={{
                        background: `linear-gradient(0deg, rgba(255,255,255,0.10), rgba(255,255,255,0.10)), ${themes[currentTheme-1].bg}`,
                        color: '#fff',
                        border: 'none',
                        backdropFilter: 'blur(6px)',
                        WebkitBackdropFilter: 'blur(6px)'
                    }}
                >
                    <X className="h-5 w-5" />
                </button>
            </div>
            {/* Only show available hours info */}
            <div className="mb-6" style={{fontSize: '0.98rem', color: 'var(--text-color)', fontWeight: 500, marginTop: '0.5rem', marginBottom: '1.5rem'}}>
                {`Você pode adicionar até ${availableHours}h nesta tarefa.`}
            </div>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-0">
                <div className="task-form-field">
                    <label htmlFor="name">Nome da Tarefa</label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="input-sm"
                        placeholder="Digite o nome da tarefa"
                        style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.01em' }}
                    />
                </div>
                <div className="duration-color-row">
                    <div className="task-form-field" style={{ flex: 1, minWidth: 0 }}>
                        <label htmlFor="duration">Duração (horas/semana) *</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: 260 }}>
                            <button
                                type="button"
                                className="modern-btn--icon"
                                onClick={() => setFormData(prev => ({ ...prev, duration: Math.max(1, Number(prev.duration) - 5) }))}
                                disabled={Number(formData.duration) <= 1}
                                aria-label="Diminuir 5"
                            >
                                -5
                            </button>
                            <button
                                type="button"
                                className="modern-btn--icon"
                                onClick={() => setFormData(prev => ({ ...prev, duration: Math.max(1, Number(prev.duration) - 1) }))}
                                disabled={Number(formData.duration) <= 1}
                                aria-label="Diminuir duração"
                            >
                                –
                            </button>
                            <div style={{ minWidth: 36, textAlign: 'center', fontWeight: 600, fontSize: '1.1rem', color: '#232931', background: '#f5f6fa', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', border: '1.5px solid #d1d5db' }}>
                                {formData.duration}
                            </div>
                            <button
                                type="button"
                                className="modern-btn--icon"
                                onClick={() => setFormData(prev => ({ ...prev, duration: Math.min(availableHours, Number(prev.duration) + 1) }))}
                                disabled={Number(formData.duration) >= availableHours}
                                aria-label="Aumentar duração"
                            >
                                +
                            </button>
                            <button
                                type="button"
                                className="modern-btn--icon"
                                onClick={() => setFormData(prev => ({ ...prev, duration: Math.min(availableHours, Number(prev.duration) + 5) }))}
                                disabled={Number(formData.duration) >= availableHours}
                                aria-label="Aumentar 5"
                            >
                                +5
                            </button>
                        </div>
                    </div>
                    <div className="task-form-field" style={{ flex: 1, minWidth: 0, maxWidth: 220 }}>
                        <label htmlFor="color">Cor</label>
                        <div className="color-picker-row">
                            <input
                                type="color"
                                name="color"
                                id="color"
                                value={formData.color}
                                onChange={handleChange}
                                className="w-16 h-10 p-1 bg-white border border-gray-300 rounded-lg cursor-pointer transition-all hover:scale-105 shadow-sm"
                                style={{ minWidth: '3rem' }}
                            />
                            <span className="color-preview" style={{ background: formData.color }}></span>
                        </div>
                    </div>
                </div>
                <div className="task-form-field">
                    <label htmlFor="description">Observação (Opcional)</label>
                    <textarea
                        name="description"
                        id="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        className="input-sm"
                        placeholder="Adicione uma observação sobre a tarefa..."
                        style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.01em' }}
                    ></textarea>
                </div>
                <div className="flex justify-end gap-3 pt-8 border-t border-gray-200 mt-8">
                    <button
                        type="button"
                        onClick={onClose}
                        className="modern-btn--icon"
                        style={{
                            background: `linear-gradient(0deg, rgba(255,255,255,0.10), rgba(255,255,255,0.10)), ${themes[currentTheme-1].bg}`,
                            color: '#fff',
                            border: 'none',
                            backdropFilter: 'blur(6px)',
                            WebkitBackdropFilter: 'blur(6px)'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="modern-btn"
                        style={{
                            background: `linear-gradient(0deg, rgba(255,255,255,0.10), rgba(255,255,255,0.10)), ${themes[currentTheme-1].bg}`,
                            color: '#fff',
                            border: 'none',
                            backdropFilter: 'blur(6px)',
                            WebkitBackdropFilter: 'blur(6px)'
                        }}
                    >
                        Salvar
                    </button>
                </div>
            </form>
        </div>
    );
}

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { createClient } from '@supabase/supabase-js';

// Registro do Chart.js (corrigido)
ChartJS.register(ArcElement, Tooltip, Legend);

// Configuração do Supabase (com validação)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Variáveis de ambiente do Supabase não configuradas!");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Componente Principal da Aplicação ---
export default function App() {
    // --- Estados do Supabase ---
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    // --- Estados da Aplicação ---
    const [tasks, setTasks] = useState([]);
    const [totalWeeklyHours, setTotalWeeklyHours] = useState(40);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [notification, setNotification] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Inicialização do Supabase ---
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
                console.error("Erro ao verificar sessão:", sessionError);
                setError("Falha ao conectar com o servidor");
                setIsAuthReady(true);
                return;
            }

            if (session) {
                setUserId(session.user.id);
                setIsAuthReady(true);
                return;
            }

            // Se não há sessão, faz login anônimo
            const { data, error: signInError } = await supabase.auth.signInAnonymously();
            
            if (signInError) {
                console.error("Erro no login anônimo:", signInError);
                setError("Falha ao iniciar sessão");
                setIsAuthReady(true);
                return;
            }

            if (data?.user) {
                setUserId(data.user.id);
            }
            setIsAuthReady(true);
        };

        checkSession();

        // Listener para mudanças de autenticação
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                setUserId(session.user.id);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    // --- Sincronização de Dados com Supabase ---
    useEffect(() => {
        if (!isAuthReady || !userId) return;

        setIsLoading(true);
        setError(null);

        // Buscar configurações do usuário
        const fetchSettings = async () => {
            try {
                const { data, error: settingsError } = await supabase
                    .from('user_settings')
                    .select('total_weekly_hours')
                    .eq('user_id', userId)
                    .single();

                if (settingsError && settingsError.code !== 'PGRST116') { // Ignora erro "nenhum resultado"
                    throw settingsError;
                }

                if (data) {
                    setTotalWeeklyHours(data.total_weekly_hours || 40);
                } else {
                    // Cria configurações padrão se não existirem
                    await supabase
                        .from('user_settings')
                        .insert([{ user_id: userId, total_weekly_hours: 40 }]);
                    setTotalWeeklyHours(40);
                }
            } catch (err) {
                console.error("Erro ao buscar configurações:", err);
                setError("Falha ao carregar configurações");
            }
        };

        // Buscar tarefas do usuário
        const fetchTasks = async () => {
            try {
                const { data, error: tasksError } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('user_id', userId);

                if (tasksError) throw tasksError;

                setTasks(data || []);
                setIsLoading(false);
            } catch (err) {
                console.error("Erro ao buscar tarefas:", err);
                setError("Falha ao carregar tarefas");
                setIsLoading(false);
            }
        };

        fetchSettings();
        fetchTasks();

        // Listener em tempo real para tarefas
        const tasksSubscription = supabase
            .channel('tasks-channel')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'tasks',
                filter: `user_id=eq.${userId}`
            }, async () => {
                const { data } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('user_id', userId);
                setTasks(data || []);
            })
            .subscribe();

        return () => {
            tasksSubscription.unsubscribe();
        };
    }, [isAuthReady, userId]);

    // --- Cálculos de Tempo ---
    const { usedHours, remainingHours, excessHours } = useMemo(() => {
        const used = tasks.reduce((acc, task) => acc + (Number(task.duration) || 0), 0); // Parêntese corrigido
    const total = Number(totalWeeklyHours) || 0;
        return {
            usedHours: used,
            remainingHours: Math.max(0, total - used),
            excessHours: Math.max(0, used - total),
        };
}, [tasks, totalWeeklyHours]);

    // --- Notificação de Excesso de Horas ---
    useEffect(() => {
        if (excessHours > 0) {
            const message = `Você excedeu seu limite semanal em ${excessHours} hora${excessHours > 1 ? 's' : ''}.`;
            setNotification(message);
        } else {
            setNotification('');
        }
    }, [excessHours]);

    // --- Funções de Manipulação de Dados ---
    const handleTotalHoursChange = useCallback(async (e) => {
        const newTotal = Number(e.target.value);
        setTotalWeeklyHours(newTotal);
        
        if (userId) {
            try {
                await supabase
                    .from('user_settings')
                    .upsert({ 
                        user_id: userId, 
                        total_weekly_hours: newTotal 
                    });
            } catch (err) {
                console.error("Erro ao atualizar configurações:", err);
                setError("Falha ao salvar configurações");
            }
        }
    }, [userId]);

    const handleSaveTask = async (taskData) => {
        if (!userId) return;
        
        try {
            const taskToSave = {
                ...taskData,
                user_id: userId,
                duration: Number(taskData.duration)
            };
            
            await supabase
                .from('tasks')
                .upsert(taskToSave);
                
            closeModal();
        } catch (err) {
            console.error("Erro ao salvar tarefa:", err);
            setError("Falha ao salvar tarefa");
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!userId) return;
        
        if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
            try {
                await supabase
                    .from('tasks')
                    .delete()
                    .eq('id', taskId);
            } catch (err) {
                console.error("Erro ao excluir tarefa:", err);
                setError("Falha ao excluir tarefa");
            }
        }
    };

    // --- Funções do Modal ---
    const openModal = (task = null) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTask(null);
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
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Organizador Semanal</h1>
                    <p className="text-lg text-gray-400">Visualize e gerencie como seu tempo é distribuído.</p>
                </header>

                {notification && (
                    <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
                        <strong className="font-bold">Atenção: </strong>
                        <span className="block sm:inline">{notification}</span>
                    </div>
                )}

                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Coluna de Status e Gráfico */}
                    <div className="lg:col-span-1 bg-gray-800 p-6 rounded-2xl shadow-lg flex flex-col h-full">
                        <div className="mb-6">
                            <label htmlFor="total-hours" className="block text-sm font-medium text-gray-300 mb-2">
                                Total de Horas na Semana
                            </label>
                            <input
                                type="number"
                                id="total-hours"
                                value={totalWeeklyHours}
                                onChange={handleTotalHoursChange}
                                className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-2 text-center text-2xl font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-6 text-center">
                            <div className="bg-gray-700/50 p-4 rounded-lg">
                                <p className="text-sm text-gray-400">Usadas</p>
                                <p className="text-2xl font-bold text-blue-400">{usedHours}h</p>
                            </div>
                            <div className="bg-gray-700/50 p-4 rounded-lg">
                                <p className="text-sm text-gray-400">Restantes</p>
                                <p className="text-2xl font-bold text-green-400">{remainingHours}h</p>
                            </div>
                        </div>
                        <div className="relative flex-grow min-h-[250px] sm:min-h-[300px]">
                            {tasks.length > 0 || remainingHours > 0 ? (
                                <Doughnut data={chartData} options={chartOptions} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    <p>Adicione uma tarefa para começar.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Coluna de Tarefas */}
                    <div className="lg:col-span-2 bg-gray-800 p-6 rounded-2xl shadow-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Minhas Tarefas</h2>
                            <button
                                onClick={() => openModal()}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105"
                            >
                                <PlusCircle className="h-5 w-5" />
                                <span>Adicionar</span>
                            </button>
                        </div>
                        <div className="space-y-4">
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
                    </div>
                </main>
            </div>

            {isModalOpen && (
                <TaskForm
                    task={editingTask}
                    onSave={handleSaveTask}
                    onClose={closeModal}
                />
            )}
        </div>
    );
}

// --- Componente do Item da Tarefa ---
function TaskItem({ task, onEdit, onDelete }) {
    return (
        <div className="bg-gray-700/50 rounded-lg p-4 flex items-center justify-between transition-shadow hover:shadow-md hover:shadow-blue-500/10">
            <div className="flex items-center gap-4">
                <div className="w-3 h-10 rounded" style={{ backgroundColor: task.color }}></div>
                <div>
                    <p className="font-semibold text-white">{task.name}</p>
                    <p className="text-sm text-gray-400">{task.duration}h por semana</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => onEdit(task)} className="p-2 text-gray-400 hover:text-yellow-400 transition-colors rounded-full hover:bg-gray-600">
                    <Edit className="h-5 w-5" />
                </button>
                <button onClick={() => onDelete(task.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-full hover:bg-gray-600">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">{task ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
                            <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-700">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Nome da Tarefa *</label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    id="name" 
                                    value={formData.name} 
                                    onChange={handleChange} 
                                    required 
                                    className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-blue-500" 
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-grow">
                                    <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-1">Duração (horas/semana) *</label>
                                    <input 
                                        type="number" 
                                        name="duration" 
                                        id="duration" 
                                        value={formData.duration} 
                                        onChange={handleChange} 
                                        required 
                                        min="0.1" 
                                        step="0.1" 
                                        className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-blue-500" 
                                    />
                                </div>
                                <div>
                                    <label htmlFor="color" className="block text-sm font-medium text-gray-300 mb-1">Cor</label>
                                    <input 
                                        type="color" 
                                        name="color" 
                                        id="color" 
                                        value={formData.color} 
                                        onChange={handleChange} 
                                        className="w-16 h-10 p-1 bg-gray-700 border-gray-600 rounded-md cursor-pointer" 
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Observação (Opcional)</label>
                                <textarea 
                                    name="description" 
                                    id="description" 
                                    value={formData.description} 
                                    onChange={handleChange} 
                                    rows="3" 
                                    className="w-full bg-gray-700 text-white border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                                ></textarea>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-700/50 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                            Salvar Tarefa
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

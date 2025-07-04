import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

// Auth hook
export function useSupabaseAuth() {
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setError('Falha ao conectar com o servidor');
        setIsAuthReady(true);
        return;
      }
      if (session) {
        setUserId(session.user.id);
        setIsAuthReady(true);
        return;
      }
      const { data, error: signInError } = await supabase.auth.signInAnonymously();
      if (signInError) {
        setError('Falha ao iniciar sessão');
        setIsAuthReady(true);
        return;
      }
      if (data?.user) {
        setUserId(data.user.id);
      }
      setIsAuthReady(true);
    };
    checkSession();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUserId(session.user.id);
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  return { userId, isAuthReady, error };
}

// User settings hook
export function useUserSettings(userId, isAuthReady) {
  const [totalWeeklyHours, setTotalWeeklyHours] = useState(40);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthReady || !userId) return;
    const fetchSettings = async () => {
      try {
        const { data, error: settingsError } = await supabase
          .from('user_settings')
          .select('total_weekly_hours')
          .eq('user_id', userId)
          .single();
        if (settingsError && settingsError.code !== 'PGRST116') {
          throw settingsError;
        }
        if (data) {
          setTotalWeeklyHours(data.total_weekly_hours || 40);
        } else {
          await supabase
            .from('user_settings')
            .insert([{ user_id: userId, total_weekly_hours: 40 }]);
          setTotalWeeklyHours(40);
        }
      } catch (err) {
        setError('Falha ao carregar configurações');
      }
    };
    fetchSettings();
  }, [isAuthReady, userId]);

  const handleTotalHoursChange = useCallback(async (e) => {
    const newTotal = Number(e.target.value);
    setTotalWeeklyHours(newTotal);
    if (userId) {
      try {
        await supabase
          .from('user_settings')
          .upsert({ user_id: userId, total_weekly_hours: newTotal });
      } catch (err) {
        setError('Falha ao salvar configurações');
      }
    }
  }, [userId]);

  return { totalWeeklyHours, setTotalWeeklyHours, error, handleTotalHoursChange };
}

// Tasks hook
export function useTasks(userId, isAuthReady) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthReady || !userId) return;
    setIsLoading(true);
    setError(null);
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
        setError('Falha ao carregar tarefas');
        setIsLoading(false);
      }
    };
    fetchTasks();
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
    } catch (err) {
      setError('Falha ao salvar tarefa');
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
        setError('Falha ao excluir tarefa');
      }
    }
  };

  return { tasks, isLoading, error, handleSaveTask, handleDeleteTask };
} 
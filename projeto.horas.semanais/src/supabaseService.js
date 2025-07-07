import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

// Auth hook
export function useSupabaseAuth() {
  const [userId, setUserId] = useState(null);
  const [user, setUser] = useState(null);
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
        setUser(session.user);
        setIsAuthReady(true);
        return;
      }
      // No session found - user needs to login
      setIsAuthReady(true);
    };
    
    checkSession();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUserId(session.user.id);
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        setUser(null);
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  return { userId, user, isAuthReady, error };
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

  const handleTotalHoursChange = useCallback(async (eOrValue) => {
    let newTotal;
    if (typeof eOrValue === 'number') {
      newTotal = eOrValue;
    } else if (eOrValue && eOrValue.target) {
      newTotal = Number(eOrValue.target.value);
    }
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
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (tasksError) throw tasksError;
        setTasks(data || []);
        setIsLoading(false);
      } catch (err) {
        setError('Falha ao carregar tarefas');
        setIsLoading(false);
      }
    };
    
    fetchTasks();
    
    // Set up real-time subscription with better error handling
    const channel = supabase.channel(`tasks-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${userId}`
      }, async (payload) => {
        console.log('Real-time update received:', payload);
        try {
          // Handle different event types appropriately
          if (payload.eventType === 'INSERT') {
            // For new tasks, fetch fresh data to get the new ID
            const { data, error } = await supabase
              .from('tasks')
              .select('*')
              .eq('user_id', userId)
              .order('created_at', { ascending: false });
            if (error) {
              console.error('Error fetching tasks after real-time update:', error);
              return;
            }
            setTasks(data || []);
          } else if (payload.eventType === 'UPDATE') {
            // For updates, only update the specific task to avoid conflicts
            setTasks(prevTasks => 
              prevTasks.map(task => 
                task.id === payload.new.id ? payload.new : task
              )
            );
          } else if (payload.eventType === 'DELETE') {
            // For deletes, remove the specific task
            setTasks(prevTasks => 
              prevTasks.filter(task => task.id !== payload.old.id)
            );
          }
        } catch (err) {
          console.error('Error in real-time subscription:', err);
        }
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });
    
    return () => {
      channel.unsubscribe();
    };
  }, [isAuthReady, userId]);

  const handleSaveTask = async (taskData, callback) => {
    if (!userId) return;
    try {
      // Check if we're editing an existing task by looking for a valid ID
      const isEditing = taskData.id && taskData.id !== null && taskData.id !== undefined;
      
      console.log('handleSaveTask called with:', { taskData, isEditing });
      
      const taskToSave = {
        user_id: userId,
        name: taskData.name,
        duration: Number(taskData.duration),
        color: taskData.color,
        description: taskData.description || ''
      };
      
      if (isEditing) {
        console.log('Updating existing task with ID:', taskData.id);
        // Update existing task
        const { error } = await supabase
          .from('tasks')
          .update(taskToSave)
          .eq('id', taskData.id)
          .eq('user_id', userId);
        if (error) throw error;
        
        console.log('Task updated successfully');
        
        // Optimistically update the local state
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskData.id ? { ...task, ...taskToSave } : task
          )
        );
      } else {
        console.log('Creating new task');
        // Create new task
        const { error } = await supabase
          .from('tasks')
          .insert([taskToSave]);
        if (error) throw error;
        console.log('Task created successfully');
        // Let the real-time subscription handle the UI update
      }
      
      if (callback) callback();
    } catch (err) {
      setError('Falha ao salvar tarefa');
      console.error('Save task error:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!userId) return;
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      try {
        // Optimistically remove from local state
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
        
        await supabase
          .from('tasks')
          .delete()
          .eq('id', taskId);
      } catch (err) {
        setError('Falha ao excluir tarefa');
        // Revert optimistic update on error
        const { data } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId);
        setTasks(data || []);
      }
    }
  };

  return { tasks, isLoading, error, handleSaveTask, handleDeleteTask };
} 
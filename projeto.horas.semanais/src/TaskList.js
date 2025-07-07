import React from 'react';
import styles from './TaskList.module.css';
import { Edit, Trash2 } from 'lucide-react';

export default function TaskList({ tasks, onEdit, onDelete, themeBg, themeCard }) {
  // Set CSS variables for scrollbar colors
  const styleVars = {
    '--scrollbar-bg': themeBg ? `${themeBg}80` : 'rgba(24,28,32,0.5)', // 50% opacity
    '--scrollbar-thumb': themeCard || '#444c56',
  };
  return (
    <div className={styles.taskListContainer} style={styleVars}>
      {tasks && tasks.length > 0 ? (
        tasks.map((task) => (
          <div className={styles.taskItem} key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
              <div style={{ width: '1rem', height: '1rem', borderRadius: '50%', background: task.color, flexShrink: 0 }}></div>
              <div>
                <div style={{ fontWeight: 600 }}>{task.name}</div>
                <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>{task.duration}h por semana</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => onEdit(task)} title="Editar" className={styles.iconBtn}>
                <Edit size={18} />
              </button>
              <button onClick={() => onDelete(task.id)} title="Excluir" className={styles.iconBtn}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>Nenhuma tarefa cadastrada ainda.</p>
          <p className="text-sm">Clique em "Adicionar" para criar sua primeira tarefa.</p>
        </div>
      )}
    </div>
  );
} 
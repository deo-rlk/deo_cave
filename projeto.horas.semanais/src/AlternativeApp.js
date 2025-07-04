import React, { useState } from "react";
import { PieChart, Pie, Cell } from "recharts";

// Simple Button and Input replacements
const Button = ({ children, onClick, size, variant, ...props }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded font-semibold border ${
      variant === "destructive"
        ? "bg-red-500 text-white border-red-600 hover:bg-red-600"
        : variant === "outline"
        ? "bg-white text-gray-800 border-gray-400 hover:bg-gray-100"
        : "bg-blue-600 text-white border-blue-700 hover:bg-blue-700"
    } ${size === "sm" ? "text-sm px-2 py-0.5" : ""}`}
    {...props}
  >
    {children}
  </button>
);
const Input = ({ ...props }) => (
  <input
    className="border rounded px-2 py-1 w-full focus:outline-blue-400"
    {...props}
  />
);

const COLORS = ["#0088FE", "#00C49F"];

const TaskPanel = ({ tasks, onAdd, onDelete, onEdit }) => {
  const [form, setForm] = useState({ title: "", subtitle: "", description: "", color: "#0088FE" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    if (form.title) {
      onAdd(form);
      setForm({ title: "", subtitle: "", description: "", color: "#0088FE" });
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-2xl shadow w-full">
      <h2 className="text-xl font-bold">Criar Tarefa</h2>
      <Input placeholder="Título" name="title" value={form.title} onChange={handleChange} />
      <Input placeholder="Subtítulo" name="subtitle" value={form.subtitle} onChange={handleChange} />
      <Input placeholder="Descrição" name="description" value={form.description} onChange={handleChange} />
      <Input type="color" name="color" value={form.color} onChange={handleChange} />
      <Button onClick={handleSubmit}>Adicionar</Button>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Tarefas</h3>
        {tasks.map((task, index) => (
          <div key={index} className="border p-2 rounded mb-2" style={{ borderLeft: `8px solid ${task.color}` }}>
            <strong>{task.title}</strong> <br />
            <span>{task.subtitle}</span> <br />
            <small>{task.description}</small>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={() => onEdit(index)}>Editar</Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(index)}>Excluir</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AlternativeApp() {
  const [availableHours, setAvailableHours] = useState(40);
  const [tasks, setTasks] = useState([]);

  const handleAddTask = (task) => {
    setTasks([...tasks, task]);
  };

  const handleDeleteTask = (index) => {
    const updated = [...tasks];
    updated.splice(index, 1);
    setTasks(updated);
  };

  const handleEditTask = (index) => {
    const task = tasks[index];
    const newTitle = prompt("Novo título", task.title);
    if (newTitle !== null) {
      const updated = [...tasks];
      updated[index].title = newTitle;
      setTasks(updated);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4 p-6 min-h-screen bg-gray-100">
      {/* Painel Esquerdo */}
      <div className="flex flex-col gap-4">
        {/* Gráfico de Rosca */}
        <div className="bg-white p-4 rounded-2xl shadow">
          <h3 className="text-lg font-bold mb-2">Horas Semanais</h3>
          <PieChart width={200} height={200}>
            <Pie
              data={[{ name: "Usadas", value: 40 - availableHours }, { name: "Disponíveis", value: availableHours }]}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              fill="#8884d8"
              label
            >
              {COLORS.map((color, index) => (
                <Cell key={`cell-${index}`} fill={color} />
              ))}
            </Pie>
          </PieChart>
        </div>

        {/* Controlador de Horas */}
        <div className="bg-white p-4 rounded-2xl shadow flex flex-col gap-2">
          <h3 className="text-lg font-bold">Controlar Horas</h3>
          <div className="flex gap-2 items-center">
            <Button onClick={() => setAvailableHours(availableHours - 1)}>-</Button>
            <span className="text-xl font-bold">{availableHours}</span>
            <Button onClick={() => setAvailableHours(availableHours + 1)}>+</Button>
          </div>
        </div>
      </div>

      {/* Painel de Tarefas */}
      <div className="col-span-2">
        <TaskPanel tasks={tasks} onAdd={handleAddTask} onDelete={handleDeleteTask} onEdit={handleEditTask} />
      </div>
    </div>
  );
}

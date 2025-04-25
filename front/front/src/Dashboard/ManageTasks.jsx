import React, { useEffect, useState } from "react";
import { Table } from "flowbite-react";
import AddTask from "./AddTask"; //

const ManageTasks = () => {
  const [tasks, setTasks] = useState([]);

  const fetchTasks = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5000/api/user/tasks", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (data.success) setTasks(data.tasks);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Gestion des Tâches</h2>

      {/* 👉 Ajouter une tâche */}
      <div className="mb-10 border p-4 rounded-xl bg-white">
        <h3 className="text-xl font-semibold mb-4">Ajouter une nouvelle tâche</h3>
        <AddTask onTaskAdded={fetchTasks} /> {/* 🔁 Passe la fonction pour recharger après ajout */}
      </div>

      {/* 👉 Liste des tâches */}
      <div className="overflow-x-auto">
        <Table>
          <Table.Head>
            <Table.HeadCell>Titre</Table.HeadCell>
            <Table.HeadCell>Projet</Table.HeadCell>
            <Table.HeadCell>Durée</Table.HeadCell>
            <Table.HeadCell>Note</Table.HeadCell>
            <Table.HeadCell>Status</Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {tasks.map((task) => (
              <Table.Row key={task.id}>
                <Table.Cell>{task.title}</Table.Cell>
                <Table.Cell>{task.project}</Table.Cell>
                <Table.Cell>{task.duration}</Table.Cell>
                <Table.Cell>{task.note}</Table.Cell>
                <Table.Cell>{task.done ? "✅" : "🕒"}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </div>
  );
};

export default ManageTasks;

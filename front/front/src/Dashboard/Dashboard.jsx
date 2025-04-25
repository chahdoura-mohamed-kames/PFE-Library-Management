import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/dashboard/stats', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setStats(res.data);
      } catch (err) {
        console.error('Erreur dashboard :', err);
        setError('Impossible de charger le dashboard.');
      }
    };
    fetchStats();
  }, []);

  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!stats) return <div className="p-8">Chargement du dashboard...</div>;

  return (
    <div className="max-w-7xl px-4 mx-auto">
      <div className="bg-white rounded-3xl p-8 mb-5">
        <h1 className="text-3xl font-bold mb-10">Dashboard – Book Inventory</h1>

        <div className="grid grid-cols-2 gap-x-20">
          <div>
            <h2 className="text-2xl font-bold mb-4">Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 bg-green-100 p-4 rounded-xl">
                <p className="text-xl font-bold">Bonjour 👋</p>
                <button className="mt-4 px-3 py-2 bg-white rounded shadow hover:text-green-600">Start tracking</button>
              </div>
              <div className="bg-yellow-100 p-4 rounded-xl text-gray-800">
                <div className="text-2xl font-bold">{stats.tasksFinished}</div>
                <p>Tasks finished</p>
              </div>
              <div className="bg-yellow-100 p-4 rounded-xl text-gray-800">
                <div className="text-2xl font-bold">{stats.trackedHours}</div>
                <p>Tracked hours</p>
              </div>
              <div className="col-span-2 bg-purple-100 p-4 rounded-xl text-gray-800">
                <div className="text-xl font-bold">Your daily plan</div>
                <p>{stats.dailyPlan.completed} of {stats.dailyPlan.total} completed</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Your tasks today</h2>
            <div className="space-y-4">
              {stats.tasksToday.map((task, index) => (
                <div key={index} className="p-4 bg-white border rounded-xl text-gray-800 space-y-2">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{task.project}</span>
                    <span>{task.duration}</span>
                  </div>
                  <p className="font-bold">{task.title}</p>
                  {task.note && (
                    <p className="text-sm text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" className="inline mr-1" viewBox="0 0 16 16">
                        <path d="M8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
                      </svg>{task.note}
                    </p>
                  )}
                </div>
              ))}
              {stats.tasksToday.length === 0 && <p className="text-sm text-gray-500">Aucune tâche pour aujourd’hui.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

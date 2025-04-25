import React, { useState } from 'react';
import { Button, Label, TextInput, Textarea } from 'flowbite-react';

const AddTask = () => {
  const [formData, setFormData] = useState({
    title: '',
    project: '',
    duration: '',
    note: ''
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.target;

    const title = form.title.value;
    const project = form.project.value;
    const duration = form.duration.value;
    const note = form.note.value;

    const taskObj = {
      title,
      project,
      duration,
      note,
    };

    fetch('http://localhost:5000/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(taskObj),
    })
      .then((res) => res.json())
      .then((data) => {
        alert('Tâche ajoutée avec succès ✅');
        form.reset();
      })
      .catch((err) => {
        console.error(err);
        alert("Erreur lors de l'ajout de la tâche ❌");
      });
  };

  return (
    <div className="px-4 my-12">
      <h2 className="mb-8 text-3xl font-bold">Ajouter une tâche</h2>
      <form className="flex lg:w-[1180px] flex-col flex-wrap gap-4" onSubmit={handleSubmit}>
        {/* Ligne 1 : Titre + Projet */}
        <div className="flex gap-8">
          {/* Titre */}
          <div className="lg:w-1/2">
            <div className="mb-2 block">
              <Label htmlFor="title" value="Titre de la tâche" />
            </div>
            <TextInput
              id="title"
              name="title"
              type="text"
              placeholder="Entrez le titre"
              required
              className="w-full"
            />
          </div>

          {/* Projet */}
          <div className="lg:w-1/2">
            <div className="mb-2 block">
              <Label htmlFor="project" value="Nom du projet" />
            </div>
            <TextInput
              id="project"
              name="project"
              type="text"
              placeholder="Projet associé"
              className="w-full"
            />
          </div>
        </div>

        {/* Ligne 2 : Durée */}
        <div className="lg:w-1/2">
          <div className="mb-2 block">
            <Label htmlFor="duration" value="Durée estimée" />
          </div>
          <TextInput
            id="duration"
            name="duration"
            type="text"
            placeholder="ex: 2h30"
            className="w-full"
          />
        </div>

        {/* Note */}
        <div>
          <div className="mb-2 block">
            <Label htmlFor="note" value="Note facultative" />
          </div>
          <Textarea
            id="note"
            name="note"
            rows={4}
            placeholder="Ajouter un commentaire ou une note…"
            className="w-full"
          />
        </div>

        {/* Bouton */}
        <Button type="submit" className="mt-5">
          Ajouter la tâche
        </Button>
      </form>
    </div>
  );
};

export default AddTask;

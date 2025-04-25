import React, { useState } from 'react';
import { Button, Label, Select, TextInput, Textarea } from 'flowbite-react';

const UploadBook = () => {
  const bookCategories = [
    "Fiction", "Non-fiction", "Mystery", "Programming", "Science fiction",
    "Fantasy", "Horror", "Biography", "Autobiography", "History",
    "Self-help", "Business", "Memoir", "Poetry", "Children's books",
    "Travel", "Religion and spirituality", "Science", "Art and design",
  ];

  const [selectedBookCategory, setSelectedBookCategory] = useState(bookCategories[0]);

  const handleChangeSelectedValue = (event) => {
    setSelectedBookCategory(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.target;

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id) {
      alert("Utilisateur non connecté.");
      return;
    }

    const formData = new FormData();
    formData.append("title", form.title.value);
    formData.append("author", form.author.value);
    formData.append("price", form.price.value);
    formData.append("category", form.category.value);
    formData.append("description", form.description.value);
    formData.append("image", form.image.files[0]);
    formData.append("bookfile", form.bookfile.files[0]);
    formData.append("user_id", user.id); // 👈 envoie du user_id connecté

    fetch("http://localhost:5000/upload-book", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("📚 Livre ajouté avec succès !");
          form.reset();
          setSelectedBookCategory(bookCategories[0]);
        } else {
          alert("❌ Erreur ajout livre.");
        }
      })
      .catch((err) => {
        console.error("Erreur Upload:", err);
        alert("Erreur lors de l'envoi du livre.");
      });
  };

  return (
    <div className="px-4 my-12">
      <h2 className="mb-8 text-3xl font-bold">📤 Upload A Book</h2>
      <form className="flex lg:w-[1180px] flex-col flex-wrap gap-4" onSubmit={handleSubmit} encType="multipart/form-data">

        {/* Titre et Auteur */}
        <div className="flex gap-8">
          <div className="lg:w-1/2">
            <Label htmlFor="title" value="Book Title" />
            <TextInput id="title" name="title" placeholder="Book Name" required className="w-full" />
          </div>
          <div className="lg:w-1/2">
            <Label htmlFor="author" value="Author Name" />
            <TextInput id="author" name="author" placeholder="Author Name" required className="w-full" />
          </div>
        </div>

        {/* Prix */}
        <div className="flex gap-8">
          <div className="lg:w-1/2">
            <Label htmlFor="price" value="Book Price" />
            <TextInput id="price" name="price" placeholder="e.g. 19.99" type="number" step="0.01" min="0" required className="w-full" />
          </div>
        </div>

        {/* Image & Catégorie */}
        <div className="flex gap-8">
          <div className="lg:w-1/2">
            <Label htmlFor="image" value="Book Cover Image (Upload)" />
            <input id="image" name="image" type="file" accept="image/*" required
              className="w-full file:bg-cyan-700 file:text-white file:px-4 file:py-2 file:rounded file:border-0 border border-gray-300 rounded p-1" />
          </div>
          <div className="lg:w-1/2">
            <Label htmlFor="category" value="Book Category" />
            <Select id="category" name="category" value={selectedBookCategory} onChange={handleChangeSelectedValue} className="w-full rounded">
              {bookCategories.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
          </div>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description" value="Book Description" />
          <Textarea id="description" name="description" placeholder="Book Description" required rows={4} className="w-full" />
        </div>

        {/* Fichier PDF */}
        <div>
          <Label htmlFor="bookfile" value="Upload Book PDF File" />
          <input id="bookfile" name="bookfile" type="file" accept="application/pdf" required
            className="w-full file:bg-cyan-700 file:text-white file:px-4 file:py-2 file:rounded file:border-0 border border-gray-300 rounded p-1" />
        </div>

        <Button type="submit" className="mt-5 bg-cyan-700">Upload Book</Button>
      </form>
    </div>
  );
};

export default UploadBook;

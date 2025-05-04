import React, { useEffect, useState } from 'react';
import BookCards from '../shared/BookCards';

const OtherBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await fetch("http://localhost:5000/all-books?page=1");
        const data = await res.json();
        console.log("Livres reçus :", data.books); 
  
        if (Array.isArray(data.books)) {
          const others = data.books.slice(0, 6);
          setBooks(others);
        } else {
          console.error("Réponse inattendue :", data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement :", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchBooks();
  }, []);
  

  return (
    <div className="mt-24">
      {loading ? (
        <p className="text-center text-gray-500">Chargement des livres...</p>
      ) : books.length > 0 ? (
        <BookCards books={books} headline="Other Books" />
      ) : (
        <p className="text-center text-gray-400">Aucun autre livre trouvé.</p>
      )}
    </div>
  );
};

export default OtherBooks;

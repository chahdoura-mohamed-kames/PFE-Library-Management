import React, { useContext, useEffect, useState } from 'react';
import { Card, Spinner } from 'flowbite-react';
import { AuthContext } from '../../contexts/AuthProvider';

export default function Shop() {
  const { loading } = useContext(AuthContext);
  const [books, setBooks] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/all-books')
      .then(res => res.json())
      .then(data => {
        console.log("Books fetched:", data.books);
        setBooks(data.books);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setBooks([]);
      });
  }, [loading]);

  if (loading) {
    return (
      <div className="text-center mt-28">
        <Spinner aria-label="Center-aligned spinner example" />
      </div>
    );
  }

  return (
    <div className="my-28 px-4 lg:px-24">
      <h2 className="text-3xl font-bold text-center mb-16 z-40">
        All Books are Available Here
      </h2>

      <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-8">
        {Array.isArray(books) && books.length > 0 ? (
          books.map((book) => (
            <Card key={book.id}>
              <img
                src={book.image ? `http://localhost:5000/uploads/${book.image}` : 'https://via.placeholder.com/300x400?text=No+Image'}
                alt={book.title}
                className="h-96 w-full object-cover"
              />
              <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {book.title}
              </h5>
              <p className="font-normal text-gray-700 dark:text-gray-400">
                {book.description || 'No description available.'}
              </p>

              {/* 📥 Lien vers le PDF si présent */}
              {book.bookurl && (
                <a
                  href={`http://localhost:5000/uploads/${book.bookurl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline mb-2 block"
                >
                  View PDF
                </a>
              )}

              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Buy Now
              </button>
            </Card>
          ))
        ) : (
          <p className="text-center col-span-full text-gray-500">
            No books available at the moment.
          </p>
        )}
      </div>
    </div>
  );
}

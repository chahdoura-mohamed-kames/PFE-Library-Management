import React, { useEffect, useState } from 'react'
import BookCards from '../shared/BookCards';

const BestSeller = () => {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/books/best-sellers")
      .then(res => res.json())
      .then(data => {
        if (data.success) setBooks(data.books);
      });
  }, []);

  return <BookCards books={books} headline={"Best Seller Books"} />;
};

export default BestSeller;

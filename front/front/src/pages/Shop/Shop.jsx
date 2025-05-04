import React, { useContext, useEffect, useState } from 'react';
import { Card, Modal, Button, Textarea, Label, TextInput } from 'flowbite-react';
import { AuthContext } from '../../contexts/AuthProvider';
import { useLocation } from 'react-router-dom';

export default function Shop() {
  const { loading } = useContext(AuthContext);
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const initialSearch = query.get('search') || '';

  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  const [selectedBook, setSelectedBook] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [commandeModalOpen, setCommandeModalOpen] = useState(false);

  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);

  const [orderMessage, setOrderMessage] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetch('http://localhost:5000/all-books')
      .then(res => res.json())
      .then(data => {
        setBooks(data.books);
        const filtered = data.books.filter((book) =>
          book.title.toLowerCase().includes(initialSearch.toLowerCase())
        );
        setFilteredBooks(filtered);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setBooks([]);
        setFilteredBooks([]);
      });
  }, [loading]);

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    const filtered = books.filter((book) =>
      book.title.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredBooks(filtered);
  };

  const handleBuyNow = (book) => {
    setSelectedBook(book);
    setOpenModal(true);
    setOrderMessage('');
    fetchReviews(book.id);
  };

  const handleOrder = () => {
    setCommandeModalOpen(true);
  };

  const handleSubmitCommande = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.id;

    if (!userId || !selectedBook) {
      alert("⚠️ Utilisateur ou livre non défini.");
      return;
    }

    if (!quantity || isNaN(quantity) || quantity <= 0) {
      alert("⚠️ Veuillez saisir une quantité valide.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          book_id: selectedBook.id,
          quantity: parseInt(quantity)
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOrderMessage("✅ Commande envoyée avec succès !");
        setCommandeModalOpen(false);
        setOpenModal(false);
        setQuantity(1);
      } else {
        alert("Erreur : " + data.message);
      }
    } catch (err) {
      console.error("❌ Erreur lors de la commande:", err);
      alert("Erreur serveur");
    }
  };

  const fetchReviews = async (bookId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/reviews/${bookId}`);
      const data = await res.json();
      setReviews(data.reviews);
      setAverageRating(data.average || 0);
    } catch (err) {
      console.error("Erreur chargement avis", err);
    }
  };

  const handleComment = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = user?.token;

    if (!user || !user.id || !selectedBook) {
      return alert("⚠️ Utilisateur ou livre non défini.");
    }

    if (!comment.trim() || rating === 0) {
      return alert("⚠️ Veuillez entrer un commentaire et une note.");
    }

    try {
      const res = await fetch(`http://localhost:5000/api/reviews/${selectedBook.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment }),
      });

      if (res.ok) {
        alert("✅ Avis soumis avec succès");
        setComment('');
        setRating(0);
        fetchReviews(selectedBook.id);
      } else if (res.status === 403) {
        alert("⛔ Accès refusé. Veuillez vous reconnecter.");
      } else {
        const error = await res.json();
        alert("❌ Erreur : " + error.message);
      }
    } catch (err) {
      console.error("Erreur lors de l'envoi du commentaire :", err);
      alert("❌ Erreur serveur");
    }
  };

  return (
    <div className="my-28 px-4 lg:px-24">
      <h2 className="text-3xl font-bold text-center mb-10 z-40">All Books are Available Here</h2>

      <div className="flex justify-center mb-10">
        <input
          type="text"
          placeholder="Search for a book..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="border border-gray-300 px-4 py-2 rounded-md w-full max-w-md"
        />
      </div>

      <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-8">
        {filteredBooks.length > 0 ? (
          filteredBooks.map((book) => (
            <Card key={book.id}>
              <img
                src={book.image ? `http://localhost:5000/uploads/${book.image}` : 'https://via.placeholder.com/300x400?text=No+Image'}
                alt={book.title}
                className="h-96 w-full object-cover"
              />
              <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{book.title}</h5>
              <p className="font-normal text-gray-700 dark:text-gray-400">
                {book.description || 'No description available.'}
              </p>
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
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => handleBuyNow(book)}
              >
                Details
              </button>
            </Card>
          ))
        ) : (
          <p className="text-center col-span-full text-gray-500">No books found.</p>
        )}
      </div>

      {/* Modal détails livre */}
      <Modal show={openModal} onClose={() => setOpenModal(false)}>
        <Modal.Header>{selectedBook?.title}</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <img
              src={selectedBook?.image ? `http://localhost:5000/uploads/${selectedBook.image}` : 'https://via.placeholder.com/300x400?text=No+Image'}
              alt={selectedBook?.title}
              className="h-64 w-full object-cover"
            />
            <p className="text-sm text-gray-700">{selectedBook?.description}</p>

            <div className="border-t pt-4">
              <h4 className="text-lg font-semibold mb-2">Note moyenne</h4>
              <p className="text-yellow-500 text-xl">{averageRating} ★</p>

              <h4 className="text-lg font-semibold mt-4">Laissez un avis</h4>
              <Label htmlFor="rating">Note</Label>
              <select
                id="rating"
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value))}
                className="w-full border p-2 rounded"
              >
                <option value="0">Sélectionnez une note</option>
                {[1,2,3,4,5].map(n => (
                  <option key={n} value={n}>{n} ★</option>
                ))}
              </select>

              <Label htmlFor="comment" className="mt-2 block">Commentaire</Label>
              <Textarea
                id="comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Votre commentaire..."
              />
              <Button className="mt-2" onClick={handleComment}>Soumettre</Button>

              <h4 className="text-lg font-semibold mt-6">Avis récents</h4>
              {reviews.length > 0 ? reviews.map((rev, i) => (
                <div key={i} className="border-t pt-2 mt-2 text-sm">
                  <div className="font-bold">{rev.name}</div>
                  <div className="text-yellow-500">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</div>
                  <p>{rev.comment}</p>
                  <p className="text-gray-500 text-xs">{new Date(rev.created_at).toLocaleDateString()}</p>
                </div>
              )) : <p className="text-gray-500">Aucun avis pour ce livre.</p>}
            </div>

            <div className="border-t pt-4">
              <h4 className="text-lg font-semibold mb-2">Passez votre commande</h4>
              <Button onClick={handleOrder} color="success" disabled={!selectedBook}>
                Commander
              </Button>
              {orderMessage && <p className="text-green-600 mt-2">{orderMessage}</p>}
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* Modal de commande */}
      <Modal show={commandeModalOpen} onClose={() => setCommandeModalOpen(false)}>
        <Modal.Header>Quantité de livres à commander</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label htmlFor="quantity">Quantité</Label>
              <TextInput
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <Button color="success" onClick={handleSubmitCommande}>Valider la commande</Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}

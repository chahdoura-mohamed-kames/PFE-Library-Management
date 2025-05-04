import { Table, Pagination } from 'flowbite-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const ManageBooks = () => {
  const [allBooks, setAllBooks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);

  const booksPerPage = 10;

  const fetchBooks = (page = 1) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;
  
    fetch(`http://localhost:5000/api/book/${user.id}?page=${page}`, {
      headers: {
        "user-id": user.id
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setAllBooks(data.books);
        setTotalBooks(data.total);
        setCurrentPage(data.page);
      });
  };
  

  useEffect(() => {
    fetchBooks(currentPage);
  }, [currentPage]);

  const handleDelete = (id) => {
    fetch(`http://localhost:5000/api/book/${bookId}?page=1`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          fetchBooks(currentPage); // Refresh list after deletion
        }
      });
  };

  return (
    <div className='px-4 my-12'>
      <h2 className='mb-8 text-3xl font-bold'>Manage Your Books Inventory!</h2>

      <Table className='lg:w-[1180px]'>
        <Table.Head>
          <Table.HeadCell>No.</Table.HeadCell>
          <Table.HeadCell>Book name</Table.HeadCell>
          <Table.HeadCell>Author Name</Table.HeadCell>
          <Table.HeadCell>Category</Table.HeadCell>
          <Table.HeadCell>Price</Table.HeadCell>
          <Table.HeadCell>Edit or Manage</Table.HeadCell>
        </Table.Head>

        <Table.Body className="divide-y">
          {allBooks.map((book, index) => (
            <Table.Row key={book.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
              <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                {(currentPage - 1) * booksPerPage + index + 1}
              </Table.Cell>
              <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                {book.title}
              </Table.Cell>
              <Table.Cell>{book.author}</Table.Cell>
              <Table.Cell>{book.category}</Table.Cell>
              <Table.Cell>${book.price || "0.00"}</Table.Cell>
              <Table.Cell>
                <Link
                  className="font-medium text-cyan-600 hover:underline dark:text-cyan-500 mr-5"
                  to={`/admin/dashboard/edit-books/${book.id}`}
                >
                  Edit
                </Link>
                <button
                  className='bg-red-600 px-4 py-1 font-semibold text-white rounded-sm hover:bg-sky-600'
                  onClick={() => handleDelete(book.id)}
                >
                  Delete
                </button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-center text-center mt-8">
        <Pagination
          currentPage={currentPage}
          layout="pagination"
          nextLabel="Go forward"
          onPageChange={page => setCurrentPage(page)}
          previousLabel="Go back"
          showIcons
          totalPages={Math.ceil(totalBooks / booksPerPage)}
        />
      </div>
    </div>
  );
};

export default ManageBooks;

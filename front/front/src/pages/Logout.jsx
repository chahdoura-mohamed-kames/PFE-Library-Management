import React, { useContext, useState } from 'react';
import { Button, Modal } from 'flowbite-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthProvider';

const Logout = () => {
  const [openModal, setOpenModal] = useState(false);
  const { logOut } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSignOut = () => {
    logOut()
      .then(() => {
        localStorage.removeItem("token"); // ⚠️ utile si tu stockes le token manuellement
        setOpenModal(false);
        navigate("/login"); // Redirection après déconnexion
      })
      .catch((error) => {
        console.error("Logout error:", error);
      });
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <Button onClick={() => setOpenModal(true)}>Click here to Logout</Button>

      <Modal show={openModal} onClose={() => setOpenModal(false)}>
        <Modal.Header>Confirm Logout</Modal.Header>
        <Modal.Body>
          <p className="text-base text-gray-700 dark:text-gray-300">
            Are you sure you want to log out from your session?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button color="failure" onClick={handleSignOut}>
            Yes, Logout
          </Button>
          <Button color="gray" onClick={() => setOpenModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Logout;

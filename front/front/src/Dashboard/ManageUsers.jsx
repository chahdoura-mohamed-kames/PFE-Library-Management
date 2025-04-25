import React, { useEffect, useState } from "react";
import { Table, Avatar, Button, Label, TextInput, Select, FileInput, Modal } from "flowbite-react";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [avatarFile, setAvatarFile] = useState(null);

  const fetchUsers = async () => {
    const admin = JSON.parse(localStorage.getItem("user"));
    const res = await fetch("http://localhost:5000/api/admin/usersadmin", {
      headers: {
        "admin-id": admin?.id,
      },
    });
    const data = await res.json();
    console.log("✅ Utilisateurs récupérés :", data);
    if (data.success) {
      setUsers(data.users);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = new FormData();
    submitData.append("name", formData.name);
    submitData.append("email", formData.email);
    submitData.append("password", formData.password);
    submitData.append("role", formData.role);
    if (avatarFile) {
      submitData.append("avatar", avatarFile);
    }

    const admin = JSON.parse(localStorage.getItem("user")); // ✅ admin-id
    const res = await fetch("http://localhost:5000/api/admin/create-user", {
      method: "POST",
      headers: {
        "admin-id": admin?.id,
      },
      body: submitData,
    });

    const result = await res.json();
    if (result.success) {
      alert("✅ Utilisateur ajouté avec succès !");
      setOpenModal(false);
      setFormData({ name: "", email: "", password: "", role: "user" });
      setAvatarFile(null);
      fetchUsers();
    } else {
      alert("❌ Erreur : " + result.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Confirmer la suppression ?")) return;
    const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
      method: "DELETE",
    });
    const result = await res.json();
    if (result.success) {
      alert("✅ Utilisateur supprimé");
      fetchUsers();
    } else {
      alert("❌ Erreur lors de la suppression");
    }
  };

  return (
    <div className="p-8 bg-white rounded-lg shadow-md max-w-7xl mx-auto mt-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gérer les Utilisateurs</h1>
        <Button onClick={() => setOpenModal(true)}>Ajouter Utilisateur</Button>
      </div>

      <div className="overflow-x-auto">
        <Table striped hoverable>
          <Table.Head>
            <Table.HeadCell>Avatar</Table.HeadCell>
            <Table.HeadCell>Nom</Table.HeadCell>
            <Table.HeadCell>Email</Table.HeadCell>
            <Table.HeadCell>Rôle</Table.HeadCell>
            <Table.HeadCell>Date création</Table.HeadCell>
            <Table.HeadCell>Action</Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {users.map((user) => (
              <Table.Row key={user.id}>
                <Table.Cell>
                  <Avatar
                    alt={user.name}
                    img={`http://localhost:5000${user.avatar_url}`}
                    rounded
                  />
                </Table.Cell>
                <Table.Cell>{user.name}</Table.Cell>
                <Table.Cell>{user.email}</Table.Cell>
                <Table.Cell className="capitalize">{user.role}</Table.Cell>
                <Table.Cell>{new Date(user.created_at).toLocaleDateString()}</Table.Cell>
                <Table.Cell>
                  <Button color="failure" size="xs" onClick={() => handleDelete(user.id)}>
                    Supprimer
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

      <Modal show={openModal} onClose={() => setOpenModal(false)}>
        <Modal.Header>Ajouter un nouvel utilisateur</Modal.Header>
        <Modal.Body>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="name" value="Nom complet" />
              <TextInput id="name" name="name" type="text" required onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="email" value="Email" />
              <TextInput id="email" name="email" type="email" required onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="password" value="Mot de passe" />
              <TextInput id="password" name="password" type="password" required onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="role" value="Rôle" />
              <Select id="role" name="role" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                <option value="user">Utilisateur</option>
                <option value="admin">Administrateur</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="avatar" value="Avatar" />
              <FileInput id="avatar" onChange={(e) => setAvatarFile(e.target.files[0])} />
            </div>
            <Button type="submit" className="mt-4 w-full">Créer l'utilisateur</Button>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ManageUsers;

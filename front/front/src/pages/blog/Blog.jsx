import React, { useState, useEffect, useContext } from 'react';
import { Textarea, Button, Label } from 'flowbite-react';
import { AuthContext } from '../../contexts/AuthProvider';

const Blog = () => {
  const { user: contextUser } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [formData, setFormData] = useState({ message: '' });
  const [replyData, setReplyData] = useState({});
  const [editData, setEditData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    setUser(savedUser ? JSON.parse(savedUser) : contextUser);
  }, [contextUser]);

  useEffect(() => {
    fetch("http://localhost:5000/api/community")
      .then(res => res.json())
      .then(setPosts)
      .catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const username = user?.name || user?.displayName || user?.email;
    const message = formData.message.trim();
    if (!username || !message) return setError("Message requis");

    const res = await fetch("http://localhost:5000/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, message })
    });
    const newPost = await res.json();
    setPosts(prev => [newPost, ...prev]);
    setFormData({ message: '' });
    setError('');
  };

  const handleReplySubmit = async (e, postId) => {
    e.preventDefault();
    const username = user?.name || user?.displayName || user?.email;
    const message = replyData[postId]?.trim();
    if (!message) return;

    const res = await fetch(`http://localhost:5000/api/community/${postId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, message })
    });
    const newReply = await res.json();
    setPosts(prev =>
      prev.map(post => post.id === postId
        ? { ...post, replies: [...(post.replies || []), newReply] }
        : post)
    );
    setReplyData(prev => ({ ...prev, [postId]: '' }));
  };

  const updatePost = (updated) => {
    setPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleLike = async (postId) => {
    const res = await fetch(`http://localhost:5000/api/community/${postId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user?.name || user?.displayName || user?.email })
    });
    res.ok ? updatePost(await res.json()) : alert("Déjà voté.");
  };

  const handleDislike = async (postId) => {
    const res = await fetch(`http://localhost:5000/api/community/${postId}/dislike`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user?.name || user?.displayName || user?.email })
    });
    res.ok ? updatePost(await res.json()) : alert("Déjà voté.");
  };

  const handleEditSubmit = async (e, postId) => {
    e.preventDefault();
    const res = await fetch(`http://localhost:5000/api/community/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: editData.message })
    });
    updatePost(await res.json());
    setEditingId(null);
    setEditData({});
  };

  if (!user) return <p className="text-center text-red-600 mt-20">Connectez-vous pour publier.</p>;

  return (
    <div className="my-12 px-6 lg:px-24">
      <h2 className="text-3xl font-bold text-center mb-8">Partagez et Réagissez</h2>

      <form onSubmit={handleSubmit} className="space-y-4 mb-12">
        <Label htmlFor="message">Votre Message</Label>
        <Textarea id="message" rows={4} value={formData.message} onChange={(e) => setFormData({ message: e.target.value })} required />
        {error && <p className="text-red-600">{error}</p>}
        <Button type="submit">Publier</Button>
      </form>

      {posts.map(post => (
        <div key={post.id} className="border p-4 rounded-lg shadow space-y-2">
          <div className="flex justify-between">
            <p className="font-bold">{post.username}</p>
            <p className="text-sm text-gray-500">{new Date(post.created_at).toLocaleString()}</p>
          </div>

          {editingId === post.id ? (
            <form onSubmit={(e) => handleEditSubmit(e, post.id)}>
              <Textarea rows={3} value={editData.message || ''} onChange={(e) => setEditData({ message: e.target.value })} />
              <div className="flex gap-2 mt-2">
                <Button size="sm" type="submit">💾 Enregistrer</Button>
                <Button size="sm" color="gray" onClick={() => setEditingId(null)}>Annuler</Button>
              </div>
            </form>
          ) : (
            <>
              <p>{post.message}</p>
              {post.username === (user?.name || user?.displayName || user?.email) && (
                <Button size="xs" onClick={() => { setEditingId(post.id); setEditData({ message: post.message }); }}>✏️ Modifier</Button>
              )}
            </>
          )}

          <div className="flex gap-4">
            <Button size="xs" onClick={() => handleLike(post.id)}>👍 {post.likes}</Button>
            <Button size="xs" onClick={() => handleDislike(post.id)}>👎 {post.dislikes}</Button>
          </div>

          <div className="pl-4 border-l mt-2">
            {(post.replies || []).map(reply => (
              <div key={reply.id}>
                <div className="flex justify-between">
                  <span className="font-semibold">{reply.username}:</span>
                  <span className="text-sm text-gray-400">{new Date(reply.created_at).toLocaleString()}</span>
                </div>
                <p>{reply.message}</p>
              </div>
            ))}
            <form onSubmit={(e) => handleReplySubmit(e, post.id)} className="space-y-2 mt-2">
              <Textarea rows={2} value={replyData[post.id] || ''} onChange={(e) => setReplyData(prev => ({ ...prev, [post.id]: e.target.value }))} placeholder="Répondre..." />
              <Button size="sm" type="submit">Répondre</Button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Blog;

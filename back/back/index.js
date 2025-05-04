const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

const app = express();
const port = process.env.PORT || 5000;
const SECRET_KEY = "yourSecretKey"; // ⚠️ Change in production

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// PostgreSQL
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "book_inventory",
  password: "1312",
  port: 5432,
});

pool
  .connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err) => console.error("❌ PostgreSQL connection error:", err));

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Signup
app.post("/auth/signup", async (req, res) => {
  const { name, email, password, avatar_url } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password, avatar_url) VALUES ($1, $2, $3, $4) RETURNING id, name, email, avatar_url, role",
      [name, email, hashedPassword, avatar_url]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, {
      expiresIn: "1d",
    });
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "Utilisateur non trouvé" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ error: "Mot de passe incorrect" });

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, {
      expiresIn: "1d",
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Profile
app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, avatar_url, role FROM users WHERE id = $1",
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard 📊
app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const taskStats = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE done) AS finished,
         COUNT(*) AS total,
         COALESCE(SUM(CAST(regexp_replace(duration, '[^0-9.]', '', 'g') AS numeric)), 0) AS hours
       FROM tasks WHERE user_id = $1`,
      [userId]
    );

    const tasksToday = await pool.query(
      `SELECT id, title, project, duration, deadline, note, done
       FROM tasks 
       WHERE user_id = $1 
       AND done = false  -- 🛠 Ajouté : seulement les tâches non terminées
       ORDER BY id DESC LIMIT 10`,
      [userId]
    );

    res.json({
      tasksFinished: parseInt(taskStats.rows[0].finished),
      trackedHours: parseFloat(taskStats.rows[0].hours),
      dailyPlan: {
        completed: parseInt(taskStats.rows[0].finished),
        total: parseInt(taskStats.rows[0].total),
      },
      tasksToday: tasksToday.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload Book
app.post(
  "/upload-book",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "bookfile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { title, author, category, description, price, user_id } = req.body;
      const image = req.files["image"]?.[0]?.filename;
      const bookurl = req.files["bookfile"]?.[0]?.filename;

      const newBook = await pool.query(
        `INSERT INTO books (title, author, image, category, description, bookurl, user_id, price)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [title, author, image, category, description, bookurl, user_id, price]
      );

      res.status(201).json({ success: true, insertedId: newBook.rows[0].id });
    } catch (err) {
      console.error("Erreur upload livre :", err.message);
      res.status(500).json({
        success: false,
        message: "Erreur ajout livre",
        error: err.message,
      });
    }
  }
);

// ✅ Marquer une tâche comme terminée
app.patch("/api/tasks/:id/complete", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const updateTask = await pool.query(
      "UPDATE tasks SET done = true WHERE id = $1 RETURNING *",
      [id]
    );

    if (updateTask.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Tâche non trouvée." });
    }

    res.json({
      success: true,
      message: "Tâche marquée comme terminée.",
      task: updateTask.rows[0],
    });
  } catch (err) {
    console.error("Erreur lors de la complétion de la tâche :", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// User tasks
app.get("/api/user/tasks", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      "SELECT * FROM tasks WHERE user_id = $1 ORDER BY id DESC",
      [userId]
    );
    res.json({ success: true, tasks: result.rows });
  } catch (err) {
    console.error("Erreur récupération tâches :", err.message);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// 📚 Books
app.get("/all-books", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  try {
    const books = await pool.query(
      "SELECT * FROM books ORDER BY id DESC LIMIT $1 OFFSET $2",
      [limit, offset]
    );
    const count = await pool.query("SELECT COUNT(*) FROM books");
    res.json({
      books: books.rows,
      total: parseInt(count.rows[0].count),
      page,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📖 Get Book by ID
app.get("/api/book/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    const books = await pool.query(
      "SELECT * FROM books WHERE user_id = $1  LIMIT $2 OFFSET $3",
      [userId, limit, offset]
    );

    const total = await pool.query(
      "SELECT COUNT(*) FROM books WHERE user_id = $1",
      [userId]
    );

    res.json({
      books: books.rows,
      total: parseInt(total.rows[0].count),
      page,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Récupérer tous les posts avec leurs réponses
app.get("/api/community", async (req, res) => {
  try {
    const postsResult = await pool.query(
      "SELECT * FROM community_posts ORDER BY created_at DESC"
    );
    const repliesResult = await pool.query("SELECT * FROM community_replies");

    const postsWithReplies = postsResult.rows.map((post) => ({
      ...post,
      replies: repliesResult.rows.filter((reply) => reply.post_id === post.id),
    }));

    res.json(postsWithReplies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Créer un nouveau post
app.post("/api/community", async (req, res) => {
  const { username, message } = req.body;
  if (!username || !message)
    return res.status(400).json({ error: "Champs requis" });

  const result = await pool.query(
    "INSERT INTO community_posts (username, message, created_at) VALUES ($1, $2, NOW()) RETURNING *",
    [username, message]
  );
  res.json(result.rows[0]);
});

// Ajouter une réponse à un post
app.post("/api/community/:postId/replies", async (req, res) => {
  const { postId } = req.params;
  const { username, message } = req.body;
  if (!username || !message)
    return res.status(400).json({ error: "Champs requis" });

  const result = await pool.query(
    "INSERT INTO community_replies (post_id, username, message, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *",
    [postId, username, message]
  );
  res.json(result.rows[0]);
});

// ALL BOOKS ADMIN
app.get("/api/admin/all-booksadmin", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const booksPerPage = 10;
  const offset = (page - 1) * booksPerPage;

  try {
    const totalBooks = await pool.query("SELECT COUNT(*) FROM books");
    const books = await pool.query(
      "SELECT * FROM books ORDER BY id DESC LIMIT $1 OFFSET $2",
      [booksPerPage, offset]
    );

    res.json({
      books: books.rows,
      total: parseInt(totalBooks.rows[0].count),
      page,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✏️ Update Book
app.patch("/book/:id", async (req, res) => {
  const { title, author, category, description, image } = req.body;
  try {
    const result = await pool.query(
      "UPDATE books SET title=$1, author=$2, category=$3, description=$4, image=$5 WHERE id=$6 RETURNING *",
      [title, author, category, description, image, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ❌ Delete Book
app.delete("/book/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM books WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Ajouter une tâche
app.post("/api/tasks", authenticateToken, async (req, res) => {
  const { title, project, duration, note } = req.body;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      "INSERT INTO tasks (title, project, duration, note, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [title, project, duration, note, userId]
    );

    res.status(201).json({
      success: true,
      message: "Tâche ajoutée avec succès",
      task: result.rows[0],
    });
  } catch (err) {
    console.error("Erreur tâche :", err.message);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'ajout de la tâche",
      error: err.message,
    });
  }
});

// Admin créer utilisateur
app.post(
  "/api/admin/create-user",
  upload.single("avatar"),
  async (req, res) => {
    const { name, email, password, role } = req.body;
    const avatar_url = req.file ? `/uploads/${req.file.filename}` : null;
    const created_by = req.headers["admin-id"];

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await pool.query(
        "INSERT INTO users (name, email, password, role, avatar_url, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [name, email, hashedPassword, role, avatar_url, created_by]
      );

      res.status(201).json({ success: true, user: result.rows[0] });
    } catch (err) {
      console.error("Erreur création utilisateur :", err.message);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// Admin voir tous les utilisateurs
app.get("/api/admin/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role, avatar_url, created_at FROM users ORDER BY id DESC"
    );
    res.json({ success: true, users: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});
//afficher les utilisateurs par admin
app.get("/api/admin/usersadmin", async (req, res) => {
  const adminId = req.headers["admin-id"]; // ⚡ On récupère l'id admin du header

  if (!adminId) {
    return res
      .status(400)
      .json({ success: false, message: "Admin ID manquant" });
  }

  try {
    const users = await pool.query(
      "SELECT id, name, email, role, avatar_url, created_at FROM users WHERE created_by = $1",
      [adminId]
    );
    return res.status(200).json({ success: true, users: users.rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});
//supprimer utilisateur
app.delete("/api/admin/users/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await pool.query("DELETE FROM users WHERE id = $1", [
      userId,
    ]);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Utilisateur non trouvé" });
    }

    res
      .status(200)
      .json({ success: true, message: "Utilisateur supprimé avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

//best seller
app.get("/api/books/best-sellers", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM books ORDER BY sales_count DESC LIMIT 8"
    );
    res.json({ success: true, books: result.rows });
  } catch (err) {
    console.error("Erreur dans /api/books/best-sellers :", err.message);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

//orders par utilisateur
app.get("/my-book-orders", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // maintenant injecté par le middleware

    const result = await pool.query(
      `
      SELECT o.*, b.title, u.name AS client_name
      FROM orders o
      JOIN books b ON o.book_id = b.id
      JOIN users u ON o.user_id = u.id
      WHERE o.owner_id = $1
      ORDER BY o.created_at DESC
    `,
      [userId]
    );

    res.json({ success: true, orders: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});
// livree commande
app.patch("/api/orders/:id/deliver", authenticateToken, async (req, res) => {
  const orderId = req.params.id;

  try {
    const result = await pool.query(
      "UPDATE orders SET status = 'Livrée' WHERE id = $1 RETURNING *",
      [orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Commande non trouvée" });
    }

    res.json({
      message: "Commande marquée comme livrée ✅",
      order: result.rows[0],
    });
  } catch (err) {
    console.error("Erreur :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

//commender

app.post("/api/orders", async (req, res) => {
  const { user_id, book_id, quantity } = req.body;

  if (!user_id || !book_id || !quantity) {
    return res.status(400).json({
      success: false,
      message: "Champs requis : user_id, book_id, quantity.",
    });
  }

  try {
    // 🔍 Récupérer prix et owner_id du livre
    const bookRes = await pool.query(
      `SELECT price, user_id AS owner_id FROM books WHERE id = $1`,
      [book_id]
    );

    if (bookRes.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Livre non trouvé." });
    }

    const { price, owner_id } = bookRes.rows[0];
    const total_amount = price * quantity;

    // 🛒 Insérer la commande
    const result = await pool.query(
      `INSERT INTO orders (user_id, book_id, owner_id, quantity, total_amount, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', NOW()) RETURNING *`,
      [user_id, book_id, owner_id, quantity, total_amount]
    );

    // Mettre à jour le sales_count du livre
    await pool.query(
      "UPDATE books SET sales_count = sales_count + $1 WHERE id = $2",
      [quantity, book_id]
    );

    // ✅ Réponse
    res.status(201).json({
      success: true,
      message: "Commande enregistrée avec succès ✅",
      order: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Erreur commande:", error);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// Ajouter un post
app.post("/api/community/posts", async (req, res) => {
  const { username, message } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO community_posts (username, message) VALUES ($1, $2) RETURNING *",
      [username, message]
    );
    res.status(201).json({ success: true, post: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Ajouter une réponse à un post
app.post("/api/community/replies", async (req, res) => {
  const { postId, username, message } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO community_replies (post_id, username, message) VALUES ($1, $2, $3) RETURNING *",
      [postId, username, message]
    );
    res.status(201).json({ success: true, reply: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Récupérer tous les posts avec leurs réponses
app.get("/api/community/posts", async (req, res) => {
  try {
    const postsResult = await pool.query(
      "SELECT * FROM community_posts ORDER BY created_at DESC"
    );
    const repliesResult = await pool.query(
      "SELECT * FROM community_replies ORDER BY created_at ASC"
    );

    // Organiser les réponses par post_id
    const posts = postsResult.rows.map((post) => ({
      ...post,
      replies: repliesResult.rows.filter((reply) => reply.post_id === post.id),
    }));

    res.json({ success: true, posts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET avis + moyenne
app.get("/api/reviews/:bookId", async (req, res) => {
  const { bookId } = req.params;
  try {
    const reviews = await pool.query(
      `
      SELECT r.rating, r.comment, r.created_at, u.name
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.book_id = $1
      ORDER BY r.created_at DESC
    `,
      [bookId]
    );

    const avg = await pool.query(
      `
      SELECT ROUND(AVG(rating)::numeric, 1) as average
      FROM reviews
      WHERE book_id = $1
    `,
      [bookId]
    );

    res.json({ reviews: reviews.rows, average: avg.rows[0].average || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
});

// POST avis
app.post("/api/reviews/:bookId", authenticateToken, async (req, res) => {
  const { bookId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;
  try {
    await pool.query(
      `INSERT INTO reviews (user_id, book_id, rating, comment)
       VALUES ($1, $2, $3, $4)`,
      [userId, bookId, rating, comment]
    );
    res.json({ message: "Avis ajouté" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur serveur");
  }
});

// PUT edit post
app.put("/api/community/:id", async (req, res) => {
  const { message } = req.body;
  const postId = req.params.id;
  const result = await pool.query(
    `UPDATE community_posts SET message = $1 WHERE id = $2 RETURNING *`,
    [message, postId]
  );
  res.json(result.rows[0]);
});

// POST like (1 fois par user)
app.post("/api/community/:id/like", async (req, res) => {
  const postId = req.params.id;
  const { username } = req.body;
  const exists = await pool.query(
    `SELECT * FROM community_votes WHERE post_id = $1 AND username = $2`,
    [postId, username]
  );
  if (exists.rows.length > 0)
    return res.status(400).json({ error: "Déjà voté." });

  await pool.query(
    `INSERT INTO community_votes (post_id, username, vote_type) VALUES ($1, $2, 'like')`,
    [postId, username]
  );
  const result = await pool.query(
    `UPDATE community_posts SET likes = likes + 1 WHERE id = $1 RETURNING *`,
    [postId]
  );
  res.json(result.rows[0]);
});

// POST dislike
app.post("/api/community/:id/dislike", async (req, res) => {
  const postId = req.params.id;
  const { username } = req.body;
  const exists = await pool.query(
    `SELECT * FROM community_votes WHERE post_id = $1 AND username = $2`,
    [postId, username]
  );
  if (exists.rows.length > 0)
    return res.status(400).json({ error: "Déjà voté." });

  await pool.query(
    `INSERT INTO community_votes (post_id, username, vote_type) VALUES ($1, $2, 'dislike')`,
    [postId, username]
  );
  const result = await pool.query(
    `UPDATE community_posts SET dislikes = dislikes + 1 WHERE id = $1 RETURNING *`,
    [postId]
  );
  res.json(result.rows[0]);
});

// 🚀 Lancer serveur
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});

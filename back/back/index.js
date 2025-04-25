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
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // 🔁 Serveur statique

// Multer config pour l'upload
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

// Middleware JWT
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

// Profil
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

// Dashboard
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
      `SELECT title, project, duration, deadline, note
       FROM tasks WHERE user_id = $1
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

// 📚 Upload Book
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

//tache utilisateur
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

// 📚 Get Books
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
app.get("/book/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM books WHERE id = $1", [
      req.params.id,
    ]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
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

// ✅ Ajouter tâche
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

// ✅ Admin - Créer un utilisateur avec avatar
app.post(
  "/api/admin/create-user",
  upload.single("avatar"),
  async (req, res) => {
    const { name, email, password, role } = req.body;
    const avatar_url = req.file ? `/uploads/${req.file.filename}` : null;
    const created_by = req.headers["admin-id"]; // 👈 admin connecté

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
//admin books
app.get("/api/admin/all-booksadmin", async (req, res) => {
  const userId = req.headers["user-id"];
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: "User ID is required" });
  }

  try {
    // Total count
    const totalResult = await pool.query(
      "SELECT COUNT(*) FROM books WHERE user_id = $1",
      [userId]
    );
    const total = parseInt(totalResult.rows[0].count);

    // Paginated data
    const booksResult = await pool.query(
      "SELECT * FROM books WHERE user_id = $1 ORDER BY id LIMIT $2 OFFSET $3",
      [userId, limit, offset]
    );

    res.json({
      success: true,
      books: booksResult.rows,
      total,
      page,
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Admin - Voir tous les utilisateurs
app.get("/api/admin/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role, avatar_url, created_at FROM users ORDER BY id DESC"
    );
    res.json({ success: true, users: result.rows });
  } catch (err) {
    console.error("Erreur récupération utilisateurs :", err.message);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: err.message,
    });
  }
});
//les utilisateurs by id
app.get("/api/admin/usersadmin", async (req, res) => {
  try {
    const adminId = req.headers["admin-id"]; // 🛑 récupérer l'id de l'admin connecté (envoyé depuis le front)

    if (!adminId) {
      return res
        .status(400)
        .json({ success: false, message: "Admin ID manquant" });
    }

    const result = await pool.query(
      "SELECT id, name, email, role, avatar_url, created_at FROM users WHERE created_by = $1 ORDER BY id DESC",
      [adminId]
    );

    res.json({ success: true, users: result.rows });
  } catch (err) {
    console.error("Erreur récupération utilisateurs :", err.message);
    res
      .status(500)
      .json({ success: false, message: "Erreur serveur", error: err.message });
  }
});

// ❌ Supprimer un utilisateur
app.delete("/api/admin/users/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: "Utilisateur supprimé" });
  } catch (err) {
    console.error("Erreur suppression utilisateur :", err.message);
    res.status(500).json({
      success: false,
      message: "Erreur suppression",
      error: err.message,
    });
  }
});

// 🚀 Lancer le serveur
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});

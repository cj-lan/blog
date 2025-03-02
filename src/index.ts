import express from "express";
import path from "path";
import bodyParser from "body-parser";
import {Pool} from "pg";

const app = express();
const port = 3000;

const pool = new Pool({
    user: "myuser",
    host: "db",
    database: "blog",
    password: "mypassword",
    port: 5432,
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({extended: true}));

app.get("/", async (req, res) => {
  const limit = 5;
  const page = parseInt(req.query.page as string) || 1;
  const offset = (page - 1) * limit;

  try {
    const totalPostResult = await pool.query("SELECT COUNT(*) FROM blog");
    const totalPosts = parseInt(totalPostResult.rows[0].count);
    const totalPages = Math.ceil(totalPosts / limit);

    const result = await pool.query("SELECT * FROM blog ORDER BY id LIMIT $1 OFFSET $2", [
      limit,
      offset
    ]);
    res.render("index", {
      posts: result.rows,
      page,
      totalPages,
    });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

app.get("/edit/:id", async (req, res) => {
  const {id} = req.params;
  try {
    const result = await pool.query("SELECT * FROM blog WHERE id = $1", [id]);
    if (result.rows.length === 0 ) {
      res.status(404).send("Content not found");
    } else {
      res.render("update", {
        post: result.rows[0]
      });
    }
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

app.post("/edit/:id", async (req, res) => {
  const {id} = req.params;
  const {title, content} = req.body;
  try {
    await pool.query("UPDATE blog SET title = $1, content = $2 WHERE id = $3", [
      title,
      content,
      id
    ]);
    res.redirect("/");
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

app.post("/create", async (req, res) => {
  const {title, content} = req.body;
  try {
    await pool.query("INSERT INTO blog (title, content) VALUES ($1, $2)", [
      title,
      content
    ]);
    res.redirect("/");
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

app.get("/delete/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM blog WHERE id = $1", [id]);
    res.redirect("/");
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
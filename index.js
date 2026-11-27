const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const app = express();

const db = require('./database');
const API = '/api/task-track'
const path = require('path');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
app.use(cookieParser());
app.set('trust proxy', 1);


//API request
app.post(`${API}/login`, async (req, res) => {
  const { username, password } = req.body;
  try {
    const { rows } = await db.query(
      'SELECT username, id FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );
    if (!rows.length) return res.status(400).json({ pesan: 'Username atau password salah' });

    const token = jwt.sign({ uid: rows[0].id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
    res.json({ username });

  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Terjadi kesalahan di server' });
  }
});

app.post(`${API}/register`, async (req, res) => {
  const { username, password } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
      [username, password]
    );

    const token = jwt.sign({ uid: rows[0].id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
    res.json({ username });
    
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ pesan: 'Username sudah dipakai' });
    }
    console.error(err);
    res.status(500).json({ pesan: 'Terjadi kesalahan di server' });
  }
});

app.post(`${API}/logout`, (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});


//Security Login
function requireLogin(req, res, next) {
  try {
    const payload = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    req.userId = payload.uid;
    next();
  } catch {
    res.status(401).json({ pesan: 'Belum login' });
  }
}

//Require login API
app.get(`${API}/me`, requireLogin, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT username FROM users WHERE id=$1', 
      [req.userId]
    )
    res.json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Terjadi kesalahan di server' });
  }
});

app.get(`${API}/tasks`, requireLogin, async (req, res) => {
  const { scope = 'all' } = req.query;

  const personal = 't.team_id IS NULL AND t.owner_id = $1';
  const team = 't.team_id IN (SELECT team_id FROM team_members WHERE member_id = $1)';
  const where = scope === 'personal' ? personal
              : scope === 'team' ? team
              : `(${personal}) OR (${team})`;

  try {
    const { rows } = await db.query(
      `SELECT t.id, t.name, t.due, t.team_id,
              COALESCE(tm.name, 'Personal') AS owner,
              COUNT(td.task_id)::int AS total,
              (COUNT(td.task_id) FILTER (WHERE td.done))::int AS done
       FROM tasks t
       LEFT JOIN teams tm ON tm.id = t.team_id
       LEFT JOIN task_details td ON td.task_id = t.id
       WHERE ${where}
       GROUP BY t.id, tm.name
       ORDER BY t.due ASC`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Terjadi kesalahan server' });
  }
});

app.get(`${API}/tasks/:taskId/details`, requireLogin, async (req, res) => {
  const taskId = Number(req.params.taskId);
  if (!Number.isInteger(taskId)) return res.status(400).json({ pesan: 'Task id tidak valid' });
  
  try {
    const query = `
    SELECT td.name, td.detail, td.done
    FROM task_details td
    JOIN tasks t ON t.id = td.task_id
    WHERE t.id = $1
      AND (
        (t.team_id IS NULL AND t.owner_id = $2)
        OR EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = t.team_id AND tm.member_id = $2
        )
      )
    ORDER BY td.done ASC`;
    const { rows } = await db.query(query, [taskId, req.userId]);
    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Terjadi kesalahan di server' });
  }
});

app.get(`${API}/teams`, requireLogin, async (req, res) => {
  try {
    const query = `
    SELECT t.name, t.id
    FROM teams t
    JOIN team_members tm ON t.id = tm.team_id
    WHERE tm.member_id = $1
    ORDER BY tm.joined_at DESC`
    const { rows } = await db.query(query, [req.userId]);
    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Terjadi kesalahan di server' });
  }
});

if (!process.env.VERCEL) {
  app.listen(3000, () => console.log('http://localhost:3000'));
}

module.exports = app;

const express = require('express');
const bcrypt = require('bcryptjs');
const UserService = require('../services/userService');

function createAuthRoutes(db) {
    const router = express.Router();
    const userService = new UserService(db);

    router.post('/login', async (req, res) => {
        try {
            const { username, password } = req.body || {};
            if (!username || !password) {
                return res.status(400).json({ message: 'Username and password are required' });
            }

            const inputUsername = typeof username === 'string' ? username.trim().toLowerCase() : '';
            const user = userService.getByUsername(inputUsername);

            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const ok = await bcrypt.compare(password, user.password_hash);
            if (!ok) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            userService.recordLastLogin(user.username);

            req.session.user = { username: user.username, role: user.role, name: user.name, email: user.email };
            req.session.save((err) => {
                if (err) return res.status(500).json({ message: 'Session save failed' });
                return res.json({ message: 'Logged in', user: req.session.user });
            });
        } catch (err) {
            return res.status(500).json({ message: 'Login failed' });
        }
    });

    router.post('/register', async (req, res) => {
        try {
            const { name, email, password } = req.body || {};
            if (!name || !email || !password) {
                return res.status(400).json({ message: 'Name, email, and password are required' });
            }

            const inputEmail = email.trim().toLowerCase();
            const existing = userService.getByUsername(inputEmail);

            if (existing) {
                return res.status(400).json({ message: 'User already exists with this email' });
            }

            const password_hash = bcrypt.hashSync(password, 12);
            userService.createUser({
                username: inputEmail,
                email: inputEmail,
                name: name.trim(),
                password_hash,
                role: 'user'
            });

            // auto-login after register
            req.session.user = { username: inputEmail, role: 'user', name: name.trim(), email: inputEmail };
            req.session.save((err) => {
                if (err) return res.status(500).json({ message: 'Session save failed' });
                return res.status(201).json({ message: 'Registered successfully', user: req.session.user });
            });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Registration failed' });
        }
    });

    router.post('/logout', (req, res) => {
        if (req.session) {
            req.session.destroy(() => {
                res.clearCookie('sid');
                return res.json({ message: 'Logged out' });
            });
        } else {
            return res.json({ message: 'Logged out' });
        }
    });

    router.get('/me', (req, res) => {
        if (req.session && req.session.user) {
            const u = userService.getByUsername(req.session.user.username);
            if (u) {
                req.session.user.name = u.name;
                req.session.user.email = u.email;
            }
            return res.json({ user: req.session.user });
        }
        return res.status(401).json({ message: 'Not authenticated' });
    });

    return router;
}

module.exports = createAuthRoutes;

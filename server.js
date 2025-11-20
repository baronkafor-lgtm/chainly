require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

// Models
const User = require('./models/User');
const Zap = require('./models/Zap');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chainly';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.warn('MongoDB connection failed (running in offline mode):', err.message));

// --- Authentication Routes ---

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        user = new User({
            name,
            email,
            password: hashedPassword
        });

        await user.save();

        // Create Token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check user
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Create Token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Zap Routes ---

app.get('/api/zaps', async (req, res) => {
    // In a real app, we would verify the token here
    // const token = req.headers['x-auth-token'];
    // ... verify token ...

    try {
        // Mocking user ID for now or getting from token
        const zaps = await Zap.find().limit(10);
        res.json(zaps);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/zaps', async (req, res) => {
    try {
        const newZap = new Zap(req.body);
        const zap = await newZap.save();
        res.json(zap);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Payment Routes ---

app.post('/api/create-checkout-session', (req, res) => {
    console.log('Creating checkout session for plan:', req.body.plan);

    // Simulate Stripe Checkout URL creation
    setTimeout(() => {
        res.json({
            message: 'Redirecting to Stripe Checkout (Simulation)...',
            url: null
        });
    }, 1000);
});

// --- Execution Routes ---

app.post('/api/execute', (req, res) => {
    const { stepType } = req.body;

    setTimeout(() => {
        res.json({
            success: true,
            message: stepType === 'trigger'
                ? 'Found 3 new emails (Simulated)'
                : 'Sent message to #general (Simulated)',
            data: { timestamp: new Date().toISOString() }
        });
    }, 1500);
});

// Serve frontend for any other route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'app.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

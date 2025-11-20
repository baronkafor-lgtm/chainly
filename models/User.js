const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'pro_27'],
            default: 'free'
        },
        status: {
            type: String,
            enum: ['active', 'canceled', 'past_due', 'trialing'],
            default: 'active'
        },
        stripeCustomerId: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);

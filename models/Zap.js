const mongoose = require('mongoose');

const zapSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        default: 'Untitled Zap'
    },
    isActive: {
        type: Boolean,
        default: false
    },
    steps: [{
        id: String,
        type: {
            type: String,
            enum: ['trigger', 'action'],
            required: true
        },
        name: String,
        app: String,
        config: mongoose.Schema.Types.Mixed
    }],
    executionCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Zap', zapSchema);

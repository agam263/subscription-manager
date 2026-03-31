const express = require('express');
const chatController = require('../controllers/chatController');

function createChatRoutes() {
    const router = express.Router();

    // POST /api/chat endpoint
    router.post('/', chatController.handleChat);

    return router;
}

module.exports = createChatRoutes;

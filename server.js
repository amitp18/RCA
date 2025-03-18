<!-- Server code (save as server.js) -->
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const waitingUsers = new Set();
const chatPairs = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // Add user to waiting pool
    if (waitingUsers.size > 0) {
        const partner = Array.from(waitingUsers)[0];
        waitingUsers.delete(partner);
        chatPairs.set(socket.id, partner);
        chatPairs.set(partner, socket.id);
        
        // Notify both users they're connected
        socket.emit('message', { text: 'Connected with a random stranger!' });
        io.to(partner).emit('message', { text: 'Connected with a random stranger!' });
    } else {
        waitingUsers.add(socket.id);
        socket.emit('message', { text: 'Waiting for someone to connect...' });
    }

    // Handle messages
    socket.on('message', (message) => {
        const partner = chatPairs.get(socket.id);
        if (partner) {
            io.to(partner).emit('message', message);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const partner = chatPairs.get(socket.id);
        if (partner) {
            io.to(partner).emit('message', { text: 'Your chat partner has disconnected.' });
            chatPairs.delete(partner);
            chatPairs.delete(socket.id);
        }
        waitingUsers.delete(socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const messageRoutes = require('./routes/message');
const eventRoutes = require('./routes/event');        // ← à rajouter
const taskRoutes = require('./routes/task');          // ← si tu as des tasks
const Message = require('./models/Message');
const notifRoute = require('./routes/notificationRoute')
const chatbotRoutes = require('./routes/chatbot');

const app = express();
app.use(express.json());
app.use(cors());

// Toutes les routes HTTP
app.use('/api/auth', authRoutes);

app.use('/api/users', authRoutes); // Alternative route pour compatibilité
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/events', eventRoutes);          // ← events
app.use('/api/events', taskRoutes);           // ← tasks (si ton router les monte sur /api/events/:eventId/tasks)
// Ajoute ici d'autres routes si tu en as
app.use('/api/notifications',notifRoute);
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err.message));

// Socket.io
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined room ${conversationId}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { senderId, receiverId, content } = data;
      if (!senderId || !receiverId || !content) return;

      const message = new Message({ sender: senderId, receiver: receiverId, content });
      await message.save();

      const conversationId = makeConversationId(senderId, receiverId);

      io.to(conversationId).emit('receive_message', {
        _id: message._id.toString(),
        senderId,
        receiverId,
        content,
        createdAt: message.createdAt
      });
    } catch (err) {
      console.error('Erreur send_message socket.io:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

function makeConversationId(a, b) {
  return [a, b].sort().join('_');
}
app.use('/api/chatbot', chatbotRoutes);


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server + socket.io on port ${PORT}`));

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

// API 라우트 설정
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "https://67170dc22490122405c3e4ab--merry-tapioca-823a0b.netlify.app", // Netlify URL로 변경
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 10000;

const rooms = new Map();

function generateNumber() {
  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const result = [];
  for (let i = 0; i < 3; i++) {
    const index = Math.floor(Math.random() * numbers.length);
    result.push(numbers[index]);
    numbers.splice(index, 1);
  }
  return result.join('');
}

function checkGuess(target, guess) {
  let strikes = 0;
  let balls = 0;
  for (let i = 0; i < 3; i++) {
    if (target[i] === guess[i]) {
      strikes++;
    } else if (target.includes(guess[i])) {
      balls++;
    }
  }
  return { strikes, balls };
}

io.on('connection', (socket) => {
  console.log('새로운 클라이언트가 연결되었습니다.');

  socket.on('createRoom', (roomId) => {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { players: [socket.id], number: generateNumber() });
      socket.join(roomId);
      socket.emit('roomCreated', roomId);
    } else {
      socket.emit('error', '이미 존재하는 방입니다.');
    }
  });

  socket.on('joinRoom', (roomId) => {
    if (rooms.has(roomId) && rooms.get(roomId).players.length < 2) {
      rooms.get(roomId).players.push(socket.id);
      socket.join(roomId);
      io.to(roomId).emit('gameStart', '게임이 시작되었습니다!');
    } else {
      socket.emit('error', '방을 찾을 수 없거나 이미 꽉 찼습니다.');
    }
  });

  socket.on('guess', ({ roomId, number }) => {
    if (rooms.has(roomId) && rooms.get(roomId).players.includes(socket.id)) {
      const result = checkGuess(rooms.get(roomId).number, number);
      io.to(roomId).emit('guessResult', { player: socket.id, guess: number, result });
      
      if (result.strikes === 3) {
        io.to(roomId).emit('gameOver', { winner: socket.id, number: rooms.get(roomId).number });
        rooms.delete(roomId);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('클라이언트 연결이 끊어졌습니다.');
    rooms.forEach((value, key) => {
      if (value.players.includes(socket.id)) {
        rooms.delete(key);
        io.to(key).emit('playerLeft', '상대방이 게임을 떠났습니다.');
      }
    });
  });
});

server.listen(PORT, () => console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`));

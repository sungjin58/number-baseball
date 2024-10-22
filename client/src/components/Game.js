import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:4000');

function Game() {
  const [roomId, setRoomId] = useState('');
  const [gameStatus, setGameStatus] = useState('');
  const [guess, setGuess] = useState('');
  const [guessHistory, setGuessHistory] = useState([]);
  const [isGameStarted, setIsGameStarted] = useState(false);

  useEffect(() => {
    socket.on('roomCreated', (id) => {
      setRoomId(id);
      setGameStatus('방이 생성되었습니다. 상대방을 기다리는 중...');
    });

    socket.on('gameStart', (message) => {
      setGameStatus(message);
      setIsGameStarted(true);
    });

    socket.on('error', (error) => {
      setGameStatus(error);
    });

    socket.on('guessResult', ({ player, guess, result }) => {
      setGuessHistory(prev => [...prev, { player, guess, result }]);
      setGameStatus(`${player === socket.id ? '당신의' : '상대방의'} 추측: ${guess} - ${result.strikes}스트라이크 ${result.balls}볼`);
    });

    socket.on('gameOver', ({ winner, number }) => {
      setGameStatus(`게임 종료! ${winner === socket.id ? '당신이' : '상대방이'} 승리했습니다. 정답은 ${number}입니다.`);
      setIsGameStarted(false);
    });

    socket.on('playerLeft', (message) => {
      setGameStatus(message);
      setIsGameStarted(false);
    });

    return () => {
      socket.off('roomCreated');
      socket.off('gameStart');
      socket.off('error');
      socket.off('guessResult');
      socket.off('gameOver');
      socket.off('playerLeft');
    };
  }, []);

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substr(2, 9);
    socket.emit('createRoom', newRoomId);
  };

  const joinRoom = () => {
    socket.emit('joinRoom', roomId);
  };

  const submitGuess = () => {
    if (guess.length === 3 && /^\d+$/.test(guess)) {
      socket.emit('guess', { roomId, number: guess });
      setGuess('');
    } else {
      setGameStatus('3자리 숫자를 입력해주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-800 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-gray-700 shadow-lg sm:rounded-3xl sm:p-20">
          <h1 className="text-4xl font-bold mb-8 text-center text-white">숫자 야구 게임</h1>
          
          {!isGameStarted && (
            <div className="space-y-4">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="방 ID 입력"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-gray-600 text-white"
              />
              <div className="flex space-x-4">
                <button onClick={createRoom} className="w-1/2 bg-cyan-500 text-white px-4 py-2 rounded-md hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50">방 만들기</button>
                <button onClick={joinRoom} className="w-1/2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">방 참여하기</button>
              </div>
            </div>
          )}
          
          {isGameStarted && (
            <div className="space-y-4">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder="3자리 숫자 입력"
                  maxLength={3}
                  className="w-2/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-gray-600 text-white"
                />
                <button onClick={submitGuess} className="w-1/3 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50">제출</button>
              </div>
            </div>
          )}
          
          <p className="mt-4 text-lg text-gray-300">{gameStatus}</p>
          
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-white">추측 기록</h2>
            <ul className="space-y-2">
              {guessHistory.map((item, index) => (
                <li key={index} className="bg-gray-600 p-2 rounded-md text-white">
                  <span className={`font-semibold ${item.player === socket.id ? 'text-cyan-300' : 'text-blue-300'}`}>
                    {item.player === socket.id ? '나' : '상대방'}
                  </span>: {item.guess} - {item.result.strikes}스트라이크 {item.result.balls}볼
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Game;

var express = require('express'),
    expressApp = express(),
    socketio = require('socket.io'),
    http = require('http'),
    server = http.createServer(expressApp),
    uuid = require('node-uuid'),
    rooms = {},
    userIds = {};



    const express = require("express");
    const app = express();
    var http = require("http").Server(app);
    var io = require("socket.io")(http);
    var server = http.createServer(app);
    var uuid = require("node-uuid");
    var rooms = {};
    var userIds = {};

var port = 3000;

app.use(express.static("public"));

io.on("connection", function(socket){
    var currentRoom, id;

    socket.on("create or join", function(data, fn){
        currentRoom = (data || {}).room || uuid.v4();
        var room = rooms[currentRoom];
        if(!data){
            rooms[currentRoom] = [socket];
            id = userIds[currentRoom] = 0;
            fn(currentRoom, id);
            console.log('Room created, with #', currentRoom);
        }
        else{
            if(!room){
                return;
            }
            userIds[currentRoom] += 1;
            id = userIds[currentRoom];
            fn(currentRoom, id);
            room.forEach(function(s){
                s.emit("offer", {id: id})
            });
            room[id] = socket;
            console.log('Peer connected to room', currentRoom, 'with #', id);
        }
    });

    socket.on('ready', function (data) {
      var to = parseInt(data.to, 10);
      if (rooms[currentRoom] && rooms[currentRoom][to]) {
        console.log('Redirecting message to', to, 'by', data.by);
        rooms[currentRoom][to].emit('msg', data);
      } else {
        console.warn('Invalid user');
      }
    });

    socket.on('disconnect', function () {
      if (!currentRoom || !rooms[currentRoom]) {
        return;
      }
      delete rooms[currentRoom][rooms[currentRoom].indexOf(socket)];
      rooms[currentRoom].forEach(function (socket) {
        if (socket) {
          socket.emit('peer.disconnected', { id: id });
        }
      });
    });
});

exports.run = function (config) {

  server.listen(port);
  console.log('Listening on', port);
  socketio.listen(server, { log: false })
  .on('connection', function (socket) {

    var currentRoom, id;

    socket.on('init', function (data, fn) {
      currentRoom = (data || {}).room || uuid.v4();
      var room = rooms[currentRoom];
      if (!data) {
        rooms[currentRoom] = [socket];
        id = userIds[currentRoom] = 0;
        fn(currentRoom, id);
        console.log('Room created, with #', currentRoom);
      } else {
        if (!room) {
          return;
        }
        userIds[currentRoom] += 1;
        id = userIds[currentRoom];
        fn(currentRoom, id);
        room.forEach(function (s) {
          s.emit('peer.connected', { id: id });
        });
        room[id] = socket;
        console.log('Peer connected to room', currentRoom, 'with #', id);
      }
    });

    socket.on('msg', function (data) {
      var to = parseInt(data.to, 10);
      if (rooms[currentRoom] && rooms[currentRoom][to]) {
        console.log('Redirecting message to', to, 'by', data.by);
        rooms[currentRoom][to].emit('msg', data);
      } else {
        console.warn('Invalid user');
      }
    });

    socket.on('disconnect', function () {
      if (!currentRoom || !rooms[currentRoom]) {
        return;
      }
      delete rooms[currentRoom][rooms[currentRoom].indexOf(socket)];
      rooms[currentRoom].forEach(function (socket) {
        if (socket) {
          socket.emit('peer.disconnected', { id: id });
        }
      });
    });
  });
};
const express = require("express");
const socket = require("socket.io");

const app = express();

let server = app.listen(4000, function () {
  console.log("index.js : Server is running on 4000");
});

app.use(express.static("public"));

let io = socket(server);

io.on("connection", function (socket) {
  console.log("index.js : User Connected : " + socket.id);

  socket.on("no_camera", function (data) {
    socket.emit("no_camera");
  });
  socket.on("join", function (roomName) {
    let rooms = io.sockets.adapter.rooms;
    let room = rooms.get(roomName);

    if (room == undefined) {
      socket.join(roomName);
      socket.emit("created");
      console.log("index.js : Room Created");
    } else {
      socket.join(roomName);
      socket.emit("joined");
      console.log("index.js : Room Joined");
    }
    console.log("index.js : " + rooms);
  });
  socket.on("ready", function (roomName) {
    console.log("index.js : ready");
    socket.broadcast.to(roomName).emit("ready");
  });
  socket.on("candidate", function (candidate, roomName) {
    console.log("index.js : candidate");
    socket.broadcast.to(roomName).emit("candidate", candidate);
  });
  socket.on("offer", function (offer, roomName) {
    console.log("index.js : offer ");
    socket.broadcast.to(roomName).emit("offer", offer);
  });

  socket.on("answer", function (answer, roomName) {
    console.log("index.js : answer");
    socket.broadcast.to(roomName).emit("answer", answer);
  });
});

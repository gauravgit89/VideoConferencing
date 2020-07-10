const express = require("express");
const app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);

app.use(express.static(__dirname + "/public"));

//signalling handlers
io.on("connection", function(socket){
    console.log("user connected");

    //when client emits create or join
    socket.on("create or join", function(room){
        console.log("create or join to the room", room);

        //count the number of users in room
        var myRoom = io.sockets.adapter.rooms[room] || {length: 0};
        var numClients = myRoom.length;

        console.log(room, "has ", numClients, "clients");

        if(numClients == 0){
            socket.join(room);
            socket.emit("created", room);
        } else if(numClients == 1){
            socket.join(room);
            socket.emit("joined", room);
        } else{
            socket.join(room);
            socket.emit("joined", room);
            // socket.emit("full",room);
        }
    })

    socket.on("ready", function(room){
        socket.broadcast.to(room).emit("ready");
    })

    socket.on("candidate", function(event){
        socket.broadcast.to(event.room).emit("candidate", event);
    })

    socket.on("offer", function(event){
        socket.broadcast.to(event.room).emit("offer", event.sdp);
    })

    socket.on("answer", function(event){
        socket.broadcast.to(event.room).emit("answer", event.sdp);
    })
});

http.listen(3000, function(){
    console.log("listening on : " + 3000 );
})
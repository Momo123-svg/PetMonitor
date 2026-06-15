const express = require("express");
const app = express();

const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

io.on("connection", (socket) => {

    socket.on("join-room", ({ room, role }) => {

        socket.join(room);

        if (role === "viewer") {
            socket.to(room).emit("viewer-joined");
        }
    });

    socket.on("offer", (data) => {
        socket.to(data.room).emit("offer", data.offer);
    });

    socket.on("answer", (data) => {
        socket.to(data.room).emit("answer", data.answer);
    });

    socket.on("ice-candidate", (data) => {
        socket.to(data.room).emit("ice-candidate", data.candidate);
    });

});

const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
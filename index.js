import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

import router from "./src/router/router.js";
import {
    getUser,
    getUsersInRoom,
    addUser,
    removeUser,
} from "./src/controller/user.js";

const CLIENT_URL = "http://localhost:3000";
const PORT = process.env.PORT || 5000;
const ADMIN_USER = "Admin";

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: CLIENT_URL,
    },
});

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.header("Access-Control-Allow-Origin", CLIENT_URL);
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    console.log(`${req.method}: ${req.url}`);
    next();
});

app.use(
    cors({
        origin: `${CLIENT_URL}`,
        credentials: true,
    })
);

app.use(router);

io.on("connection", (socket) => {
    console.log("Connected");
    socket.on("join", ({ name, chatRoom }, callback) => {
        console.log(`${name} joined ${chatRoom}`);
        const { user, error } = addUser({ id: socket.id, name, chatRoom });
        if (error) {
            return callback(error);
        }
        socket.emit("message", {
            user: ADMIN_USER,
            text: `${user.name}, welcome to ${user.chatRoom}`,
        });
        socket.broadcast.to(user.chatRoom).emit("message", {
            user: ADMIN_USER,
            text: `${user.name} has joined.`,
        });
        socket.join(user.chatRoom);
        io.to(user.chatRoom).emit(
            "chatRoomDetails",
            getUsersInRoom(user.chatRoom)
        );
        callback();
    });
    socket.on("sendMessage", (message, callback) => {
        const user = getUser(socket.id);
        if (!user) {
            return callback("User not found");
        }
        console.log(
            `${socket.id}: ${user.name} sent a message in chat room ${user.chatRoom}`
        );
        io.to(user.chatRoom).emit("message", {
            user: user.name,
            text: message,
        });
        callback();
    });
    socket.on("userDisconnect", () => {
        const user = removeUser(socket.id);
        if (user) {
            console.log(`${user.name} left ${user.chatRoom}`);
            io.to(user.chatRoom).emit("message", {
                user: ADMIN_USER,
                text: `${user.name} has left.`,
            });
            io.to(user.chatRoom).emit(
                "chatRoomDetails",
                getUsersInRoom(user.chatRoom)
            );
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// https://stackoverflow.com/questions/52936584/node-js-importing-socket-io-with-es6

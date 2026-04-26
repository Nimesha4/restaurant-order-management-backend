require("dotenv").config();
const express = require("express");
const mongoose = require("./config/db");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const socketIo = require("socket.io");

const orderRoutes = require("./routes/orderRoutes");
const authRoutes = require("./routes/authRoutes");
const userDetailsRoutes = require("./routes/userDetailsRoutes");
const { generateToken } = require("./middleware/generateToken");

// Call the generateToken function
//const token = generateToken("Customer", "6800eeb68bddabe494aaf7f4", "uthara@gmail.com");

// Log the generated token
//console.log(token);
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "https://glowing-sunshine-d907db.netlify.app/", methods: ["GET", "POST"] },
});

// Middleware
app.use(cors({ origin: "https://glowing-sunshine-d907db.netlify.app/" }));
app.use(bodyParser.json());

// WebSocket
io.on("connection", (socket) => {
  console.log("Client connected");
  socket.on("disconnect", () => console.log("Client disconnected"));
});

app.set("io", io);

app.get("/", (req, res) => {
 return  res.send({message : "Hello"});
});

// Routes
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/userdetails", userDetailsRoutes);

const PORT = process.env.PORT || 8002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


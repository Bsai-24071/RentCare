const express = require("express");
const http = require("http");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(express.json());
// Routes
const userRoutes = require("./routes/userRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const authRoutes = require("./routes/authRoutes");
const fileRoutes = require("./routes/fileRoutes");

app.use("/api/users", userRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);

app.get("/", (req, res) => {
  res.send("RentCare backend is running");
});

// Socket.io
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_room", (userId) => {
    socket.join(userId);
    console.log("User joined room:", userId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
module.exports = { io };

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
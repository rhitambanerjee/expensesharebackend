const express = require("express");
const dotenv = require("dotenv");
const conn = require("./config/db");
const userRouter = require("./routes/userRoutes");
const expenseRouter = require("./routes/expenseRoutes");

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
conn();

app.use("/user", userRouter);
app.use("/expense", expenseRouter);

app.get("/", (req, res) => {
  res.send("hello");
});

app.listen(PORT, () => {
  console.log(`Listening at port ${PORT}`);
});

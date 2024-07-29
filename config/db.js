const mongoose = require("mongoose");

const conn = async () => {
  try {
    await mongoose.connect(process.env.MONGOURI);
    console.log("Connection established successfully");
  } catch (e) {
    console.log(e.message);
  }
};

module.exports = conn;

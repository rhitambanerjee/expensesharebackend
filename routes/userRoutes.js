const express = require("express");
const { signUp, login, getAllUsers } = require("../controllers/userController");
const { verifyToken } = require("../config/isAuth");
const router = express.Router();

router.post("/signup", signUp);
router.post("/login", login);
router.get("/allusers", verifyToken, getAllUsers);

module.exports = router;

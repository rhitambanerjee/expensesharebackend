const express = require("express");
const router = express.Router();
const {
  addExpense,
  getUserExpenses,
  getOverallExpenses,
  downloadBalanceSheet,
} = require("../controllers/expenseController");

router.post("/addExpense", addExpense);
router.get("/user/:userId", getUserExpenses);
router.get("/addExpense", getOverallExpenses);
router.get("/user/:userId/download", downloadBalanceSheet);

module.exports = router;

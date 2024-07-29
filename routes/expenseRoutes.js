const express = require('express');
const router = express.Router();
const { addExpense } = require('../controllers/expenseController');


router.post('/addExpense', addExpense);

module.exports = router;

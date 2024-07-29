const Expense = require('../models/expenseModels');
const User = require('../models/userModels');

// Add Expense
exports.addExpense = async (req, res) => {
    const { description, amount, splitMethod, participants } = req.body;

    try {
        let calculatedParticipants = [];

        if (splitMethod === 'Equal') {
            const splitAmount = amount / participants.length;
            calculatedParticipants = await Promise.all(participants.map(async (participant) => {
                const user = await User.findOne({ name: participant.name });
                if (!user) throw new Error(`User ${participant.name} not found`);
                return {
                    user: user._id,
                    amount: splitAmount,
                };
            }));
        } else if (splitMethod === 'Exact') {
            calculatedParticipants = await Promise.all(participants.map(async (participant) => {
                const user = await User.findOne({ name: participant.name });
                if (!user) throw new Error(`User ${participant.name} not found`);
                return {
                    user: user._id,
                    amount: participant.amount,
                };
            }));
        } else if (splitMethod === 'Percentage') {
            calculatedParticipants = await Promise.all(participants.map(async (participant) => {
                const user = await User.findOne({ name: participant.name });
                if (!user) throw new Error(`User ${participant.name} not found`);
                return {
                    user: user._id,
                    amount: (amount * participant.percentage) / 100,
                    percentage: participant.percentage,
                };
            }));
        }

        const expense = new Expense({
            description,
            amount,
            splitMethod,
            participants: calculatedParticipants,
        });

        await expense.save();
        res.status(201).json(expense);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

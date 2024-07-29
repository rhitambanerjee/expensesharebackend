const Expense = require('../models/expenseModels');
const User = require('../models/userModels');
const PDFDocument = require('pdfkit');

// Add Expense
exports.addExpense = async (req, res) => {
    const { description, amount, splitMethod, participants } = req.body;

    try {
        // Check if at least one participant exists in the database
        const userNames = participants.map(participant => participant.name);
        const existingUser = await User.findOne({ name: { $in: userNames } });

        if (!existingUser) {
            return res.status(404).json({ msg: 'None of the participants are found in the database' });
        }

        let calculatedParticipants = [];
        let totalAmount = 0;
        let totalPercentage = 0;

        if (splitMethod === 'Equal') {
            const splitAmount = amount / participants.length;
            calculatedParticipants = await Promise.all(participants.map(async (participant) => {
                const user = await User.findOne({ name: participant.name });
                return {
                    user: user._id,
                    amount: splitAmount,
                };
            }));
        } else if (splitMethod === 'Exact') {
            calculatedParticipants = await Promise.all(participants.map(async (participant) => {
                const user = await User.findOne({ name: participant.name });
                return {
                    user: user._id,
                    amount: participant.amount,
                };
            }));
            totalAmount = calculatedParticipants.reduce((acc, participant) => acc + participant.amount, 0);
            if (totalAmount !== amount) {
                return res.status(400).json({ msg: 'The sum of exact amounts does not equal the total amount' });
            }
        } else if (splitMethod === 'Percentage') {
            calculatedParticipants = await Promise.all(participants.map(async (participant) => {
                const user = await User.findOne({ name: participant.name });
                return {
                    user: user._id,
                    amount: (amount * participant.percentage) / 100,
                    percentage: participant.percentage,
                };
            }));
            totalPercentage = calculatedParticipants.reduce((acc, participant) => acc + participant.percentage, 0);
            if (totalPercentage !== 100) {
                return res.status(400).json({ msg: 'The total percentage does not equal 100' });
            }
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

// Retrieve individual user expenses
exports.getUserExpenses = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const expenses = await Expense.find({ 'participants.user': user._id });

        res.json(expenses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Retrieve overall expenses
exports.getOverallExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find();
        res.json(expenses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Download balance sheet as PDF
exports.downloadBalanceSheet = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const expenses = await Expense.find({ 'participants.user': user._id });

        const doc = new PDFDocument();

        let totalAmount = 0;
        let owes = {};

        for (const expense of expenses) {
            totalAmount += expense.participants.find(p => p.user.toString() === user._id.toString()).amount;

            for (const participant of expense.participants) {
                if (participant.user.toString() !== user._id.toString()) {
                    const participantUser = await User.findById(participant.user);
                    if (!owes[participantUser.name]) {
                        owes[participantUser.name] = 0;
                    }
                    owes[participantUser.name] += participant.amount;
                }
            }
        }

        doc.pipe(res);

        doc.fontSize(20).text('Balance Sheet', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text(`Name: ${user.name}`);
        doc.moveDown();

        for (const expense of expenses) {
            doc.fontSize(12).text(`Description: ${expense.description}`);
            doc.fontSize(12).text(`Amount: ${expense.amount}`);
            doc.fontSize(12).text(`Split Method: ${expense.splitMethod}`);
            doc.fontSize(12).text('Participants:');
            for (const participant of expense.participants) {
                const participantUser = await User.findById(participant.user);
                doc.fontSize(12).text(`  - ${participantUser.name}: ${participant.amount}`);
            }
            doc.moveDown();
        }

        doc.moveDown();
        doc.fontSize(14).text('Owes:');
        for (const [name, amount] of Object.entries(owes)) {
            doc.fontSize(12).text(`  - ${name}: ${amount}`);
        }

        doc.moveDown();
        doc.fontSize(14).text(`Total Amount: ${totalAmount}`, { align: 'right' });

        doc.end();
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

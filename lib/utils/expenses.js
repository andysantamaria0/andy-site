/**
 * Calculate equal splits for an expense among participants.
 * Returns an array of { userId, amount } objects.
 */
export function splitEqual(totalAmount, participantIds) {
  const share = Math.round((totalAmount / participantIds.length) * 100) / 100;
  const remainder = Math.round((totalAmount - share * participantIds.length) * 100) / 100;

  return participantIds.map((userId, i) => ({
    userId,
    amount: i === 0 ? share + remainder : share,
  }));
}

/**
 * Calculate net balances from a list of expenses with splits.
 * Returns a Map of userId → net amount (positive = owed money, negative = owes money).
 */
export function calculateBalances(expenses) {
  const balances = new Map();

  for (const expense of expenses) {
    const payerId = expense.paid_by;
    // Payer is owed the total amount
    balances.set(payerId, (balances.get(payerId) || 0) + Number(expense.amount));

    // Each split participant owes their share
    for (const split of expense.splits || []) {
      const userId = split.user_id;
      balances.set(userId, (balances.get(userId) || 0) - Number(split.amount));
    }
  }

  return balances;
}

/**
 * Given net balances, compute minimum transactions to settle debts.
 * Returns array of { from, to, amount }.
 */
export function minimizeTransactions(balances) {
  const debtors = []; // people who owe (negative balance)
  const creditors = []; // people who are owed (positive balance)

  for (const [userId, balance] of balances) {
    const rounded = Math.round(balance * 100) / 100;
    if (rounded < 0) debtors.push({ userId, amount: Math.abs(rounded) });
    if (rounded > 0) creditors.push({ userId, amount: rounded });
  }

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const payment = Math.min(debtors[i].amount, creditors[j].amount);
    if (payment > 0.01) {
      transactions.push({
        from: debtors[i].userId,
        to: creditors[j].userId,
        amount: Math.round(payment * 100) / 100,
      });
    }
    debtors[i].amount -= payment;
    creditors[j].amount -= payment;
    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return transactions;
}

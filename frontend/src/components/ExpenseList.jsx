import React from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Trash } from '@phosphor-icons/react';
import { Button } from './ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ExpenseList({ expenses, properties, onRefresh }) {
  const handleDelete = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await axios.delete(`${API}/expenses/${expenseId}`);
      toast.success('Expense deleted successfully');
      onRefresh();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : 'Unknown Property';
  };

  const getCategoryColor = (category) => {
    const colors = {
      maintenance: '#7BA38A',
      repairs: '#D96C4E',
      insurance: '#2C4C3B',
      other: '#7D7D7D'
    };
    return colors[category] || colors.other;
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 text-[#7D7D7D]">
        <p>No expenses recorded yet. Click "Add Expense" to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full" data-testid="expenses-table">
        <thead>
          <tr className="border-b border-[#E6E2D8]">
            <th className="text-left py-3 px-4 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Date
            </th>
            <th className="text-left py-3 px-4 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Property
            </th>
            <th className="text-left py-3 px-4 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Category
            </th>
            <th className="text-left py-3 px-4 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Description
            </th>
            <th className="text-right py-3 px-4 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Amount
            </th>
            <th className="text-center py-3 px-4 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id} className="border-b border-[#E6E2D8] hover:bg-[#F7F5F0]/50" data-testid={`expense-row-${expense.id}`}>
              <td className="py-4 px-4 text-[#2E2E2E]">
                {new Date(expense.date).toLocaleDateString('en-IN')}
              </td>
              <td className="py-4 px-4 text-[#2E2E2E]">
                {getPropertyName(expense.property_id)}
              </td>
              <td className="py-4 px-4">
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-medium capitalize"
                  style={{
                    backgroundColor: `${getCategoryColor(expense.category)}15`,
                    color: getCategoryColor(expense.category)
                  }}
                >
                  {expense.category}
                </span>
              </td>
              <td className="py-4 px-4 text-[#7D7D7D]">
                {expense.description}
              </td>
              <td className="py-4 px-4 text-right font-semibold text-[#D96C4E]">
                ₹{expense.amount.toLocaleString('en-IN')}
              </td>
              <td className="py-4 px-4 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(expense.id)}
                  className="text-[#D96C4E] hover:text-[#C2583D] hover:bg-[#D96C4E]/10"
                  data-testid={`delete-expense-${expense.id}`}
                >
                  <Trash size={18} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AddReminderDialog({ open, onOpenChange, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    due_date: new Date().toISOString().split('T')[0],
    priority: 'medium',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const reset = () => setForm({
    title: '',
    due_date: new Date().toISOString().split('T')[0],
    priority: 'medium',
    notes: ''
  });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/custom-reminders`, {
        title: form.title.trim(),
        due_date: form.due_date,
        priority: form.priority,
        notes: form.notes.trim() || null
      });
      toast.success('Reminder added');
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add reminder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-white" data-testid="add-reminder-dialog">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#0F172A]">Add Custom Reminder</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="reminder-title" className="text-[#0F172A]">Title *</Label>
              <Input
                id="reminder-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder=""
                required
                className="border-[#E5E2DA]"
                data-testid="reminder-title-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="reminder-date" className="text-[#0F172A]">Due Date *</Label>
                <Input
                  id="reminder-date"
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  required
                  className="border-[#E5E2DA]"
                  data-testid="reminder-date-input"
                />
              </div>
              <div>
                <Label htmlFor="reminder-priority" className="text-[#0F172A]">Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger className="border-[#E5E2DA]" data-testid="reminder-priority-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="reminder-notes" className="text-[#0F172A]">Notes (optional)</Label>
              <Textarea
                id="reminder-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder=""
                className="border-[#E5E2DA]"
                data-testid="reminder-notes-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#E5E2DA]"
              data-testid="cancel-reminder-btn"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#0F172A] hover:bg-[#1E293B] text-white"
              data-testid="submit-reminder-btn"
            >
              {loading ? 'Adding…' : 'Add Reminder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

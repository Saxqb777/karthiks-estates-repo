import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Info } from '@phosphor-icons/react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CloseLeaseDialog({ open, onOpenChange, tenant, onSuccess }) {
  const [formData, setFormData] = useState({
    lease_end_date: new Date().toISOString().split('T')[0],
    pending_dues_at_exit: '0',
    deposit_refunded: '0',
    deposit_withheld: '0',
    exit_notes: ''
  });
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingEstimate, setLoadingEstimate] = useState(false);

  useEffect(() => {
    const fetchEstimate = async () => {
      if (!tenant || !open) return;
      setLoadingEstimate(true);
      try {
        const res = await axios.get(`${API}/tenants/${tenant.id}/pending-dues-estimate`);
        setEstimate(res.data);
        const dues = res.data.estimated_amount || 0;
        const deposit = tenant.security_deposit || 0;
        const withheld = Math.min(dues, deposit);
        const refunded = Math.max(0, deposit - withheld);
        setFormData({
          lease_end_date: new Date().toISOString().split('T')[0],
          pending_dues_at_exit: dues.toString(),
          deposit_withheld: withheld.toString(),
          deposit_refunded: refunded.toString(),
          exit_notes: ''
        });
      } catch (error) {
        console.error('Error fetching estimate:', error);
      } finally {
        setLoadingEstimate(false);
      }
    };
    fetchEstimate();
  }, [tenant, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tenant) return;
    setLoading(true);
    try {
      await axios.post(`${API}/tenants/${tenant.id}/close-lease`, {
        lease_end_date: formData.lease_end_date,
        pending_dues_at_exit: parseFloat(formData.pending_dues_at_exit) || 0,
        deposit_refunded: parseFloat(formData.deposit_refunded) || 0,
        deposit_withheld: parseFloat(formData.deposit_withheld) || 0,
        exit_notes: formData.exit_notes
      });
      toast.success(`Lease closed for ${tenant.name}`);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error closing lease:', error);
      toast.error('Failed to close lease');
    } finally {
      setLoading(false);
    }
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const totalDepositSettlement = (parseFloat(formData.deposit_refunded) || 0) + (parseFloat(formData.deposit_withheld) || 0);
  const securityDeposit = tenant?.security_deposit || 0;
  const depositMismatch = Math.abs(totalDepositSettlement - securityDeposit) > 0.01;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto" data-testid="close-lease-dialog">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-[#2C4C3B]">
            Close Lease — {tenant?.name}
          </DialogTitle>
          <DialogDescription className="text-[#7D7D7D]">
            Settle outstanding dues and security deposit. All historical records will be preserved.
          </DialogDescription>
        </DialogHeader>

        {loadingEstimate ? (
          <div className="py-8 text-center text-[#7D7D7D]">Calculating pending dues...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Auto-calculated estimate info */}
              {estimate && estimate.estimated_amount > 0 && (
                <div className="p-4 bg-[#F7F5F0] border border-[#E6E2D8] rounded-lg">
                  <div className="flex items-start gap-2 mb-3">
                    <Info size={20} className="text-[#D96C4E] mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#2E2E2E] mb-1">
                        Auto-calculated pending dues: ₹{estimate.estimated_amount.toLocaleString('en-IN')}
                      </p>
                      <div className="text-xs text-[#7D7D7D] grid grid-cols-3 gap-2 mt-2">
                        <div>
                          <span className="block uppercase tracking-wider text-[10px] font-bold">Expected</span>
                          <span className="text-sm font-semibold text-[#2E2E2E]">₹{estimate.total_expected.toLocaleString('en-IN')}</span>
                          <span className="block text-[10px]">{estimate.expected_months} month(s) × ₹{estimate.monthly_rent.toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="block uppercase tracking-wider text-[10px] font-bold">Received</span>
                          <span className="text-sm font-semibold text-[#7BA38A]">₹{estimate.total_received.toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="block uppercase tracking-wider text-[10px] font-bold">Balance</span>
                          <span className="text-sm font-semibold text-[#D96C4E]">₹{estimate.estimated_amount.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {estimate.month_breakdown && estimate.month_breakdown.length > 0 && (
                    <details className="text-xs text-[#7D7D7D]">
                      <summary className="cursor-pointer hover:text-[#2C4C3B] font-medium uppercase tracking-wider text-[10px]">
                        View month-by-month breakdown
                      </summary>
                      <div className="mt-2 max-h-40 overflow-y-auto border-t border-[#E6E2D8] pt-2">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-[#E6E2D8]">
                              <th className="text-left py-1 font-medium">Month</th>
                              <th className="text-right py-1 font-medium">Expected</th>
                              <th className="text-right py-1 font-medium">Received</th>
                              <th className="text-right py-1 font-medium">Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {estimate.month_breakdown.map((m, idx) => (
                              <tr key={idx} className={m.balance > 0 ? 'text-[#D96C4E]' : 'text-[#7BA38A]'}>
                                <td className="py-1">{monthNames[m.month - 1]} {m.year}</td>
                                <td className="py-1 text-right">₹{m.expected.toLocaleString('en-IN')}</td>
                                <td className="py-1 text-right">₹{m.received.toLocaleString('en-IN')}</td>
                                <td className="py-1 text-right font-semibold">₹{m.balance.toLocaleString('en-IN')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="lease_end_date" className="text-[#2E2E2E]">Move-out Date *</Label>
                <Input
                  id="lease_end_date"
                  type="date"
                  value={formData.lease_end_date}
                  onChange={(e) => setFormData({ ...formData, lease_end_date: e.target.value })}
                  required
                  className="border-[#E6E2D8] focus:border-[#2C4C3B]"
                  data-testid="lease-end-date-input"
                />
              </div>

              <div>
                <Label htmlFor="pending_dues" className="text-[#2E2E2E]">Pending Dues at Exit (₹)</Label>
                <Input
                  id="pending_dues"
                  type="number"
                  step="0.01"
                  value={formData.pending_dues_at_exit}
                  onChange={(e) => setFormData({ ...formData, pending_dues_at_exit: e.target.value })}
                  className="border-[#E6E2D8] focus:border-[#2C4C3B]"
                  data-testid="pending-dues-input"
                />
                <p className="text-xs text-[#7D7D7D] mt-1">
                  Total amount the tenant owes but did not pay (rent, damages, etc.)
                </p>
              </div>

              <div className="p-4 border border-[#E6E2D8] rounded-lg bg-white">
                <p className="text-sm font-medium text-[#2E2E2E] mb-3">
                  Security Deposit Settlement (Held: ₹{securityDeposit.toLocaleString('en-IN')})
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deposit_refunded" className="text-[#2E2E2E] text-sm">Refunded (₹)</Label>
                    <Input
                      id="deposit_refunded"
                      type="number"
                      step="0.01"
                      value={formData.deposit_refunded}
                      onChange={(e) => setFormData({ ...formData, deposit_refunded: e.target.value })}
                      className="border-[#E6E2D8] focus:border-[#2C4C3B]"
                      data-testid="deposit-refunded-input"
                    />
                    <p className="text-xs text-[#7D7D7D] mt-1">Cash returned to tenant</p>
                  </div>
                  <div>
                    <Label htmlFor="deposit_withheld" className="text-[#2E2E2E] text-sm">Withheld (₹)</Label>
                    <Input
                      id="deposit_withheld"
                      type="number"
                      step="0.01"
                      value={formData.deposit_withheld}
                      onChange={(e) => setFormData({ ...formData, deposit_withheld: e.target.value })}
                      className="border-[#E6E2D8] focus:border-[#2C4C3B]"
                      data-testid="deposit-withheld-input"
                    />
                    <p className="text-xs text-[#7D7D7D] mt-1">Used to cover dues/damages</p>
                  </div>
                </div>
                {depositMismatch && (
                  <p className="text-xs text-[#D96C4E] mt-2">
                    ⚠️ Refunded (₹{(parseFloat(formData.deposit_refunded) || 0).toLocaleString('en-IN')}) + Withheld (₹{(parseFloat(formData.deposit_withheld) || 0).toLocaleString('en-IN')}) = ₹{totalDepositSettlement.toLocaleString('en-IN')} — doesn't match deposit (₹{securityDeposit.toLocaleString('en-IN')})
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="exit_notes" className="text-[#2E2E2E]">Exit Notes (Optional)</Label>
                <Textarea
                  id="exit_notes"
                  value={formData.exit_notes}
                  onChange={(e) => setFormData({ ...formData, exit_notes: e.target.value })}
                  placeholder=""
                  className="border-[#E6E2D8] focus:border-[#2C4C3B]"
                  data-testid="exit-notes-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-[#E6E2D8]"
                data-testid="cancel-close-lease-btn"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#D96C4E] hover:bg-[#C2583D] text-white"
                data-testid="submit-close-lease-btn"
              >
                {loading ? 'Closing...' : 'Close Lease & Settle'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

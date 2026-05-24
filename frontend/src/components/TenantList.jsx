import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Trash, Phone, PencilSimple, CurrencyInr, Receipt, SignOut, ArrowCounterClockwise } from '@phosphor-icons/react';
import { Button } from './ui/button';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import ConfirmDialog from './ConfirmDialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function TenantList({ tenants, properties, rentPayments, onRefresh, onEdit, onRecordPayment, onViewHistory, onCloseLease }) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [reopenTarget, setReopenTarget] = useState(null);
  const [activeTab, setActiveTab] = useState('active');

  const filteredTenants = tenants.filter(t =>
    activeTab === 'active' ? t.lease_status !== 'ended' : t.lease_status === 'ended'
  );

  const performDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${API}/tenants/${deleteTarget.id}`);
      toast.success('Tenant deleted successfully');
      onRefresh();
    } catch (error) {
      console.error('Error deleting tenant:', error);
      toast.error('Failed to delete tenant');
    } finally {
      setDeleteTarget(null);
    }
  };

  const performReopen = async () => {
    if (!reopenTarget) return;
    try {
      await axios.post(`${API}/tenants/${reopenTarget.id}/reopen-lease`);
      toast.success(`Lease reopened for ${reopenTarget.name}`);
      onRefresh();
    } catch (error) {
      console.error('Error reopening lease:', error);
      toast.error('Failed to reopen lease');
    } finally {
      setReopenTarget(null);
    }
  };

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property ? property.name : 'Unknown Property';
  };

  const getLastPayment = (tenantId) => {
    if (!rentPayments) return null;
    const payments = rentPayments
      .filter(p => p.tenant_id === tenantId)
      .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
    return payments.length > 0 ? payments[0] : null;
  };

  const getNextDueInfo = (tenant) => {
    const now = new Date();
    const dueDay = tenant.rent_due_day || 1;
    let nextDue;
    if (now.getDate() < dueDay) {
      nextDue = new Date(now.getFullYear(), now.getMonth(), dueDay);
    } else {
      nextDue = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
    }
    return { date: nextDue };
  };

  const activeCount = tenants.filter(t => t.lease_status !== 'ended').length;
  const pastCount = tenants.filter(t => t.lease_status === 'ended').length;

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList className="bg-[#F7F5F0] border border-[#E6E2D8]">
          <TabsTrigger value="active" data-testid="tab-active-tenants">
            Active ({activeCount})
          </TabsTrigger>
          <TabsTrigger value="past" data-testid="tab-past-tenants">
            Past Tenants ({pastCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredTenants.length === 0 ? (
        <div className="text-center py-12 text-[#7D7D7D]">
          <p>
            {activeTab === 'active'
              ? 'No active tenants. Click "Add Tenant" to get started.'
              : 'No past tenants. Closed leases will appear here.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="tenants-table">
            <thead>
              <tr className="border-b border-[#E6E2D8]">
                <th className="text-left py-3 px-3 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">Name</th>
                <th className="text-left py-3 px-3 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">Property</th>
                <th className="text-left py-3 px-3 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">Contact</th>
                <th className="text-left py-3 px-3 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">Lease Start</th>
                <th className="text-right py-3 px-3 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">Monthly Rent</th>
                <th className="text-right py-3 px-3 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">
                  {activeTab === 'active' ? 'Security Deposit' : 'Deposit Settled'}
                </th>
                {activeTab === 'active' ? (
                  <>
                    <th className="text-left py-3 px-3 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">Last Payment Date</th>
                    <th className="text-left py-3 px-3 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">Next Payment Date</th>
                  </>
                ) : (
                  <>
                    <th className="text-left py-3 px-3 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">Move-out</th>
                    <th className="text-right py-3 px-3 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">Net Unrecovered</th>
                  </>
                )}
                <th className="text-center py-3 px-3 text-xs uppercase tracking-[0.2em] font-bold text-[#7D7D7D]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((tenant) => {
                const lastPayment = getLastPayment(tenant.id);
                const nextDue = getNextDueInfo(tenant);
                const isEnded = tenant.lease_status === 'ended';
                return (
                  <tr key={tenant.id} className="border-b border-[#E6E2D8] hover:bg-[#F7F5F0]/50" data-testid={`tenant-row-${tenant.id}`}>
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[#2E2E2E]">{tenant.name}</p>
                        {isEnded && (
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#D96C4E]/15 text-[#D96C4E] rounded">
                            Ended
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-3 text-sm text-[#2E2E2E]">{getPropertyName(tenant.property_id)}</td>
                    <td className="py-4 px-3">
                      <div className="flex items-center text-sm text-[#7D7D7D]">
                        <Phone size={14} className="mr-1" />
                        {tenant.contact}
                      </div>
                    </td>
                    <td className="py-4 px-3 text-sm text-[#2E2E2E]">
                      {tenant.lease_start ? new Date(tenant.lease_start).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td className="py-4 px-3 text-right font-semibold text-[#2C4C3B]">
                      ₹{tenant.monthly_rent.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-3 text-right">
                      {isEnded ? (
                        <div className="text-xs">
                          <p className="text-[#7BA38A]">Refunded: ₹{(tenant.deposit_refunded || 0).toLocaleString('en-IN')}</p>
                          <p className="text-[#D96C4E]">Withheld: ₹{(tenant.deposit_withheld || 0).toLocaleString('en-IN')}</p>
                        </div>
                      ) : (
                        <span className="font-medium text-[#7BA38A]">
                          ₹{(tenant.security_deposit || 0).toLocaleString('en-IN')}
                        </span>
                      )}
                    </td>
                    {activeTab === 'active' ? (
                      <>
                        <td className="py-4 px-3 text-sm">
                          {lastPayment ? (
                            <div>
                              <p className="text-[#2E2E2E]">{new Date(lastPayment.payment_date).toLocaleDateString('en-IN')}</p>
                              <p className="text-xs text-[#7D7D7D]">₹{lastPayment.amount.toLocaleString('en-IN')}</p>
                            </div>
                          ) : (
                            <span className="text-[#7D7D7D] italic">No payments</span>
                          )}
                        </td>
                        <td className="py-4 px-3 text-sm">
                          <p className="text-[#2E2E2E]">{nextDue.date.toLocaleDateString('en-IN')}</p>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-4 px-3 text-sm text-[#2E2E2E]">
                          {tenant.lease_end_date ? new Date(tenant.lease_end_date).toLocaleDateString('en-IN') : '-'}
                        </td>
                        <td className="py-4 px-3 text-right">
                          {(() => {
                            const dues = tenant.pending_dues_at_exit || 0;
                            const withheld = tenant.deposit_withheld || 0;
                            const net = Math.max(0, dues - withheld);
                            return (
                              <div>
                                <span className={`font-semibold ${net > 0 ? 'text-[#D96C4E]' : 'text-[#7BA38A]'}`}>
                                  ₹{net.toLocaleString('en-IN')}
                                </span>
                                {dues > 0 && (
                                  <div className="text-[10px] text-[#7D7D7D] mt-0.5">
                                    Dues ₹{dues.toLocaleString('en-IN')} − Withheld ₹{withheld.toLocaleString('en-IN')}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                      </>
                    )}
                    <td className="py-4 px-3">
                      <div className="flex items-center justify-center gap-1">
                        {!isEnded ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRecordPayment(tenant)}
                              className="text-[#2C4C3B] hover:text-[#1F362A] hover:bg-[#2C4C3B]/10"
                              title="Record Payment"
                              data-testid={`record-payment-${tenant.id}`}
                            >
                              <CurrencyInr size={18} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewHistory(tenant)}
                              className="text-[#7BA38A] hover:text-[#6A9279] hover:bg-[#7BA38A]/10"
                              title="Payment History"
                              data-testid={`view-history-${tenant.id}`}
                            >
                              <Receipt size={18} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(tenant)}
                              className="text-[#2C4C3B] hover:text-[#1F362A] hover:bg-[#2C4C3B]/10"
                              title="Edit Tenant"
                              data-testid={`edit-tenant-${tenant.id}`}
                            >
                              <PencilSimple size={18} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onCloseLease(tenant)}
                              className="text-[#D96C4E] hover:text-[#C2583D] hover:bg-[#D96C4E]/10"
                              title="Close Lease"
                              data-testid={`close-lease-${tenant.id}`}
                            >
                              <SignOut size={18} />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewHistory(tenant)}
                              className="text-[#7BA38A] hover:text-[#6A9279] hover:bg-[#7BA38A]/10"
                              title="Payment History"
                              data-testid={`view-history-${tenant.id}`}
                            >
                              <Receipt size={18} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReopenTarget(tenant)}
                              className="text-[#2C4C3B] hover:text-[#1F362A] hover:bg-[#2C4C3B]/10"
                              title="Reopen Lease"
                              data-testid={`reopen-lease-${tenant.id}`}
                            >
                              <ArrowCounterClockwise size={18} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(tenant)}
                              className="text-[#D96C4E] hover:text-[#C2583D] hover:bg-[#D96C4E]/10"
                              title="Delete Tenant Permanently"
                              data-testid={`delete-tenant-${tenant.id}`}
                            >
                              <Trash size={18} />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={`Permanently delete "${deleteTarget?.name}"?`}
        description="This will permanently remove this tenant AND all their payment history. This action cannot be undone. Consider keeping the record for historical reference."
        confirmLabel="Yes, Delete Permanently"
        onConfirm={performDelete}
        testId="confirm-delete-tenant"
      />
      <ConfirmDialog
        open={!!reopenTarget}
        onOpenChange={(open) => { if (!open) setReopenTarget(null); }}
        title={`Reopen lease for "${reopenTarget?.name}"?`}
        description="This will reactivate the tenant. Their lease close-out information (move-out date, pending dues, deposit settlement) will be removed."
        confirmLabel="Yes, Reopen Lease"
        destructive={false}
        onConfirm={performReopen}
        testId="confirm-reopen-lease"
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const emptyForm = {
  name: '',
  address: '',
  purchase_price: '',
  purchase_date: '',
  appreciation_rate: '',
  highest_offer: '',
  highest_offer_date: '',
  highest_offer_notes: ''
};

export default function AddPropertyDialog({ open, onOpenChange, onSuccess, editProperty }) {
  const isEditMode = !!editProperty;
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editProperty) {
      setFormData({
        name: editProperty.name || '',
        address: editProperty.address || '',
        purchase_price: editProperty.purchase_price?.toString() || '',
        purchase_date: editProperty.purchase_date ? editProperty.purchase_date.split('T')[0] : '',
        appreciation_rate: editProperty.appreciation_rate?.toString() || '',
        highest_offer: editProperty.highest_offer?.toString() || '',
        highest_offer_date: editProperty.highest_offer_date ? editProperty.highest_offer_date.split('T')[0] : '',
        highest_offer_notes: editProperty.highest_offer_notes || ''
      });
    } else {
      setFormData(emptyForm);
    }
  }, [editProperty, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        purchase_price: parseFloat(formData.purchase_price),
        appreciation_rate: parseFloat(formData.appreciation_rate),
        highest_offer: parseFloat(formData.highest_offer) || 0,
        image_url: editProperty?.image_url || ''
      };

      if (isEditMode) {
        await axios.patch(`${API}/properties/${editProperty.id}`, payload);
        toast.success('Property updated successfully');
      } else {
        await axios.post(`${API}/properties`, payload);
        toast.success('Property added successfully');
      }

      setFormData(emptyForm);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error saving property:', error);
      toast.error(isEditMode ? 'Failed to update property' : 'Failed to add property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white max-h-[90vh] overflow-y-auto" data-testid="add-property-dialog">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-[#2C4C3B]">
            {isEditMode ? 'Edit Property' : 'Add New Property'}
          </DialogTitle>
          <DialogDescription className="text-[#7D7D7D]">
            {isEditMode ? 'Update the details of your property.' : 'Enter the details of your new property.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name" className="text-[#2E2E2E]">Property Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="border-[#E6E2D8] focus:border-[#2C4C3B]"
                data-testid="property-name-input"
              />
            </div>
            <div>
              <Label htmlFor="address" className="text-[#2E2E2E]">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                className="border-[#E6E2D8] focus:border-[#2C4C3B]"
                data-testid="property-address-input"
              />
            </div>
            <div>
              <Label htmlFor="purchase_price" className="text-[#2E2E2E]">Purchase Price (₹) *</Label>
              <Input
                id="purchase_price"
                type="number"
                step="0.01"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                required
                className="border-[#E6E2D8] focus:border-[#2C4C3B]"
                data-testid="property-price-input"
              />
            </div>
            <div>
              <Label htmlFor="purchase_date" className="text-[#2E2E2E]">Purchase Date *</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                required
                className="border-[#E6E2D8] focus:border-[#2C4C3B]"
                data-testid="property-date-input"
              />
            </div>
            <div>
              <Label htmlFor="appreciation_rate" className="text-[#2E2E2E]">Annual Appreciation Rate (%) *</Label>
              <Input
                id="appreciation_rate"
                type="number"
                step="0.01"
                value={formData.appreciation_rate}
                onChange={(e) => setFormData({ ...formData, appreciation_rate: e.target.value })}
                required
                className="border-[#E6E2D8] focus:border-[#2C4C3B]"
                data-testid="property-rate-input"
              />
            </div>

            <div className="pt-2 border-t border-[#E5E2DA]">
              <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#64748B] mb-3">Market Offers Received (Optional)</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="highest_offer" className="text-[#2E2E2E]">Highest Offer (₹)</Label>
                  <Input
                    id="highest_offer"
                    type="number"
                    step="0.01"
                    value={formData.highest_offer}
                    onChange={(e) => setFormData({ ...formData, highest_offer: e.target.value })}
                    placeholder=""
                    className="border-[#E6E2D8] focus:border-[#2C4C3B]"
                    data-testid="property-offer-input"
                  />
                </div>
                <div>
                  <Label htmlFor="highest_offer_date" className="text-[#2E2E2E]">Offer Date</Label>
                  <Input
                    id="highest_offer_date"
                    type="date"
                    value={formData.highest_offer_date}
                    onChange={(e) => setFormData({ ...formData, highest_offer_date: e.target.value })}
                    className="border-[#E6E2D8] focus:border-[#2C4C3B]"
                    data-testid="property-offer-date-input"
                  />
                </div>
              </div>
              <div className="mt-3">
                <Label htmlFor="highest_offer_notes" className="text-[#2E2E2E]">Notes</Label>
                <Input
                  id="highest_offer_notes"
                  value={formData.highest_offer_notes}
                  onChange={(e) => setFormData({ ...formData, highest_offer_notes: e.target.value })}
                  placeholder=""
                  className="border-[#E6E2D8] focus:border-[#2C4C3B]"
                  data-testid="property-offer-notes-input"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#E6E2D8]"
              data-testid="cancel-property-btn"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#2C4C3B] hover:bg-[#1F362A] text-white"
              data-testid="submit-property-btn"
            >
              {loading ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Property' : 'Add Property')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const defaultImages = [
  'https://images.unsplash.com/photo-1628012209120-d9db7abf7eab?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB0b3duaG91c2UlMjBhcmNoaXRlY3R1cmUlMjBleHRlcmlvcnxlbnwwfHx8fDE3Nzk2MDk5MDV8MA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1627141234469-24711efb373c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjB0b3duaG91c2UlMjBhcmNoaXRlY3R1cmUlMjBleHRlcmlvcnxlbnwwfHx8fDE3Nzk2MDk5MDV8MA&ixlib=rb-4.1.0&q=85'
];

export default function AddPropertyDialog({ open, onOpenChange, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    purchase_price: '',
    purchase_date: '',
    appreciation_rate: '',
    image_url: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use default image if none provided
      const imageUrl = formData.image_url || defaultImages[Math.floor(Math.random() * defaultImages.length)];
      
      await axios.post(`${API}/properties`, {
        ...formData,
        purchase_price: parseFloat(formData.purchase_price),
        appreciation_rate: parseFloat(formData.appreciation_rate),
        image_url: imageUrl
      });

      toast.success('Property added successfully');
      setFormData({
        name: '',
        address: '',
        purchase_price: '',
        purchase_date: '',
        appreciation_rate: '',
        image_url: ''
      });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error adding property:', error);
      toast.error('Failed to add property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white" data-testid="add-property-dialog">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-[#2C4C3B]">
            Add New Property
          </DialogTitle>
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
            <div>
              <Label htmlFor="image_url" className="text-[#2E2E2E]">Image URL (Optional)</Label>
              <Input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="Leave empty for default image"
                className="border-[#E6E2D8] focus:border-[#2C4C3B]"
                data-testid="property-image-input"
              />
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
              {loading ? 'Adding...' : 'Add Property'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
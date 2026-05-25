import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Buildings, PencilSimple, Eye, Ruler } from '@phosphor-icons/react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function EstateLayoutCard() {
  const [settings, setSettings] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    axios.get(`${API}/portfolio-settings`)
      .then((r) => setSettings(r.data))
      .catch((e) => console.error('Estate settings load:', e));
  };

  useEffect(() => { load(); }, []);

  const openEdit = () => {
    setForm({
      combined_plot_frontage: settings?.combined_plot_frontage?.toString() || '',
      combined_plot_depth: settings?.combined_plot_depth?.toString() || '',
      estate_layout_image_url: settings?.estate_layout_image_url || ''
    });
    setShowEdit(true);
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Layout image must be under 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, estate_layout_image_url: reader.result }));
    reader.readAsDataURL(file);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.patch(`${API}/portfolio-settings`, {
        combined_plot_frontage: form.combined_plot_frontage ? parseFloat(form.combined_plot_frontage) : null,
        combined_plot_depth: form.combined_plot_depth ? parseFloat(form.combined_plot_depth) : null,
        estate_layout_image_url: form.estate_layout_image_url || null
      });
      toast.success('Estate details updated');
      setShowEdit(false);
      load();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save estate details');
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return null;

  const totalPlotSqft = (settings.combined_plot_frontage || 0) * (settings.combined_plot_depth || 0);
  const hasAnyData = totalPlotSqft > 0 || settings.estate_layout_image_url;

  return (
    <>
      <div className="bg-white border border-[#E5E2DA] rounded-lg p-6" data-testid="estate-layout-card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#0F172A] rounded-md flex items-center justify-center">
              <Buildings size={20} className="text-[#B89D5F]" weight="fill" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#0F172A]">Estate Plot &amp; Layout</h3>
              <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#64748B]">
                Single parcel · two saleable / rentable townhouses
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={openEdit}
            className="h-8 w-8 p-0 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F4F4EF]"
            data-testid="edit-estate-btn"
          >
            <PencilSimple size={16} />
          </Button>
        </div>

        {!hasAnyData ? (
          <p className="text-sm text-[#64748B] py-4">
            No estate layout info recorded yet. Click the edit icon to add plot dimensions and upload the site plan.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-start">
            {/* Mini-map */}
            {settings.combined_plot_frontage > 0 && settings.combined_plot_depth > 0 && (
              <div className="flex items-center gap-4">
                <svg width="64" height="96" viewBox="0 0 32 48" className="flex-shrink-0">
                  <rect x="1" y="1" width="30" height="46" fill="#F4F4EF" stroke="#B89D5F" strokeDasharray="2 2" strokeWidth="0.8" />
                  <rect x="8" y="6" width="18" height="14" fill="#0F172A" opacity="0.85" />
                  <text x="17" y="14" textAnchor="middle" fill="#B89D5F" fontSize="3.5" fontWeight="bold">UNIT 1</text>
                  <rect x="8" y="28" width="18" height="14" fill="#0F172A" opacity="0.85" />
                  <text x="17" y="36" textAnchor="middle" fill="#B89D5F" fontSize="3.5" fontWeight="bold">UNIT 2</text>
                </svg>
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#64748B]">Plot Dimensions</p>
                    <p className="text-sm font-semibold text-[#0F172A] tabular-nums">
                      {settings.combined_plot_frontage}′ × {settings.combined_plot_depth}′
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#64748B]">Total Plot Area</p>
                    <p className="text-sm font-semibold text-[#B89D5F] tabular-nums">
                      {Math.round(totalPlotSqft).toLocaleString('en-IN')} sqft
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="md:border-l md:border-[#E5E2DA] md:pl-6 space-y-3">
              {settings.estate_layout_image_url && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowView(true)}
                  className="border-[#E5E2DA] hover:border-[#0F172A] text-xs"
                  data-testid="view-estate-layout-btn"
                >
                  <Eye size={14} className="mr-1.5" />
                  View Layout / Site Plan
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* View dialog */}
      <Dialog open={showView} onOpenChange={setShowView}>
        <DialogContent className="sm:max-w-[800px] bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#0F172A]">Estate Layout / Site Plan</DialogTitle>
          </DialogHeader>
          {settings.estate_layout_image_url && (
            <img
              src={settings.estate_layout_image_url}
              alt="Estate layout"
              className="w-full rounded-md border border-[#E5E2DA]"
              data-testid="estate-layout-image"
            />
          )}
          {totalPlotSqft > 0 && (
            <p className="text-xs text-[#64748B] tracking-wider flex items-center gap-1.5">
              <Ruler size={12} /> PLOT {settings.combined_plot_frontage}′ × {settings.combined_plot_depth}′ · {Math.round(totalPlotSqft).toLocaleString('en-IN')} SQFT
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-[520px] bg-white max-h-[90vh] overflow-y-auto" data-testid="edit-estate-dialog">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#0F172A]">Edit Estate Plot &amp; Layout</DialogTitle>
          </DialogHeader>
          <form onSubmit={save}>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="frontage" className="text-[#0F172A]">Combined Plot Frontage (ft)</Label>
                  <Input
                    id="frontage"
                    type="number"
                    step="0.01"
                    value={form.combined_plot_frontage}
                    onChange={(e) => setForm({ ...form, combined_plot_frontage: e.target.value })}
                    className="border-[#E5E2DA]"
                    data-testid="estate-frontage-input"
                  />
                </div>
                <div>
                  <Label htmlFor="depth" className="text-[#0F172A]">Combined Plot Depth (ft)</Label>
                  <Input
                    id="depth"
                    type="number"
                    step="0.01"
                    value={form.combined_plot_depth}
                    onChange={(e) => setForm({ ...form, combined_plot_depth: e.target.value })}
                    className="border-[#E5E2DA]"
                    data-testid="estate-depth-input"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="layout" className="text-[#0F172A]">Layout / Site Plan Image</Label>
                <Input
                  id="layout"
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="border-[#E5E2DA] cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-[#F4F4EF] file:px-3 file:py-1 file:text-xs file:text-[#0F172A]"
                  data-testid="estate-layout-upload"
                />
                {form.estate_layout_image_url && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={form.estate_layout_image_url} alt="Layout preview" className="h-24 border border-[#E5E2DA] rounded" />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setForm({ ...form, estate_layout_image_url: '' })}
                      className="border-[#E5E2DA] text-xs"
                      data-testid="estate-layout-clear-btn"
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEdit(false)}
                className="border-[#E5E2DA]"
                data-testid="cancel-estate-btn"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#0F172A] hover:bg-[#1E293B] text-white"
                data-testid="save-estate-btn"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

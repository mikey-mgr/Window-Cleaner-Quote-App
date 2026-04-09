import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function QuoteDiscount({ discount, onUpdate, onPreview }) {
  const [value, setValue] = useState(discount.toString());

  const applyValue = (nextVal) => {
    const num = parseFloat(nextVal);
    const safe = Number.isFinite(num) ? num : 0;
    onPreview?.(safe);
    onUpdate?.(safe);
  };

  return (
    <div className="flex items-center justify-between bg-card rounded-xl border p-3">
      <Label className="text-sm">Customer Discount (%)</Label>
      <Input
        type="number"
        min="0"
        max="100"
        value={value}
        onChange={e => {
          setValue(e.target.value);
          applyValue(e.target.value);
        }}
        className="w-20 h-8 text-center text-sm"
      />
    </div>
  );
}

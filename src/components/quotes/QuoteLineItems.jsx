import db from '@/api/localDb';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus, Trash2, Layers } from 'lucide-react';
import { calcLineTotal, getMultipliers, saveMultipliers } from '@/lib/quoteUtils';
import { getNeighborhoodMultiplier } from '@/lib/neighborhoodMultipliers';

export default function QuoteLineItems({ quote, onUpdate }) {
  const [editingPrice, setEditingPrice] = useState(null);
  const [priceValue, setPriceValue] = useState('');
  const [multipliers, setMultipliers] = useState(() => getMultipliers());
  const items = quote.line_items || [];

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => db.entities.WindowTemplate.list(),
  });
  const templateMap = Object.fromEntries(templates.map(t => [t.id, t]));

  const addTemplate = async (t) => {
    let neighborhood = quote.customer_neighborhood;
    if (!neighborhood && quote.customer_id) {
      const customer = await db.entities.Customer.get(quote.customer_id);
      neighborhood = customer?.neighborhood || '';
    }
    const neighborhoodMultiplier = getNeighborhoodMultiplier(neighborhood);
    const basePrice = t.base_price || 0;
    const adjustedPrice = basePrice * neighborhoodMultiplier;
    const existing = items.find(i => i.template_id === t.id && i.difficulty === 'normal');
    if (existing) {
      const updated = items.map(i =>
        i.template_id === t.id && i.difficulty === 'normal'
          ? { ...i, quantity: i.quantity + 1 }
          : i
      );
      onUpdate(updated);
    } else {
      onUpdate([...items, {
        template_id: t.id,
        template_name: t.name,
        template_image: t.image_url || '',
        quantity: 1,
        base_unit_price: basePrice,
        unit_price: adjustedPrice,
        difficulty: 'normal',
        multiplier: 1,
        price_overridden: false,
      }]);
    }
  };

  const updateQty = (idx, delta) => {
    const updated = items.map((item, i) => {
      if (i !== idx) return item;
      const newQty = Math.max(0, item.quantity + delta);
      return { ...item, quantity: newQty };
    }).filter(item => item.quantity > 0);
    onUpdate(updated);
  };

  const updateDifficulty = (idx, difficulty) => {
    const updated = items.map((item, i) =>
      i === idx ? { ...item, difficulty } : item
    );
    onUpdate(updated);
  };

  const setMultipliersOnItem = (item, heavyOn, secondOn) => {
    const mult = (heavyOn ? multipliers.heavy : 1) * (secondOn ? multipliers.second : 1);
    return {
      ...item,
      heavy_dirt: heavyOn,
      second_story: secondOn,
      multiplier: mult || 1,
    };
  };

  const toggleHeavy = (idx) => {
    const item = items[idx];
    const heavyOn = !item?.heavy_dirt;
    const secondOn = !!item?.second_story;
    const updated = items.map((it, i) => (i === idx ? setMultipliersOnItem(it, heavyOn, secondOn) : it));
    onUpdate(updated);
  };

  const toggleSecond = (idx) => {
    const item = items[idx];
    const heavyOn = !!item?.heavy_dirt;
    const secondOn = !item?.second_story;
    const updated = items.map((it, i) => (i === idx ? setMultipliersOnItem(it, heavyOn, secondOn) : it));
    onUpdate(updated);
  };

  const updateMultiplierSetting = (key, value) => {
    const next = { ...multipliers, [key]: value };
    setMultipliers(next);
    saveMultipliers(next);
  };

  const startEditPrice = (idx) => {
    setEditingPrice(idx);
    setPriceValue(items[idx].unit_price.toString());
  };

  const savePrice = (idx) => {
    const updated = items.map((item, i) =>
      i === idx ? { ...item, unit_price: parseFloat(priceValue) || 0, price_overridden: true } : item
    );
    onUpdate(updated);
    setEditingPrice(null);
  };

  const removeItem = (idx) => {
    onUpdate(items.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Line Items ({items.length})</h3>
      </div>

      <div className="mb-3 rounded-xl border bg-muted/30 p-3">
        <p className="text-[11px] font-semibold text-muted-foreground mb-2">Difficulty Multipliers (x)</p>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] text-muted-foreground">Heavy Dirt/Webs</label>
            <Input
              type="number"
              step="0.1"
              value={multipliers.heavy}
              onChange={(e) => updateMultiplierSetting('heavy', parseFloat(e.target.value) || 1)}
              className="h-8 text-xs mt-1"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-muted-foreground">Second Story</label>
            <Input
              type="number"
              step="0.1"
              value={multipliers.second}
              onChange={(e) => updateMultiplierSetting('second', parseFloat(e.target.value) || 1)}
              className="h-8 text-xs mt-1"
            />
          </div>
        </div>
      </div>

      {items.map((item, idx) => (
        <Card key={idx} className="mb-2 overflow-hidden">
          <div className="flex">
            {(item.template_image || templateMap[item.template_id]?.image_url) ? (
              <img
                src={item.template_image || templateMap[item.template_id]?.image_url}
                alt=""
                className="w-24 h-24 object-cover shrink-0"
              />
            ) : (
              <div className="w-24 h-24 bg-muted flex items-center justify-center shrink-0">
                <Layers className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 p-2 min-w-0">
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold truncate">{item.template_name}</p>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeItem(idx)}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>

              {/* Price - tap to edit */}
              <div className="mt-1">
                {editingPrice === idx ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.01"
                      value={priceValue}
                      onChange={e => setPriceValue(e.target.value)}
                      className="h-7 text-xs w-20"
                      autoFocus
                      onBlur={() => savePrice(idx)}
                      onKeyDown={e => e.key === 'Enter' && savePrice(idx)}
                    />
                  </div>
                ) : (
                  <button onClick={() => startEditPrice(idx)} className="text-xs text-primary font-medium">
                    ${item.unit_price.toFixed(2)} each
                  </button>
                )}
              </div>

              {/* Difficulty + Quantity */}
              <div className="mt-1.5 space-y-2">
                <div className="flex flex-wrap gap-1">
                  <Button
                    type="button"
                    variant={item.heavy_dirt ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-[10px]"
                    onClick={() => toggleHeavy(idx)}
                  >
                    Heavy Dirt x{multipliers.heavy}
                  </Button>
                  <Button
                    type="button"
                    variant={item.second_story ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-[10px]"
                    onClick={() => toggleSecond(idx)}
                  >
                    2nd Story x{multipliers.second}
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(idx, -1)}>
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(idx, 1)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs font-bold">${calcLineTotal(item).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}

      {/* Add from templates */}
      <div className="mt-3">
        <p className="text-xs text-muted-foreground mb-2">Add window type:</p>
        <div className="flex gap-2 flex-wrap">
          {templates.map(t => (
            <Button key={t.id} variant="outline" size="sm" className="text-xs gap-1" onClick={() => addTemplate(t)}>
              <Plus className="w-3 h-3" /> {t.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}


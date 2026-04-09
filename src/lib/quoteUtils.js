const MULTIPLIER_KEY = 'windowcleaner:multipliers';

const defaultMultipliers = {
  heavy: 1.2,
  second: 1.5,
};

export function getMultipliers() {
  try {
    const raw = localStorage.getItem(MULTIPLIER_KEY);
    if (!raw) return { ...defaultMultipliers };
    const parsed = JSON.parse(raw);
    return {
      heavy: Number(parsed?.heavy) || defaultMultipliers.heavy,
      second: Number(parsed?.second) || defaultMultipliers.second,
    };
  } catch {
    return { ...defaultMultipliers };
  }
}

export function saveMultipliers(next) {
  try {
    localStorage.setItem(MULTIPLIER_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}

export function calcLineTotal(item) {
  const price = item.unit_price || 0;
  const qty = item.quantity || 0;
  const mult = item.multiplier || 1;
  return price * qty * mult;
}

export function calcDiscountAmount(lineItems, discountPercent = 0) {
  const subtotal = (lineItems || []).reduce((sum, item) => sum + calcLineTotal(item), 0);
  const discount = subtotal * (discountPercent / 100);
  return discount;
}

export function calcGrandTotal(lineItems, discountPercent = 0) {
  const subtotal = (lineItems || []).reduce((sum, item) => sum + calcLineTotal(item), 0);
  const discount = subtotal * (discountPercent / 100);
  return Math.max(0, subtotal - discount);
}

export function generateWhatsAppText(quote, discountAmount = 0) {
  const lines = [];
  lines.push('Apex Window Care');
  lines.push(`Quote for: ${quote.customer_name || 'Customer'}`);
  if (quote.created_date) {
    lines.push(`Quote Date: ${new Date(quote.created_date).toLocaleString()}`);
  }
  if (quote.customer_address) {
    lines.push(`Address: ${quote.customer_address}`);
  }
  lines.push('');
  lines.push('Items:');

  (quote.line_items || []).forEach((item) => {
    const lineTotal = calcLineTotal(item);
    const tags = [];
    if (item.heavy_dirt) tags.push('Heavy Dirt');
    if (item.second_story) tags.push('2nd Story');
    const tagText = tags.length ? ` (${tags.join(', ')})` : '';
    lines.push(`- ${item.template_name} x${item.quantity}${tagText}`);
    lines.push(`  $${Number(item.unit_price || 0).toFixed(2)} each -> $${lineTotal.toFixed(2)}`);
  });

  lines.push('');
  if (quote.neighborhood_discount > 0) {
    lines.push(`Customer Discount: -${quote.neighborhood_discount}% ($${discountAmount.toFixed(2)})`);
  }
  lines.push(`TOTAL: $${Number(quote.grand_total || 0).toFixed(2)}`);
  lines.push('');
  lines.push('Thank you for choosing Apex Window Care.');

  return lines.join('\n');
}

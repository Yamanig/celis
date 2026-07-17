-- Update listing pricing tiers to dollar-based boundaries:
-- Basic $10.00 - $499.99  → $0.50 fee
-- Standard $500.00 - $4,999.99 → $1.00 fee
-- Premium $5,000.00+ → $2.50 fee
INSERT INTO platform_configs (key, value, description)
VALUES (
  'listing_tiers',
  '{"currency":"USD","tiers":[{"label":"Basic","minCents":1000,"maxCents":49999,"feeCents":50,"expiryDays":7},{"label":"Standard","minCents":50000,"maxCents":499999,"feeCents":100,"expiryDays":14},{"label":"Premium","minCents":500000,"maxCents":null,"feeCents":250,"expiryDays":30}]}'::jsonb,
  'Price bands used to calculate listing fees and expiry durations'
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

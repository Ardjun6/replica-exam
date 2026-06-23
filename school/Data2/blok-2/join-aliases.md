# Relaties en aliases

Aliases (afkortingen voor tabelnamen) houden je query overzichtelijk, vooral bij meerdere JOINs.

```sql
SELECT k.voornaam, o.order_id, p.product_naam
FROM klanten k
JOIN orders o
    ON k.klant_id = o.klant_id
JOIN order_producten op
    ON o.order_id = op.order_id
JOIN producten p
    ON op.product_id = p.product_id;
```

- `k` → alias voor `klanten`
- `o` → alias voor `orders`
- `op` → alias voor `order_producten`
- `p` → alias voor `producten`

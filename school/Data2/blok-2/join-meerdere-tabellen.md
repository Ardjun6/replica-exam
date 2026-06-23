# Relaties over meerdere tabellen (moeilijker voorbeeld)

Je kunt meerdere tabellen aan elkaar koppelen door meerdere `JOIN`s te gebruiken.

```sql
SELECT k.voornaam, o.order_datum, p.product_naam, v.vestiging_naam
FROM klanten k
JOIN orders o
        ON k.klant_id = o.klant_id
JOIN order_producten op
    ON o.order_id = op.order_id
JOIN producten p
    ON op.product_id = p.product_id
JOIN vestigingen v
    ON p.vestiging_id = v.vestiging_id;
```

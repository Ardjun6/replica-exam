# Relaties gebruiken met JOIN (simpel voorbeeld)

Om relaties daadwerkelijk te gebruiken in een query, gebruik je een `JOIN`. Daarmee koppel je tabellen via een sleutel.

```sql
SELECT k.voornaam, k.achternaam, l.land_naam
FROM klanten k
JOIN landen l
    ON k.land_id = l.land_id;
```

Hier gebruik je de relatie tussen `klanten` en `landen`:
- `klanten.land_id` → foreign key
- `landen.land_id` → primary key

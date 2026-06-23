# Relaties en USING()

Met `USING()` kun je een `JOIN` korter schrijven als de kolomnaam in beide tabellen hetzelfde is.

```sql
SELECT k.voornaam, l.land_naam
FROM klanten k
JOIN landen l USING (land_id);
```

Dit is equivalent aan `ON k.land_id = l.land_id`, maar beknopter.

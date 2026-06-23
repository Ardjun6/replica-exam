## One-Hot Encoding

One-hot encoding is een techniek om **categorische data** om te zetten naar **numerieke vorm**, zodat machine learning-modellen ermee kunnen werken.

### Nominale data (belangrijk)
One-hot encoding wordt vooral gebruikt bij **nominale variabelen**.

Nominaal betekent:
- Categorieën hebben **geen volgorde**
- Voorbeeld: kleuren

Bijvoorbeeld:
- groen  
- blauw  
- rood  

Er zit geen logische volgorde in deze waarden.

Dit is dus fout:
1. groen  
2. blauw  
3. rood  

Want hiermee suggereer je dat rood “meer” is dan blauw, en blauw “meer” dan groen — terwijl dat niet klopt.

---

### Idee van One-Hot Encoding
Elke categorie krijgt een **eigen kolom**.  
Voor elke rij:
- De juiste categorie = 1  
- De rest = 0  

### Voorbeeld

Originele kolom `Kleur`:

| Kleur |
|------|
| groen |
| blauw |
| rood |

Na one-hot encoding:

| groen | blauw | rood |
|------|------|------|
| 1    | 0    | 0    |
| 0    | 1    | 0    |
| 0    | 0    | 1    |

---

### Visualisatie

| Kleur | groen | blauw | rood |
|------|------|------|------|
| groen | 1 | 0 | 0 |
| blauw | 0 | 1 | 0 |
| rood | 0 | 0 | 1 |


# Classificatiebeslissingsboom

Een classificatiebeslissingsboom is een algoritme dat steeds een **vraag** stelt.

Bijvoorbeeld:

> Is gewicht groter dan 10?

Daarna splitst de data in twee groepen:

```text
Ja-groep
Nee-groep
```

> De boom kiest de vraag **niet zelf zomaar**.   
> Hij berekent welke vraag het beste is met:
> *  **Gini-index**
> *  **Entropie**

---

# 1. Het algemene algoritme

```mermaid
flowchart TD
    A[Start met alle data] --> B[Bereken hoe rommelig de data is]
    B --> C[Test meerdere mogelijke vragen]
    C --> D[Bereken Gini-index of Entropie]
    D --> E[Kies de beste vraag]
    E --> F[Split de data in twee groepen]
    F --> G{Is de groep duidelijk genoeg?}
    G -->|Nee| C
    G -->|Ja| H[Maak leaf node]
    H --> I[Voorspelling]
```

## Uitleg

De boom begint met alle data.

Daarna kijkt hij:

```text
Hoe gemengd zijn de antwoorden?
```

Als de antwoorden nog rommelig zijn, gaat de boom verschillende vragen testen.

Voor elke vraag berekent hij of de data duidelijker wordt.

De beste vraag wordt gekozen.

Daarna splitst de boom de data in twee groepen.

Dit blijft doorgaan totdat de groep duidelijk genoeg is.

---

# 2. Wat probeert de boom te doen?

De boom wil dit veranderen:

```text
Ja, Nee, Ja, Nee, Ja, Nee
```

naar dit:

```text
Groep 1: Ja, Ja, Ja
Groep 2: Nee, Nee, Nee
```

```mermaid
flowchart LR
    A[Rommelige data<br/>Ja, Nee, Ja, Nee] --> B[Beste vraag]
    B --> C[Groep 1<br/>Ja, Ja, Ja]
    B --> D[Groep 2<br/>Nee, Nee, Nee]
```

## Uitleg

Aan het begin zitten de antwoorden door elkaar.

De boom zoekt een vraag waardoor de antwoorden beter gescheiden worden.

Een goede vraag zorgt ervoor dat in één groep vooral dezelfde antwoorden zitten.

Dus:

```text
rommelig → vraag stellen → duidelijkere groepen
```

---

# 3. Voorbeeld van een split

Stel je hebt deze data:

```text
Gewicht | Antwoord
5       | Nee
8       | Nee
12      | Ja
15      | Ja
20      | Ja
```

De boom test bijvoorbeeld:

```text
Gewicht >= 10?
```

```mermaid
flowchart TD
    A[Alle data] --> B{Gewicht >= 10?}
    B -->|Ja| C[Ja-groep<br/>12 = Ja<br/>15 = Ja<br/>20 = Ja]
    B -->|Nee| D[Nee-groep<br/>5 = Nee<br/>8 = Nee]
```

## Uitleg

De vraag `Gewicht >= 10?` splitst de data netjes.

Want:

```text
Gewicht >= 10  → allemaal Ja
Gewicht < 10   → allemaal Nee
```

Dat is een goede split.

De groepen zijn bijna perfect duidelijk.

---

# 4. Hoe kiest de boom de beste vraag?

De boom test meerdere vragen.

Bijvoorbeeld:

```text
Gewicht >= 8?
Gewicht >= 10?
Gewicht >= 15?
```

```mermaid
flowchart TD
    A[Vraag 1<br/>Gewicht >= 8?] --> D[Bereken score]
    B[Vraag 2<br/>Gewicht >= 10?] --> D
    C[Vraag 3<br/>Gewicht >= 15?] --> D

    D --> E{Welke vraag geeft<br/>de beste split?}

    E -->|Laagste Gini-index| F[Kies deze vraag]
    E -->|Grootste daling in Entropie| F

    F --> G[Maak decision node]
```

## Uitleg

De boom kiest niet random een vraag.

Hij probeert meerdere vragen en berekent per vraag een score.

Bij **Gini-index** geldt:

```text
laagste Gini-index = beste split
```

Bij **Entropie** geldt:

```text
grootste daling in entropie = beste split
```

De vraag met de beste score wordt gebruikt in de boom.

---

# 5. Gini-index

De formule:

$$
G = 1 - \sum_{k=1}^{K} p_k^2
$$

```mermaid
flowchart LR
    A[Gini-index laag] --> B[Groep is duidelijk]
    C[Gini-index hoog] --> D[Groep is rommelig]
```

## Uitleg

De **Gini-index** meet hoe rommelig een groep is.

Voorbeeld duidelijke groep:

```text
Ja, Ja, Ja, Ja
```

Dan is de Gini-index laag.

Voorbeeld rommelige groep:

```text
Ja, Nee, Ja, Nee
```

Dan is de Gini-index hoger.

Dus:

```text
Gini laag = goed
Gini hoog = minder goed
```

---

# 6. Entropie

De formule:

$$
H = -\sum_{k=1}^{K} p_k \log_2(p_k)
$$

```mermaid
flowchart LR
    A[Entropie laag] --> B[Groep is duidelijk]
    C[Entropie hoog] --> D[Groep is rommelig]
```

## Uitleg

**Entropie** meet ook hoe onzeker of rommelig een groep is.

Als bijna alles dezelfde klasse heeft, is de entropie laag.

Als de klassen door elkaar zitten, is de entropie hoog.

Dus:

```text
Entropie laag = groep is duidelijk
Entropie hoog = groep is rommelig
```

---

# 7. Complete simpele decision tree

```mermaid
flowchart TD
    A[Start] --> B{Gewicht >= 10?}

    B -->|Ja| C[Antwoord = Ja]
    B -->|Nee| D{Heeft vacht?}

    D -->|Ja| E[Antwoord = Kat]
    D -->|Nee| F[Antwoord = Vogel]
```

## Uitleg

Nieuwe data gaat van boven naar beneden door de boom.

Voorbeeld:

```text
Gewicht = 4
Heeft vacht = Ja
```

Dan gaat de boom zo:

```text
Gewicht >= 10? → Nee
Heeft vacht? → Ja
Antwoord = Kat
```

De boom stelt dus vragen totdat hij bij een eindantwoord komt.

---

# Kort onthouden

```mermaid
flowchart TD
    A[Data] --> B[Test vragen]
    B --> C[Bereken Gini-index of Entropie]
    C --> D[Kies beste vraag]
    D --> E[Split data]
    E --> F[Herhaal]
    F --> G[Leaf node]
    G --> H[Voorspelling]
```

## Simpelste uitleg

Een classificatiebeslissingsboom doet dit:

```text
1. Kijk naar de data.
2. Test meerdere vragen.
3. Bereken met Gini-index of Entropie welke vraag het beste is.
4. Kies die vraag.
5. Split de data.
6. Herhaal dit.
7. Eindig met een voorspelling.
```

De kernzin:

> Een classificatiebeslissingsboom zoekt steeds automatisch de beste vraag om rommelige data te veranderen in duidelijke groepen.

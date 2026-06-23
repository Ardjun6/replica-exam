# Variabelen en meetniveaus

[[./index]]
[[./verdelingen-en-kurtosis]]

## Variabelen

```mermaid
flowchart TD
    A[Variabelen] --> B[Kwalitatief ALLEEN TEXT]
    A --> C[Kwantitatief ALLEEN CIJFERS]

    %% Kwalitatief
    B --> B1[Geen getallen]
    B --> B2[Kleur]
    B --> B3[Geslacht]
    B --> B4[Woonplaats]
    B --> B5[Naam]

    %% Kwantitatief
    C --> C1[Getallen]
    C --> C2[Gewicht]
    C --> C3[Lengte]
    C --> C4[Aantal leerlingen]

    C --> D[Discreet KAN NIET ELKE GETAL AANNEMEN]
    C --> E[Continu KAN WEL ELKE GETAL AANNEMEN]

    %% Discreet
    D --> D1[Kan niet elk getal aannemen]
    D --> D2[Aantal leerlingen]
    D --> D3[Aantal dieren]
    D --> D4[Aantal potloden]
    D --> D5[Aantal mensen]

    %% Continu
    E --> E1[Kan elk getal aannemen]
    E --> E2[Lengte]
    E --> E3[Gewicht]
    E --> E4[Inhoud]
```

## Meetniveau's

### Nominaal

categorien ZONDER vaste volgorde

- `kleuren`
- `geslacht`
- `diersoorten`

### Ordinaal

categorien MET volgorde, MAAR stapgrootte is niet overal hetzelfde

- `kledingmaten`
- `film-ratings`
- `decibel`

### Interval

VASTE volgorde met dezelfde stapgrootte, maar geen natuurlijk nulpunt

- wilt zeggen dat het aantal in de min kan, bijvoorbeeld `-1`
- `jaartelling`
- `temperatuur` *Fahrenheit & Celsius*

### Ratio

vaste volgorde, stapgrootte allemaal hetzelfde, natuurlijk nulpunt

- wilt zeggen dat het aantal `0` is
- `examen punten`
- `leeftijd`
- `batterij-percentage`



## Overzicht

```mermaid
flowchart TD
    A[Meetniveau]

    A --> B[Ratio / Interval]
    A --> C[Ordinaal]
    A --> D[Nominaal]

    %% Ratio / Interval
    B --> B1[Voorbeelden:<br/>leeftijd, gewicht,<br/>graden Celsius]
    B --> E[Shapiro-Wilk test]

    E --> F[Normaal verdeeld]
    E --> G[Niet normaal verdeeld]

    F --> F1[Gemiddelde]
    F --> F2[Standaarddeviatie]
    F2 --> F3[Pearson's R]

    G --> G1[Mediaan]
    G --> G2[IQR]
    G2 --> G3[Spearman's Rho]

    %% Ordinaal
    C --> C1[Voorbeeld:<br/>low - medium - high]
    C --> C2[Modus]
    C --> C3[Mediaan]
    C3 --> C4[Spearman's Rho]

    %% Nominaal
    D --> D1[Voorbeeld:<br/>kleuren]
    D --> D2[Modus]
    D2 --> D3[Cramer's V]
```

## 1. Meetniveau

### Ratio / Interval

* Voorbeelden:

  * leeftijd
  * gewicht
  * graden Celsius

#### Als de data normaal verdeeld is
* welke tekst moet je gebruiken voor om te kijken als de data normaal verdeeld is?
  * shapiro-wilk test
* gebruik:

  * gemiddelde
  * standaarddeviatie

* correlatie:

  * Pearson's R

#### Als de data niet normaal verdeeld is
* welke tekst moet je gebruiken voor om te kijken als de data normaal verdeeld of niet normaal verdeeld is?
  * shapiro-wilk test
* gebruik:

  * mediaan
  * IQR

* correlatie:

  * Spearman's Rho

---

### Ordinaal

* Voorbeeld:

  * low - medium - high

* gebruik:

  * modus
  * mediaan

* correlatie:

  * Spearman's Rho

---

### Nominaal

* Voorbeeld:

  * kleuren

* gebruik:

  * modus

* correlatie:

  * Cramer's V


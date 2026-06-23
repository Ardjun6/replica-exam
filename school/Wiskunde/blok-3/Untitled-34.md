# Aantekeningen: z-scores, standaardisatie en de standaardnormale verdeling

## 1. Normale verdeling

Een **normale verdeling** is een verdeling met een klokvorm. Veel waarden liggen dicht bij het gemiddelde en steeds minder waarden liggen ver van het gemiddelde af.

Belangrijke symbolen:

- **μ** = het gemiddelde van de populatie
- **σ** = de standaardafwijking van de populatie
- **X** = een waarneming of datapunt
- **Z** = de z-score

Bij een normale verdeling kun je bepalen welk percentage van de data onder, boven of tussen bepaalde waarden ligt.

---

## 2. Standaardnormale verdeling

De **standaardnormale verdeling** is een normale verdeling waarbij:

- **μ = 0**
- **σ = 1**

Hierbij gebruik je z-scores. Een z-score geeft aan hoeveel standaardafwijkingen een datapunt van het gemiddelde af ligt.

Voorbeeld:

- z = 0 betekent: precies op het gemiddelde
- z = 1 betekent: 1 standaardafwijking boven het gemiddelde
- z = -1 betekent: 1 standaardafwijking onder het gemiddelde
- z = 2 betekent: 2 standaardafwijkingen boven het gemiddelde

---

## 3. Vuistregel bij de normale verdeling

Bij een normale verdeling geldt ongeveer:

- Tussen **z = -1** en **z = 1** ligt ongeveer **68%** van de data
- Tussen **z = -2** en **z = 2** ligt ongeveer **95%** van de data
- Tussen **z = -3** en **z = 3** ligt ongeveer **99,7%** van de data

Verdeeld per gebied:

- Van z = -1 tot z = 0 ligt ongeveer **34%**
- Van z = 0 tot z = 1 ligt ongeveer **34%**
- Van z = 1 tot z = 2 ligt ongeveer **13,5%**
- Van z = 2 tot z = 3 ligt ongeveer **2,5%**

---

## 4. Z-score berekenen

De formule voor een z-score is:

```text
z = (X - μ) / σ
```

Betekenis:

- **X** = de observatie / het datapunt
- **μ** = het populatiegemiddelde
- **σ** = de populatie-standaardafwijking

De z-score vertelt hoeveel standaardafwijkingen jouw datapunt boven of onder het gemiddelde ligt.

---

## 5. Voorbeeld met lengtes

Gegeven:

- μ = 1,75 m
- σ = 0,10 m
- X = 1,83 m

Berekening:

```text
z = (1,83 - 1,75) / 0,10
z = 0,08 / 0,10
z = 0,8
```

Dus iemand van **1,83 m** ligt **0,8 standaardafwijkingen boven het gemiddelde**.

In de z-tabel hoort bij z = 0,8 ongeveer:

```text
P(Z < 0,8) = 0,7881
```

Dat betekent:

- Ongeveer **78,81%** van de mensen is kleiner dan 1,83 m
- Ongeveer **21,19%** van de mensen is groter dan 1,83 m

Berekening rechterkant:

```text
1 - 0,7881 = 0,2119
```

---

## 6. Kans tussen twee waarden

Je kunt ook berekenen hoeveel procent van de verdeling tussen twee lengtes ligt.

Voorbeeld van het bord:

```text
P(1,65 < X < 1,83)
```

Op het bord stond:

```text
0,7881 - 0,1379 = 0,6502
```

Dus volgens deze berekening ligt ongeveer **65,02%** tussen 1,65 m en 1,83 m.

Let op: als je precies rekent met μ = 1,75 en σ = 0,10, dan is de z-score van 1,65:

```text
z = (1,65 - 1,75) / 0,10 = -1
```

Daarbij hoort ongeveer:

```text
P(Z < -1) = 0,1587
```

Dan wordt de kans:

```text
0,7881 - 0,1587 = 0,6294
```

Dus met deze exacte waarden is de kans ongeveer **62,94%**. De **65,02%** op het bord komt waarschijnlijk doordat er een andere z-waarde of afgeronde tabelwaarde is gebruikt.

---

## 7. Volledig Python-script om de grafieken te maken

Kopieer de onderstaande code naar een bestand, bijvoorbeeld:

```text
grafieken_normale_verdeling.py
```

Run daarna het script. Het script maakt drie grafieken:

1. De standaardnormale verdeling met de 68-95-99,7-regel
2. De normale verdeling van lengtes met het gebied tussen 1,65 m en 1,83 m
3. De normale verdeling met de kans kleiner en groter dan 1,83 m

```python
import math
import numpy as np
import matplotlib.pyplot as plt


# -----------------------------
# Basisfuncties
# -----------------------------

def normal_pdf(x, mu=0, sigma=1):
    """Bereken de kansdichtheid van een normale verdeling."""
    return (1 / (sigma * np.sqrt(2 * np.pi))) * np.exp(-0.5 * ((x - mu) / sigma) ** 2)


def normal_cdf(x, mu=0, sigma=1):
    """Bereken de cumulatieve kans P(X < x) met de error function."""
    z = (x - mu) / (sigma * math.sqrt(2))
    return 0.5 * (1 + math.erf(z))


def save_or_show(filename=None):
    """Sla de grafiek op als filename is ingevuld, anders toon de grafiek."""
    plt.tight_layout()
    if filename:
        plt.savefig(filename, dpi=200, bbox_inches="tight")
    plt.show()


# -----------------------------
# Grafiek 1: standaardnormale verdeling
# -----------------------------

def grafiek_standaardnormale_verdeling(filename=None):
    mu = 0
    sigma = 1

    x = np.linspace(-4, 4, 1000)
    y = normal_pdf(x, mu, sigma)

    plt.figure(figsize=(10, 5))
    plt.plot(x, y, linewidth=2)

    # Gebieden inkleuren voor de vuistregel
    gebieden = [
        (-1, 1, "ongeveer 68% tussen z = -1 en z = 1"),
        (-2, -1, "ongeveer 13,5%"),
        (1, 2, "ongeveer 13,5%"),
        (-3, -2, "ongeveer 2,5%"),
        (2, 3, "ongeveer 2,5%"),
    ]

    for links, rechts, label in gebieden:
        x_fill = np.linspace(links, rechts, 300)
        y_fill = normal_pdf(x_fill, mu, sigma)
        plt.fill_between(x_fill, y_fill, alpha=0.25, label=label)

    # Verticale lijnen bij z-scores
    for z in range(-3, 4):
        plt.axvline(z, linestyle="--", linewidth=1)
        plt.text(z, -0.015, str(z), ha="center", va="top")

    plt.title("Standaardnormale verdeling")
    plt.xlabel("z-score")
    plt.ylabel("Kansdichtheid")
    plt.ylim(bottom=-0.03)
    plt.legend(loc="upper right", fontsize=8)
    save_or_show(filename)


# -----------------------------
# Grafiek 2: kans tussen 1,65 m en 1,83 m
# -----------------------------

def grafiek_kans_tussen_twee_lengtes(filename=None):
    mu = 1.75
    sigma = 0.10
    x1 = 1.65
    x2 = 1.83

    z1 = (x1 - mu) / sigma
    z2 = (x2 - mu) / sigma

    kans_x1 = normal_cdf(x1, mu, sigma)
    kans_x2 = normal_cdf(x2, mu, sigma)
    kans_tussen = kans_x2 - kans_x1

    x = np.linspace(mu - 4 * sigma, mu + 4 * sigma, 1000)
    y = normal_pdf(x, mu, sigma)

    plt.figure(figsize=(10, 5))
    plt.plot(x, y, linewidth=2)

    # Gebied tussen x1 en x2 inkleuren
    x_fill = np.linspace(x1, x2, 500)
    y_fill = normal_pdf(x_fill, mu, sigma)
    plt.fill_between(x_fill, y_fill, alpha=0.35)

    # Verticale lijnen
    plt.axvline(mu, linestyle="--", linewidth=1.5, label=f"Gemiddelde μ = {mu:.2f}")
    plt.axvline(x1, linestyle="--", linewidth=1.5, label=f"X = {x1:.2f}, z = {z1:.2f}")
    plt.axvline(x2, linestyle="--", linewidth=1.5, label=f"X = {x2:.2f}, z = {z2:.2f}")

    plt.title(f"Kans tussen {x1:.2f} m en {x2:.2f} m: {kans_tussen * 100:.2f}%")
    plt.xlabel("Lengte in meters")
    plt.ylabel("Kansdichtheid")
    plt.legend()

    print("Grafiek 2: kans tussen twee lengtes")
    print(f"z-score bij {x1:.2f} m = {z1:.2f}")
    print(f"z-score bij {x2:.2f} m = {z2:.2f}")
    print(f"P(X < {x1:.2f}) = {kans_x1:.4f}")
    print(f"P(X < {x2:.2f}) = {kans_x2:.4f}")
    print(f"P({x1:.2f} < X < {x2:.2f}) = {kans_tussen:.4f} = {kans_tussen * 100:.2f}%")
    print()

    save_or_show(filename)


# -----------------------------
# Grafiek 3: kleiner en groter dan 1,83 m
# -----------------------------

def grafiek_kleiner_groter_dan_183(filename=None):
    mu = 1.75
    sigma = 0.10
    x_grens = 1.83

    z = (x_grens - mu) / sigma
    kans_links = normal_cdf(x_grens, mu, sigma)
    kans_rechts = 1 - kans_links

    x = np.linspace(mu - 4 * sigma, mu + 4 * sigma, 1000)
    y = normal_pdf(x, mu, sigma)

    plt.figure(figsize=(10, 5))
    plt.plot(x, y, linewidth=2)

    # Linkerkant inkleuren
    x_links = np.linspace(mu - 4 * sigma, x_grens, 700)
    y_links = normal_pdf(x_links, mu, sigma)
    plt.fill_between(x_links, y_links, alpha=0.25, label=f"Kleiner dan {x_grens:.2f} m: {kans_links * 100:.2f}%")

    # Rechterkant inkleuren
    x_rechts = np.linspace(x_grens, mu + 4 * sigma, 300)
    y_rechts = normal_pdf(x_rechts, mu, sigma)
    plt.fill_between(x_rechts, y_rechts, alpha=0.35, label=f"Groter dan {x_grens:.2f} m: {kans_rechts * 100:.2f}%")

    plt.axvline(mu, linestyle="--", linewidth=1.5, label=f"Gemiddelde μ = {mu:.2f}")
    plt.axvline(x_grens, linestyle="--", linewidth=1.5, label=f"X = {x_grens:.2f}, z = {z:.2f}")

    plt.title(f"Kans kleiner/groter dan {x_grens:.2f} m")
    plt.xlabel("Lengte in meters")
    plt.ylabel("Kansdichtheid")
    plt.legend()

    print("Grafiek 3: kleiner en groter dan 1,83 m")
    print(f"z-score bij {x_grens:.2f} m = {z:.2f}")
    print(f"P(X < {x_grens:.2f}) = {kans_links:.4f} = {kans_links * 100:.2f}%")
    print(f"P(X > {x_grens:.2f}) = {kans_rechts:.4f} = {kans_rechts * 100:.2f}%")
    print()

    save_or_show(filename)


# -----------------------------
# Script uitvoeren
# -----------------------------

if __name__ == "__main__":
    # Laat de grafieken zien op je scherm.
    grafiek_standaardnormale_verdeling()
    grafiek_kans_tussen_twee_lengtes()
    grafiek_kleiner_groter_dan_183()

    # Wil je de grafieken ook opslaan als PNG-bestanden?
    # Zet dan hieronder de comments weg:
    # grafiek_standaardnormale_verdeling("standaardnormale_verdeling.png")
    # grafiek_kans_tussen_twee_lengtes("kans_tussen_165_en_183.png")
    # grafiek_kleiner_groter_dan_183("kans_kleiner_groter_dan_183.png")
```

---

## 8. Samenvatting

Een z-score gebruik je om een gewone normale verdeling om te zetten naar de standaardnormale verdeling. Daarna kun je met een z-tabel of met Python bepalen welk percentage van de data onder, boven of tussen bepaalde waarden ligt.

De belangrijkste formule is:

```text
z = (X - μ) / σ
```

Bij het voorbeeld met lengtes:

```text
μ = 1,75
σ = 0,10
X = 1,83
z = 0,8
```

Daarom is ongeveer **78,81%** kleiner dan 1,83 m en ongeveer **21,19%** groter dan 1,83 m.

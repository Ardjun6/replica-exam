# Logistische Regressie
BELANGRIJK: in een cassus van de toets moet je kunnen herkennen als je een lineaire of logistische regressie
## hoe herken je als het logistisch of linear is?

### Logistich kenmerken
voorspelt binair TRUE/FALSE
data:
- is wel/niet langer dan 130 cm
- is wel/niet zwaarder dan 10kg
- vriest wel/niet
- is duurder dan
- man/vrouw 

### Linear kenmerken
voorspelt continue
data:
- lengte
- gewicht
- temperatuur
- huizenprijzen

```python
import numpy as np
import matplotlib.pyplot as plt

# Sigmoidfunctie
def sigmoid(x, x0=100, k=0.15):
    return 1 / (1 + np.exp(-k * (x - x0)))

# X-waarden voor de curve
x = np.linspace(0, 200, 500)
y = sigmoid(x)

# Voorbeeldpunten uit de schets
x_points = np.array([20, 40, 75, 95, 100, 115, 130, 150, 175])
y_points = np.array([0, 0, 0, 0, 1, 0, 1, 1, 1])

plt.figure(figsize=(10, 6))

# Scatterpunten
plt.scatter(x_points, y_points, s=120, facecolors='none', edgecolors='blue', linewidths=2)

# Sigmoidcurve
plt.plot(x, y, linewidth=2)

# Hulplijnen
plt.axhline(0.5, linestyle='--', linewidth=1)
plt.axvline(100, linestyle='--', linewidth=1)
plt.axvline(175, linestyle='--', linewidth=1)

# Annotatie
plt.annotate(
    'Sigmoid-functie',
    xy=(110, sigmoid(110)),
    xytext=(120, 0.55),
    arrowprops=dict(arrowstyle='->', lw=1.5),
    fontsize=12
)

# Assen en labels
plt.xlim(0, 200)
plt.ylim(-0.1, 1.1)
plt.xticks([0, 90, 100, 175, 200])
plt.yticks([0, 1], ['niet obees', 'obees'])
plt.xlabel('gewicht')
plt.title('Logistische Regressie')

# Nettere stijl
plt.grid(False)
plt.show()
```

## Sigmoid

### De sigmoidfunctie:

comprimeert getallen naar een schaal tussen 0 en 1
geeft een kans terug
wordt gebruikt om een grens te trekken tussen twee klassen

### Bijvoorbeeld:

- uitkomst dicht bij 0 → waarschijnlijk niet obees
- uitkomst dicht bij 1 → waarschijnlijk obees
- uitkomst rond 0.5 → twijfelgebied / omslagpunt
- Interpretatie van de grafiek

### Naarmate het gewicht stijgt:

is de kans op obesitas eerst laag neemt die kans rond het midden snel toe en vlakt daarna af richting 1

Dat S-vormige verloop is typisch voor logistische regressie.


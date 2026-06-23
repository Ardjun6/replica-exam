# Enkelvoudige lineaire regressie

[[./index]]
[[./meervoudige-lineaire-regressie]]
[[./centrummaten-en-spreidingsmaten]]

## Enkelvoudige lineaire regressie

### OLS -> ordinary least squares

- 1 variabele waarmee je de voorspelling gaat voorspellen
- `y = ax + b`
- `y = b₀ + b₁ * X₁`
- **lengte of b₀ = intercept** dat is waarbij de lijn de y-as snijdt
- **b₁ = richtingscoëfficiënt**
- `b₁ = Δy / Δx`

### Relaties

- `a = b₁` (richtingscoëfficiënt)
- `b = b₀` (intercept)
- `x = X₁` (onafhankelijke variabele)

### Voorbeeld

- `something + b₂ * schoenmaat (x₂) + b₃ + leeftijd (x₃)`

## OLS regressie

- OLS = Ordinary Least Squares
- SSE = Sum of Squared Errors

### SSE uitgelegd

- **ERROR** = verschil tussen de voorspelde lijn en de werkelijke waarde
- **SQUARED** = je neemt het kwadraat van elke error, zodat negatieve en positieve fouten niet tegen elkaar wegvallen

#### Voorbeeld errors

- 1e error = 5
- 2e error = -3
- 3e error = 3

#### Zonder kwadraat

- `5 + (-3) + 3 = 5`

#### Met kwadraat

- `(5)² + (-3)² + (3)²`
- `25 + 9 + 9 = 43`

## SSE (Sum of Squared Errors)

- `SSE = Σ (yᵢ - ŷᵢ)²`
- `yᵢ` = werkelijke waarde (punt)
- `ŷᵢ` = voorspelde waarde (op de regressielijn)

### Doel van SSE

- Het doel van SSE is om te meten hoe goed de regressielijn bij de data past
- OLS probeert de lijn te vinden waarbij:
  - de totale fout zo klein mogelijk is
  - dus: de SSE minimaal is

**Beste lijn = lijn met de kleinste SSE**

## R² = verklaarde variantie

- `r` = correlatiecoëfficiënt
- Wat is de invloed van de inputvariabele (voorbeeld: gewicht) op de outputvariabele (voorbeeld: lengte) op een schaal van 0 tot 1
- Hoeveel procent van de variatie in de dataset is verklaard door ons model?
- `R² = 0.8` -> 80% van de variantie in de data wordt door het model verklaard

## Cost functions

Deze formules meten hoe goed een model voorspellingen maakt.

### Betekenis van alle symbolen

| Symbool | Betekenis |
|--------|----------|
| yᵢ | Werkelijke waarde (de echte uitkomst) |
| ŷᵢ | Voorspelde waarde (van het model) |
| ȳ | Gemiddelde van alle werkelijke waarden |
| N of n | Aantal datapunten |
| Σ | Som (alles bij elkaar optellen) |
| i | Index (loopt van 1 tot N) |

### Wat is ȳ (y met streepje)?

`ȳ = (1 / N) * Σ yᵢ`

**Uitleg:**

- Dit is het gemiddelde van alle echte waarden.
- Je telt alle `yᵢ` op en deelt door `N`.

**Voorbeeld:**

- Waarden: 4 en 5
- `ȳ = (4 + 5) / 2 = 4.5`

### Mean Squared Error (MSE)

`MSE = (1 / N) * Σ (yᵢ - ŷᵢ)²`

**Uitleg:**

- Het gemiddelde van de kwadratische fouten.
- Grote fouten worden extra zwaar bestraft.

### Root Mean Squared Error (RMSE)

`RMSE = √((1 / N) * Σ (yᵢ - ŷᵢ)²)`

**Uitleg:**

- De wortel van de MSE.
- Uitkomst heeft dezelfde eenheid als de originele data.

### Mean Absolute Error (MAE)

`MAE = (1 / N) * Σ |yᵢ - ŷᵢ|`

**Uitleg:**

- Gemiddelde van absolute fouten.
- Minder gevoelig voor uitschieters.

### R² (Coefficient of Determination)

`R² = 1 - (Σ (yᵢ - ŷᵢ)² / Σ (yᵢ - ȳ)²)`

**Uitleg:**

- Vergelijkt jouw model met een simpel model dat altijd het gemiddelde voorspelt.
- Hoe dichter bij 1, hoe beter.

### Samenvatting

- `yᵢ` → echte waarde
- `ŷᵢ` → voorspelling
- `ȳ` → gemiddelde
- `N` → aantal datapunten

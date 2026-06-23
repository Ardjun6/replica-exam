# Centrummaten en spreidingsmaten

[[./index]]
[[./enkelvoudige-lineaire-regressie]]

## Centrummaten

- `gemiddelde`
- `modus` = meest voorkomende getal
- `mediaan (Q2)` = middelste getal

## Spreidingsmaten

- `IQR (50%)` = *Q3 (75%) - Q1 (25%)*
- `std (gemiddelde)`
- `range/snelheidsbreedte` = *grootste getal* - *kleine getal*

## Belangrijke informatie

- `std = gemiddelde`
- `mediaan (q2) = IQR (q3 - q1)`

## Standaarddeviatie

- Hoe ver staan de data-punten van het gemiddelde gezien
- klein -> tightly clustered data

## Shapiro-Wilk toets

- Gebruik je om te testen als je data normaal verdeeld is -> p-waarde
- om percentage te krijgen van je data verdeling `(1-p)*100`
- Is mijn `p < 0.05`? zo ja, mijn data is niet normaal verdeeld met een zekerheid van minstens 95%

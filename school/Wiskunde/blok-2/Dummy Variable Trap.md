# Dummy Variable Trap = One hot encoding (nodig voor data2)
### Multicollineariteit
samenhang/ correlatie tussen 1 of meerderen ofafhankelijke variablen
### Oplossing
Altijd 1 categorie minder dan het totaal aantal categorien in je dummy's 

| geslacht | man | vrouw |
|----------|-----|-------|
| man      | 1   | 0     |
| vrouw    | 0   | 1     |
| man      | 1   | 0     |
| man      | 1   | 0     |
| vrouw    | 0   | 1     |
| vrouw    | 0   | 1     |
| man      | 1   | 0     |
| vrouw    | 0   | 1     |
| man      | 1   | 0     |
| vrouw    | 0   | 1     |

**Onafhankelijke variabele**: wat je gebruikt om te voorspellen (input, x-as)

**Afhankelijke variabele**: wat je voorspelt (output, y-as)

## **Dummy variable trap**
- Er is spraken van multicollineariteit (= voorspellende variablen correleren met elkaar (> 0.8 of < -0.8))als je alle kolommen van de dummy-variable gebruikt. 
- **oplossing**: gebruik altijd 1 kolom minder
- 




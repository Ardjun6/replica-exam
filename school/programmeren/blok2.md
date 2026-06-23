# Blok 2 - programmeren 


## Inhoudsopgave

**I.** [Inhoudsopgave](#inhoudsopgave)

**II.** [Voorbeeld van data zoeken](#voorbeeld-van-data-zoeken)

&emsp;&emsp;a) [Methode 1: Lineair zoeken](#methode-1-lineair-zoeken)

&emsp;&emsp;b) [Methode 2: Binaire zoekopdracht](#methode-2-binaire-zoekopdracht)

**III.** [Big O notatie](#big-o-notatie)

&emsp;&emsp;a) [korte uitleg over Big O](#korte-uitleg-over-big-o)

&emsp;&emsp;b) [Van snel naar traag](#van-snel-naar-traag)

&emsp;&emsp;&emsp;&emsp;1. [Praktisch voorbeeld (O(1)) :](#praktisch-voorbeeld-o-1)

&emsp;&emsp;&emsp;&emsp;2. [Praktisch voorbeeld (O(log n)) :](#praktisch-voorbeeld-o-log-n)

&emsp;&emsp;&emsp;&emsp;3. [Praktisch voorbeeld (O(n)) :](#praktisch-voorbeeld-o-n)

&emsp;&emsp;&emsp;&emsp;4. [Praktisch voorbeeld (O(n log n)) :](#praktisch-voorbeeld-o-n-log-n)

&emsp;&emsp;&emsp;&emsp;5. [Praktisch voorbeeld (O(n²)) :](#praktisch-voorbeeld-o-n)

&emsp;&emsp;&emsp;&emsp;6. [Praktisch voorbeeld (O(n³)) :](#praktisch-voorbeeld-o-n)

&emsp;&emsp;&emsp;&emsp;7. [Praktisch voorbeeld (O(2ⁿ)) :](#praktisch-voorbeeld-o-2)

&emsp;&emsp;&emsp;&emsp;8. [Praktisch voorbeeld (O(n!)) :](#praktisch-voorbeeld-o-n)

**IV.** [Hints](#hints)

&emsp;&emsp;a) [Snelle ezelsbrug](#snelle-ezelsbrug)

&emsp;&emsp;b) [Handige denkvragen](#handige-denkvragen)

&emsp;&emsp;c) [Kort overzicht](#kort-overzicht)

**V.** [Tijdcomplexiteit](#tijdcomplexiteit)

**VI.** [While loop](#while-loop)

**VII.** [O() Notatie met examen opdrachten](#o-notatie-met-examen-opdrachten)

&emsp;&emsp;a) [Case A: De Halverende Zoeker (Binary Search)](#case-a-de-halverende-zoeker-binary-search)

&emsp;&emsp;b) [Case B: De Vermenigvuldiger](#case-b-de-vermenigvuldiger)

&emsp;&emsp;c) [Case C: De Geneste Halvering](#case-c-de-geneste-halvering)

&emsp;&emsp;d) [Case D: De String Bouwer](#case-d-de-string-bouwer)

**VIII.** [Samenvatting](#samenvatting)

**IX.** [Datastructuren](#datastructuren)

&emsp;&emsp;a) [Stack](#stack)

&emsp;&emsp;&emsp;&emsp;1. [Stack methodes:](#stack-methodes)

&emsp;&emsp;&emsp;&emsp;2. [Voorbeeld van het implementeren van een stack in python](#voorbeeld-van-het-implementeren-van-een-stack-in-python)

&emsp;&emsp;b) [Queues](#queues)

&emsp;&emsp;&emsp;&emsp;1. [Queue methodes:](#queue-methodes)

&emsp;&emsp;&emsp;&emsp;2. [Voorbeeld van het implementeren van een Queues in python](#voorbeeld-van-het-implementeren-van-een-queues-in-python)

&emsp;&emsp;c) [Deque (Double-Ended Queue)](#deque-double-ended-queue)

&emsp;&emsp;&emsp;&emsp;1. [Voorbeelden:](#voorbeelden)

&emsp;&emsp;d) [Deque methodes:](#deque-methodes)

&emsp;&emsp;&emsp;&emsp;1. [Voorbeeld van het implementeren van een Deque in python](#voorbeeld-van-het-implementeren-van-een-deque-in-python)



## Inhoudsopgave


## Voorbeeld van data zoeken
### Methode 1: Lineair zoeken

Je begint bij pagina 1 en bekijkt één voor één de namen totdat je de juiste vindt.

**Slechtste geval**: De naam staat op de laatste pagina → je moet alle 1.000.000 namen langsgaan.

### Methode 2: Binaire zoekopdracht

- Je opent het telefoonboek in het midden.
-- Staat de naam voor de huidige pagina? Sla de hele rechterhelft over.
-- Staat de naam na de huidige pagina? Sla de hele linkerhelft over.

**Slechtste geval**: In ~20 stappen halveren ben je bij de juiste naam.

## Big O notatie
### korte uitleg over Big O

**Big O-notatie** beschrijft hoe de rekentijd van een algoritme groeit naarmate de input groter wordt.
- Geen Exacte tijd in seconde
- Laat zien hoe het gedrag van het algoritme schaalt
- Bij grote datasets een goede algoritme blijft snel werken, een slecht algoritme wordt onbruikbaar.

### Van snel naar traag
 **O(1)** – Constant:  maakt  niet  uit hoe groot input is (hash-set).  
 **O(log n)** – Logaritmisch:  halveert het werk  bij  elke  stap.  
 **O(n)** – Lineair:  bijvoorbeeld  een loop.  
 **O(n log n)** – Log-lineair:  iets  trager, bv sorter algoritmes.  sorteren
 **O(n²)** – Kwadratisch: een  dubbele loop : traag! 🐌  
 **O(n³)** – Cubisch: een  drie  dubbele loop : nog  trager! 🚫  
 **O(2ⁿ)** – Exponentieel:  groeit  heel snel, onpraktisch! 🚫
**O(n!)** – Factorieel:  onmogelijk  groot. 🚫

#### Praktisch voorbeeld (O(1)) :
```python
# Toegang tot een element in een lijst  
arr  = [10, 20, 30, 40]  
print(arr[2]) # Altijd directe toegang → constant
```
#### Praktisch voorbeeld (O(log n)) :
```python
# Binary search  
def  binary_search(arr, target):  
	left, right  =  0, len(arr) -  1  
	while  left  <=  right:  
		mid  = (left  +  right) //  2  
		if  arr[mid] ==  target:  
			return  mid  
		elif  arr[mid] <  target:  
			left  =  mid  +  1  
		else:  
			right  =  mid  -  1  
	return  -1
```

#### Praktisch voorbeeld (O(n)) :

```python
# Door een lijst lopen  
arr  = [1, 2, 3, 4, 5]  
for  num  in  arr:  
	print(num)
```

#### Praktisch voorbeeld (O(n log n)) :
```python
# Sorteren (bijv. merge sort / timsort in Python)  
arr  = [5, 2, 9, 1, 5, 6]  
sorted_arr  =  sorted(arr)  
print(sorted_arr)
```
#### Praktisch voorbeeld (O(n²)) :
```python
# Dubbele loop (bijv. alle paren vergelijken)  
arr  = [1, 2, 3, 4]  
for  i  in  range(len(arr)):  
	for  j  in  range(len(arr)):  
		print(arr[i], arr[j])
```

#### Praktisch voorbeeld (O(n³)) :
```python
# Drie geneste loops  
arr  = [1, 2, 3]  
for  i  in  arr:  
	for  j  in  arr:  
		for  k  in  arr:  
			print(i, j, k)
```

#### Praktisch voorbeeld (O(2ⁿ)) :
```python
# Recursieve Fibonacci (zonder optimalisatie)  
def  fib(n):  
 if  n  <=  1:  
		return  n  
	return  fib(n-1) +  fib(n-2)  
  
print(fib(5))
```

#### Praktisch voorbeeld (O(n!)) :
```python
# Alle permutaties genereren  
import  itertools  
 
arr  = [1, 2, 3]  
perms  =  list(itertools.permutations(arr))  
print(perms)
```

## Hints

**1. Kijk naar hoeveel keer iets herhaald wordt**

-   **1 keer iets doen** → vaak **O(1)**
-   **1 loop door alles** → vaak **O(n)**
-   **2 geneste loops** → vaak **O(n²)**
-   **3 geneste loops** → vaak **O(n³)**

**2. Let op of de input steeds kleiner wordt**

-   `n = n / 2` of `high = mid - 1` → vaak **O(log n)**
-   Voorbeeld: binary search

**3. Let op of er een loop is met binnenin nog logaritmisch werk**

-   loop over alle elementen + elke stap iets dat halveert → **O(n log n)**
-   Voorbeeld: mergesort, heapsort

**4. Vermenigvuldigen of optellen?**

-   **Na elkaar** uitvoeren:
    -   eerst `O(n)`, daarna `O(n²)`
    -   samen wordt dat **O(n²)**
    -   je pakt de grootste term
-   **Binnen elkaar**:
    -   buitenste loop `n`, binnenste loop `n`
    -   dan **O(n × n) = O(n²)**

**5. Constants negeer je**

-   `O(2n)` wordt **O(n)**
-   `O(100)` wordt **O(1)**
-   `O(3n²)` wordt **O(n²)**

**6. Alleen de snelst groeiende term telt**

-   `O(n² + n + 5)` → **O(n²)**
-   `O(n log n + n)` → **O(n log n)**

**7. Recursie kan ook een hint geven**

-   Elke keer **1 kleiner** → vaak **O(n)**
-   Elke keer **halveren** → vaak **O(log n)**
-   Elke keer **meerdere nieuwe oproepen** → kan snel richting **O(2ⁿ)** gaan

**8. Slechtste geval telt meestal**

-   Bij Big-O kijk je meestal naar het **worst case**
-   Dus: “wat is het langzaamste dat kan gebeuren?”

### Snelle ezelsbrug

-   **for loop** → vaak **O(n)**
-   **for in for** → vaak **O(n²)**
-   **halveren** → **O(log n)**
-   **sorteren** → vaak **O(n log n)**
-   **alle combinaties proberen** → vaak **O(2ⁿ)** of erger

### Handige denkvragen

Vraag jezelf steeds af:

-   Hoeveel stappen doet het algoritme ongeveer?
-   Hangt dat af van `n`?
-   Wordt `n` kleiner of juist volledig doorlopen?
-   Zijn loops genest of achter elkaar?

### Kort overzicht

-   **O(1)** = vast aantal stappen
-   **O(log n)** = halveert steeds
-   **O(n)** = doorloopt alles 1 keer
-   **O(n log n)** = doorlopen + halveren/sorteren
-   **O(n²)** = dubbele loop
-   **O(n³)** = driedubbele loop
-   **O(2ⁿ)** = alle mogelijkheden
-   **O(n!)** = alle volgordes


## Tijdcomplexiteit
# === LIST OPERATIES ===

# 1. Indexeren (toegang tot element)
```python
my_list = [0, 1, 2, 3, 4] 
item = my_list[2]
print(1, item)
```
o(1)


# 2. Element toevoegen aan het einde
```python
my_list.append(5)
print(2, my_list)
```
o(1)

# 3. Element toevoegen aan het begin
```python
my_list.insert(0, -1)
print(3, my_list)
```
o(1)

# 4. Element verwijderen aan het einde
```python
my_list.pop()
print(4, my_list)
```
o(1)
# 5. Element verwijderen aan het begin
```python
my_list.pop(0) 
print(5, my_list)
```
o(N)

# 6. Zoeken of een element voorkomt
```python
exists = 3 in my_list
print(6, exists)
```
o(N)
# 7. Itereren over de lijst
```python
for item in my_list:
    pass
```
o(N)

# 8. Lijst kopiëren
```python
copy_list = my_list[:]  
print(8, copy_list)
```
o(N)
# 9. Lijst sorteren
```python
unsorted_list = [3, 1, 4, 1, 5]
unsorted_list.sort()  
print(9, unsorted_list)
```
o(N log N)
# === DICTIONARY OPERATIES ===
```python
my_dict = {"a":1, "b": 2, "c": 3}
```
# 10. Toevoegen of bijwerken van een key
```python
my_dict["a"] = 10  
print(10, my_dict)
```
O(1)
# 11. Toegang tot een value via key
```python
val = my_dict["a"]  
print(11, val)
```
o(1)
# 12. Check of een key bestaat
```python
exists = "a" in my_dict  
print(12, exists)
```
o(1)
# 13. Verwijderen van een key
```python
del my_dict["a"]  
print(13, my_dict)
```
o(1)
# 14. Itereren over alle keys

```python
for key in my_dict:  
    pass
```
o(N)

## While loop
- Loopt zolang totdat de conditie **True** is

## O() Notatie met examen opdrachten

De Big O notatie beschrijft hoe de runtime of geheugengebruik van een algoritme groeit als de invoer (n) groter wordt. Het helpt ons snelle en efficiënte algoritmes identificeren.

---

### Case A: De Halverende Zoeker (Binary Search)

**Beschrijving:** Dit is de klassieke logaritmische groei. Elke stap wordt de set data gehalveerd.

```python
def find_target(data, target):
    low = 0                         # O(1)
    high = len(data) - 1            # O(1)
    while low <= high:              # O(log n) iteraties
        mid = (low + high) // 2     # O(1) (binnen log n loop)
        if data[mid] == target:     # O(1) (binnen log n loop)
            return mid              # O(1)
        elif data[mid] < target:    # O(1) (binnen log n loop)
            low = mid + 1           # O(1) (binnen log n loop)
        else:                       # O(1) (binnen log n loop)
            high = mid - 1          # O(1) (binnen log n loop)
    return -1                       # O(1)
```

**Complexiteitsanalyse:**
- **Volledige som:** 1 + 1 + (log n · (1 + 1 + 1)) + 1
- **Tussenstap:** O(3 + 3 log n)
- **Eindoordeel (Simplificatie):** **O(log n)**

**Waarom O(log n)?** De while-loop draait maximaal log₂(n) keer, omdat we de zoekruimte elke keer halveren.

---

### Case B: De Vermenigvuldiger

**Beschrijving:** In plaats van +1 doen we hier telkens ×2. Dit betekent dat we heel snel bij n zijn, dus log n iteraties.

```python
def power_loop(n):
    i = 1                           # O(1)
    count = 0                       # O(1)
    while i < n:                    # O(log n) iteraties
        print(f"Stap: {i}")         # O(1) (binnen log n loop)
        i = i * 2                   # O(1) (binnen log n loop)
        count += 1                  # O(1) (binnen log n loop)
    return count                    # O(1)
```

**Complexiteitsanalyse:**
- **Volledige som:** 1 + 1 + (log n · (1 + 1 + 1)) + 1
- **Tussenstap:** O(3 + 3 log n)
- **Eindoordeel (Simplificatie):** **O(log n)**

**Waarom O(log n)?** De while-loop draait ongeveer log₂(n) keer omdat i exponentieel groeit (1, 2, 4, 8, ...).

---

### Case C: De Geneste Halvering

**Beschrijving:** Hier combineren we een lineaire loop met een logaritmische loop. De binnenlus draait log n keer, en dat gebeurt n keer.

```python
def complex_process(n):
    for i in range(n):              # n iteraties
        j = n                       # O(1) (binnen n loop)
        while j > 1:                # O(log n) iteraties (binnen n loop)
            print(i, j)             # O(1) (binnen n * log n loop)
            j = j // 2              # O(1) (binnen n * log n loop)
```

**Complexiteitsanalyse:**
- **Volledige som:** n · (1 + (log n · (1 + 1)))
- **Tussenstap:** O(n + 2n log n)
- **Eindoordeel (Simplificatie):** **O(n log n)**

**Waarom O(n log n)?** We hebben een buitenlus die n keer draait, en per iteratie een binnenlus die log n keer draait. Dat geeft n · log n.

---

### Case D: De String Bouwer

**Beschrijving:** Hoewel de binnenste loop korter wordt, blijft de groei kwadratisch omdat we de groei kwadraat onder de "driehoek" die gevormd wordt.

```python
def build_matrix(n):
    result = []                     # O(1)
    for i in range(n):              # n iteraties
        row = []                    # O(1) (binnen n loop)
        for j in range(i, n):       # Gemiddeld n/2 iteraties (binnen n loop)
            row.append(i * j)       # O(1) (binnen n^2 loop)
        result.append(row)          # O(1) (binnen n loop)
    return result                   # O(1)
```

**Complexiteitsanalyse:**
- **Volledige som:** 1 + (n · (1 + (n/2 · 1) + 1)) + 1
- **Tussenstap:** 1 + n + (n²/2) + n + 1 → O(0.5n² + 2n + 2)
- **Eindoordeel (Simplificatie):** **O(n²)**

**Waarom O(n²)?** De buitenlus draait n keer, en de binnenlus draait gemiddeld n/2 keer. Het product n · (n/2) geeft ons n²/2, wat vereenvoudigt tot O(n²).

---

## Samenvatting

| Case | Algoritme | Complexiteit | Groeisnelheid |
|------|-----------|--------------|---------------|
| A | Binary Search | O(log n) | **Zeer snel** |
| B | Multiplicative Loop | O(log n) | **Zeer snel** |
| C | Nested Linear-Log | O(n log n) | **Snel** |
| D | Matrix Builder | O(n²) | **Traag** |

De Big O notatie helpt ons te begrijpen hoe algoritmes schalen. Lagere orden zijn beter voor grote invoergroottes!

## Datastructuren

### Stack
- van boven tot naar boven
- push: Voeg toe bovenaan
- pop: verwijder bovenaan
- Voorbeeld : Git dan stapen je commits op elkaar
#### Stack methodes:
- `Push`: het toevoegen van data aan de stack bovenaan
- `Pop` het verwijderen van data van de stack bovenaan
- `Peek`: om de bovenste waarde van de stack te bekijken zonder deze te verwijderen
- `is_empty`: om te controleren of de stack leeg is
- `size`: om het aantal elementen in de stack te tellen

#### Voorbeeld van het implementeren van een stack in python
```python
sensor_data = [98.4, 99.1, -5.0, 101.5, 96.3, 89.0, 110.2, 92.5]

class Stack:

# Todo: Vul hier jouw implementatie in

    def __init__(self):
        self.items = []

    def push(self, item):
        self.items.append(item)

    def pop(self):
        return self.items.pop()

    def peek(self):
        return self.items[-1]

    def is_empty(self):
        return self.items == []
    
s = Stack()

for item in sensor_data:
    s.push(item)

print(s.peek())

s.pop()
s.pop()

print(s.peek())

while not s.is_empty():
    s.pop()

print(s.is_empty())
```

### Queues
- Van links naar rechts
- deque verwijder aan het eind
- voeg toe van het begin
- Voorbeeld: Streaming data, wanneer je data binnen krijgt die je chronologisch wilt verwerken (supermarken doen dit)
Dequeus
- Voeg toe / verwijder aan beide kanten mogelijk
- Voorbeeld: moving averages wanneer je door meerdere datapunten over tijd heen wil (sliden)


#### Queue methodes:
- `Enqueue`: Adds a new element to the queue.
- `Dequeue`: Removes and returns the first (front) element from the queue.
- `Peek`: Returns the first element in the queue.
- `isEmpty`: Checks if the queue is empty.
- `Size`: Finds the number of elements in the queue.


#### Voorbeeld van het implementeren van een Queues in python
```python
class Queue:
    def __init__(self):
        self.items = []

    def enqueue(self, item):
        self.items.append(item)

    def dequeue(self):
        if not self.items:
            return "Queue is empty"
        return self.items.pop(0)



q = Queue()
q.enqueue(10)
q.enqueue(20)
q.enqueue(30)
q.enqueue(40)

print(q.dequeue())
print(q.dequeue())
print(q.items)
```
### Deque (Double-Ended Queue)
Werkt van links naar rechts
Je kunt aan beide kanten elementen toevoegen en verwijderen
Dit maakt het flexibeler dan een gewone queue

#### Voorbeelden:

- Sliding window (bijv. moving averages)
- Taken die zowel vooraan als achteraan aangepast moeten worden
- Caching systemen
### Deque methodes:
- `append_left`: voegt een element toe aan het begin (linkerkant)
- `append_right`: voegt een element toe aan het einde (rechterkant)
- `pop_left`: verwijdert en retourneert het eerste element
- `pop_right`: verwijdert en retourneert het laatste element
- `peek_left`: bekijkt het eerste element zonder te verwijderen
- `peek_right`: bekijkt het laatste element zonder te verwijderen
- `is_empty`: controleert of de deque leeg is
- `size`: geeft het aantal elementen terug
#### Voorbeeld van het implementeren van een Deque in python
```python
from collections import deque

class Deque:

    def __init__(self):
        self.items = deque()

    def append_left(self, item):
        self.items.appendleft(item)

    def append_right(self, item):
        self.items.append(item)

    def pop_left(self):
        return self.items.popleft()

    def pop_right(self):
        return self.items.pop()

    def peek_left(self):
        return self.items[0]

    def peek_right(self):
        return self.items[-1]

    def is_empty(self):
        return self.items == deque()

    def size(self):
        return len(self.items)


d = Deque()

d.append_right(10)
d.append_right(20)
d.append_left(5)

print(d.peek_left())   # 5
print(d.peek_right())  # 20

d.pop_left()
d.pop_right()

print(d.size())        # 1

while not d.is_empty():
    d.pop_left()

print(d.is_empty())    # True

```


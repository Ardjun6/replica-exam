# Tree - understanding 

```text
        M
      /   \
     G     T
    / \   / \
   D   J P   W
```
## Question
Give the:
1. Pre-order traversal
2. In-order traversal
3. Post-order traversal

## Answer
1. Pre-order: `MGDJTPW`
2. In-order: `DGJMPTW`
3. Post-order: `DJGPWTM`

---
# tree - building

```text
        A
       / \
      B   C
     / \ / \
    D  E F  G
```
```python
class Node:
    def __init__(self, data):
        self.data = data
        self.left = None
        self.right = None
        
def preorder(node):
    if node:
        print(node.data, end=" ")
        preorder(node.left)
        preorder(node.right)
        
def inorder(node):
    if node:
        inorder(node.left)
        print(node.data, end=" ")
        inorder(node.right)
 
def postorder(node):
    if node:
        postorder(node.left)
        postorder(node.right)
        print(node.data, end=" ")
        
A = Node("A")
B = Node("B")
C = Node("C")
D = Node("D")
E = Node("E")
F = Node("F")
G = Node("G")
A.left = B
A.right = C
B.left = D
B.right = E
C.left = F
C.right = G
 
print("Pre-order:")
preorder(A)
# Pre-order: Root → Left → Right
# A B D E C F G

print("In-order:")
inorder(A)
# In-order: Left → Root → Right
# D B E A F C G

print("Post-order:")
postorder(A)
# Post-order: Left → Right → Root
# D E B F G C A

```
---

# Recursive Question 1 — Rewriting Code

## Question
Rewrite this code so it uses **recursion** instead of a `for` loop.
```python
def count_down(n):
    for i in range(n, 0, -1):
        print(i)
    print("Done")
```

## Answer
```python
def count_down(n):
    if n == 0:
        print("Done")
        return
    print(n)
    count_down(n - 1)
```
## Criteria
* Uses a **base case**
* Uses a **recursive call**
* Does not use a `for` loop
* Prints the numbers from `n` down to `1`
* Prints `"Done"` at the end

---

# Recursive Question 2 — Understanding Steps

## Question
What is the output of this recursive function? Write the steps.

```python
def mystery(n):
    if n == 1:
        return 1
    return n + mystery(n - 1)
print(mystery(4))
```
## Answer
```text
mystery(4)
= 4 + mystery(3)
= 4 + 3 + mystery(2)
= 4 + 3 + 2 + mystery(1)
= 4 + 3 + 2 + 1
= 10
```
Output:
```text
10
```

## Criteria
* Shows the recursive calls step by step
* Identifies the base case: `n == 1`
* Understands that the function adds numbers together
* Gives the correct final output: `10

---


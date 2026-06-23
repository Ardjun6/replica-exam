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
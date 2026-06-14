# Reference: FIFO and LIFO

| Term     | Full form           | Meaning                                | Example |
| -------- | ------------------- | -------------------------------------- | ------- |
| **LIFO** | Last In, First Out  | The last item added is removed first.  | Stack   |
| **FIFO** | First In, First Out | The first item added is removed first. | Queue   |

**LIFO** is like a stack of plates: the plate you put on top last is the first one you take away.
**FIFO** is like a line at a shop: the person who joins first is helped first.

---

# Stack

## Code
```python
class Stack:
    def __init__(self):
        self.items = []

    def push(self, item):
        self.items.append(item)

    def pop(self):
        if len(self.items) == 0:
            return None
        return self.items.pop()

    def peek(self):
        if len(self.items) == 0:
            return None
        return self.items[-1]


stack = Stack()

stack.push("A")
stack.push("B")
stack.push("C")

print(stack.peek())
print(stack.pop())
print(stack.pop())
```

## Answer

```text
C
C
B
```

---

# Queue

## Code

```python
from collections import deque

class Queue:
    def __init__(self):
        self.items = deque()

    def enqueue(self, item):
        self.items.append(item)

    def dequeue(self):
        if len(self.items) == 0:
            return None
        return self.items.popleft()

    def peek(self):
        if len(self.items) == 0:
            return None
        return self.items[0]


queue = Queue()

queue.enqueue("A")
queue.enqueue("B")
queue.enqueue("C")

print(queue.peek())
print(queue.dequeue())
print(queue.dequeue())
```

## Answer

```text
A
A
B
```

---

# Deque

## Code

```python
from collections import deque

class Deque:
    def __init__(self):
        self.items = deque()

    def add_front(self, item):
        self.items.appendleft(item)

    def add_rear(self, item):
        self.items.append(item)

    def remove_front(self):
        if len(self.items) == 0:
            return None
        return self.items.popleft()

    def remove_rear(self):
        if len(self.items) == 0:
            return None
        return self.items.pop()

    def peek_front(self):
        if len(self.items) == 0:
            return None
        return self.items[0]

    def peek_rear(self):
        if len(self.items) == 0:
            return None
        return self.items[-1]


dq = Deque()

dq.add_rear("A")
dq.add_rear("B")
dq.add_front("C")

print(dq.peek_front())
print(dq.peek_rear())
print(dq.remove_rear())
print(dq.remove_front())
```

## Answer

```text
C
B
B
C
```

---

# Final Comparison

| Structure | Add                          | Remove                             | Peek                           |
| --------- | ---------------------------- | ---------------------------------- | ------------------------------ |
| **Stack** | `push()`                     | `pop()`                            | `peek()`                       |
| **Queue** | `enqueue()`                  | `dequeue()`                        | `peek()`                       |
| **Deque** | `add_front()` / `add_rear()` | `remove_front()` / `remove_rear()` | `peek_front()` / `peek_rear()` |
```
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
```
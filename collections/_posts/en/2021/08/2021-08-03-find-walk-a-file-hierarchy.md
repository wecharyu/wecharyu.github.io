---
title: "find - walk a file hierarchy"
toc: true
layout: post
lang: en
categories: [Command Line Tool]
tags: [Find Files]
---

The `find` utility recursively descends the directory tree for each path listed, evaluating an expression in terms of each file in the tree. Basic usage:
```bash
find [options] path [expression]
```

## Options
Here are some oprations:
<table>
  <thead><tr>
    <td>Option</td>
    <td>Description</td>
  </tr></thead>
  <tr>
    <td>-E</td>
    <td>Support extended (modern) regular expressions, followed by `-regex` and `-iregex` primaries.</td>
  </tr>
  <tr>
    <td>-s</td>
    <td>Cause `find` to traverse the file hierarchies in lexicographical order. `find -s` and `find | sort` may give different results.</td>
  </tr>
</table>

## Expression
Expression is composed of the `primaries` and `operands`.

### PRIMARIES
All primaries which take a numeric argument allow the number to be preceded by a plus sign (`+`) or a minus sign (`-`). A preceding plus sign means **more than n**, a preceding minus sign means **less than n** and neither means **exactly n**.

<table>
  <thead><tr>
    <td>Primary</td>
    <td>Description</td>
  </tr></thead>
  <tr>
    <td>-ctime n[smhdw]</td>
    <td>Compare the time of last change of file status information and the time `find` was started.</td>
  </tr>
  <tr>
    <td>-d n</td>
    <td>True if the depth of the file relative to the starting point of the traverse is n.</td>
  </tr>
  <tr>
    <td>-empty</td>
    <td>True if current file or directory is empty.</td>
  </tr>
  <tr>
    <td>-[i]name pattern</td>
    <td>True if the last component of the pathname matches pattern. Special matching characters: [, ], *, ?</td>
  </tr>
  <tr>
    <td>-[i]regex pattern</td>
    <td>True if the whole path of the file matches pattern using regular expression.</td>
  </tr>
  <tr>
    <td>-type [bdflps]</td>
    <td>True if the file is of the specified type. b(block), d(directory), f(regular file), l(symbolic link), p(FIFO), s(socket)</td>
  </tr>
</table>

### OPERATORS
The primaries may be combined using the following operators.
<table>
  <thead><tr>
    <td>Operator</td>
    <td>Description</td>
  </tr></thead>
  <tr>
    <td>( expression )</td>
    <td>This evaluates to true if the parenthesized expression evaluates to true.</td>
  </tr>
  <tr>
    <td>! expression</td>
    <td rowspan='2'>This evaluates to true if the expression is false.</td>
  </tr>
  <tr>
    <td>-not expression</td>
  </tr>
  <tr>
    <td>expression -and expression</td>
    <td>This is the logical AND operator.</td>
  </tr>
  <tr>
    <td>expression -or expression</td>
    <td>This is the logical OR operator.</td>
  </tr>
</table>

## Examples
- Find the files that have not been changed for more than 7 days:
```bash
$ find /tmp/ -ctime +7d
```

- Find all files whose name ends with `1.txt`:
```bash
$ find . -regex '.*/*1.txt'
```

- Find all files whose name ends with `.txt` but not symbolic links:
```bash
$ find . -regex '.*/*.txt' -and -not -type l
```

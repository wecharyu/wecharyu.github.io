---
title: "find - 遍历文件结构"
toc: true
layout: post
lang: zh
categories: [命令行工具]
tags: [查找文件]
---

`find`程序递归向下遍历每个路径的目录树，对树中每个文件计算表达式。基本用法：
```bash
find [options] path [expression]
```

## Operation
这里又一些常用选项：
<table>
  <thead><tr>
    <td>选项</td>
    <td>描述</td>
  </tr></thead>
  <tr>
    <td>-E</td>
    <td>支持拓展的正则表达式，跟primaries中的`-regex`和`-iregex`一起使用。</td>
  </tr>
  <tr>
    <td>-s</td>
    <td>使`find`按字典序遍历文件结构。`find -s`和`find | sort`的结果可能不同。</td>
  </tr>
</table>

## Expression
Expression有`primaries`和`operands`两种。

### PRIMARIES
带数字参数的primaries都可以在数字前加`+`或`-`前缀。加号前缀表示**超过n**，减号前缀表示**少于n**,没有前缀表示**恰好n**。

<table>
  <thead><tr>
    <td>Primary</td>
    <td>描述</td>
  </tr></thead>
  <tr>
    <td>-ctime n[smhdw]</td>
    <td>比较文件状态信息最后修改时间和`find`查询开始时间。</td>
  </tr>
  <tr>
    <td>-d n</td>
    <td>如果文件相对于遍历起点的深度是n则返回true。</td>
  </tr>
  <tr>
    <td>-empty</td>
    <td>如果当前文件或目录是空则返回true。</td>
  </tr>
  <tr>
    <td>-[i]name pattern</td>
    <td>如果路径名最后一部分匹配pattern则返回true. 特殊匹配字符：[, ], *, ?</td>
  </tr>
  <tr>
    <td>-[i]regex pattern</td>
    <td>如果整个路径匹配正则表达式则返回true。</td>
  </tr>
  <tr>
    <td>-type [bdflps]</td>
    <td>如果文件是指定类型则返回true. b(block), d(目录), f(普通文件), l(符号链接), p(FIFO), s(socket)</td>
  </tr>
</table>

### OPERATORS
primaries可以由以下operators来组合使用：
<table>
  <thead><tr>
    <td>Operator</td>
    <td>Description</td>
  </tr></thead>
  <tr>
    <td>( expression )</td>
    <td>如果括号内表达式为true则返回true.</td>
  </tr>
  <tr>
    <td>! expression</td>
    <td rowspan='2'>如果expression为false则返回true</td>
  </tr>
  <tr>
    <td>-not expression</td>
  </tr>
  <tr>
    <td>expression -and expression</td>
    <td>这是一个逻辑与操作。</td>
  </tr>
  <tr>
    <td>expression -or expression</td>
    <td>这是一个逻辑或操作。</td>
  </tr>
</table>

## 例子
- 找到超过7天没有修改过的所有文件：
```bash
$ find /tmp/ -ctime +7d
```

- 找到所有以`1.txt`结尾的文件：
```bash
$ find . -regex '.*/*1.txt'
```

- 找到所有以`.txt`结尾但不是符号链接的文件：
```bash
$ find . -regex '.*/*.txt' -and -not -type l
```

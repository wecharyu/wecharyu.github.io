---
title: "SSH远程登录和TCP端口转发"
toc: true
layout: post
lang: zh
categories: [命令行工具]
tags: [SSH, 远程调试]
---

**Security Shell Protocal** (SSH)是一种网络协议，旨在为不安全的网络提供安全的加密通信。SSH应用基于客户端/服务端架构，SSH客户端用于登录远程机器（SSH服务器）并在远程机器上执行命令。
最常见的SSH应用包括：
- SSH远程登录
- 任意TCP端口转发

## SSH远程登录
身份验证的方式有很多，最常见的是密码验证和公钥认证。首次登录远程ssh服务器时，ssh会将机器标识保存在`~/.ssh/known_hosts`文件里，也就是说它会保存访问过的每个主机的信息。

### 密码验证
如果没有配置任何身份验证方式，ssh会提示你输入密码。

```bash
$ ssh username@ip
username@ip‘s password:
```

SSH服务默认端口是**22**，如果ssh服务不是在默认端口启动的，则在登录时需要通过`-p`指定端口：
```bash
$ ssh -p 1234 username@ip
```

如果主机标识发生改变，ssh会发出告警并且禁用密码验证方式，以防止服务器欺骗或中间人攻击，否则这些攻击可以规避加密。

### 公钥认证
公钥认证基于公钥密码学，密码系统的加密和解密使用不同的密钥。使用公钥认证可以避免每次登录时输入密码，你要在客户机上生成公-私密钥对，并把公钥复制到服务器上，之后你就可以方便地登录远程机器。

#### 生成密钥对
公钥协议和算法有很多，这里我们使用`RSA算法`，在客户机上输入命令：
```bash
$ ssh-keygen -t rsa
```
该命令会生成`~/.ssh`目录，并在目录下生成`~/.ssh/id_rsa`和`~/.ssh/id_rsa.pub`文件分别保存私钥和公钥。

#### 复制公钥到服务器
服务器把客户机公钥保存在`~/.ssh/authorized_keys`文件内，有两种方式拷贝公钥：
1. 客户机使用`ssh-copy-id`命令：
```bash
$ ssh-copy-id remote_username@ip
```
2. 直接将客户机的`id_rsa.pub`内容复制到服务机的`~/.ssh/authorized_keys`文件末尾：
```bash
(client) $ cat ~/.ssh/id_rsa.pub
(server) $ vim ~/.ssh/authorized_keys
```

#### 远程登录
现在你可以像[密码验证](#密码验证)的命令那样登录远程服务器，但是不再需要输入密码。

为了简化这个命令，还可以创建`~/.ssh/config`文件并且添加`Host`:
```bash
Host wechar
  HostName <remote_ip>
  User wechar
  IdentityFile ~/.ssh/id_rsa
```
然后你可以这样登录：
```bash
$ ssh wechar
```
更进一步，如果你必须通过**跳板机(jump server)**访问安全隔离的空间内的设备，你可以这样配置：
```bash
Host jump
  HostName <jump_ip>
  User username
  IdentityFile ~/.ssh/id_rsa

Host dev01 # must access through jump server, access dev01 as username
  HostName <dev01_ip>
  ProxyJump jump
  ProxyCommand  sudo ssh -W %h:%p jump

Host dev02 # access dev02 as another_user
  HostName <dev02_ip>
  IdentityFile ~/.ssh/id_rsa
  User another_user
  ProxyCommand ssh -W %h:%p jump
```

## TCP转发
可以通过以下选项指定任意TCP连接在安全通道(channel)内被转发：
```bash
-L [bind_address:]port:target_host:target_hostport
```
这将分配一个socket来监听目标socket，一旦连接到本地端口，连接就会通过安全通道转发。

举个例子，我们要通过跳板机`jump`转发`10.128.1.1:4990`端口到本地端口`5900`：
```bash
$ ssh -f -N -L 5900:10.128.1.1:4990 jump
```

- `-f`: ssh以守护进程方式启动
- `-N`: 不执行远程命令，只用于端口转发

TCP转发有很多应用场景。

### JVM远程调试
我们可以用TCP转发为远程服务器上的java应用进行调试，步骤如下：
1. 通过以下选项启动java应用：
```bash
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=4990 -cp "Test.jar:lib/*" org.wechar.Main
```
2. 在Idea上配置远程调试：
![](https://img-blog.csdnimg.cn/03bcf0add5fb4dc9a90ff1c893ec08bf.png)

然后你就可以像本地应用一样调试远程java应用了。

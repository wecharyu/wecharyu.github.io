---
title: "Hive系列(1) - Hive介绍"
toc: true
layout: post
lang: zh
categories: [大数据, 数据库]
tags: [Hive]
serial: "Hive系列文章"
serial_order: 0
---

[Apache Hive™](http://hive.apache.org/)是一个基于[Apache Hadoop™](http://hadoop.apache.org/)的数据仓库设施，便于读、写和管理分布式存储中的大型数据集,并通过SQL语法查询数据。

## Hive概念
Hive是一个数据存储和处理的数据仓库软件。

### Hive是什么
Hive有以下特性：
- 获取数据的标准`SQL`功能，可以通过用户定义函数（`UDFs`）、用户定义聚合（`UDAFs`）和用户定义表函数（`UDTFs`）
- 访问直接存储在[Apache HDFS™](http://hadoop.apache.org/docs/current/hadoop-project-dist/hadoop-hdfs/HdfsUserGuide.html)或[Apache HBase™](http://hbase.apache.org/)中的数据
- 通过[Apache Tez™](http://tez.apache.org/)，[Apache Spark™](http://spark.apache.org/)或[MapReduce](http://hadoop.apache.org/docs/current/hadoop-mapreduce-client/hadoop-mapreduce-client-core/MapReduceTutorial.html)执行查询
- 可插入的文件格式，包括(CSV/TSV)文本文件，[Apache Parquet™](http://parquet.apache.org/)，[Apache ORC™](http://orc.apache.org/)等

### Hive不是什么
Hive不是为在线事务处理（OLTP）工作流而设计的。

### Hive数据模型
按照粒度可以把Hive数据划分为：
- **Databases** - 命名空间，作用是避免表，视图，分区，列等的命名冲突。
- **Tables** - 具有相同结构的数据单元，类似于关系型数据库中的表。 <br>
表可以被过滤、投影、连接和合并表格。此外一个表的所有数据都保存在HDFS的一个目录下。Hive的表有以下几种类型：
  - `MANAGED_TABLE` (默认) -  文件，元数据和统计信息由Hive内部进程管理。内部表有以下特性：
    -  内部表保存在`hive.metastore.warehouse.dir`属性下，默认的保存路径类似于`/user/hive/warehouse/databasename.db/tablename/`.
    - **DROP** 会删除内部表的数据但是只会删除外部表的元数据。
  - `EXTERNAL_TABLE` - 文件可以被Hive之外的进程访问和管理。
    - 如果一个外部表的结构或分区改变了，`MSCK REPAIR TABLE table_name`语句可以用来更新元数据信息。
  - `VIRTUAL_VIEW` - 一个没有相关存储的纯逻辑对象，由`CTAS`语句创建。<br>
    - 当查询引用视图时，视图的定义会被执行以产生一系列行数据。
    - 一个视图的schema在创建时被**冻结**，对基础表连续修改不会影响视图的schema.
    - 视图时**只读的**.
  - `MATERIALIZED_VIEW` - 存储实际数据的中间表，占据物理空间，由`CTAS` 创建。<br>
    - 物化视图的创建语句有**原子性**。
    - 物化视图可通过优化器查询**重写**。
    - 物化视图可以保存在外部系统中，如Druid.
- **Partitions** - 分区列确定数据的存储方式。比如一个表T有个date类型的分区列`ds`，它的数据文件将保存在特定的HDFS目录`<table location>/ds=<date>`下。
- **Buckets** (or **Clusters**) - 每个分区的数据可能根据表中列的哈希值划分入Buckets中，每个桶作为一个文件储存在分区目录下。

### 类型系统
Hive支持和表中列关联的原始和复杂数据类型。

- 基本类型
<table>
  <thead><tr>
    <th>分类</th>
    <th>类型</th>
    <th>描述</th>
  </tr></thead>
  <tr>
    <td rowspan="4">整型</td>
    <td>TINYINT</td>
    <td>1字节的整型</td>
  </tr>
  <tr>
    <td>SMALLINT</td>
    <td>2字节的整型</td>
  </tr>
  <tr>
    <td>INT</td>
    <td>4字节的整型</td>
  </tr>
  <tr>
    <td>BIGINT</td>
    <td>8字节的整型</td>
  </tr>
  <tr>
    <td rowspan="1">Boolean</td>
    <td>BOOLEAN</td>
    <td>TRUE/FALSE</td>
  </tr>
  <tr>
    <td rowspan="2">浮点数</td>
    <td>FLOAT</td>
    <td>单精度浮点数</td>
  </tr>
  <tr>
    <td>DOUBLE</td>
    <td>双精度浮点数</td>
  </tr>
  <tr>
    <td rowspan="1">定点数</td>
    <td>DECIMAL</td>
    <td>用户定义范围和精度的定点值</td>
  </tr>
  <tr>
    <td rowspan="3">字符串类型</td>
    <td>STRING</td>
    <td>指定字符集的连续字符序列</td>
  </tr>
  <tr>
    <td>VARCHAR</td>
    <td>有最大长度的连续字符序列</td>
  </tr>
  <tr>
    <td>CHAR</td>
    <td>指定长度的字符序列</td>
  </tr>
  <tr>
    <td rowspan="3">日期和时间类型</td>
    <td>TIMESTAMP</td>
    <td>没有时区的日期和时间（"LocalDateTime"语义）</td>
  </tr>
  <tr>
    <td>TIMESTAMP WITH LOCAL TIME ZONE</td>
    <td>精确到纳秒的时间戳</td>
  </tr>
  <tr>
    <td>Date</td>
    <td>a date</td>
  </tr>
  <tr>
    <td>二进制类型</td>
    <td>BINARY</td>
    <td>一串字节序列</td>
  </tr>
</table>

类型可以在查询语言中隐式转换。<br>
显式类型转换可以使用[内置函数](https://cwiki.apache.org/confluence/pages/viewpage.action?pageId=82903074#Tutorial-BuiltInFunctions)实现。

- 复杂类型 <br>
复杂类型可以由基础类型和其他复杂类型组合构成：
<table>
  <thead><tr>
    <th>类型</th>
    <th>描述</th>
    <th>例子</th>
  </tr></thead>
  <tr>
    <td>STRUCT</td>
    <td>使用点号(.)访问元素</td>
    <td>列c的类型时TRUCT {a INT; b INT}，通过表达式c.a访问</td>
  </tr>
  <tr>
    <td>Maps</td>
    <td>使用['element name']访问元素</td>
    <td>M['key']</td>
  </tr>
  <tr>
    <td>Arrays</td>
    <td>使用[n]访问元素</td>
    <td>A[0]</td>
  </tr>
</table>

## Hive架构
这是Hive的架构图，它包括客户端，查询处理器，执行引擎和元数据服务：
![](https://img-blog.csdnimg.cn/img_convert/601e29d70f1617bb4fd0f9ff30f03fa1.png)

Hive有3个主要组件：
- **Serializers/Deserializers** (trunk/serde) - 包含一些内置的序列化/反序列化族群，也允许用户为自己的数据格式开发序列化器/反序列化器。
- **MetaStore** (trunk/metastore) - 实现元数据服务，用于保存仓库中表和分区的所有信息。
- **Query Processor** (trunk/ql) - 实现了将SQL转换为map/reduce任务图的处理框架以及基于依赖顺序执行任务的执行时序框架。

### Hive SerDe
Hive用SerDe（和文件格式）来读和写表的行数据，基本的工作流程如下：
- HDFS文件 --> 输入文件格式 --> <key, value> --> 反序列化器 --> 行数据对象
- 行数据对象 --> 序列化器 --> <key, value> --> 输出文件格式 --> HDFS文件

注意以下几点：
- "key"在读取时被忽略，在写入时总是一个常量。行数据对象被保存在"value"中。
- Hive不拥有HDFS文件格式，用户可以使用其他工具访问HDFS中的Hive表。

包`org.apache.hadoop.hive.serde2`中提供了一些内置的SerDe类，如 `MetadataTypedColumnsetSerDe`, `LazySimpleSerDe`等。

### Hive MetaStore
MetaStore包含表，分区和数据库相关的元数据。
- **MetaStore Server** - 一个thrift服务（接口定义在`metastore/if/hive_metastore.if`中），为来自客户端的元数据请求服务。
- **ObjectStore** - 处理存储在SQL仓库中的实际的元数据的访问。
- **MetaStore Client** - 提供各种语言的Thrift客户端查询元数据。

### Hive查询处理器
Hive查询处理器处理sql查询，主要包括以下组件：
- **Driver** - 接收查询，实现会话处理并提供执行和获取的api.
- **Compiler** - 解析查询和语义分析，并在**MetaStore**中查找的表和分区元数据的帮助下生成执行计划。
- **Execution Engine** - 执行**Compiler**生成的执行计划。执行计划是状态的DAG.

## Hive Metastore部署
Hive对象（如数据库，表和函数)的定义存储在Metastore中，Hive和其他执行引擎在运行时通过这些元数据确定怎么解析，授权和有效执行用户的查询。

Metastore通过[DataNucleus](http://www.datanucleus.org/)将对象定义保存到关系型数据库（RDBMS）中，它是一个基于对象关系映射（ORM）层的JAVA JDO. Metastore有一些推荐的RDBMS，如`MySQL`, `MariaDB`, `Oracle`等。

### 部署模式
从Hive 3.0开始，Metastore作为独立的服务运行，无需安装Hive的其他部分。基于后端的RDBMS，Metastore有两种部署模式：(Embedded)嵌入式模式和(Remote)远程模式。

1. **Embedded mode** <br>
MetaStore使用嵌入式的Apache `Derby` RDBMS, 完全嵌入用户的进程中。只适合用于简单的测试。 <br>
缺点：任一时间只有一个客户端可以使用Metastore，并且客户端生命周期内的任何修改都不会持久化（因为Derby保存在内存中）。
![](https://img-blog.csdnimg.cn/img_convert/ca177b5f3dbace77f2d72c0dc03a7ddd.png)

2. **Remote mode** <br>
Metastore通过JDBC连接到外部的RDBMS，作为一个服务运行。RDBMS的JDBC驱动所需要的任何jar文件都要放在`METASTORE_HOME/lib`目录中或通过命令行显式传入。
![](https://img-blog.csdnimg.cn/img_convert/e6c9d3d947324db2696a4a4eb6686fe3.png)

### 配置
Metastore从`$METASTORE_HOME/conf`目录下读取所有的配置文件。下面是一些通用配置：
<table>
  <thead><tr>
    <th>参数</th>
    <th>默认值</th>
    <th>描述</th>
  </tr></thead>
  <tr>
    <td>metastore.warehouse.dir</td>
    <td></td>
    <td class="left">默认catalog和数据库下表的默认存放路径。</td>
  </tr>
  <tr>
    <td>datanucleus.schema.autoCreateAll</td>
    <td>false</td>
    <td class="left">如果RDBMS中schema不存在，则在启动时自动创建。<b style="font-weight:bold">生产环境中不建议使用，用schematool代替。</b></td>
  </tr>
  <tr>
    <td>metastore.hmshandler.retry.attempts</td>
    <td>10</td>
    <td class="left">连接metastore失败时的重试次数。</td>
  </tr>
  <tr>
    <td>metastore.hmshandler.retry.interval</td>
    <td>2 sec</td>
    <td class="left">重试间隔时间。</td>
  </tr>
</table>

远程Metasotre需要配置以下JDBC参数：
<table>
  <thead><tr>
    <th>配置参数</th>
    <th>说明</th>
  </tr></thead>
  <tr>
    <td>javax.jdo.option.ConnectionURL</td>
    <td class="left">JDBC驱动连接URL</td>
  </tr>
  <tr>
    <td>javax.jdo.option.ConnectionDriverName</td>
    <td class="left">JDBC驱动类</td>
  </tr>
  <tr>
    <td>javax.jdo.option.ConnectionUserName</td>
    <td class="left">连接RDBMS的用户名</td>
  </tr>
  <tr>
    <td>javax.jdo.option.ConnectionPassword</td>
    <td class="left">连接RDBMS的用户密码</td>
  </tr>
</table>

有三种方式配置Metastore服务：
- 在CLI或Beeline中使用**set**命令设置会话级别的配置。 <br>
```bash
set hive.root.logger=DEBUG,console;
```
- 使用hive命令（CLI）或beeline命令中的 **--hiveconf** 选项为整个会话配置。
```bash
bin/hive --hiveconf hive.root.logger=DEBUG,console
```
- 使用`$HIVE_CONF_DIR`或 classpath 中的配置文件设置。
  - `hive-site.xml` 为整个Hive设置配置。
    ```xml
      <property>
        <name>hive.root.logger</name>
        <value>DEBUG,console</value>
        <description>Root logger</description>
      </property>
    ```
  - **服务特定的配置文件**。可以在`hivemetastore-site.xml`文件中设置元数据服务相关的配置，在`hiveserver2-site.xml`中设置hiveserver2服务相关的配置。

### 部署实践
使用下面的步骤启动一个hive metastore服务。

**1. 要求**
- Java <br>
- Hadoop 2.x (preferred), 1.x (not surpported by Hive 2.0.0 onward).
- Hive通常在Linux或Windows生产环境下使用。Mac一般用于开发环境。

**2. 获取Hive压缩包和解压** <br>
有两种方式获取hive压缩包：
- 从[hive稳定版](https://downloads.apache.org/hive/)网站直接下载。
- 从源代码编译：
```bash
# hive 1.0
mvn clean package -DskipTest -Phadoop-1,dist
# hive 2.0 and onward
mvn clean package -DskipTest -Pdist
```

解压hive压缩包并且设置`HIVE_HOME`和`HIVE_CONF_DIR`环境变量（可选）：
```bash
tar zxf hive-x.y.z.tar.gz
export HIVE_HOME=/path/to/hive
export PATH=$HIVE_HOME/bin:$PATH
```

**3. 启动metastore服务** <br>
Hive使用hadoop，所以path中必须有hadoop：
```bash
export HADOOP_HOME=<hadoop-install-dir>
export HADOOP_CONF_DIR=<hadoop-conf-dir>
```
此外，必须使用以下HDFS命令创建`/tmp`和`/user/hive/warehouse`(即`hive.metastore.warehouse.dir`)目录，并且修改chmod g+w，然后你才可以在hive中创建表。
```bash
$HADOOP_HOME/bin/hadoop fs -mkdir       /tmp
$HADOOP_HOME/bin/hadoop fs -mkdir       /user/hive/warehouse
$HADOOP_HOME/bin/hadoop fs -chmod g+w   /tmp
$HADOOP_HOME/bin/hadoop fs -chmod g+w   /user/hive/warehouse
```
如果是第一次启动metastore服务，还必须初始化背后的数据库schema：
```bash
$HIVE_HOME/bin/schematool -initSchema -dbType mysql
```
然后启动hive metastore服务：
```bash
nohup $HIVE_HOME/bin/hive --service metastore --hiveconf hive.log.file=hivemetastore.log --hiveconf hive.log.dir=/var/log/hive > /var/log/hive/hive.out 2> /var/log/hive/hive.err &
```

**4. 冒烟测试hive** <br>
- 打开hive命令行：
```bash
$HIVE_HOME/bin/hive [--hiveconf hive.metastore.uris=thrift://<host>:<port>]
```
- 运行示例命令：
```sql
show databases;create table test(col1 int, col2 string); show tables;
```

为了方便起见，我们提供了一个docker工具用于启动一个小型的hive metastore服务，可以参考[hadoop-docker](https://github.com/wecharyu/hadoop-docker).

---
title: "Hive serial (1) - Introduction to Hive"
toc: true
layout: post
lang: en
categories: [Big Data, Database]
tags: [Hive]
serial: "Hive Serial Articles"
serial_order: 0
---

The [Apache Hive™](http://hive.apache.org/) is a warehousing infrastructure based on [Apache Hadoop™](http://hadoop.apache.org/), facilitates reading, writing, and managing large datasets residing in distributed storage and queried using SQL syntax.

## Hive Concepts
Hive is a data warehouse software for data storage and processing.

### What Is Hive
Hive provides the following features:
- Standard `SQL` functionality to access to data, `SQL` can be extended with user defined functions (`UDFs`), user defined aggregates (`UDAFs`), and user defined table functions (`UDTFs`)
- Access to files stored either directly in [Apache HDFS™](http://hadoop.apache.org/docs/current/hadoop-project-dist/hadoop-hdfs/HdfsUserGuide.html) or [Apache HBase™](http://hbase.apache.org/)
- Query execution via [Apache Tez™](http://tez.apache.org/), [Apache Spark™](http://spark.apache.org/), or [MapReduce](http://hadoop.apache.org/docs/current/hadoop-mapreduce-client/hadoop-mapreduce-client-core/MapReduceTutorial.html)
- Pluggable file formats, including (CSV/TSV) text files, [Apache Parquet™](http://parquet.apache.org/), [Apache ORC™](http://orc.apache.org/) etc

### What Hive Is NOT
Hive is not designed for online transaction processing (OLTP) workloads.

### Hive Data Model
In the order of granularity - Hive data is organized into:
- **Databases** - Namespaces function to avoid naming conflicts for tables, views, partitions, columns, and so on.
- **Tables** - Homogeneous units of data which have the same schema, these are analogous to Tables in Relational Databases. <br>
Tables can be filtered, projected, joined and unioned. Additionally all the data of a table is stored in a directory in HDFS. There are some types of tables in Hive:
  - `MANAGED_TABLE` (default) -  files, metadata and statistics are managed by internal Hive processes. Here are some features:
    -  A managed table is stored under the `hive.metastore.warehouse.dir` path property, by default in a folder path similar to `/user/hive/warehouse/databasename.db/tablename/`.
    - **DROP** deletes data for managed tables while it only deletes metadata for external ones.
  - `EXTERNAL_TABLE` - files can be accessed and managed by processes outside of Hive.
    - If the structure or partitioning of an external table is changed, an `MSCK REPAIR TABLE table_name` statement can be used to refresh metadata information.
  - `VIRTUAL_VIEW` - a purely logical object with no associated storage, created by `CTAS` statement. <br>
    - When a query references a view, the view's definition is evaluated in order to produce a set of rows for further processing by the query.
    - A view's schema is **frozen** at the time the view is created, subsequent changes to underlying tables will not be reflected in the view's schema.
    - Views are **read-only**.
  - `MATERIALIZED_VIEW` - intermediate table, which stores the actual data, takes up physical space, created by `CTAS` statement. <br>
    - Materialized view creation statement is **atomic**.
    - Materialized views are usable for query **rewriting** by the optimizer.
    - Materialized views can be stored in external systems, e.g., Druid, using custom storage handlers.
- **Partitions** - partition columns determine how the data is stored. For example, a table T with a date partition column `ds` had files with data for a particular date stored in the `<table location>/ds=<date>` directory in HDFS.
- **Buckets** (or **Clusters**) - Data in each partition may in turn be divided into Buckets based on the hash of a column in the table. Each bucket is stored as a file in the partition directory.

### Type System
Hive supports primitive and complex data types associated with the columns in the tables.

- Primitive Types
<table>
  <thead><tr>
    <th>Category</th>
    <th>Type</th>
    <th>Description</th>
  </tr></thead>
  <tr>
    <td rowspan="4">Integers</td>
    <td>TINYINT</td>
    <td>1 byte integer</td>
  </tr>
  <tr>
    <td>SMALLINT</td>
    <td>2 byte integer</td>
  </tr>
  <tr>
    <td>INT</td>
    <td>4 byte integer</td>
  </tr>
  <tr>
    <td>BIGINT</td>
    <td>8 byte integer</td>
  </tr>
  <tr>
    <td rowspan="1">Boolean</td>
    <td>BOOLEAN</td>
    <td>TRUE/FALSE</td>
  </tr>
  <tr>
    <td rowspan="2">Floating point numbers</td>
    <td>FLOAT</td>
    <td>single precision</td>
  </tr>
  <tr>
    <td>DOUBLE</td>
    <td>double precision</td>
  </tr>
  <tr>
    <td rowspan="1">Fixed point numbers</td>
    <td>DECIMAL</td>
    <td>a fixed point value of user defined scale and precision</td>
  </tr>
  <tr>
    <td rowspan="3">String types</td>
    <td>STRING</td>
    <td>sequence of characters in a specified character set</td>
  </tr>
  <tr>
    <td>VARCHAR</td>
    <td>sequence of characters with a maximum length</td>
  </tr>
  <tr>
    <td>CHAR</td>
    <td>sequence of characters with a defined length</td>
  </tr>
  <tr>
    <td rowspan="3">Date and time types</td>
    <td>TIMESTAMP</td>
    <td>A date and time without a timezone ("LocalDateTime" semantics)</td>
  </tr>
  <tr>
    <td>TIMESTAMP WITH LOCAL TIME ZONE</td>
    <td>A point in time measured down to nanoseconds ("Instant" semantics)</td>
  </tr>
  <tr>
    <td>Date</td>
    <td>a date</td>
  </tr>
  <tr>
    <td>Binary types</td>
    <td>BINARY</td>
    <td>a sequence of bytes</td>
  </tr>
</table>

Types can be implicitly converted in the query language. <br>
Explicit type conversion can be done using the cast operator with the [Built In Functions](https://cwiki.apache.org/confluence/pages/viewpage.action?pageId=82903074#Tutorial-BuiltInFunctions).

- Complex Types
Complex Types can be built up from primitive types and other composite types using:
<table>
  <thead><tr>
    <th>Type</th>
    <th>Description</th>
    <th>Example</th>
  </tr></thead>
  <tr>
    <td>STRUCT</td>
    <td>access element using DOT (.)</td>
    <td>column c of type STRUCT {a INT; b INT}, accessed by the expression c.a</td>
  </tr>
  <tr>
    <td>Maps</td>
    <td>access element using ['element name']</td>
    <td>M['key']</td>
  </tr>
  <tr>
    <td>Arrays</td>
    <td>access element using [n]</td>
    <td>A[0]</td>
  </tr>
</table>

## Hive Architecture
Here is the overview of Hive architecture, it consits of client, query processor, execution engines and metadata service:
![](https://raw.githubusercontent.com/wecharyu/picture-bed/main/img/2021/09/2021-09-11-hive-serial-1-introduction-to-hive/Hive-Architecture.png)

Hive has 3 major components:
- **Serializers/Deserializers** (trunk/serde) - contains some builtin serialization/deserialization families, also allows users to develop serializers and deserializers for their own data formats.
- **MetaStore** (trunk/metastore) - implements the metadata server, which is used to hold all the information about the tables and partitions that are in the warehouse.
- **Query Processor** (trunk/ql) - implements the processing framework for converting SQL to a graph of map/reduce jobs and the execution time framework to run those jobs in the order of dependencies.

### Hive SerDe
Hive use SerDe (and FileFormat) to read and write table rows, basic work flow looks like below:
- HDFS files --> InputFileFormat --> <key, value> --> Deserializer --> Row Object
- Row Object --> Serializer --> <key, value> --> OutputFileFormat --> HDFS files

Something to note:
- the "key" part is ignored while reading, and is always a constant when writing. Basically row object is stored into the "value".
- Hive does not own the HDFS file format. Users can access to HDFS files in the hive tables using other tools.

There are some builtin SerDe classes provided in package `org.apache.hadoop.hive.serde2`, like `MetadataTypedColumnsetSerDe`, `LazySimpleSerDe` et.

### Hive MetaStore
MetaStore contains metadata regarding tables, partitions and databases. There are three major components in hive metastore:
- **MetaStore Server** - A thrift server (interface defined in `metastore/if/hive_metastore.if`) that services metadata requests from clients.
- **ObjectStore** - handles access to the actual metadata stored in the SQL store.
- **MetaStore Client** - Thrift clients are the main interface to manipulate and query Hive metadata for all other Hive components in many popular languages.

### Hive Query Processor
Hive Query Processor handles the sql query. The following are the main components of the Hive Query Processor:
- **Driver** - receieves the queries, implements session handles and provides execute and fetch api.
- **Compiler** - parses the query, does semantic analysis, and eventually generates an execution plan with the help of table and partition metadata looked up from **MetaStore**.
- **Execution Engine** - executes the execution plan created by the compiler. The plan is a DAG of stages.

## Hive Metastore Deployment
The definition of Hive objects such as databases, tables, and functions are stored in the Metastore. Hive, and other execution engines, use this data at runtime to determine how to parse, authorize, and efficiently execute user queries.

The metastore persists the object definitions to a relational database (RDBMS) via [DataNucleus](http://www.datanucleus.org/), a Java JDO based Object Relational Mapping (ORM) layer. There are some recommanded RDBMS for MetaStore, such as `MySQL`, `MariaDB`, `Oracle` et.

### Deploy Mode
Beginning in Hive3.0, the Metastore is running as a standalone service without the rest of Hive being installed. Based on the backend RDBMS, there are two deploy mode for MetaStore: Embedded mode and Remote mode.

1. **Embedded mode** <br>
MetaStore use embedded Apache `Derby` RDBMS, is embedded entirely in a user process. It is not intended for use beyond simple testing. <br>
Disadvantage: Only one client can use the Metastore at any one time and any changes are not durable beyond the life of client (since it use an in memory version of Derby).
![](https://raw.githubusercontent.com/wecharyu/picture-bed/main/img/2021/09/2021-09-11-hive-serial-1-introduction-to-hive/Metastore-embedded.png)

2. **Remote mode** <br>
MetaStore connects to an external RDBMS via JDBC, runs as a service for other processes to connect to. Any jars required by the JDBC driver for your RDBMS should be placed in `METASTORE_HOME/lib` or explicitly passed on the command line.
![](https://raw.githubusercontent.com/wecharyu/picture-bed/main/img/2021/09/2021-09-11-hive-serial-1-introduction-to-hive/Metastore-Remote.png)

### Configuration
The metastore reads all configuration files from `$METASTORE_HOME/conf` directory. Here are some general configurations:
<table>
  <thead><tr>
    <th>Parameter</th>
    <th>Default Value</th>
    <th>Description</th>
  </tr></thead>
  <tr>
    <td>metastore.warehouse.dir</td>
    <td></td>
    <td class="left">URI of the default location for tables in the default catalog and database.</td>
  </tr>
  <tr>
    <td>datanucleus.schema.autoCreateAll</td>
    <td>false</td>
    <td class="left">Auto creates the necessary schema in the RDBMS at startup if one does not exist. <b style="font-weight:bold">Not Recommanded in production, run schematool instead.</b></td>
  </tr>
  <tr>
    <td>metastore.hmshandler.retry.attempts</td>
    <td>10</td>
    <td class="left">The number of times retry a call to metastore when there is a connection error.</td>
  </tr>
  <tr>
    <td>metastore.hmshandler.retry.interval</td>
    <td>2 sec</td>
    <td class="left">Time between retry attempts.</td>
  </tr>
</table>

For the Remote Metastore, you should config the following parameters for JDBC connection:
<table>
  <thead><tr>
    <th>Configuration Parameter</th>
    <th>Comment</th>
  </tr></thead>
  <tr>
    <td>javax.jdo.option.ConnectionURL</td>
    <td class="left">Connection URL for the JDBC driver</td>
  </tr>
  <tr>
    <td>javax.jdo.option.ConnectionDriverName</td>
    <td class="left">JDBC driver class</td>
  </tr>
  <tr>
    <td>javax.jdo.option.ConnectionUserName</td>
    <td class="left">Username to connect to the RDBMS with</td>
  </tr>
  <tr>
    <td>javax.jdo.option.ConnectionPassword</td>
    <td class="left">Password to connect to the RDBMS with</td>
  </tr>
</table>

There are three ways to config for the Metastore service:
- Using **set command** in the CLI or Beeline for setting session level values. <br>
```bash
set hive.root.logger=DEBUG,console;
```
- Using the **--hiveconf** option of the hive command (in the CLI) or beeline command for the entire session.
```bash
bin/hive --hiveconf hive.root.logger=DEBUG,console
```
- Using config files in `$HIVE_CONF_DIR` or in the classpath for setting values.
  - In `hive-site.xml`, setting values for the entire Hive configuration.
    ```xml
      <property>
        <name>hive.root.logger</name>
        <value>DEBUG,console</value>
        <description>Root logger</description>
      </property>
    ```
  - In **server-specific configuration files**. You can set metastore-specific configuration values in `hivemetastore-site.xml` and HiveServer2-specific configuration values in `hiveserver2-site.xml`.

### Deploy Practice
Using following steps to start a Hive Metastore service.

**1. Requirements**
- Java <br>
- Hadoop 2.x (preferred), 1.x (not surpported by Hive 2.0.0 onward).
- Hive is commonly used in production Linux and Windows environment. Mac is a commonly used development environment.

**2. Get Hive tarball and unpack** <br>
There are two methods to get the hive tarball:
- Download from [hive stable release](https://downloads.apache.org/hive/).
- Compile from resources:
```bash
# hive 1.0
mvn clean package -DskipTest -Phadoop-1,dist
# hive 2.0 and onward
mvn clean package -DskipTest -Pdist
```

Unpack hive tar ball and set `HIVE_HOME` and `HIVE_CONF_DIR` (optional):
```bash
tar zxf hive-x.y.z.tar.gz
export HIVE_HOME=/path/to/hive
export PATH=$HIVE_HOME/bin:$PATH
```

**3. Start metastore service** <br>
Hive uses hadoop, so must have hadoop in your path:
```bash
export HADOOP_HOME=<hadoop-install-dir>
export HADOOP_CONF_DIR=<hadoop-conf-dir>
```
In addition, you must use below HDFS commands to create `/tmp` and `/user/hive/warehouse` (aka `hive.metastore.warehouse.dir`) and set them chmod g+w before you can create a table in Hive.
```bash
$HADOOP_HOME/bin/hadoop fs -mkdir       /tmp
$HADOOP_HOME/bin/hadoop fs -mkdir       /user/hive/warehouse
$HADOOP_HOME/bin/hadoop fs -chmod g+w   /tmp
$HADOOP_HOME/bin/hadoop fs -chmod g+w   /user/hive/warehouse
```
Init database schema if you start metastore service for the first time:
```bash
$HIVE_HOME/bin/schematool -initSchema -dbType mysql
```
Then start hive metastore service:
```bash
nohup $HIVE_HOME/bin/hive --service metastore --hiveconf hive.log.file=hivemetastore.log --hiveconf hive.log.dir=/var/log/hive > /var/log/hive/hive.out 2> /var/log/hive/hive.err &
```

**4. Smoke test hive** <br>
- Open hive command line shell:
```bash
$HIVE_HOME/bin/hive [--hiveconf hive.metastore.uris=thrift://<host>:<port>]
```
- Run sample commands:
```sql
show databases;create table test(col1 int, col2 string); show tables;
```

For convenience, we provide a docker tool to start a tiny hive metastore service, please refer to [hadoop-docker](https://github.com/wecharyu/hadoop-docker).

---
title: "Hive系列(2) - Hive数据定义操作(DDL)"
toc: true
layout: post
lang: zh
categories: [大数据, 数据库]
tags: [Hive]
serial: "Hive系列文章"
serial_order: 1
---
Hive DDL语句主要和database/schema, table/view, function等有关，全部的操作可以查看[Hive Confluence](https://cwiki.apache.org/confluence/display/Hive/LanguageManual+DDL#LanguageManualDDL), 包括：
- CREATE DATABASE/SCHEMA, TABLE, VIEW, FUNCTION, INDEX
- DROP DATABASE/SCHEMA, TABLE, VIEW, INDEX
- TRUNCATE TABLE
- ALTER DATABASE/SCHEMA, TABLE, VIEW
- MSCK REPAIR TABLE (or ALTER TABLE RECOVER PARTITIONS)
- SHOW DATABASES/SCHEMAS, TABLES, TBLPROPERTIES, VIEWS, PARTITIONS, FUNCTIONS, INDEX[ES], COLUMNS, CREATE TABLE
- DESCRIBE database/schema, table, view

## Database Statements
Database作为命名空间，用于避免表，视图，分区，列等的命名冲突。

### Create Database
```sql
CREATE [REMOTE] (DATABASE|SCHEMA) [IF NOT EXISTS] database_name
[COMMENT database_comment]
[LOCATION hdfs_path]
[MANAGEDLOCATION hdfs_path]
[WITH DBPROPERTIES (property_name=property_value, ...)];
```

- **参数**
  - `LOCATION`: 为EXTERNAL TABLE指定默认的路径。
  - `MANAGEDLOCATION`: 为MANAGED TABLE指定默认的路径。

- **例子**
```sql
hive> CREATE DATABASE IF NOT EXISTS `test_db`;
OK
Time taken: 0.079 seconds
```

### Drop Database
```sql
DROP (DATABASE|SCHEMA) [IF EXISTS] database_name [RESTRICT|CASCADE];
```

- **参数**
  - `RESTRICT`: 默认行为,如果数据库不为空，DROP DATABASE会失败。
  - `CASCADE`: 同时删除数据库中的表。

### Alter Database
```sql
ALTER (DATABASE|SCHEMA) database_name SET DBPROPERTIES (property_name=property_value, ...);   -- (Note: SCHEMA added in Hive 0.14.0)

ALTER (DATABASE|SCHEMA) database_name SET OWNER [USER|ROLE] user_or_role;   -- (Note: Hive 0.13.0 and later; SCHEMA added in Hive 0.14.0)

ALTER (DATABASE|SCHEMA) database_name SET LOCATION hdfs_path; -- (Note: Hive 2.2.1, 2.4.0 and later)

ALTER (DATABASE|SCHEMA) database_name SET MANAGEDLOCATION hdfs_path; -- (Note: Hive 4.0.0 and later)
```
只有上面描述的数据库元数据可以被修改。

- **参数**
  - `SET LOCATION`: 不会改变已经存在的表/分区的路径，只会影响新建的表的路径。

**4. Use Database** <br>
```sql
USE database_name;
```
USE为后续HiveQL语句设置当前查询的数据库。
检查当前在使用的数据库可以使用：
```sql
SELECT current_database()
```

### Query Databases
**1. Show Databases** <br>
```sql
SHOW (DATABASES|SCHEMAS) [LIKE 'identifier_with_wildcards'];
```
列出所有的数据库。
- **参数**
  - `LIKE`: 使用正则表达或通配符过滤数据库。

**2. Describe Database** <br>
```sql
DESCRIBE (DATABASE|SCHEMA) [EXTENDED] db_name;
```
显示数据库的名称，注释和根路径。

- **参数**
  - `EXTENDED`: 同时显示数据库的属性。

## Table Statements
表指具有相同schema的同质数据单元。
### Create Table
有多种方式创建表，包括： <br>
**1. CREATE TABLE**
```sql
CREATE [TEMPORARY] [EXTERNAL] TABLE [IF NOT EXISTS] [db_name.]table_name    -- (Note: TEMPORARY available in Hive 0.14.0 and later)
  [(col_name data_type [column_constraint_specification] [COMMENT col_comment], ... [constraint_specification])]
  [COMMENT table_comment]
  [PARTITIONED BY (col_name data_type [COMMENT col_comment], ...)]
  [CLUSTERED BY (col_name, col_name, ...) [SORTED BY (col_name [ASC|DESC], ...)] INTO num_buckets BUCKETS]
  [SKEWED BY (col_name, col_name, ...)                  -- (Note: Available in Hive 0.10.0 and later)
    ON ((col_value, col_value, ...), (col_value, col_value, ...), ...)
    [STORED AS DIRECTORIES]
  ]
  [
   [ROW FORMAT row_format]
   [STORED AS file_format]
     | STORED BY 'storage.handler.class.name' [WITH SERDEPROPERTIES (...)]  -- (Note: Available in Hive 0.6.0 and later)
  ]
  [LOCATION hdfs_path]
  [TBLPROPERTIES (property_name=property_value, ...)]   -- (Note: Available in Hive 0.6.0 and later)
```
- **参数**
  - `PARTITIONED BY`: 创建分区表，有一个或多个分区列，并为每个分区列的组合值提供一个单独的路径。
  ```sql
  CREATE TABLE IF NOT EXISTS test_tbl (
    `id` int,
    `name` string)
  PARTITIONED BY (`region` string, `date` date);
  ```
  - `CLUSTERED BY`: 为表或分区创建buckets，bucket中的数据可以通过`SORTED_BY`排序以提高特定查询的性能。
  - `SKEWED BY`: 创建skewed表，其中有一个或多个列有数据倾斜。通过指定经常出现的值，Hive将把这些数据切分到单独的文件中。
  ```sql
  CREATE TABLE IF NOT EXISTS list_bucket (
    `key` string,
    `value` string)
  SKEWED BY (`key`, `value`) ON (('key1', 'val1'), ('key2', 'val2')) [STORED AS DIRECTORIES];
  ```
  - `ROW FORMAT`: 为表的列指定SerDe.
  ```sql
  row_format
      : DELIMITED [FIELDS TERMINATED BY char [ESCAPED BY char]] [COLLECTION ITEMS TERMINATED BY char]
            [MAP KEYS TERMINATED BY char] [LINES TERMINATED BY char]
            [NULL DEFINED AS char]   -- (Note: Available in Hive 0.13 and later)
      | SERDE serde_name [WITH SERDEPROPERTIES (property_name=property_value, property_name=property_value, ...)]
  ```
  - `STORED AS`: 指定文件的存储格式。
  ```sql
  file_format:
      : SEQUENCEFILE
      | TEXTFILE    -- (Default, depending on hive.default.fileformat configuration)
      | RCFILE      -- (Note: Available in Hive 0.6.0 and later)
      | ORC         -- (Note: Available in Hive 0.11.0 and later)
      | PARQUET     -- (Note: Available in Hive 0.13.0 and later)
      | AVRO        -- (Note: Available in Hive 0.14.0 and later)
      | JSONFILE    -- (Note: Available in Hive 4.0.0 and later)
      | INPUTFORMAT input_format_classname OUTPUTFORMAT output_format_classname
  ```

- **例子**
创建外部表：
```sql
CREATE EXTERNAL TABLE IF NOT EXISTS `page_view` (
  viewTime INT,
  userid BIGINT)
ROW FORMAT DELIMITED FIELDS TERMINATED BY '\054'
STORED AS TEXTFILE
LOCATION '/tmp/page_view';
```

**2. CREATE TABLE AS SELECT (CTAS)**
```sql
CREATE TABLE [IF NOT EXISTS] table_name
AS SELECT target_columns
FROM source_table;
```
表可以由create-table-as-select语句创建， 并用查询的结果填充表。CTAS需要注意：
- CTAS是原子操作。
- 新建的表不能是外部表。
- 新建的表不能是list bucketing表。

**例子**
```sql
CREATE TABLE new_key_value_store
   ROW FORMAT SERDE "org.apache.hadoop.hive.serde2.columnar.ColumnarSerDe"
   STORED AS RCFile
   AS
SELECT (key % 1024) new_key, concat(key, value) key_value_pair
FROM key_value_store
SORT BY new_key, key_value_pair;
```

**3. CREATE TABLE LIKE**
```sql
CREATE [TEMPORARY] [EXTERNAL] TABLE [IF NOT EXISTS] [db_name.]table_name
LIKE existing_table_or_view_name
```
CREATE TABLE LIKE允许你复制已经存在的表的定义（不拷贝表数据）。

建表有一些注意点：
- 表名和列名不区分大小写，SerDe和属性名区分大小写。
- 表和列的注释是字符文本（单引号）。

### Drop/Truncate Table
**1. Drop Table**
```sql
DROP TABLE [IF EXISTS] table_name [PURGE];
```
DROP TABLE删除表的元数据，如果是MANAGED TABLE同时也会删除表数据。
- **参数**
  - `PRUGE`: 表数据会被删除而不是移动到trash目录，即时文件系统启用了trash.

**2. Truncate Table**
```sql
TRUNCATE TABLE [IF EXISTS] table_name [PARTITION partition_spec];

partition_spec:
  : (partition_column = partition_col_value, partition_column = partition_col_value, ...)
```
移除表和分区的所有行。

### Alter Table
**1. Rename Table**
```sql
ALTER TABLE table_name RENAME TO new_table_name;
```
内部表只有在创建时没有使用`LOCATION`语句且在所属的数据库路径下时，其HDFS路径才会被改变。

**2. Alter Table Properties**
```sql
ALTER TABLE table_name SET TBLPROPERTIES table_properties;

table_properties:
  : (property_name = property_value, property_name = property_value, ... )
```
这个语句用于更新或新增表属性。

**3. Alter SerDe Properties**
```sql
ALTER TABLE table_name [PARTITION partition_spec] SET SERDE serde_class_name [WITH SERDEPROPERTIES serde_properties];

ALTER TABLE table_name [PARTITION partition_spec] SET SERDEPROPERTIES serde_properties;

serde_properties:
  : (property_name = property_value, property_name = property_value, ... )

ALTER TABLE table_name [PARTITION partition_spec] UNSET SERDEPROPERTIES (property_name, ... );
```

**4. Alter column**
```sql
ALTER TABLE table_name [PARTITION partition_spec]
CHANGE [COLUMN] col_old_name col_new_name column_type
[COMMENT col_comment] [FIRST|AFTER column_name] [CASCADE|RESTRICT];
```
这个命令允许用户改变列的名称，数据类型，注释，或者位置。
- **参数**
  - `CASCADE|RESTRICT`: CASCADE改变表元数据的列，并且级联到改变所有的分区元数据的列。RESTRICT是默认的，限制列改变在表元数据层。

**修改列只会修改Hive的元数据，不会修改数据。**

### Query Tables
**1. Show Tables** <br>
```sql
SHOW TABLES [IN database_name] ['identifier_with_wildcards'];
```
SHOW TABLES lists all the tables and views in the current database.
- **参数**
  - `IN database_name`: 显式指定想查询的数据库。
  - `'identifier_with_wildcards'`: 匹配表名的通配符。

**2. Describe Table/View/Column**
```sql
DESC [EXTENDED|FORMATTED] [db_name.]table_name;
```
- **参数**
  - `FORMATTED`: 以表格格式显示元数据。

**3. Display Column Statistics**
```sql
DESC FORMATTED [db_name.]table_name column_name
[PARTITION (partition_spec)];
```

## Partition Statements
分区列决定了数据如何存储。分区定义在创建分区表的同时创建。

分区可以在ALTER TABLE语句中使用PARTITION语句添加，重命名，交换（移动），删除或者（解）压缩。要让metastore知道直接添加到HDFS的分区，需要使用metastore check命令（**MSCK**)。

### Add Partitions
```sql
ALTER TABLE table_name ADD [IF NOT EXISTS] PARTITION partition_spec [LOCATION 'location'][, PARTITION partition_spec [LOCATION 'location'], ...];

partition_spec:
  : (partition_column = partition_col_value, partition_column = partition_col_value, ...)
```
ADD PARTITION改变表元数据，但不会加载数据。

### Alter Partition
**1. Rename Partition**
```sql
ALTER TABLE table_name PARTITION partition_spec RENAME TO PARTITION partition_spec;
```

**2. Exchange Partition**
```sql
ALTER TABLE table_name_2 EXCHANGE PARTITION (partition_spec[, partition_spec2,...]) WITH TABLE table_name_1;
```
分区可以在表之间交换（移动）。EXCHANGE PARTITION语句可以将分区数据从一个表移动到另一个有相同schema但没有该分区的表。

**3. Recover Partitions (MSCK REPAIR TABLE)**
```sql
MSCK [REPAIR] TABLE table_name [ADD/DROP/SYNC PARTITIONS];
```
- **参数**:
  - `REPAIR`: 不带REPAIR时,这个命令只会找到未匹配的元数据信息，而不会更新元数据。
  - `ADD/DROP/SYNC PARTITIONS`: 默认是ADD PARTITIONS, SYNC表示ADD和DROP.
Hive保存了每个表的所有分区信息，但是如果新分区直接加到HDFS（也就是通过`hadoop -put`命令）或者直接从HDFS删除，metastore是不知道这个变更的，除非用户对新增或删除的每个分区单独运行`ALTER TABLE table_name ADD/DROP partition`命令。

metastore check命令（MSCK REPAIR TABLE）会更新分区的元数据。当有大量分区要更新时，可能出现OOM错误。为避免这个错误，可以给**hive.msck.repair.batch.size**属性配置批大小，metastore内部就会按批处理。

**4. (Un)Archive Partition**
```sql
ALTER TABLE table_name ARCHIVE PARTITION partition_spec;
ALTER TABLE table_name UNARCHIVE PARTITION partition_spec;
```
Archive将一个分区的所有文件移动到一个Hadoop Archive（HAR）。**只是减少了文件数量，HAR并不提供任何压缩。**

### Drop Partitions
```sql
ALTER TABLE table_name DROP [IF EXISTS] PARTITION partition_spec[, PARTITION partition_spec, ...]
  [IGNORE PROTECTION] [PURGE];
```
为表删除分区会删除该分区的元数据和数据。

### Query Partitions
**1. Show Partitions**
```sql
SHOW PARTITIONS table_name [PARTITION (partition_spec)]
[WHERE where_condition] [ORDER BY col_list]
[LIMIT rows];
```
列出给定的表的所有存在的分区名。

**2. Describe Partition**
```sql
DESCRIBE [EXTENDED|FORMATTED] [db_name.]table_name [column_name] PARTITION partition_spec;
```
展示分区的信息。

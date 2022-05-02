---
title: "Hive serial (2) - Hive Data Definition Operation (DDL)"
toc: true
layout: post
lang: en
categories: [Big Data, Database]
tags: [Hive]
serial: "Hive Serial Articles"
serial_order: 1
---
Hive DDL statements are mainly related to database/schema, table, view, function et, all operations can be found in [Hive Confluence](https://cwiki.apache.org/confluence/display/Hive/LanguageManual+DDL#LanguageManualDDL), including:
- CREATE DATABASE/SCHEMA, TABLE, VIEW, FUNCTION, INDEX
- DROP DATABASE/SCHEMA, TABLE, VIEW, INDEX
- TRUNCATE TABLE
- ALTER DATABASE/SCHEMA, TABLE, VIEW
- MSCK REPAIR TABLE (or ALTER TABLE RECOVER PARTITIONS)
- SHOW DATABASES/SCHEMAS, TABLES, TBLPROPERTIES, VIEWS, PARTITIONS, FUNCTIONS, INDEX[ES], COLUMNS, CREATE TABLE
- DESCRIBE database/schema, table, view

## Database Statements
Database is used as namespace to avoid naming conflicts for tables, views, partitions, columns, and so on.

### Create Database
```sql
CREATE [REMOTE] (DATABASE|SCHEMA) [IF NOT EXISTS] database_name
[COMMENT database_comment]
[LOCATION hdfs_path]
[MANAGEDLOCATION hdfs_path]
[WITH DBPROPERTIES (property_name=property_value, ...)];
```

- **Parameters**
  - `LOCATION`: now refers to the default directory for external tables.
  - `MANAGEDLOCATION`: refers to the default directory for managed tables.

- **Examples**
```sql
hive> CREATE DATABASE IF NOT EXISTS `test_db`;
OK
Time taken: 0.079 seconds
```

### Drop Database
```sql
DROP (DATABASE|SCHEMA) [IF EXISTS] database_name [RESTRICT|CASCADE];
```

- **Parameters**
  - `RESTRICT`: default behavior, where DROP DATABASE will fail if the database is not empty.
  - `CASCADE`: drop the tables in the database as well.

### Alter Database
```sql
ALTER (DATABASE|SCHEMA) database_name SET DBPROPERTIES (property_name=property_value, ...);   -- (Note: SCHEMA added in Hive 0.14.0)

ALTER (DATABASE|SCHEMA) database_name SET OWNER [USER|ROLE] user_or_role;   -- (Note: Hive 0.13.0 and later; SCHEMA added in Hive 0.14.0)

ALTER (DATABASE|SCHEMA) database_name SET LOCATION hdfs_path; -- (Note: Hive 2.2.1, 2.4.0 and later)

ALTER (DATABASE|SCHEMA) database_name SET MANAGEDLOCATION hdfs_path; -- (Note: Hive 4.0.0 and later)
```
Only database metadata described above can be changed.

- **Parameters**
  - `SET LOCATION`: does not change location of existing tables/partitions, only affects location of new created tables.

**4. Use Database** <br>
```sql
USE database_name;
```
USE sets the current database for all subsequent HiveQL statements.
To check which database is currently being used:
```sql
SELECT current_database()
```

### Query Databases
**1. Show Databases** <br>
```sql
SHOW (DATABASES|SCHEMAS) [LIKE 'identifier_with_wildcards'];
```
lists all of the databases defined in the metastore.
- **Parameters**
  - `LIKE`: filters the databases using a regular expression or wildcards.

**2. Describe Database** <br>
```sql
DESCRIBE (DATABASE|SCHEMA) [EXTENDED] db_name;
```
shows the name, comment, and root location of database.

- **Paramaters**
  - `EXTENDED`: also shows the database properties

## Table Statements
Homogeneous units of data which have the same schema.
### Create Table
There are multiple forms of creating a tale, including: <br>
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
- **Paramaters**
  - `PARTITIONED BY`: create partitioned tables, which have one or more partition columns and a seperated data directory for each distinct value combination in the partition colums.
  ```sql
  CREATE TABLE IF NOT EXISTS test_tbl (
    `id` int,
    `name` string)
  PARTITIONED BY (`region` string, `date` date);
  ```
  - `CLUSTERED BY`: create buckets for tables or partitions, and data can be sorted within that bucket via `SORTED_BY` columns to improve performance on certain kinds of queries.
  - `SKEWED BY`: create skewed tables where one or more columns have skewed values. By specifying the values that appear very often (heavy skew), Hive will split those out into seperate files.
  ```sql
  CREATE TABLE IF NOT EXISTS list_bucket (
    `key` string,
    `value` string)
  SKEWED BY (`key`, `value`) ON (('key1', 'val1'), ('key2', 'val2')) [STORED AS DIRECTORIES];
  ```
  - `ROW FORMAT`: specify the SerDe for columns of tables.
  ```sql
  row_format
      : DELIMITED [FIELDS TERMINATED BY char [ESCAPED BY char]] [COLLECTION ITEMS TERMINATED BY char]
            [MAP KEYS TERMINATED BY char] [LINES TERMINATED BY char]
            [NULL DEFINED AS char]   -- (Note: Available in Hive 0.13 and later)
      | SERDE serde_name [WITH SERDEPROPERTIES (property_name=property_value, property_name=property_value, ...)]
  ```
  - `STORED AS`: specify the storage format of file.
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

- **Examples**
Create External tables:
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
Tables can be created and populated by the result of a query in one create-table-as-select statement. There are some points of CTAS:
- CTAS is atomic.
- The target table can not be an external table.
- The target table can not be a list bucketing table.

**Example**
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
The LIKE form of CREATE TABLE allows you to copy an existing table definition exactly (without copying its data).

There are some points on creating table:
- Table names and column names are case insensitive, but SerDe and property names are case sensitive.
- Table and column comments are string literals (single-quoted).

### Drop/Truncate Table
**1. Drop Table**
```sql
DROP TABLE [IF EXISTS] table_name [PURGE];
```
DROP TABLE removes metadata for this table, also remove data if it is a MANAGED TABLE.
- **Parameters**
  - `PRUGE`: table data will be deleted rather than moving to trash directory even if the filesystem trash is enabled.

**2. Truncate Table**
```sql
TRUNCATE TABLE [IF EXISTS] table_name [PARTITION partition_spec];

partition_spec:
  : (partition_column = partition_col_value, partition_column = partition_col_value, ...)
```
Remove all rows of a table or partition(s).

### Alter Table
**1. Rename Table**
```sql
ALTER TABLE table_name RENAME TO new_table_name;
```
A managed table's HDFS location will be moved only if the table is created without a `LOCATION` clause and under its database directory.

**2. Alter Table Properties**
```sql
ALTER TABLE table_name SET TBLPROPERTIES table_properties;

table_properties:
  : (property_name = property_value, property_name = property_value, ... )
```
This statement is used to update or add table properties.

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
This command allows users to change a column's name, data type, comment, or position or an arbitrary combination of them.
- **Parameters**
  - `CASCADE|RESTRICT`: CASCADE changes the columns of table metadata, and cascades the same change to all the partition metadata. RESTRICT is the default, limiting the column changes only to table metadata.

**Alter column will only modify Hive's metadata, and will not modify data.**

### Query Tables
**1. Show Tables** <br>
```sql
SHOW TABLES [IN database_name] ['identifier_with_wildcards'];
```
SHOW TABLES lists all the tables and views in the current database.
- **Parameters**
  - `IN database_name`: specify the database wanted to query explicitly
  - `'identifier_with_wildcards'`: wildcards for table name matching

**2. Describe Table/View/Column**
```sql
DESC [EXTENDED|FORMATTED] [db_name.]table_name;
```
- **Parameters**
  - `FORMATTED`: show the metadata in tabular format

**3. Display Column Statistics**
```sql
DESC FORMATTED [db_name.]table_name column_name
[PARTITION (partition_spec)];
```

## Partition Statements
Partition columns determine how the data is stored. Partition definition is created while creating partitioned table.

Partitions can be added, renamed, exchanged (moved), dropped, or (un)archived by using PARTITION clause in an ALTER TABLE statement. To make the metastore aware of partitions that were added directly to HDFS, you can use the matastore check command (**MSCK**).

### Add Partitions
```sql
ALTER TABLE table_name ADD [IF NOT EXISTS] PARTITION partition_spec [LOCATION 'location'][, PARTITION partition_spec [LOCATION 'location'], ...];

partition_spec:
  : (partition_column = partition_col_value, partition_column = partition_col_value, ...)
```
ADD PARTITION changes the table metadata, but does not load data.

### Alter Partition
**1. Rename Partition**
```sql
ALTER TABLE table_name PARTITION partition_spec RENAME TO PARTITION partition_spec;
```

**2. Exchange Partition**
```sql
ALTER TABLE table_name_2 EXCHANGE PARTITION (partition_spec[, partition_spec2,...]) WITH TABLE table_name_1;
```
Partitions can be exchanged (moved) between tables. EXCHANGE PARTITION statement lets you move data in a partition from a table to another table that has the same schema and does not already have this partition.

**3. Recover Partitions (MSCK REPAIR TABLE)**
```sql
MSCK [REPAIR] TABLE table_name [ADD/DROP/SYNC PARTITIONS];
```
- **PARAMETERS**:
  - `REPAIR`: without REPAIR, this command will only find the details about metadata mismatch metastore rather than update the metadata.
  - `ADD/DROP/SYNC PARTITIONS`: default is ADD PARTITIONS, SYNC means both ADD and DROP.
Hive stores a list of partitions for each table in its metastore, if, however, new partitions are directly added to HDFS (say by using `hadoop -put` command) or removed from HDFS, the metastore will not be aware of these changes unless the user runs `ALTER TABLE table_name ADD/DROP partition` commands on each newly added or removed partitions respectly.

The metastore check command (MSCK REPAIR TABLE) updates the metadata about partitions. When there is a large number of untracked partitions, the OOM error may occur. To avoid such error, you can give a configured batch size for the property **hive.msck.repair.batch.size**, it can run in the batches internally.

**4. (Un)Archive Partition**
```sql
ALTER TABLE table_name ARCHIVE PARTITION partition_spec;
ALTER TABLE table_name UNARCHIVE PARTITION partition_spec;
```
Archiving moves a partition's files into a Hadooop Archive (HAR). **Only the file count is reduced, the HAR does not provide any compression.**

### Drop Partitions
```sql
ALTER TABLE table_name DROP [IF EXISTS] PARTITION partition_spec[, PARTITION partition_spec, ...]
  [IGNORE PROTECTION] [PURGE];
```
Drop partition for a table, which removes both data and metadata for this partition.

### Query Partitions
**1. Show Partitions**
```sql
SHOW PARTITIONS table_name [PARTITION (partition_spec)]
[WHERE where_condition] [ORDER BY col_list]
[LIMIT rows];
```
lists all existing partition names for a given table.

**2. Describe Partition**
```sql
DESCRIBE [EXTENDED|FORMATTED] [db_name.]table_name [column_name] PARTITION partition_spec;
```
displays the partition information.

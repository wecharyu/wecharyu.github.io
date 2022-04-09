---
title: "HikariCP Source Code Analysis"
toc: true
layout: post
lang: en
categories: [Database]
tags: [Database Connection Pool]
---

[HikariCP](https://github.com/brettwooldridge/HikariCP) is a fast, simple reliable JDBC connection pool, it became the default database connection pool since `SpringBoot2.0`. JDBC connection pool is a mechanism that manages multiple database connection requests. In other words, it facilitates connection reuse, a memory cache of database connections.

## Basic Usage
To use `HikariCP`, we should first add dependency lib, then create `DataSource` to provide Connection, and get `Connection` from DataSource, finally we can close HikariCP if current DataSource expired.
### Add Dependency
If you are not developing your application based on `SpringBoot2.0` or above, you need add `HikariCP` dependency explicitely. We use `HikariCP 2.6.1` version as an example:
```xml
<dependency>
  <groupId>com.zaxxer</groupId>
  <artifactId>HikariCP</artifactId>
  <version>2.6.1</version>
</dependency>
```

### Create DataSource
As a database connection pool, HikariCP provides `HikariDataSource` which implements `DataSource` interface, we should construct a `HikariDataSource` instance to use, there are many ways to create `HikariDataSource` instance:

- Default constructor, should set configuration after construction
```java
HikariDataSource ds = new HikariDataSource();
ds.setJdbcUrl("jdbc:mysql://localhost:3306/test");
ds.setUsername("root");
ds.setPassword("123456");
```

- Initialize with `HikariConfig`:
```java
HikariConfig config = new HikariConfig();
config.setJdbcUrl("jdbc:mysql://localhost:3306/test");
config.setUsername("root");
config.setPassword("123456");
HikariDataSource ds = new HikariDataSource(config);
```

### Get Connection
Then you can get `Connection` instance from `ds` and do execute with it:
```java
try (Connection connection = ds.getConnection();
  Statement st = connection.createStatement()
) {
  ResultSet rs = st.executeQuery("show tables;");
  if (rs.next()) {
    System.out.println(rs.getString(1));
  }
} catch (Exception e) {
  // handle exception
}
// if any required
ds.close();
```

## Source Code Analysis
There are three mainly components in `HikariCP`, as shown below:
![](https://raw.githubusercontent.com/wecharyu/picture-bed/main/img/2022/01/2022-01-16-database-hikaricp/HikariCP-Architecture-Overview.png)

- API
  -  `HikariDataSource` represents the target DataSource
  -  `HikariConfig` used to make database related configuration
- Pool
  - `HikariPool` provides the basic pooling behavior, maintaining a certain number of connections and closing expired connections
  - `ConcurrentBag` stores new created elements in sharedList and requited elements in threadList
  - `PoolEntry` used in the ConcurrentBag to track Connection instances
- metrics
  - `MetricsTrackerFactory` interface to create `IMetricsTracker`
  - `IMetricsTracker` interface to record connection metrics

The mainly UML of each modules are shown as follows:
![](https://raw.githubusercontent.com/wecharyu/picture-bed/main/img/2022/01/2022-01-16-database-hikaricp/HikariCP-UML.png)
### API
`HikariDataSource` is the core api of HikariCP, which implements the `DataSource` and has two constructors:
```java
   // fastPathPool is final and can be cached, created in parametered constructor
   private final HikariPool fastPathPool;
   // pool is volatile, lazy load and should read from memory each time
   private volatile HikariPool pool;

   // Default constructor.  Setters be used to configure the pool.
   public HikariDataSource()
   {
      // constructor of HikariConfig
      super();
      // no eager loading pool
      fastPathPool = null;
   }

   public HikariDataSource(HikariConfig configuration)
   {
      // validate and copy curent configuration of pool
      configuration.validate();
      configuration.copyState(this);

      LOGGER.info("{} - Starting...", configuration.getPoolName());
      // eager loading pool
      pool = fastPathPool = new HikariPool(this);
      LOGGER.info("{} - Start completed.", configuration.getPoolName());
   }
```
Default constructor only initialize base configuration, and should use `set` method to config other configurations, it use lazy load method to create `HikariPool`. Instead, the parameterized constructor will create `fastPathPool` to use directly.

`HikariDataSource` implements the method `getConnection()` of `DataSource` interface, and gets the real connection through the maintained `fastPathPool` of `pool`:
```java
   public Connection getConnection() throws SQLException
   {
      // closed pool can not get connection
      if (isClosed()) {
         throw new SQLException("HikariDataSource " + this + " has been closed.");
      }

      // eager load from fastPathPool
      if (fastPathPool != null) {
         return fastPathPool.getConnection();
      }

      // lazy load from pool
      // See http://en.wikipedia.org/wiki/Double-checked_locking#Usage_in_Java
      HikariPool result = pool;
      if (result == null) {
         synchronized (this) {
            result = pool;
            // double check for pool
            if (result == null) {
               // validate configuration
               validate();
               LOGGER.info("{} - Starting...", getPoolName());
               try {
                  // create HikariPool instance
                  pool = result = new HikariPool(this);
               }
               catch (PoolInitializationException pie) {
                  if (pie.getCause() instanceof SQLException) {
                     throw (SQLException) pie.getCause();
                  }
                  else {
                     throw pie;
                  }
               }
               LOGGER.info("{} - Start completed.", getPoolName());
            }
         }
      }
      // get connection from HikariPool
      return result.getConnection();
   }
```
We get connection from `fastPathPool` or `pool`, `fastPathPool` can be a bit faster because it can be cached compared to `pool`, so **it is more recommanded to initialize `HikariDataSource` with parametered constructor**.

### Pool
`HikariPool` is the primary connection pool class that provides the basic pooling behavior for HikariCP.
```java
   /* mainly fields of HikariPool */
   // LinkedBlockingQueue used to store the task of adding connections
   private final Collection<Runnable> addConnectionQueue;
   // thread pool to execute tasks of adding connections
   private final ThreadPoolExecutor addConnectionExecutor;
   // thread pool to execute task of closing expired connections
   private final ThreadPoolExecutor closeConnectionExecutor;

   // connectionBag maintains the real connection inside PoolEntry
   private final ConcurrentBag<PoolEntry> connectionBag;

   // thread pool to retire and maintain minimum idle connections.
   private ScheduledExecutorService houseKeepingExecutorService;
```
`ConcurrentBag` is the core util collection that maintains the connections for the connection pool concurrently.
```java
   /* mainly fields of HikariPool */
   // sharedList all threads can borrow
   private final CopyOnWriteArrayList<T> sharedList;

   // threadList can be borrowed only in thread locally
   private final ThreadLocal<List<Object>> threadList;
   // listener is just the HikariPool instance
   private final IBagStateListener listener;
   // number of waiting to get connection
   private final AtomicInteger waiters;

   // blocking queue to store the PoolEntry elements
   private final SynchronousQueue<T> handoffQueue;
```

#### Get Connection
`HikariPool` provides the method `getConnection()` to get connection, it borrows existing `PoolEntry` from `connectionBag`:
```java
   public Connection getConnection(final long hardTimeout) throws SQLException
   {
      // limit the maximum number of requested connections
      suspendResumeLock.acquire();
      final long startTime = currentTime();

      try {
         long timeout = hardTimeout;
         PoolEntry poolEntry = null;
         try {
            do {
               // borrow existing PoolEntry from connectionBag
               poolEntry = connectionBag.borrow(timeout, MILLISECONDS);
               if (poolEntry == null) {
                  break; // We timed out... break and throw exception
               }

               final long now = currentTime();
               // close connection if it is evicted or idle for long time
               if (poolEntry.isMarkedEvicted() || (elapsedMillis(poolEntry.lastAccessed, now) > ALIVE_BYPASS_WINDOW_MS && !isConnectionAlive(poolEntry.connection))) {
                  closeConnection(poolEntry, "(connection is evicted or dead)"); // Throw away the dead connection (passed max age or failed alive test)
                  timeout = hardTimeout - elapsedMillis(startTime);
               }
               else {
                  // get proxy connection from poolEntry
                  metricsTracker.recordBorrowStats(poolEntry, startTime);
                  return poolEntry.createProxyConnection(leakTask.schedule(poolEntry), now);
               }
            } while (timeout > 0L);

            metricsTracker.recordBorrowTimeoutStats(startTime);
         }
         catch (InterruptedException e) {
            // error when borrowing poolEntry, recyle it back to pool
            if (poolEntry != null) {
               poolEntry.recycle(startTime);
            }
            Thread.currentThread().interrupt();
            throw new SQLException(poolName + " - Interrupted during connection acquisition", e);
         }
      }
      finally {
         // release the semophore
         suspendResumeLock.release();
      }

      throw createTimeoutException(startTime);
   }
```
`ConcurrentBag` provides `borrow()` method to get `PoolEntry` element from concurrent collection, it first try to get from `threadList`, then try to get from `sharedList`, if still not get, then try to get from `handoffQueue`:
```java
   public T borrow(long timeout, final TimeUnit timeUnit) throws InterruptedException
   {
      // Try the thread-local list first
      final List<Object> list = threadList.get();
      for (int i = list.size() - 1; i >= 0; i--) {
         final Object entry = list.remove(i);
         @SuppressWarnings("unchecked")
         final T bagEntry = weakThreadLocals ? ((WeakReference<T>) entry).get() : (T) entry;
         if (bagEntry != null && bagEntry.compareAndSet(STATE_NOT_IN_USE, STATE_IN_USE)) {
            return bagEntry;
         }
      }

      // Otherwise, scan the shared list ... then poll the handoff queue
      final int waiting = waiters.incrementAndGet();
      try {
         for (T bagEntry : sharedList) {
            if (bagEntry.compareAndSet(STATE_NOT_IN_USE, STATE_IN_USE)) {
               // If we may have stolen another waiter's connection, request another bag add.
               if (waiting > 1) {
                  // listener is HikariPool instance
                  listener.addBagItem(waiting - 1);
               }
               return bagEntry;
            }
         }

         listener.addBagItem(waiting);

         timeout = timeUnit.toNanos(timeout);
         do {
            final long start = currentTime();
            // retrieves bagEntry from queue, waiting if necessary up to timeout
            final T bagEntry = handoffQueue.poll(timeout, NANOSECONDS);
            if (bagEntry == null || bagEntry.compareAndSet(STATE_NOT_IN_USE, STATE_IN_USE)) {
               return bagEntry;
            }

            timeout -= elapsedNanos(start);
         } while (timeout > 10_000);

         return null;
      }
      finally {
         waiters.decrementAndGet();
      }
   }
```

`HikariPool` recyle `poolEntry` back to pool by `connectionBag`:
```java
   void recycle(final PoolEntry poolEntry)
   {
      metricsTracker.recordConnectionUsage(poolEntry);

      connectionBag.requite(poolEntry);
   }
```
`ConcurrentBag` provides `requite()` method to return borrowed PoolEntry to the bag, if there are waiters directly push bagEntry to `handoffQueue`, otherwise push bagEntry to `threadLocalList`:
```java
   public void requite(final T bagEntry)
   {
      bagEntry.setState(STATE_NOT_IN_USE);

      for (int i = 0; waiters.get() > 0; i++) {
         // there are waiters, just try push bagEntry to handoffQueue for borrowing
         if (bagEntry.getState() != STATE_NOT_IN_USE || handoffQueue.offer(bagEntry)) {
            return;
         }
         else if ((i & 0x100) == 0x100) {
            parkNanos(MICROSECONDS.toNanos(10));
         }
         else {
            yield();
         }
      }

      // no waiters, return poolEntry to threadLocalList
      final List<Object> threadLocalList = threadList.get();
      threadLocalList.add(weakThreadLocals ? new WeakReference<>(bagEntry) : bagEntry);
   }
```

#### Add Connection
`HikariPool` adds `PoolEntry` instance with `addBagItem()` method, it will submit a task of `POOL_ENTRY_CREATOR`:
```java
   public Future<Boolean> addBagItem(final int waiting)
   {
      final boolean shouldAdd = waiting - addConnectionQueue.size() >= 0; // Yes, >= is intentional.
      if (shouldAdd) {
         return addConnectionExecutor.submit(POOL_ENTRY_CREATOR);
      }

      return CompletableFuture.completedFuture(Boolean.TRUE);
   }
```
`POOL_ENTRY_CREATOR` is an `Callable<Boolean>` instance, the `call()` method used to add `PoolEntry` instance to `connectionBag`:
```java
      public Boolean call() throws Exception
      {
         long sleepBackoff = 250L;
         while (poolState == POOL_NORMAL && shouldCreateAnotherConnection()) {
            // create new PoolEntry instance
            final PoolEntry poolEntry = createPoolEntry();
            if (poolEntry != null) {
               connectionBag.add(poolEntry);
               LOGGER.debug("{} - Added connection {}", poolName, poolEntry.connection);
               if (loggingPrefix != null) {
                  logPoolState(loggingPrefix);
               }
               return Boolean.TRUE;
            }

            // failed to get connection from db, sleep and retry
            quietlySleep(sleepBackoff);
            sleepBackoff = Math.min(SECONDS.toMillis(10), Math.min(connectionTimeout, (long) (sleepBackoff * 1.5)));
         }
         // Pool is suspended or shutdown or at max size
         return Boolean.FALSE;
      }
```
`HikariPool` use `createPoolEntry()` method to create a `PoolEntry`, it will create new connection to construct PoolEntry and schedule task to evict connection if maxLifetime is configured:
```java
   private PoolEntry createPoolEntry()
   {
      try {
         // create new poolEntry with new connection
         final PoolEntry poolEntry = newPoolEntry();

         final long maxLifetime = config.getMaxLifetime();
         if (maxLifetime > 0) {
            // variance up to 2.5% of the maxlifetime
            final long variance = maxLifetime > 10_000 ? ThreadLocalRandom.current().nextLong( maxLifetime / 40 ) : 0;
            final long lifetime = maxLifetime - variance;
            // schedule task to evict connection after lifetime
            poolEntry.setFutureEol(houseKeepingExecutorService.schedule(
               () -> {
                  if (softEvictConnection(poolEntry, "(connection has passed maxLifetime)", false /* not owner */)) {
                     // try to add PoolEntry because this connection is evicted
                     addBagItem(connectionBag.getWaitingThreadCount());
                  }
               },
               lifetime, MILLISECONDS));
         }

         return poolEntry;
      }
      catch (Exception e) {
         if (poolState == POOL_NORMAL) {
            LOGGER.debug("{} - Cannot acquire connection from data source", poolName, (e instanceof ConnectionSetupException ? e.getCause() : e));
         }
         return null;
      }
   }
```
`ConcurrentBag` use `add()` method to add new PoolEntry to the bag for others to borrow, it first add bagEntry to `sharedList`, and if there are `waiters` then it offers the bagEntry to `handoffQueue` for borrowing:
```java
   public void add(final T bagEntry)
   {
      if (closed) {
         LOGGER.info("ConcurrentBag has been closed, ignoring add()");
         throw new IllegalStateException("ConcurrentBag has been closed, ignoring add()");
      }

      // add bagEntry to sharedList
      sharedList.add(bagEntry);

      // spin until a thread takes it or none are waiting
      while (waiters.get() > 0 && !handoffQueue.offer(bagEntry)) {
         yield();
      }
   }
```

#### Maintain Connection
`HikariPool` use `HouseKeeper` to retire and maintain minimum idle connections, it implements `Runnable`, it will limit idle timeout connections if idle timeout is configured and minimumIdle is smaller than maximum pool size, to avoid this action, **we can leave minimumIdle and idleTimeout unset**.
```java
      // timestamp of house keeping task executed
      private volatile long previous = plusMillis(currentTime(), -HOUSEKEEPING_PERIOD_MS);

      public void run()
      {
         try {
            // refresh timeouts in case they changed via MBean
            connectionTimeout = config.getConnectionTimeout();
            validationTimeout = config.getValidationTimeout();
            leakTask.updateLeakDetectionThreshold(config.getLeakDetectionThreshold());

            final long idleTimeout = config.getIdleTimeout();
            final long now = currentTime();

            // Detect retrograde time, allowing +128ms as per NTP spec.
            if (plusMillis(now, 128) < plusMillis(previous, HOUSEKEEPING_PERIOD_MS)) {
               // unexpected, current timestamp is smaller than expected
               LOGGER.warn("{} - Retrograde clock change detected (housekeeper delta={}), soft-evicting connections from pool.",
                           poolName, elapsedDisplayString(previous, now));
               previous = now;
               softEvictConnections();
               fillPool();
               return;
            }
            else if (now > plusMillis(previous, (3 * HOUSEKEEPING_PERIOD_MS) / 2)) {
               // No point evicting for forward clock motion, this merely accelerates connection retirement anyway
               LOGGER.warn("{} - Thread starvation or clock leap detected (housekeeper delta={}).", poolName, elapsedDisplayString(previous, now));
            }

            previous = now;

            String afterPrefix = "Pool ";
            if (idleTimeout > 0L && config.getMinimumIdle() < config.getMaximumPoolSize()) {
               // close idle timeout conenctions if idle timeout is set
               // and minimumIdle is smaller than maximum pool size
               logPoolState("Before cleanup ");
               afterPrefix = "After cleanup  ";

               connectionBag
                  .values(STATE_NOT_IN_USE)
                  .stream()
                  .sorted(LASTACCESS_REVERSE_COMPARABLE)
                  .skip(config.getMinimumIdle())
                  .filter(p -> elapsedMillis(p.lastAccessed, now) > idleTimeout)
                  .filter(connectionBag::reserve)
                  .forEachOrdered(p -> closeConnection(p, "(connection has passed idleTimeout)"));
            }

            logPoolState(afterPrefix);

            fillPool(); // Try to maintain minimum connections
         }
         catch (Exception e) {
            LOGGER.error("Unexpected exception in housekeeping task", e);
         }
      }
```
`HikariPool` provides `fillPool()` method to maintain the minimum idle connections, it will calculate the number of connections need to add, and submit the tasks:
```java
   private synchronized void fillPool()
   {
      final int connectionsToAdd = Math.min(config.getMaximumPoolSize() - getTotalConnections(), config.getMinimumIdle() - getIdleConnections())
                                   - addConnectionQueue.size();
      for (int i = 0; i < connectionsToAdd; i++) {
         addConnectionExecutor.submit((i < connectionsToAdd - 1) ? POOL_ENTRY_CREATOR : POST_FILL_POOL_ENTRY_CREATOR);
      }
   }
```

### metrics
`HikariCP` provide both dropwizard and prometheus types metrics, the top interface `MetricsTrackerFactory` is used to create `IMetricsTracker`, which is used to record the create, acquire, usage and timeout of connections.

#### dropwizard
`CodahaleMetricsTrackerFactory` create the instance of `CodaHaleMetricsTracker`, it stores such metrics:
```java
   private final String poolName;
   // related metrics
   private final Timer connectionObtainTimer;
   private final Histogram connectionUsage;
   private final Histogram connectionCreation;
   private final Meter connectionTimeoutMeter;
   // registry used to register metrics
   private final MetricRegistry registry;

   // names of other metrics
   private static final String METRIC_CATEGORY = "pool";
   private static final String METRIC_NAME_WAIT = "Wait";
   private static final String METRIC_NAME_USAGE = "Usage";
   private static final String METRIC_NAME_CONNECT = "ConnectionCreation";
   private static final String METRIC_NAME_TIMEOUT_RATE = "ConnectionTimeoutRate";
   private static final String METRIC_NAME_TOTAL_CONNECTIONS = "TotalConnections";
   private static final String METRIC_NAME_IDLE_CONNECTIONS = "IdleConnections";
   private static final String METRIC_NAME_ACTIVE_CONNECTIONS = "ActiveConnections";
   private static final String METRIC_NAME_PENDING_CONNECTIONS = "PendingConnections";
```

#### prometheus
`PrometheusMetricsTrackerFactory` create the instance of `PrometheusMetricsTracker`, it stores such metrics:
```java
   // hikaricp_connection_timeout_count{poolName}
   private final Counter.Child connectionTimeoutCounter;
   // hikaricp_connection_acquired_nanos{poolName}
   private final Summary.Child elapsedAcquiredSummary;
   // hikaricp_connection_usage_millis{poolName}
   private final Summary.Child elapsedBorrowedSummary;
   // hikaricp_connection_creation_millis{poolName}
   private final Summary.Child elapsedCreationSummary;

   // hikaricp_connection_timeout_count
   private final Counter ctCounter;
   // hikaricp_connection_acquired_nanos
   private final Summary eaSummary;
   // hikaricp_connection_usage_millis
   private final Summary ebSummary;
   // hikaricp_connection_creation_millis
   private final Summary ecSummary;
   private final Collector collector;
```

## Best Practices
There are some best practices for HikariCP:
- **Create `HikariDataSource` by constructor `HikariDataSource(HikariConfig config)`** <br>
It will check configurations and eagerly initialize pool, and the `fastPathPool` can be cached for better performance.
- **Running HikariCP as a fixed-size pool** <br>
Leaving `minimumIdle` and `idleTimeout` unset, then pool does not need to close connections idle for long time.
- **Config resonable `maximumPoolSize`** <br>
It depends primarily on the QPS of processing requests, the processing time of each request and the number of CPU cores of the database server.

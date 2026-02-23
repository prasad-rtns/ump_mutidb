export type DbPools = {
  pg?: import('pg').Pool;
  mysql?: import('mysql2/promise').Pool;
  mssql?: import('mssql').ConnectionPool;
  oracle?: import('oracledb').Pool;
  mongo?: import('mongodb').MongoClient;
};
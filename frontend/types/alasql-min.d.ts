declare module "alasql/dist/alasql.min.js" {
  type AlaSql = {
    (sql: string, params?: unknown[]): unknown;
    tables: Record<string, { data: Record<string, string | number>[] }>;
  };

  const alasql: AlaSql;
  export default alasql;
}

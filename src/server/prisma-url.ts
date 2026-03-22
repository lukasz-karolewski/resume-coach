import path from "node:path";

const SQLITE_FILE_PROTOCOL = "file:";
const MEMORY_DATABASE_URL = "file::memory:";

function toPosixPath(filePath: string) {
  return filePath.split(path.sep).join("/");
}

export function normalizePrismaSqliteUrl(databaseUrl: string) {
  if (!databaseUrl.startsWith(SQLITE_FILE_PROTOCOL)) {
    return databaseUrl;
  }

  const sqliteTarget = databaseUrl.slice(SQLITE_FILE_PROTOCOL.length);

  if (sqliteTarget === ":memory:") {
    return MEMORY_DATABASE_URL;
  }

  const [sqlitePath, ...queryParts] = sqliteTarget.split("?");

  if (path.isAbsolute(sqlitePath)) {
    return databaseUrl;
  }

  const resolvedPath = path.resolve(process.cwd(), "prisma", sqlitePath);
  const relativePath = toPosixPath(path.relative(process.cwd(), resolvedPath));
  const normalizedPath = relativePath.startsWith(".")
    ? relativePath
    : `./${relativePath}`;
  const query = queryParts.length > 0 ? `?${queryParts.join("?")}` : "";

  return `${SQLITE_FILE_PROTOCOL}${normalizedPath}${query}`;
}

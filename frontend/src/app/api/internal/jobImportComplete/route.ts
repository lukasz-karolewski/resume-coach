import type { NextRequest } from "next/server";

const handler = (req: NextRequest) => {
  console.log("Hello from the jobImportComplete route!");
};

export { handler as GET, handler as POST };

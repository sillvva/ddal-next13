// src/server/db/client.ts
import { env } from "$src/env/server.mjs";

import { PrismaClient } from "@prisma/client";

declare global {
	var prisma: PrismaClient;
}

export const prisma =
	global.prisma ||
	new PrismaClient({
		// log: env.NODE_ENV !== "production" ? ["query"] : [],
	});

if (env.NODE_ENV !== "production") {
	global.prisma = prisma;
}

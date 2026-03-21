import { prisma } from "@/lib/prisma";

export default async function Home() {
  await prisma.$queryRaw`SELECT 1`;

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold">DB Connected ✅</h1>
    </main>
  );
}

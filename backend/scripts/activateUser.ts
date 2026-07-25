import { prisma } from '@/lib/prisma';

async function main() {
  const email = process.argv[2];
  if (!email) { console.error('Usage: tsx scripts/activateUser.ts <email>'); process.exit(1); }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) { console.error('User not found:', email); process.exit(2); }
  await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true, accountStatus: 'ACTIVE', emailVerifiedAt: new Date() } });
  console.log('User updated to active:', email);
}

main().catch((e) => { console.error(e); process.exit(99); });

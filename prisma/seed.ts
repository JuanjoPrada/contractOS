const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'ADMIN',
        },
    })

    const legal = await prisma.user.upsert({
        where: { email: 'legal@example.com' },
        update: {},
        create: {
            email: 'legal@example.com',
            name: 'Legal Team',
            role: 'LEGAL',
        },
    })

    console.log({ admin, legal })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })

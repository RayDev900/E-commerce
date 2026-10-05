import { prisma } from "./config/prisma.js"

async function main(){
    const user = await prisma.user.findUnique({
        where: {
            email: "test@example.com"
        }
    })
    console.log(user)
}

main()

async function Create(){
    const user = await prisma.user.create({
        data:{
            email: 'test@test.com',
            name: 'Usuario de prueba',
            password: '123456'  
        }
    })
    console.log(user)
}

Create()


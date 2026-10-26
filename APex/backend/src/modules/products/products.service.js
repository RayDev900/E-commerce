import prisma from "../../prisma/client.js";


//USER SERVICES
const getAllProducts = async () => {
    return await prisma.product.findMany();
}

const getProductByCategory = async (categoryId) => {
    const products = await prisma.product.findMany({
        where: { categoryId }
    });
    return products;
}

const getProductBySlug = async (slug) => {
    const product = await prisma.product.findUnique({
        where: { slug }
    });
    return product;
}

const getProductsBySpecs = async (specs) => {
    if (!specs || typeof specs !== "object" || Object.keys(specs).length === 0) {
        return await prisma.product.findMany();
    }

    const conditions = Object.entries(specs).map(([key, value]) => ({
        specs: {
            path: [key],
            equals: value
        }
    }));

    return await prisma.product.findMany({
        where: conditions.length === 1 ? conditions[0] : { AND: conditions }
    });
}


//ADMIN SERVICES
const createProduct = async (productData) => {
    const product = await prisma.product.create({
        data: productData
    });
    return product;
}

const updateProduct = async (productId, productData) => {
    const product = await prisma.product.update({
        where: { id: productId },
        data: productData
    });
    return product;
}

const deleteProduct = async (productId) => {
    const product = await prisma.product.delete({
        where: { id: productId }
    });
    return product;
}

export default {
    getAllProducts,
    getProductByCategory,
    getProductBySlug,
    getProductsBySpecs,
    createProduct,
    updateProduct,
    deleteProduct
}
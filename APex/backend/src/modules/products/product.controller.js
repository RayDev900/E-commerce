import * as productService from './product.service.js';

export const getAllProducts = async (req, res) => {
    try {
        const products = await productService.getAllProducts();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const getProductByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const products = await productService.getProductByCategory(category);
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export const getProductBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const product = await productService.getProductBySlug(slug);
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const getProductsBySpecs = async (req, res) => {
    try {
        const specs = req.query;
        const products = await productService.getProductsBySpecs(specs);
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const createProduct = async (req, res) => {
    try {
        const productData = req.body;
        const product = await productService.createProduct(productData);
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const productData = req.body;
        res.status(200).json(await productService.updateProduct(productId, productData));
    }catch(error){
        res.status(500).json({ error: error.message });
    }
}

export const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        res.status(200).json(await productService.deleteProduct(productId));
    }catch(error){
        res.status(500).json({ error: error.message });
    }
}
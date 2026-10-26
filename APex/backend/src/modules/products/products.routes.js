import { Router } from 'express';
import * as productController from './products.controller.js';

const productRouter = Router();

productRouter.get('/', productController.getAllProducts);
productRouter.get('/category/:category', productController.getProductByCategory);
productRouter.get('/slug/:slug', productController.getProductBySlug);
productRouter.get('/specs', productController.getProductsBySpecs);
productRouter.post('/', productController.createProduct);
productRouter.put('/:productId', productController.updateProduct);
productRouter.delete('/:productId', productController.deleteProduct);
const API_URL = import.meta.env.VITE_API_URL;

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Error en la petición');
  }
  return data;
}

export const getAllProducts = () => request('/products');

export const getProductsByCategory = (categoryId) =>
  request(`/products/category/${categoryId}`);

export const getProductBySlug = (slug) =>
  request(`/products/slug/${slug}`);

export const getProductsBySpecs = (specs) => {
  const query = new URLSearchParams(specs).toString();
  return request(`/products/specs?${query}`);
};

export const createProduct = (product) =>
  request('/products', { method: 'POST', body: JSON.stringify(product) });

export const updateProduct = (id, product) =>
  request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(product) });

export const deleteProduct = (id) =>
  request(`/products/${id}`, { method: 'DELETE' });
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Categorías de tecnología (idempotente por slug)
  const categorias = [
    { name: "Laptops", slug: "laptops", isActive: true },
    { name: "Desktops", slug: "desktops", isActive: true },
    { name: "Componentes", slug: "componentes", isActive: true },
    { name: "Periféricos", slug: "perifericos", isActive: true },
    { name: "Almacenamiento", slug: "almacenamiento", isActive: true },
    { name: "Monitores", slug: "monitores", isActive: true },
  ];

  for (const cat of categorias) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, isActive: cat.isActive },
      create: cat,
    });
  }

  // 2. Marcas de tecnología (idempotente por name)
  const marcas = [
    "ASUS",
    "MSI",
    "Gigabyte",
    "Corsair",
    "Samsung",
    "Western Digital",
    "Logitech",
    "Razer",
    "LG",
    "Dell",
  ];

  for (const name of marcas) {
    await prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name, slug: name.toLowerCase() },
    });
  }

  // Obtener referencias para conectar productos
  const catLaptops = await prisma.category.findUnique({ where: { slug: "laptops" } });
  const catDesktops = await prisma.category.findUnique({ where: { slug: "desktops" } });
  const catComponentes = await prisma.category.findUnique({ where: { slug: "componentes" } });
  const catPerifericos = await prisma.category.findUnique({ where: { slug: "perifericos" } });
  const catAlmacenamiento = await prisma.category.findUnique({ where: { slug: "almacenamiento" } });
  const catMonitores = await prisma.category.findUnique({ where: { slug: "monitores" } });

  const brandAsus = await prisma.brand.findUnique({ where: { name: "ASUS" } });
  const brandMsi = await prisma.brand.findUnique({ where: { name: "MSI" } });
  const brandGigabyte = await prisma.brand.findUnique({ where: { name: "Gigabyte" } });
  const brandCorsair = await prisma.brand.findUnique({ where: { name: "Corsair" } });
  const brandSamsung = await prisma.brand.findUnique({ where: { name: "Samsung" } });
  const brandWd = await prisma.brand.findUnique({ where: { name: "Western Digital" } });
  const brandLogitech = await prisma.brand.findUnique({ where: { name: "Logitech" } });
  const brandRazer = await prisma.brand.findUnique({ where: { name: "Razer" } });
  const brandLg = await prisma.brand.findUnique({ where: { name: "LG" } });
  const brandDell = await prisma.brand.findUnique({ where: { name: "Dell" } });

  // 3. Productos 100% tecnología (idempotente por SKU)
  const productos = [
    {
      sku: "ASUS-Z13-16-512",
      name: "ASUS Zenbook 13 OLED",
      slug: "asus-zenbook-13-oled",
      description: "Laptop ultraligera con pantalla OLED 2.8K, procesador Intel Core i7 y 16GB RAM",
      price: 850000,
      comparePrice: 950000,
      type: "PHYSICAL",
      categoryId: catLaptops.id,
      brandId: brandAsus.id,
      specs: {
        marca: "ASUS",
        modelo: "Zenbook 13 OLED",
        procesador: "Intel Core i7-1355U",
        ram: "16GB LPDDR5",
        almacenamiento: "512GB SSD NVMe",
        pantalla: "13.3 pulgadas OLED 2.8K",
        sistemaOperativo: "Windows 11 Home",
        peso: "1.10 kg",
      },
      isActive: true,
      isFeatured: true,
      images: [
        { url: "https://ejemplo.com/imagenes/asus-zenbook-13-1.jpg", altText: "ASUS Zenbook 13 OLED frontal", sortOrder: 1, isPrimary: true },
        { url: "https://ejemplo.com/imagenes/asus-zenbook-13-2.jpg", altText: "ASUS Zenbook 13 OLED teclado", sortOrder: 2, isPrimary: false },
      ],
      inventory: { quantity: 25, reserved: 0, minStock: 5 },
    },
    {
      sku: "MSI-GF63-16-1TB",
      name: "MSI GF63 Thin Gaming",
      slug: "msi-gf63-thin-gaming",
      description: "Laptop gamer con tarjeta de video NVIDIA RTX 3050, ideal para gaming y diseño",
      price: 720000,
      comparePrice: 800000,
      type: "PHYSICAL",
      categoryId: catLaptops.id,
      brandId: brandMsi.id,
      specs: {
        marca: "MSI",
        modelo: "GF63 Thin",
        procesador: "Intel Core i5-12450H",
        ram: "16GB DDR4",
        almacenamiento: "1TB SSD NVMe",
        tarjetaVideo: "NVIDIA GeForce RTX 3050 4GB",
        pantalla: "15.6 pulgadas Full HD 144Hz",
        sistemaOperativo: "Windows 11 Home",
      },
      isActive: true,
      isFeatured: true,
      images: [
        { url: "https://ejemplo.com/imagenes/msi-gf63-1.jpg", altText: "MSI GF63 Thin Gaming", sortOrder: 1, isPrimary: true },
      ],
      inventory: { quantity: 15, reserved: 2, minStock: 3 },
    },
    {
      sku: "DELL-XPS-32-1TB",
      name: "Dell XPS 15",
      slug: "dell-xps-15",
      description: "Laptop premium para profesionales con pantalla 3.5K OLED y procesador Intel Core i9",
      price: 1450000,
      comparePrice: 1550000,
      type: "PHYSICAL",
      categoryId: catLaptops.id,
      brandId: brandDell.id,
      specs: {
        marca: "Dell",
        modelo: "XPS 15",
        procesador: "Intel Core i9-13900H",
        ram: "32GB LPDDR5",
        almacenamiento: "1TB SSD NVMe",
        pantalla: "15.6 pulgadas 3.5K OLED Touch",
        sistemaOperativo: "Windows 11 Pro",
      },
      isActive: true,
      isFeatured: false,
      images: [
        { url: "https://ejemplo.com/imagenes/dell-xps-15-1.jpg", altText: "Dell XPS 15", sortOrder: 1, isPrimary: true },
      ],
      inventory: { quantity: 10, reserved: 1, minStock: 2 },
    },
    {
      sku: "ASUS-ROG-STRIX-32-2TB",
      name: "ASUS ROG Strix G16",
      slug: "asus-rog-strix-g16",
      description: "Laptop gamer de alto rendimiento con RTX 4060 y pantalla 240Hz",
      price: 1100000,
      comparePrice: 1200000,
      type: "PHYSICAL",
      categoryId: catLaptops.id,
      brandId: brandAsus.id,
      specs: {
        marca: "ASUS",
        modelo: "ROG Strix G16",
        procesador: "Intel Core i7-13650HX",
        ram: "32GB DDR5",
        almacenamiento: "2TB SSD NVMe",
        tarjetaVideo: "NVIDIA GeForce RTX 4060 8GB",
        pantalla: "16 pulgadas QHD+ 240Hz",
        sistemaOperativo: "Windows 11 Home",
      },
      isActive: true,
      isFeatured: true,
      images: [
        { url: "https://ejemplo.com/imagenes/rog-strix-g16-1.jpg", altText: "ASUS ROG Strix G16", sortOrder: 1, isPrimary: true },
      ],
      inventory: { quantity: 12, reserved: 0, minStock: 3 },
    },
    {
      sku: "MSI-MAG-32-1TB",
      name: "PC Desktop MSI MAG Infinite",
      slug: "msi-mag-infinite",
      description: "PC de escritorio gaming con procesador AMD Ryzen 7 y RTX 4070",
      price: 950000,
      comparePrice: 1050000,
      type: "PHYSICAL",
      categoryId: catDesktops.id,
      brandId: brandMsi.id,
      specs: {
        marca: "MSI",
        modelo: "MAG Infinite S3",
        procesador: "AMD Ryzen 7 7700",
        ram: "32GB DDR5",
        almacenamiento: "1TB SSD NVMe",
        tarjetaVideo: "NVIDIA GeForce RTX 4070 12GB",
        fuente: "650W 80+ Bronze",
        sistemaOperativo: "Windows 11 Home",
      },
      isActive: true,
      isFeatured: true,
      images: [
        { url: "https://ejemplo.com/imagenes/msi-mag-infinite-1.jpg", altText: "PC Desktop MSI MAG Infinite", sortOrder: 1, isPrimary: true },
      ],
      inventory: { quantity: 8, reserved: 0, minStock: 2 },
    },
    {
      sku: "GIGABYTE-RTX4070-12G",
      name: "Tarjeta de Video Gigabyte RTX 4070",
      slug: "gigabyte-rtx-4070-12g",
      description: "Tarjeta gráfica para gaming y renderizado con 12GB VRAM y arquitectura Ada Lovelace",
      price: 580000,
      comparePrice: 620000,
      type: "PHYSICAL",
      categoryId: catComponentes.id,
      brandId: brandGigabyte.id,
      specs: {
        marca: "Gigabyte",
        modelo: "RTX 4070 Windforce",
        memoria: "12GB GDDR6X",
        interfaz: "PCIe 4.0 x16",
        puertos: "3x DisplayPort 1.4a, 1x HDMI 2.1a",
        consumo: "200W",
        largo: "245 mm",
      },
      isActive: true,
      isFeatured: false,
      images: [
        { url: "https://ejemplo.com/imagenes/gigabyte-rtx4070-1.jpg", altText: "Gigabyte RTX 4070", sortOrder: 1, isPrimary: true },
      ],
      inventory: { quantity: 20, reserved: 3, minStock: 5 },
    },
    {
      sku: "CORSAIR-VENGEANCE-32GB",
      name: "Memoria RAM Corsair Vengeance 32GB DDR5",
      slug: "corsair-vengeance-32gb-ddr5",
      description: "Kit de memoria RAM DDR5 6000MHz para PC de escritorio y laptops compatibles",
      price: 120000,
      comparePrice: 140000,
      type: "PHYSICAL",
      categoryId: catComponentes.id,
      brandId: brandCorsair.id,
      specs: {
        marca: "Corsair",
        modelo: "Vengeance DDR5",
        capacidad: "32GB (2x16GB)",
        velocidad: "6000MHz",
        tipo: "DDR5 DIMM",
        latencia: "CL30",
        voltaje: "1.25V",
      },
      isActive: true,
      isFeatured: false,
      images: [
        { url: "https://ejemplo.com/imagenes/corsair-vengeance-32gb-1.jpg", altText: "Corsair Vengeance 32GB DDR5", sortOrder: 1, isPrimary: true },
      ],
      inventory: { quantity: 45, reserved: 0, minStock: 10 },
    },
    {
      sku: "SAMSUNG-990PRO-2TB",
      name: "SSD Samsung 990 Pro 2TB",
      slug: "samsung-990-pro-2tb",
      description: "Unidad de estado sólido NVMe M.2 con velocidades de hasta 7450 MB/s de lectura",
      price: 180000,
      comparePrice: 200000,
      type: "PHYSICAL",
      categoryId: catAlmacenamiento.id,
      brandId: brandSamsung.id,
      specs: {
        marca: "Samsung",
        modelo: "990 PRO",
        capacidad: "2TB",
        interfaz: "PCIe 4.0 x4, NVMe 2.0",
        factorForma: "M.2 2280",
        lecturaSecuencial: "Hasta 7450 MB/s",
        escrituraSecuencial: "Hasta 6900 MB/s",
      },
      isActive: true,
      isFeatured: false,
      images: [
        { url: "https://ejemplo.com/imagenes/samsung-990pro-2tb-1.jpg", altText: "SSD Samsung 990 Pro 2TB", sortOrder: 1, isPrimary: true },
      ],
      inventory: { quantity: 35, reserved: 0, minStock: 8 },
    },
    {
      sku: "WD-BLACK-4TB",
      name: "Disco Duro WD Black 4TB",
      slug: "wd-black-4tb",
      description: "Disco duro interno para escritorio con caché de 256MB, ideal para almacenamiento masivo",
      price: 95000,
      comparePrice: 110000,
      type: "PHYSICAL",
      categoryId: catAlmacenamiento.id,
      brandId: brandWd.id,
      specs: {
        marca: "Western Digital",
        modelo: "Black",
        capacidad: "4TB",
        interfaz: "SATA III 6Gb/s",
        velocidad: "7200 RPM",
        cache: "256MB",
        factorForma: "3.5 pulgadas",
      },
      isActive: true,
      isFeatured: false,
      images: [
        { url: "https://ejemplo.com/imagenes/wd-black-4tb-1.jpg", altText: "Disco Duro WD Black 4TB", sortOrder: 1, isPrimary: true },
      ],
      inventory: { quantity: 30, reserved: 0, minStock: 6 },
    },
    {
      sku: "LOGITECH-G502",
      name: "Mouse Logitech G502 Hero",
      slug: "logitech-g502-hero",
      description: "Mouse gamer con sensor HERO 25K, 11 botones programables y peso ajustable",
      price: 45000,
      comparePrice: 55000,
      type: "PHYSICAL",
      categoryId: catPerifericos.id,
      brandId: brandLogitech.id,
      specs: {
        marca: "Logitech",
        modelo: "G502 Hero",
        sensor: "HERO 25K",
        dpi: "Hasta 25600 DPI",
        botones: "11 programables",
        conectividad: "USB con cable",
        peso: "Ajustable con pesas de 3.6g cada una",
      },
      isActive: true,
      isFeatured: false,
      images: [
        { url: "https://ejemplo.com/imagenes/logitech-g502-1.jpg", altText: "Mouse Logitech G502 Hero", sortOrder: 1, isPrimary: true },
      ],
      inventory: { quantity: 60, reserved: 5, minStock: 15 },
    },
    {
      sku: "RAZER-BLACKWIDOW",
      name: "Teclado Razer BlackWidow V4",
      slug: "razer-blackwidow-v4",
      description: "Teclado mecánico gamer con switches Razer Green, iluminación RGB y teclas programables",
      price: 130000,
      comparePrice: 150000,
      type: "PHYSICAL",
      categoryId: catPerifericos.id,
      brandId: brandRazer.id,
      specs: {
        marca: "Razer",
        modelo: "BlackWidow V4",
        switches: "Razer Green Mecánicos",
        iluminación: "RGB Chroma",
        conectividad: "USB con cable",
        distribucion: "Español Latinoamérica",
      },
      isActive: true,
      isFeatured: false,
      images: [
        { url: "https://ejemplo.com/imagenes/razer-blackwidow-v4-1.jpg", altText: "Teclado Razer BlackWidow V4", sortOrder: 1, isPrimary: true },
      ],
      inventory: { quantity: 40, reserved: 2, minStock: 8 },
    },
    {
      sku: "LG-27GN950",
      name: "Monitor LG UltraGear 27\" 4K",
      slug: "lg-27gn950",
      description: "Monitor gamer 4K UHD con Nano IPS, 144Hz y tiempo de respuesta de 1ms",
      price: 420000,
      comparePrice: 480000,
      type: "PHYSICAL",
      categoryId: catMonitores.id,
      brandId: brandLg.id,
      specs: {
        marca: "LG",
        modelo: "27GN950-B",
        tamaño: "27 pulgadas",
        resolucion: "4K UHD (3840x2160)",
        panel: "Nano IPS",
        frecuencia: "144Hz",
        tiempoRespuesta: "1ms GtG",
        conectividad: "HDMI 2.1, DisplayPort 1.4, USB-C",
      },
      isActive: true,
      isFeatured: true,
      images: [
        { url: "https://ejemplo.com/imagenes/lg-27gn950-1.jpg", altText: "Monitor LG UltraGear 27 4K", sortOrder: 1, isPrimary: true },
      ],
      inventory: { quantity: 18, reserved: 1, minStock: 4 },
    },
  ];

  for (const p of productos) {
    const { images, inventory, ...productData } = p;

    const product = await prisma.product.upsert({
      where: { sku: productData.sku },
      update: {
        name: productData.name,
        slug: productData.slug,
        description: productData.description,
        price: productData.price,
        comparePrice: productData.comparePrice,
        type: productData.type,
        categoryId: productData.categoryId,
        brandId: productData.brandId,
        specs: productData.specs,
        isActive: productData.isActive,
        isFeatured: productData.isFeatured,
      },
      create: productData,
    });

    // Reemplazar imágenes del producto (idempotente)
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: images.map((img) => ({ ...img, productId: product.id })),
    });

    // Reemplazar inventario del producto (idempotente)
    await prisma.inventory.deleteMany({ where: { productId: product.id } });
    await prisma.inventory.create({
      data: {
        productId: product.id,
        ...inventory,
      },
    });
  }

  console.log("Seed de productos de tecnología completado exitosamente");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

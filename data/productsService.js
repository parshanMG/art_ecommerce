async function fetchProducts() {
    const response = await fetch("data/products.json", { cache: "no-store" });

    if (!response.ok) {
        throw new Error(`Failed to load products.json: ${response.status}`);
    }

    const products = await response.json();

    if (!Array.isArray(products)) {
        throw new Error("Invalid products payload. Expected an array.");
    }

    return products;
}

function getFeaturedProducts(products) {
    return products.filter((product) => product.available && product.featured);
}

window.productsService = {
    fetchProducts,
    getFeaturedProducts,
};

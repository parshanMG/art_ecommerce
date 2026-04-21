import { useEffect, useMemo, useState } from "react";
import { fetchProducts, getFeaturedProducts } from "../services/productsService";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

export default function FeaturedProductsCarousel() {
  const [products, setProducts] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        const allProducts = await fetchProducts();
        const featuredProducts = getFeaturedProducts(allProducts);

        if (isMounted) {
          setProducts(featuredProducts);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || "Failed to load products.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const pageSize = 3;
  const pages = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < products.length; i += pageSize) {
      chunks.push(products.slice(i, i + pageSize));
    }
    return chunks;
  }, [products]);

  const goNext = () => {
    if (!pages.length) return;
    setPageIndex((prev) => (prev + 1) % pages.length);
  };

  const goPrev = () => {
    if (!pages.length) return;
    setPageIndex((prev) => (prev - 1 + pages.length) % pages.length);
  };

  if (isLoading) {
    return <div className="text-center py-10 text-gray-600">Loading featured products...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  if (!products.length) {
    return <div className="text-center py-10 text-gray-600">No featured products available right now.</div>;
  }

  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold">Featured Products</h2>
      </div>

      <div className="flex items-center justify-center gap-3 md:gap-6">
        <button
          type="button"
          aria-label="Previous featured products"
          onClick={goPrev}
          className="shrink-0 w-10 h-10 md:w-12 md:h-12 hover:bg-gray-200 transition rounded-full flex items-center justify-center"
        >
          <img
            src="/images/Icons/arrow_back_ios_new_60dp_BLACK_FILL0_wght400_GRAD0_opsz48.png"
            alt="Previous"
            className="w-5 h-5 md:w-6 md:h-6"
          />
        </button>

        <div className="overflow-hidden flex-1">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${pageIndex * 100}%)` }}
          >
            {pages.map((page, idx) => (
              <div key={idx} className="w-full shrink-0 flex flex-col md:flex-row gap-6 md:gap-8">
                {page.map((product) => (
                  <article key={product.id} className="group flex-1 [perspective:1000px]">
                    <div className="relative h-80 md:h-96 w-full transition-transform duration-700 ease-in-out [transition-delay:0ms] [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] group-hover:[transition-delay:500ms]">

                      {/* Front — image with title/price overlay */}
                      <div className="absolute inset-0 rounded-xl overflow-hidden [backface-visibility:hidden]">
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/65 to-transparent px-5 py-4">
                          <h3 className="text-white text-lg font-semibold leading-tight">{product.title}</h3>
                          <p className="text-white/80 text-sm mt-0.5">{formatCurrency(product.price)}</p>
                        </div>
                      </div>

                      {/* Back — product details + add to basket */}
                      <div className="absolute inset-0 rounded-xl overflow-hidden bg-gray-50 px-6 py-7 flex flex-col justify-between [backface-visibility:hidden] [transform:rotateY(180deg)]">
                        <div>
                          <h3 className="text-xl font-semibold text-black mb-4 leading-snug">{product.title}</h3>
                          <dl className="space-y-2 text-sm">
                            {product.dimensions && (
                              <div className="flex gap-2">
                                <dt className="font-medium text-gray-800 w-16 shrink-0">Size</dt>
                                <dd className="text-gray-600">{product.dimensions}</dd>
                              </div>
                            )}
                            {product.medium && (
                              <div className="flex gap-2">
                                <dt className="font-medium text-gray-800 w-16 shrink-0">Medium</dt>
                                <dd className="text-gray-600">{product.medium}</dd>
                              </div>
                            )}
                            {product.year && (
                              <div className="flex gap-2">
                                <dt className="font-medium text-gray-800 w-16 shrink-0">Year</dt>
                                <dd className="text-gray-600">{product.year}</dd>
                              </div>
                            )}
                          </dl>
                          <p className="mt-5 text-xl font-semibold text-black">{formatCurrency(product.price)}</p>
                        </div>
                        <button className="w-full bg-black hover:bg-[#800020] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition">
                          Add to Basket +
                        </button>
                      </div>

                    </div>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          aria-label="Next featured products"
          onClick={goNext}
          className="shrink-0 w-10 h-10 md:w-12 md:h-12 hover:bg-gray-200 transition rounded-full flex items-center justify-center"
        >
          <img
            src="/images/Icons/arrow_forward_ios_60dp_BLACK_FILL0_wght400_GRAD0_opsz48.png"
            alt="Next"
            className="w-5 h-5 md:w-6 md:h-6"
          />
        </button>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {pages.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setPageIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`w-2.5 h-2.5 rounded-full transition ${idx === pageIndex ? "bg-black" : "bg-gray-300"}`}
          />
        ))}
      </div>
    </div>
  );
}

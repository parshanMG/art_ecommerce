import { useEffect, useState } from "react";
import { fetchProducts } from "../services/productsService";

export default function Shop() {
	const [products, setProducts] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		let active = true;
		fetchProducts()
			.then((data) => {
				if (active) setProducts(data.filter((p) => p.available));
			})
			.catch((err) => {
				if (active) setError(err.message || "Failed to load products.");
			})
			.finally(() => {
				if (active) setIsLoading(false);
			});
		return () => { active = false; };
	}, []);

	return (
		<main className="min-h-screen relative bg-white pt-28 pb-16">
			<section className="mx-auto w-full max-w-7xl px-6 md:px-10 xl:px-16">
				<div className="mb-10 border-b border-gray-200 pb-6">
					<p className="text-sm uppercase tracking-[0.3em] text-[#800020]">Shop</p>
					<h1 className="mt-3 text-4xl font-semibold text-black">All Artwork</h1>
					<p className="mt-4 max-w-2xl text-base text-gray-600">
						Browse the full collection of original paintings and limited-edition prints.
					</p>
				</div>
			</section>

			<section className="relative z-10 mx-auto w-full max-w-7xl px-6 md:px-10 xl:px-16">
				{isLoading && <p className="text-center text-gray-500">Loading…</p>}
				{error && <p className="text-center text-red-600">{error}</p>}

				<div className="flex flex-col gap-1 md:flex-row">
					{/* Left column */}
					<div className="flex flex-1 flex-col gap-1">
						{products.filter((_, i) => i % 2 === 0).map((product) => (
							<article
								key={product.id}
								className="group relative w-full max-w-[34rem] mx-auto overflow-hidden rounded-2xl shadow-sm"
							>
								<img
									src={product.image}
									alt={product.title}
									className="h-[46rem] w-full object-cover transition duration-300 group-hover:brightness-50"
								/>

								<div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/75 via-black/35 to-transparent p-6 opacity-0 transition duration-300 group-hover:opacity-100">
									<div className="pointer-events-auto w-full text-white">
										<div className="mb-4">
											<p className="text-2xl font-semibold">{product.title}</p>
											<p className="mt-1 text-sm text-white/90">Size: {product.dimensions}</p>
											<p className="text-sm text-white/90">Type: {product.medium}</p>
											<p className="mt-1 text-base font-medium">${product.price.toFixed(2)}</p>
										</div>

										<div className="flex flex-wrap gap-2">
											<button className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium ring-1 ring-white/50 transition hover:bg-[#800020]">
												Buy Now
											</button>
											<button className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium ring-1 ring-white/50 transition hover:bg-[#800020]">
												Add to Basket +
											</button>
											<a
												href={`/enquiry?product=${product.id}`}
												className="rounded-lg bg-white/10 px-4 py-2 text-center text-sm font-medium ring-1 ring-white/50 transition hover:bg-[#800020]"
											>
												Enquire
											</a>
										</div>
									</div>
								</div>
							</article>
						))}
					</div>

					{/* Right column — offset down */}
					<div className="flex flex-1 flex-col gap-1 md:mt-[14rem]">
						{products.filter((_, i) => i % 2 === 1).map((product) => (
							<article
								key={product.id}
								className="group relative w-full max-w-[34rem] mx-auto overflow-hidden rounded-2xl shadow-sm"
							>
								<img
									src={product.image}
									alt={product.title}
									className="h-[46rem] w-full object-cover transition duration-300 group-hover:brightness-50"
								/>

								<div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/75 via-black/35 to-transparent p-6 opacity-0 transition duration-300 group-hover:opacity-100">
									<div className="pointer-events-auto w-full text-white">
										<div className="mb-4">
											<p className="text-2xl font-semibold">{product.title}</p>
											<p className="mt-1 text-sm text-white/90">Size: {product.dimensions}</p>
											<p className="text-sm text-white/90">Type: {product.medium}</p>
											<p className="mt-1 text-base font-medium">${product.price.toFixed(2)}</p>
										</div>

										<div className="flex flex-wrap gap-2">
											<button className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium ring-1 ring-white/50 transition hover:bg-[#800020]">
												Buy Now
											</button>
											<button className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium ring-1 ring-white/50 transition hover:bg-[#800020]">
												Add to Basket +
											</button>
											<a
												href={`/enquiry?product=${product.id}`}
												className="rounded-lg bg-white/10 px-4 py-2 text-center text-sm font-medium ring-1 ring-white/50 transition hover:bg-[#800020]"
											>
												Enquire
											</a>
										</div>
									</div>
								</div>
							</article>
						))}
					</div>
				</div>
			</section>

		</main>
	);
}

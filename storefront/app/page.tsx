import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f9fafb] text-[#121516]">
      {/* Top Announcement Bar */}
      <div className="bg-[#0f2e23] text-white text-xs font-medium py-2 px-4 text-center tracking-wider">
        <span className="text-[#f48d42] font-semibold">SPRING 2026 EXPEDITION:</span> Complimentary shipping on alpine gear orders over $150.
      </div>

      {/* Main Navigation */}
      <header className="border-b border-gray-200 bg-white/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-10">
            <Link href="/" className="flex items-center space-x-3 group">
              <span className="w-10 h-10 rounded-lg bg-[#0f2e23] text-white flex items-center justify-center font-bold text-xl shadow-md group-hover:bg-[#1b4d3e] transition">
                ✦
              </span>
              <div>
                <span className="text-xl font-black tracking-tight block uppercase text-[#0f2e23]">Northstar</span>
                <span className="text-[10px] tracking-widest uppercase text-gray-500 font-semibold block -mt-1">Outfitters</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-gray-700">
              <Link href="/catalog" className="hover:text-[#e06d20] transition">Catalog</Link>
              <Link href="/categories/mountaineering" className="hover:text-[#e06d20] transition">Mountaineering</Link>
              <Link href="/categories/backpacking" className="hover:text-[#e06d20] transition">Backpacking</Link>
              <Link href="/landings/winter-summit-2026" className="text-[#e06d20] font-bold transition hover:opacity-80">Campaigns</Link>
            </nav>
          </div>

          <div className="flex items-center space-x-6">
            <Link
              href="https://github.com"
              target="_blank"
              className="hidden sm:inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-300 text-gray-700 hover:border-gray-900 transition"
            >
              Arch Docs Pack ↗
            </Link>
            <div className="relative">
              <button className="flex items-center space-x-2 text-sm font-semibold bg-[#f3f4f6] px-4 py-2 rounded-lg hover:bg-gray-200 transition">
                <span>Cart</span>
                <span className="w-5 h-5 rounded-full bg-[#e06d20] text-white text-xs flex items-center justify-center font-bold">0</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-[#0f2e23] text-white overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#e06d20_1px,transparent_1px)] [background-size:24px_24px]" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-2xl">
            <span className="inline-block uppercase tracking-widest text-xs font-bold text-[#f48d42] mb-4 bg-white/10 px-3 py-1 rounded-md backdrop-blur-sm">
              Alpine Proven • 2026 Season
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] mb-6">
              Engineered for the Edge of the Map.
            </h1>
            <p className="text-gray-300 text-lg sm:text-xl font-normal leading-relaxed mb-8">
              Technical mountaineering equipment, ultralight expedition tents, and weather-defying outerwear designed without compromise.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/catalog"
                className="bg-[#e06d20] text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:bg-[#c25e1a] transition transform hover:-translate-y-0.5"
              >
                Explore Alpine Gear
              </Link>
              <Link
                href="/landings/winter-summit-2026"
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-xl backdrop-blur-sm transition border border-white/20"
              >
                View Expedition Guide
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Architectural Portfolio Highlight Banner */}
      <section className="bg-white border-y border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-[#f9fafb] border border-gray-200 rounded-2xl p-8 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <span className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-[#1b4d3e] bg-[#3b9b7d]/10 px-3 py-1 rounded-full mb-3">
                Portfolio Architecture Showcase
              </span>
              <h2 className="text-2xl font-black text-[#0f2e23]">Headless E-Commerce System Architecture</h2>
              <p className="text-gray-600 text-sm mt-2 max-w-2xl">
                Powered by a <strong>Spring Boot 3 / Java 21 Modular Monolith</strong> with Hexagonal boundaries (verified via ArchUnit) and a high-performance <strong>Next.js 15 App Router</strong> storefront.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="text-xs font-mono font-semibold bg-white border border-gray-300 px-3 py-1.5 rounded-md shadow-sm">
                Next.js 16 + React 19
              </span>
              <span className="text-xs font-mono font-semibold bg-white border border-gray-300 px-3 py-1.5 rounded-md shadow-sm">
                Hexagonal Monolith
              </span>
              <span className="text-xs font-mono font-semibold bg-white border border-gray-300 px-3 py-1.5 rounded-md shadow-sm">
                ArchUnit Enforced
              </span>
              <span className="text-xs font-mono font-semibold bg-white border border-gray-300 px-3 py-1.5 rounded-md shadow-sm">
                PostgreSQL 16 Multi-Schema
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories Grid */}
      <section className="py-20 max-w-7xl mx-auto px-6 flex-1">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl font-black text-[#0f2e23] tracking-tight">Expedition Categories</h2>
            <p className="text-gray-600 text-sm mt-1">Field-tested gear categories designed for extreme conditions.</p>
          </div>
          <Link href="/catalog" className="text-sm font-bold text-[#e06d20] hover:underline">
            View All Categories →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="group rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="h-48 bg-gradient-to-tr from-[#0f2e23] to-[#2d7a62] p-8 flex flex-col justify-end text-white">
              <span className="text-xs font-bold tracking-widest uppercase opacity-80">Category 01</span>
              <h3 className="text-2xl font-black">Mountaineering</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">Ice axes, 4-season alpine tents, and crampons engineered for high-altitude summits.</p>
              <Link href="/categories/mountaineering" className="text-xs font-bold uppercase tracking-wider text-[#0f2e23] group-hover:text-[#e06d20] transition">
                Explore Range →
              </Link>
            </div>
          </div>

          <div className="group rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="h-48 bg-gradient-to-tr from-[#1b4d3e] to-[#3a4043] p-8 flex flex-col justify-end text-white">
              <span className="text-xs font-bold tracking-widest uppercase opacity-80">Category 02</span>
              <h3 className="text-2xl font-black">Ultralight Backpacking</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">Sub-2lb shelter systems, down sleeping bags, and dyneema composite trail packs.</p>
              <Link href="/categories/backpacking" className="text-xs font-bold uppercase tracking-wider text-[#0f2e23] group-hover:text-[#e06d20] transition">
                Explore Range →
              </Link>
            </div>
          </div>

          <div className="group rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="h-48 bg-gradient-to-tr from-[#c25e1a] to-[#f48d42] p-8 flex flex-col justify-end text-white">
              <span className="text-xs font-bold tracking-widest uppercase opacity-80">Category 03</span>
              <h3 className="text-2xl font-black">Weather Defense</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">3-layer hard shells, seam-taped GORE-TEX storm gear, and thermal mid-layers.</p>
              <Link href="/categories/apparel" className="text-xs font-bold uppercase tracking-wider text-[#0f2e23] group-hover:text-[#e06d20] transition">
                Explore Range →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#121516] text-gray-400 py-16 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center space-x-3">
            <span className="text-2xl text-[#f48d42]">✦</span>
            <span className="text-lg font-bold text-white tracking-wider uppercase">Northstar Outfitters</span>
          </div>
          <p className="text-xs text-center md:text-right">
            Architected & Built as an Enterprise Portfolio Showcase. Designed with Hexagonal Architecture & Next.js.
          </p>
        </div>
      </footer>
    </div>
  );
}

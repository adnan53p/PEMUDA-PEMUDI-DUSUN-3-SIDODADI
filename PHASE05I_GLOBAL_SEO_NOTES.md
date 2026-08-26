# Phase 05I — Global SEO

Perubahan:
- SEO global dan per halaman publik dapat diedit Superadmin dari Konten Website.
- Runtime metadata: title, description, keywords, canonical, Open Graph, Twitter Card.
- Organization JSON-LD schema.
- SEO detail Lima Bidang tetap memakai data per bidang dari Phase 05H.
- robots.txt dan sitemap.xml ditambahkan untuk domain pemudadusun3.my.id.
- Default OG image memakai URL yang diatur Superadmin; jika kosong memakai foto hero.

Catatan teknis:
- Tidak memerlukan migration SQL baru jika tabel `public_site_content` Phase 05H sudah aktif, karena SEO disimpan di JSON `homepage_managed` yang sama.
- Metadata per route diubah client-side. Google modern dapat merender JavaScript, tetapi preview sosial tertentu dapat membaca metadata awal `index.html`; untuk preview per-route yang benar-benar server-side diperlukan SSR/prerender di fase terpisah.

# Pendahuluan
Aplikasi terdiri dari dua bagian:

### A. Inti
Berisi layout utama dan komponen-komponen yang digunakan pada isi. Bagian inti terdiri dari:

1. index.html
2. script
3. style
4. library

### B. Isi
Berisi halaman-halaman konten aplikasi. Berkas part ada di /app/parts. Terdiri dari:

1. layout file
2. script
3. style

# Terminologi
## `Part`
Part adalah bagian bagian yang dapat dimuat secara opsional oleh aplikasi. Digunakan untuk menggenerate View.
## `View`
View digenerate dari suatu Part, dengan parameter yang diberikan oleh suatu Menu. View inilah yang akhirnya akan menjadi halaman-halaman yang dapat dilihat oleh user.
## `Menu`
Titik yang digunakan untuk navigasi aplikasi. Top menu berada paling atas. Setiap top menu memiliki submenu, yang berada di sebelah kiri. Menu terhubung dengan sebuah View.

## `Input`
Komponen-komponen dalam aplikasi yang dapat diambil datanya atau di ubah datanya. Semua input harus memngimplementasi interface `app.IInput`.
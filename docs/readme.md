# Develop WMS client app

### Semua path di dokumen ini berada relatif terhadap path *{SOURCE}/app* !!

## Setup
1. Buka source code, masuk ke folder /app. Pastikan berkas package.json ada dalam folder tersebut.
2. Buka cmd, jalankan `npm -v`. Jika command tidak ditemukan, silahkan install nodejs terlebih dahulu. [https://nodejs.org/](https://nodejs.org/).
	
3. Jalankan `npm install`, tunggu sampai proses selesai.
4. Install typescript compiler, dengan menjalankan `npm install -g typescript`
5. Install sass compiler,degan menjalankan `npm install -g node-sass`
6. Install gulp, dengan menjalankan `npm install -g gulp`
7. Jalankan `gulp dev`
8. Untuk proses development, program bisa langsung dijalankan dari URL /app/app.

## Developing
Pada saat development, untuk melihat hasil perubahan pada script secara cepat, ikuti langkah di bawah. Untuk tahap produksi, app harus di build!
1. Berdoa. Pastikan anda berada pada folder di mana terdapat gulpfile.js dan package.json!
2. Kompilasi otomatis dapat dilakukan dengan menjalankan `gulp watch` agar setiap file typescript dan scss otomatis ter-*compile*.
3. Kadang kompilasi otomatis memakan waktu yang cukup lama. Jika ingin meng-*compile* dengan cepat, dapat menggunakan cara berikut:

    a. Jika perubahan pada script part (ada dalam /app/parts/ts/**/*.ts). Kompilasi dapat dilakukan utuk tiap berkas. Misalkan berkas yang akan dikompilasi adalah /app/parts/ts/sample.ts, maka jalankan
    ```
    tsc --outDir app/parts/_ app/parts/ts/sample.ts
    ```

    b. Jika perubahan pada style part (ada dalam /app/parts/scss/**/*.scss). Kompilasi dapat dilakukan untuk tiap berkas. Misalkan berkas yang akan dikompilasi adalah /app/parts/scss/sample.scss, maka jalankan
    ```
    node-sass -o app/parts/_/css app/parts/scss/sample.scss
    ```

    c. Jika perubahan dalam berkas script utama aplikasi (berkas yang ada dalam _/app/scripts/**/*.ts_), namun susunan berkas tetap (tidak ada penambahan, penghapusan atu perubahan nama berkas), jalankan script berikut untuk melakukan kompilasi.
    ```
    tsc -p app/scripts/ts/tsconfig.json
    ```
    
    d. Jika terdapat penambahan, penghapusan atau perubahan nama pada berkas-berkas pada _/app/scripts/**/*.ts_. Harus diperbaharui juga daftar referensi pada berkas /app/scripts/app.d.ts. Proses ini dapat dilakukan langsung pada berkas tersebut atau dengan menjalankan:
    ```
    gulp script:ref
    ```
    
    c. Jika perubahan pada style utama aplikasi (ada dalam /app/styles/**/*.scss)
    ```
    node-sass -o app/styles app/styles/scss/app.scss
    ```
    
    

## Build
1. Jalankan `gulp build`. Hasil build ada pada folder ../wms/public
2. Jalankan web server, kemudian browse URL ../wms/public.


## Referensi	
* [What is NPM package manager](http://www.tutorialspoint.com/nodejs/nodejs_npm.htm)
* [gulpjs.com](http://gulpjs.com/)

## Installing node (Linux)
Lihat [https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-a-centos-7-server](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-a-centos-7-server)
* `curl https://raw.githubusercontent.com/creationix/nvm/v0.13.1/install.sh | bash`
* `source ~/.bash_profile`
* `nvm install 6.3.1`
* Cek dengan menjalankan `npm -v`
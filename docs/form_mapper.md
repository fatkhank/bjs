# Pendahuluan
Form Mapper digunakan untuk memetakan suatu HTLMElemen ke suatu form. Form dapat berisi kumpulan Input, variabel, atau fungsi-fungsi yang digunakan untuk mengatur perilaku form tersebut. 

Mapper dapat digunakan untuk mengisi suatu data json ke input-input pada form, atau mengekstrak data dari form.

# Membuat mapper

```
var mapper = app.ui.mapper(mapperFunction, validationFunction);
```

mapperFunction merupakan fungsi yang akan memetakan suatu HTMLElement ke input-input pada elemen tersebut dengan struktur tertentu. Struktur inilah, yang nanti akan digunakan untuk menentukan struktur data hasil ekstrasi dari form.

validationFunction digunakan untuk melakukan validasi terhadap form.


Contoh:
```
var mapperPerson = app.ui.mapper(function(elm){
    return {
        id: 0,
        age: ui.inputFloat(app.s(elm, '.input_age')),
        name: {
            first: ui.inputField(app.s(elm, '.input_first_name')),
            last: ui.inputField(app.s(elm, '.input_last_name')),
        }
    };
});
```

# Mengambil form yang terikat pada suatu HTMLElement
```
var form = mapper.get(suatuElm);
```
Dengan mengambil suatu form, kita dapat mengatur perilaku dari form tersebut. Contoh:
```
var formPerson = mapperPerson.get(suatuElm);
formPerson.id;            //mendapatkan id
formPerson.name.first;    //tipe ui.InputField
formPerson.name.first.enable(false); //membuat input first name disable
formPerson.age.val(); //mengambil nilai input age
```

# Mengambil data

```
var data mapper.getData(suatuElm);
```
Struktur dari data yang diekstrak dari suatu form bersesuati dengan struktur form itu sendiri. Contoh:
```
var data = mapperPerson.get(suatuElm);
```

data akan memiliki struktur sebagai berikut, (namun dengan data sesuai dengan isi input).
```
{
    id:0,
    age:20,
    name:{
        first:'Jimbis'
        last:'Sukoco'
    }
}
```

# Mengatur data
```
mapper.setData(suatuElm, data);
```
Mapper akan mencocokan struktur form dan data, kemudian mengubah input atau variabel yang bersesuaian. Hanya input atau variabel yang ada pada data saja yang dirubah. Contoh :
```
mapperPerson.setData({
    age: 10,
    name: {
        first: 'Budi'
    }
});
```
Skrip di atas hanya akan mengubah input `age` dan `name.first` saja, sedangkan isi pada `id` dan `name.last` tidak berubah.

# Validasi
```
var isValid = mapper.validate(suatuElm);
```

# Atribut khusus
## `_set`
Atribut yang berada dalam atribut ini akan berubah saat dilakukan `setData`, namun tidak akan diambil datanya saat dilakukan `getData` walaupun terdapat data yang bersesuaian.


## `_get`
Atribut yang berada dalam atribut ini akan ditelusuri saat dilakukan `getData`, namun tidak akan berubah datanya saat dilakukan `setData` walaupun terdapat data yang bersesuaian.

## `_skip`
Atribut yang berada dalam atribut ini akan ditelusuri baik saat `getData`, maupun `setData`. Atribut ini digunakan untuk menyimpan fungsi-fungsi untuk mengatur perilaku form.

Perhatikan contoh berikut:
```
var mapperBox = app.ui.mapper(function(elm){
    var form = {
        corner: 8,
        _get:{
            volume: ui.inputFloat(app.s(elm, '.input_vol')),
        },
        _set:{
            width: ui.inputFloat(app.s(elm, '.input_w')),
            length: ui.inputFloat(app.s(elm, '.input_l')),
            height: ui.inputFloat(app.s(elm, '.input_h')),
        },
    };

    form._skip = {
        color:'red',
        calc: function(){
            var length = form._set.length.val();
            var width = form._set.width.val();
            var height = form._set.height.val();
            form._get.volume.val(length * width * height);
        }
    };

    return form;
});

```
Skrip berikut hanya akan mengubah input `_set.length` menjadi 10:
```
mapperBox.setData(elm, {
    volume: 2000,
    length: 10,
    color: 'blue'
});
```
`mapperBox.getData(elm)` akan menghasilkan:
```
{
    corner: 8,
    volume: 16000 //data tergantung nilai input vol
}
```
Semua atribut masih dapat diakses lewat form
```
var form = mapperBox.get(elm);
form._set.length.val(100);//mengubah length menjadi 100
form._skip.color = 'blue';//mengganti color jadi 'blue'
form._skip.calc(); //menghitung volume
```
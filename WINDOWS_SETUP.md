# 🪟 ALFAI Enterprise - Windows Kurulum Rehberi

## 📥 Adım 1: Dosyaları İndirme

1. Claude'dan gelen dosyaları indirin
2. Tümünü bir klasöre çıkartın (örn: `C:\alfai-enterprise\`)

## 📂 Adım 2: Klasör Yapısı

İndirdiğiniz dosyalar şu şekilde olmalı:

```
C:\alfai-enterprise\
├── 📁 backend\
│   ├── 📄 package.json
│   ├── 📄 server.js
│   ├── 📄 .env.example
│   └── ...
│
├── 📁 frontend\
│   ├── 📄 package.json
│   ├── 📄 index.html
│   ├── 📄 .env.example
│   ├── 📁 src\
│   └── 📁 external_features\
│
├── 📄 README.md
├── 📄 SETUP.md
├── 📄 start-windows.bat  ⭐ (YENİ!)
└── 📄 docker-compose.yml
```

## 🔧 Adım 3: Node.js Kurulumu

### Node.js Yüklü mü Kontrol Edin:

1. **Windows tuşu + R** basın
2. `cmd` yazın ve Enter
3. Şunu yazın: `node -v`

**Eğer hata verirse:**
- https://nodejs.org adresinden indirin
- LTS versiyonunu seçin (v20.x önerilir)
- Yükleyin ve bilgisayarı yeniden başlatın

## 🚀 Adım 4: Kolay Başlatma (Önerilen)

### Yöntem 1: Batch Dosyası ile (EN KOLAY) ⭐

1. `alfai-enterprise` klasörüne gidin
2. `start-windows.bat` dosyasına çift tıklayın
3. Menüden seçin:
   - **1** → Sadece Backend
   - **2** → Sadece Frontend
   - **3** → İkisi de (2 terminal gerekir)

### Yöntem 2: Manuel Kurulum

#### Backend Başlatma:

1. Dosya Gezgini'nde `alfai-enterprise\backend` klasörünü açın
2. Adres çubuğuna `cmd` yazın ve Enter
3. Şu komutları sırayla çalıştırın:

```cmd
npm install
copy .env.example .env
npm start
```

✅ **Backend hazır!** → http://localhost:5002

#### Frontend Başlatma:

1. **YENİ BİR CMD AÇIN** (önemli!)
2. `alfai-enterprise\frontend` klasörüne gidin
3. Şu komutları sırayla çalıştırın:

```cmd
npm install
copy .env.example .env
npm run dev
```

✅ **Frontend hazır!** → http://localhost:5173

## 🎯 Adım 5: Uygulamayı Açma

1. Tarayıcınızı açın (Chrome/Edge önerilir)
2. Şu adrese gidin: **http://localhost:5173**
3. Giriş yapın:
   - **Kullanıcı**: demo
   - **Şifre**: demo

## ⚠️ Yaygın Sorunlar ve Çözümler

### Sorun 1: "Port zaten kullanımda"

**Çözüm:**
```cmd
# Backend için (port 5002)
netstat -ano | findstr :5002
taskkill /PID [PID_NUMARASI] /F

# Frontend için (port 5173)
netstat -ano | findstr :5173
taskkill /PID [PID_NUMARASI] /F
```

### Sorun 2: "npm bulunamadı"

**Çözüm:**
1. Node.js'i yükleyin: https://nodejs.org
2. Bilgisayarı yeniden başlatın
3. Tekrar deneyin

### Sorun 3: "Cannot find module"

**Çözüm:**
```cmd
# Backend klasöründe
rmdir /s /q node_modules
del package-lock.json
npm install

# Frontend klasöründe aynı işlemi yapın
```

### Sorun 4: "Permission denied"

**Çözüm:**
- CMD'yi **Yönetici olarak çalıştırın**
- Sağ tık → "Yönetici olarak çalıştır"

## 📊 İlk Kullanım Kontrol Listesi

```
✅ Node.js yüklü (node -v çalışıyor)
✅ Dosyalar doğru klasörde
✅ Backend npm install tamamlandı
✅ Frontend npm install tamamlandı
✅ .env dosyaları oluşturuldu
✅ Backend çalışıyor (http://localhost:5002/api/health)
✅ Frontend açıldı (http://localhost:5173)
✅ Giriş başarılı (demo/demo)
```

## 🎨 İpuçları

### İpucu 1: PowerShell Kullanımı

CMD yerine PowerShell tercih ederseniz:

```powershell
# Backend
cd backend
npm install
Copy-Item .env.example .env
npm start

# Frontend (yeni PowerShell)
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

### İpucu 2: VSCode ile Geliştirme

1. VSCode'u indirin: https://code.visualstudio.com
2. `alfai-enterprise` klasörünü VSCode'da açın
3. Terminal'den (Ctrl + `) komutları çalıştırın
4. İki terminal açabilirsiniz (Split terminal)

### İpucu 3: Otomatik Başlatma

Windows başlangıcında otomatik açılsın isterseniz:

1. `start-windows.bat` dosyasının kısayolunu oluşturun
2. **Windows + R** → `shell:startup` yazın
3. Kısayolu bu klasöre koyun

## 🐳 Docker ile Kullanım (İsteğe Bağlı)

Eğer Docker Desktop yüklüyse:

1. Docker Desktop'ı başlatın
2. CMD'de şunu çalıştırın:

```cmd
cd alfai-enterprise
docker-compose up -d
```

3. Tarayıcıda http://localhost:5173 açın

Docker'ı durdurmak için:
```cmd
docker-compose down
```

## 📱 Mobil/Tablet Erişimi

Aynı WiFi'deyken:

1. CMD'de şunu yazın: `ipconfig`
2. "IPv4 Address" notunu alın (örn: 192.168.1.100)
3. Mobil tarayıcıda: `http://192.168.1.100:5173`

## 🆘 Yardım Alma

### Dokümanlara Bakın:
- **README.md** - Genel bilgi
- **SETUP.md** - Detaylı kurulum
- **QUICK_START.md** - Hızlı başlangıç
- **CHECKLIST.md** - Kontrol listesi

### Hata Bildirimi:
- GitHub Issues
- support@alfai.com

## ✅ Başarı Senaryosu

Doğru kurulum sonrası görecekleriniz:

**Backend Terminal:**
```
ALFAI Odoo Backend listening on 5002
```

**Frontend Terminal:**
```
VITE v5.0.0  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.X:5173/
```

**Tarayıcı:**
- ALFAI Enterprise ERP Login sayfası
- Modern, profesyonel arayüz
- Türkçe dil desteği

---

## 🎉 Tebrikler!

Artık ALFAI Enterprise ERP sisteminiz çalışıyor!

**Sonraki adımlar:**
1. Tüm modülleri keşfedin
2. Demo verilerle pratik yapın
3. Kendi verilerinizi ekleyin
4. Raporları deneyin

**Başarılar! 🚀**

---

*Windows 10/11 için test edilmiştir.*
*Node.js v18+ gerektirir.*

# 📘 ALFAI Enterprise - Kurulum Rehberi

## 🎯 Hızlı Başlangıç

### Seçenek 1: Otomatik Başlatma (Önerilen)

```bash
# Projeyi indirin
cd alfai-enterprise

# Master script ile başlatın
./start-alfai.sh
```

Script menüsünden istediğiniz seçeneği seçin:
- **1** - Full Stack (Backend + Frontend)
- **2** - Sadece Backend
- **3** - Sadece Frontend
- **4** - Production Build

### Seçenek 2: Manuel Kurulum

#### Backend Kurulumu

```bash
cd backend
npm install
cp .env.example .env
# .env dosyasını düzenleyin
npm start
```

Backend http://localhost:5002 adresinde çalışacaktır.

#### Frontend Kurulumu

```bash
cd frontend
npm install
cp .env.example .env
# .env dosyasını düzenleyin
npm run dev
```

Frontend http://localhost:5173 adresinde çalışacaktır.

### Seçenek 3: Docker ile Kurulum

```bash
# Docker Compose ile tüm servisleri başlatın
docker-compose up -d

# Logları görüntülemek için
docker-compose logs -f

# Servisleri durdurmak için
docker-compose down
```

## ⚙️ Yapılandırma

### Backend (.env)

```env
# Odoo Configuration
ODOO_URL=http://localhost:8069
ODOO_DB=ALFA-ERP
ODOO_USERNAME=your_username
ODOO_PASSWORD=your_password

# Server
PORT=5002

# AI Keys (Opsiyonel)
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-...
HF_API_TOKEN=hf_...
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:5002
```

## 🔧 Gereksinimler

### Minimum Gereksinimler

- **Node.js**: v18.0.0 veya üzeri
- **npm**: v9.0.0 veya üzeri
- **RAM**: 2GB
- **Disk**: 500MB boş alan

### Önerilen Gereksinimler

- **Node.js**: v20.x (LTS)
- **npm**: v10.x
- **RAM**: 4GB
- **Disk**: 1GB boş alan
- **OS**: Linux, macOS, Windows 10+

## 📦 Bağımlılıklar

### Backend Bağımlılıkları

```json
{
  "axios": "^1.7.0",
  "cors": "^2.8.5",
  "dotenv": "^16.4.0",
  "express": "^4.19.0"
}
```

### Frontend Bağımlılıkları

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "axios": "^1.7.0",
  "chart.js": "^4.4.1",
  "jspdf": "^3.0.4",
  "lucide-react": "^0.555.0",
  "react-chartjs-2": "^5.2.0",
  "react-hot-toast": "^2.4.1",
  "xlsx": "^0.18.5"
}
```

## 🚀 İlk Kullanım

### 1. Giriş Yapma

Frontend'e gittikten sonra varsayılan kullanıcı bilgileri:

```
Kullanıcı Adı: demo
Şifre: demo
```

veya yeni bir hesap oluşturun.

### 2. Odoo Bağlantısı (Opsiyonel)

Eğer Odoo kullanmıyorsanız, sistem otomatik olarak **local mode**'a geçer ve demo verileriyle çalışır.

Odoo kullanmak için:

1. Backend `.env` dosyasında Odoo bilgilerini girin
2. Odoo'nun çalıştığından emin olun
3. Backend'i yeniden başlatın

### 3. Modülleri Keşfetme

Sol menüden modüller arasında gezinebilirsiniz:
- **Dashboard** - Genel bakış
- **Finance** - Finansal yönetim
- **Inventory** - Envanter
- **CRM** - Müşteri ilişkileri
- **AI** - Yapay zeka asistanı
- Ve daha fazlası...

## 🔒 Güvenlik

### Production Ortamı İçin

1. **Güçlü şifreler kullanın**
   ```bash
   # .env dosyasında
   ODOO_PASSWORD=GuclU_S1fre_123!
   ```

2. **HTTPS kullanın**
   ```nginx
   # Nginx reverse proxy örneği
   server {
       listen 443 ssl;
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
   }
   ```

3. **Firewall kuralları**
   ```bash
   # UFW örneği
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

4. **Environment variables'ı güvenle saklayın**
   - Asla `.env` dosyalarını Git'e eklemeyin
   - Production'da secrets manager kullanın

## 🐛 Sorun Giderme

### Backend Başlamıyor

```bash
# Port kullanımda olabilir
lsof -i :5002
kill -9 <PID>

# Dependencies eksik olabilir
cd backend && npm install

# Log kontrol
cat backend/logs/error.log
```

### Frontend Derleme Hatası

```bash
# Cache temizleme
rm -rf node_modules package-lock.json
npm install

# Vite cache temizleme
rm -rf .vite
```

### Odoo Bağlantı Hatası

```bash
# Odoo çalışıyor mu?
curl http://localhost:8069

# Credentials doğru mu?
# .env dosyasını kontrol edin

# Odoo kullanmadan devam
# Backend otomatik local mode'a geçer
```

### Port Zaten Kullanımda

```bash
# Farklı port kullan
# Backend .env
PORT=5003

# Frontend vite.config.js
server: { port: 5174 }
```

## 📊 Performans İyileştirme

### Production Build

```bash
# Frontend optimize build
cd frontend
npm run build

# Build dosyaları frontend/dist/ klasöründe
```

### Caching Aktifleştirme

Backend otomatik olarak API response'larını cache'ler (60 saniye TTL).

### Database Optimizasyonu

```javascript
// Local store temizleme
// Backend'de otomatik olarak 500 kayıtla sınırlıdır
```

## 🔄 Güncelleme

```bash
# Git ile güncelleme
git pull origin main

# Dependencies güncelleme
cd backend && npm update
cd frontend && npm update

# Restart
./start-alfai.sh
```

## 📝 Loglar

### Backend Logları

```bash
# Console logları
cd backend && npm start

# File logları (gelecek feature)
tail -f backend/logs/app.log
```

### Frontend Logları

```bash
# Browser console
# Chrome DevTools: F12 -> Console
```

## 🆘 Destek

### Hata Bildirimi

1. GitHub Issues: [Link]
2. Email: support@alfai.com
3. Discord: [Link]

### Doküman Kaynakları

- API Docs: http://localhost:5002/api-docs
- User Guide: docs/user-guide.md
- Developer Guide: docs/developer-guide.md

## 🎓 Eğitim Kaynakları

### Video Tutoriallar
- YouTube Channel: [Link]
- Udemy Course: [Link]

### Yazılı Kaynaklar
- Blog: https://blog.alfai.com
- Wiki: https://wiki.alfai.com

## 📞 İletişim

- Email: info@alfai.com
- Website: https://alfai.com
- Twitter: @alfai_erp
- LinkedIn: ALFAI Technologies

---

**Happy Coding! 🚀**

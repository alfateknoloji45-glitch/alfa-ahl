#!/bin/bash

cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              🚀 ALFAI ENTERPRISE ERP v1.0                ║
║                                                           ║
║          Modern Kurumsal Kaynak Planlama Sistemi         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF

echo ""
echo "Başlatma seçenekleri:"
echo ""
echo "1) 🎯 Full Stack (Backend + Frontend)"
echo "2) 🔧 Sadece Backend"
echo "3) 🎨 Sadece Frontend"
echo "4) 🏗️  Production Build"
echo "5) ❌ Çıkış"
echo ""

read -p "Seçiminiz (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Full stack başlatılıyor..."
        echo ""
        
        # Backend'i arka planda başlat
        echo "📡 Backend başlatılıyor..."
        cd backend/backend && ./start.sh &
        BACKEND_PID=$!
        
        # Backend'in hazır olmasını bekle
        sleep 5
        
        # Frontend'i başlat
        echo ""
        echo "🎨 Frontend başlatılıyor..."
        cd ../../frontend && ./start.sh
        
        # Cleanup on exit
        trap "kill $BACKEND_PID 2>/dev/null" EXIT
        ;;
        
    2)
        echo ""
        echo "🔧 Backend başlatılıyor..."
        cd backend/backend && ./start.sh
        ;;
        
    3)
        echo ""
        echo "🎨 Frontend başlatılıyor..."
        cd frontend && ./start.sh
        ;;
        
    4)
        echo ""
        echo "🏗️  Production build başlatılıyor..."
        echo ""
        
        # Frontend build
        echo "📦 Frontend build ediliyor..."
        cd frontend
        npm run build
        
        echo ""
        echo "✅ Build tamamlandı!"
        echo "📁 Build dosyaları: frontend/dist/"
        echo ""
        
        read -p "Preview modunda başlatmak ister misiniz? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            npm run preview
        fi
        ;;
        
    5)
        echo ""
        echo "👋 Görüşmek üzere!"
        exit 0
        ;;
        
    *)
        echo ""
        echo "❌ Geçersiz seçim!"
        exit 1
        ;;
esac

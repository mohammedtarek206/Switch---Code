# 🔧 دليل إعداد MongoDB - MongoDB Setup Guide

## 📋 طريقة سريعة - Quick Setup

### 1️⃣ إنشاء حساب MongoDB Atlas (مجاني)
1. افتح: https://www.mongodb.com/cloud/atlas/register
2. سجل بحساب Google أو Email
3. اختر الخطة المجانية (FREE - M0 Cluster)

### 2️⃣ إنشاء Cluster
1. بعد التسجيل، انقر "Build a Database"
2. اختر "M0 FREE" (المجاني)
3. اختر Cloud Provider و Region (أقرب منطقة)
4. اسم Cluster: `SwitchCode` (أو أي اسم)
5. انقر "Create"

### 3️⃣ إعداد Network Access
1. من القائمة الجانبية: **Network Access**
2. انقر "Add IP Address"
3. انقر "Allow Access from Anywhere" (للاختبار)
   - أو: أضف IP محدد
4. انقر "Confirm"

### 4️⃣ إنشاء Database User
1. من القائمة: **Database Access**
2. انقر "Add New Database User"
3. Authentication Method: **Password**
4. Username: `switchcode` (أو أي اسم)
5. Password: قم بإنشاء كلمة مرور قوية
   - **احفظها!**
6. User Privileges: **Atlas Admin** (للاختبار)
7. انقر "Add User"

### 5️⃣ الحصول على Connection String
1. من القائمة: **Database**
2. انقر "Connect" بجانب Cluster
3. اختر "Connect your application"
4. Driver: **Node.js**
5. Version: **5.5 or later**
6. انسخ الـ Connection String:
```
mongodb+srv://switchcode:<password>@switchcode.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### 6️⃣ تعديل Connection String
استبدل `<password>` بكلمة المرور التي أنشأتها:
```
mongodb+srv://switchcode:YOUR_PASSWORD@switchcode.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

مثال:
```
mongodb+srv://switchcode:MyPass123@switchcode.abc123.mongodb.net/?retryWrites=true&w=majority
```

## 🎯 إضافة إلى المشروع

### 1. إنشاء ملف `.env.local`:
```bash
# في جذر المشروع
copy env.example .env.local
```

### 2. فتح `.env.local` وملء البيانات:
```env
MONGODB_URI=mongodb+srv://switchcode:YOUR_PASSWORD@switchcode.xxxxx.mongodb.net/switchcode?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_this_123456
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. تشغيل المشروع:
```bash
npm run dev
```

## ✅ اختبار الاتصال

بعد تشغيل المشروع:
1. افتح http://localhost:3000
2. اذهب إلى صفحة Contact
3. أرسل نموذج تجريبي
4. إذا ظهرت رسالة نجاح = MongoDB يعمل! ✅

## 🐛 حل المشاكل - Troubleshooting

### المشكلة: Connection Timeout
**الحل:**
- تأكد من إضافة IP في Network Access
- جرب "Allow Access from Anywhere"

### المشكلة: Authentication Failed
**الحل:**
- تأكد من استبدال `<password>` في Connection String
- تأكد من كلمة مرور Database User

### المشكلة: Error: 500
**الحل:**
- افتح MongoDB Atlas Dashboard
- تحقق من حالة Cluster (يجب تكون Running)
- تأكد من صحة Connection String

## 📊 بيانات تجريبية - Demo Data

بعد تشغيل المشروع، يمكنك إضافة بيانات تجريبية:

```bash
# Test API
curl -X GET http://localhost:3000/api/team
```

## 🎉 مبروك!
الآن لديك:
- ✅ MongoDB Atlas Cluster
- ✅ Database Connected
- ✅ API Endpoints تعمل
- ✅ Forms تتصل بالـ Database

---

## 📞 مساعدة إضافية
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- Support: https://www.mongodb.com/support

# AiSG – Assessment Field Logic  
### Module: Humanized 18 Pilar Framework v2.0  

---

## 🎯 TUJUAN
Mengubah proses pengisian “18 Pilar” menjadi **Assessment Field** yang modern, intuitif, dan lebih manusiawi.  
User tidak lagi diminta mengisi angka mentah tanpa konteks, tapi dibimbing lewat dialog interaktif yang membantu refleksi.

---

## 🧠 STRUKTUR FORM INPUT
### 1️⃣ Identitas Awal
```
Nama Lengkap:
Jabatan:
Nama Atasan Langsung:
Jumlah Tim Aktif:
Margin Kuartal (USD):
Tanggal Audit:
```
> Semua nominal uang menggunakan format **angka tanpa titik + satuan USD.**  
> Contoh: `75000 USD`

---

### 2️⃣ Pelatihan & Kaderisasi
Pertanyaan ini menegaskan posisi kaderisasi dalam sistem SG:
```
Apakah Anda sudah mengikuti PATD (Pelatihan Analisa Teknikal Dasar)?  
Apakah Anda sudah mengikuti PATL (Pelatihan Analisa Teknikal Lanjut)?
```
- **PATD** → syarat naik dari **BC ke SBC**
- **PATL** → syarat naik ke level manajerial (**SBC → BSM → SBM → BM → dst.**)  

> GPT akan menjawab edukatif, bukan sekadar “ya/tidak”.

---

### 3️⃣ Assessment Field (Humanized 18 Pilar)
GPT akan menjelaskan di awal:

```
Sekarang kita masuk ke tahap Assessment Field — 18 bidang yang menggambarkan pola kerja dan gaya kepemimpinan Anda.  
Saya akan bacakan satu per satu, beri nilai 1–5.  
Nilai 1 berarti masih sangat perlu dikembangkan, 5 berarti sudah kuat dan stabil.  
Ketik “mulai” untuk memulai.
```

---

### 4️⃣ Pola Tanya Otomatis
GPT menanyakan bidang satu per satu, misalnya:
```
1️⃣ Fokus Pemasukan & Produktivitas — seberapa konsisten Anda mencapai target?
(1–5)
2️⃣ Retensi & Loyalitas Tim — seberapa baik Anda menjaga stabilitas dan motivasi anggota?
(1–5)
3️⃣ Kaderisasi & Regenerasi — seberapa aktif Anda menyiapkan penerus?
(1–5)
...
```
Sampai semua 18 bidang selesai.  
Jika user ingin isi sekaligus:
```
Baik, berikut urutan lengkap 18 bidang:
1. Fokus Pemasukan & Produktivitas  
2. Retensi & Loyalitas Tim  
3. Kaderisasi & Regenerasi  
...  
18. Kepatuhan & Tata Kelola  
Silakan isi skor Anda dalam format:  
1=4, 2=5, 3=3, …, 18=4
```

---

### 5️⃣ Dual Scoring Logic
Untuk setiap bidang, sistem membandingkan dua nilai:
- **Self-Score (input user)**
- **System-Score (dihitung dari margin, retensi, lama bergabung)**

```
Gap = Self-Score – System-Score
```

> GPT otomatis membuat kolom insight dari hasil gap tersebut:
> - Gap 0 → seimbang  
> - Gap negatif → overconfidence  
> - Gap positif → undervaluation (rendah diri)

---

### 6️⃣ Output Tabel Ringkas
| Field | Self | System | Gap | Insight |
|-------|------|---------|-----|----------|
| Fokus Pemasukan | 4 | 2 | -2 | Target belum selaras dengan hasil nyata. |
| Retensi & Loyalitas | 3 | 4 | +1 | Tim solid, tapi persepsi diri masih rendah. |
| ... | ... | ... | ... | ... |

---

### 7️⃣ Penutup Assessment Field
Sebelum lanjut ke laporan, GPT tampilkan:
> “Terima kasih. Semua bidang sudah dinilai.  
> Sekarang saya akan mengolah hasil dan menghasilkan laporan lengkap, termasuk insight, SWOT, dan rencana 30–60–90 hari.”  

---

### ⚙️ INTERNAL NOTE
- Semua istilah *18 Pilar* diganti **Assessment Field** di seluruh sistem.  
- Sistem tidak menampilkan kode “P1, P2…” melainkan nama bidang penuh.  
- GPT otomatis menyimpan hasil nilai dan gap untuk dibaca modul berikutnya (Narrative & Action Plan).  

---

📦 **Patch Source:** `AssessmentField_Update_v1.2`  
**Author:** AiSG Team – NM23 Ai × ChatGPT–OpenAI  
**Mode:** Interactive Audit Form Logic

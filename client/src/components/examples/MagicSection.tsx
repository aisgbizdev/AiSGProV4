import MagicSection from "../MagicSection";

export default function MagicSectionExample() {
  return (
    <div className="max-w-2xl mx-auto p-6 bg-background">
      <MagicSection
        zodiak="Leo (Singa) ♌"
        booster="Kekuatan kepemimpinan alami Anda bersinar terang bulan ini. Gunakan karisma Anda untuk menginspirasi tim dan meraih target yang lebih tinggi."
        quote="Kepemimpinan sejati bukan tentang menjadi yang terkuat, tetapi tentang memberdayakan orang lain untuk menjadi versi terbaik dari diri mereka."
        data-testid="magic-section-example"
      />
    </div>
  );
}

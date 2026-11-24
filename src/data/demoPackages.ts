import { InspectionImage, ProductCategory } from '../types';

function toSvgDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export interface PredefinedFieldInfo {
  field: string;
  label: string;
  value: string;
  status: 'PASS' | 'FAIL' | 'FLAGGED';
  panel: 'Front' | 'Back' | 'Carton';
  ruleCitation: string;
  note?: string;
}

export interface DemoPackagePreset {
  id: string;
  title: string;
  subtitle: string;
  productName: string;
  brand: string;
  category: ProductCategory;
  barcode: string;
  packageLevel: 'RETAIL_CONSUMER' | 'BULK_BOX';
  expectedStatus: 'PASS' | 'FAIL' | 'REVIEW' | 'NO_PACKAGE_DETECTED';
  badgeLabel: string;
  badgeClass: string;
  description: string;
  calibMethod: 'REFERENCE_OBJECT' | 'DECLARED_DIMENSIONS' | 'NONE';
  selectedRefObject?: string;
  declaredDims?: { width: number; height: number; depth: number };
  bulkDetails?: {
    unitsCount: number;
    unitNetMass: string;
    totalGrossWeight: string;
    masterBarcode: string;
  };
  predefinedFields: PredefinedFieldInfo[];
  images: InspectionImage[];
}

// -------------------------------------------------------------
// 1. AURA ORGANICS WHOLEGRAIN OATS COOKIES (PASS - FULLY COMPLIANT)
// -------------------------------------------------------------
const SVG_COOKIES_FRONT = toSvgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="#f8fafc">
  <rect width="600" height="750" fill="#0c1929" rx="0"/>
  <rect x="24" y="24" width="552" height="702" rx="20" fill="#ffffff" stroke="#38bdf8" stroke-width="3"/>
  <rect x="44" y="44" width="512" height="120" rx="14" fill="#0f172a"/>
  <text x="300" y="90" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#38bdf8" text-anchor="middle">AURA ORGANICS</text>
  <text x="300" y="130" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="#f8fafc" text-anchor="middle">CRUNCHY WHOLEGRAIN OATS COOKIES</text>
  
  <rect x="70" y="190" width="460" height="260" rx="16" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/>
  <circle cx="300" cy="300" r="75" fill="#fde68a" stroke="#d97706" stroke-width="3"/>
  <text x="300" y="315" font-family="Arial, sans-serif" font-size="52" text-anchor="middle">🍪</text>
  <text x="300" y="365" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#92400e" text-anchor="middle">100% WHOLE GRAIN &amp; HIGH FIBRE</text>

  <!-- Principal Display Panel Declarations -->
  <rect x="50" y="480" width="500" height="215" rx="12" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
  <text x="75" y="515" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0f172a">PRINCIPAL DISPLAY PANEL (RULE 6 &amp; 7)</text>
  
  <rect x="75" y="530" width="450" height="42" rx="6" fill="#e0f2fe" stroke="#38bdf8"/>
  <text x="90" y="557" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="#0369a1">Net Quantity: 200 g (2 × 100g Packs)</text>
  
  <text x="75" y="602" font-family="Arial, sans-serif" font-size="14" fill="#334155">Generic Name: Baked Biscuit &amp; Oat Confectionery</text>
  <text x="75" y="628" font-family="Arial, sans-serif" font-size="13" fill="#64748b">Serving Suggestion: Best enjoyed with fresh milk or tea</text>
  
  <!-- Vegetarian Green Dot -->
  <rect x="75" y="646" width="30" height="30" fill="#ffffff" stroke="#16a34a" stroke-width="2"/>
  <circle cx="90" cy="661" r="8" fill="#16a34a"/>
  <text x="115" y="666" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#15803d">100% Vegetarian Commodity</text>
</svg>`);

const SVG_COOKIES_BACK = toSvgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="#f8fafc">
  <rect width="600" height="750" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="4"/>
  <rect x="25" y="25" width="550" height="700" rx="16" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
  <rect x="40" y="40" width="520" height="55" rx="8" fill="#0f172a"/>
  <text x="300" y="75" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#f8fafc" text-anchor="middle">STATUTORY MANDATORY DECLARATIONS PANEL</text>

  <rect x="40" y="110" width="520" height="595" rx="8" fill="#ffffff" stroke="#e2e8f0"/>
  
  <text x="60" y="145" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">1. GENERIC PRODUCT NAME:</text>
  <text x="260" y="145" font-family="Arial, sans-serif" font-size="14" fill="#334155">Wholegrain Oats Cookies</text>

  <text x="60" y="180" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">2. NET QUANTITY (RULE 11):</text>
  <text x="260" y="180" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0284c7">200 g (2 x 100g Individual Packs)</text>

  <text x="60" y="215" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">3. MRP (INCL. ALL TAXES):</text>
  <text x="260" y="215" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#059669">₹75.00 (Incl. of all taxes)</text>

  <text x="60" y="250" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">4. UNIT SALE PRICE (USP):</text>
  <text x="260" y="250" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0284c7">₹0.38 / g (Rule 6(11) Compliant)</text>

  <text x="60" y="285" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">5. MFD &amp; PACKED BY:</text>
  <text x="60" y="310" font-family="Arial, sans-serif" font-size="12" fill="#475569">Aura Organics Foods Pvt Ltd, Plot 14, Phase III, KIADB Industrial Area,</text>
  <text x="60" y="328" font-family="Arial, sans-serif" font-size="12" fill="#475569">Peenya 2nd Stage, Bengaluru, Karnataka - 560058, India.</text>

  <text x="60" y="365" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">6. DATE OF PACKING &amp; BATCH:</text>
  <text x="260" y="365" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#334155">04/2026 | BATCH: AO-2026-B84</text>

  <text x="60" y="400" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">7. BEST BEFORE / SHELF LIFE:</text>
  <text x="260" y="400" font-family="Arial, sans-serif" font-size="13" fill="#334155">9 Months from Packaging Date</text>

  <text x="60" y="435" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">8. COUNTRY OF ORIGIN:</text>
  <text x="260" y="435" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#15803d">India</text>

  <!-- Consumer Care Box -->
  <rect x="55" y="465" width="490" height="95" rx="8" fill="#f0fdf4" stroke="#86efac" stroke-width="2"/>
  <text x="75" y="490" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#166534">9. CONSUMER CARE GRIEVANCE CELL (RULE 6(1)(n)):</text>
  <text x="75" y="515" font-family="Arial, sans-serif" font-size="12" fill="#14532d">Manager, Consumer Grievance Cell, at Mfd Address above</text>
  <text x="75" y="538" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#15803d">Toll Free: 1800-425-9988 | Email: care@auraorganics.in</text>

  <!-- Barcode & FSSAI -->
  <rect x="60" y="580" width="220" height="60" fill="#f8fafc" stroke="#cbd5e1"/>
  <text x="170" y="615" font-family="monospace" font-size="18" text-anchor="middle">|||| | ||||| || ||||</text>
  <text x="170" y="632" font-family="monospace" font-size="11" text-anchor="middle">8901234567890</text>
  
  <text x="310" y="605" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#334155">FSSAI Lic. No: 10020043000987</text>
  <text x="310" y="625" font-family="Arial, sans-serif" font-size="11" fill="#64748b">Store in cool, dry hygienic place.</text>
</svg>`);

// -------------------------------------------------------------
// 2. SILK GLOW HERBAL SHAMPOO (FAIL - MISSING CC CELL & BAD MRP)
// -------------------------------------------------------------
const SVG_SHAMPOO_FRONT = toSvgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="#f8fafc">
  <rect width="600" height="750" fill="#fff1f2" stroke="#f43f5e" stroke-width="4"/>
  <rect x="25" y="25" width="550" height="700" rx="20" fill="#ffffff" stroke="#fb7185" stroke-width="2"/>
  <rect x="40" y="40" width="520" height="110" rx="12" fill="#881337"/>
  <text x="300" y="85" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#fda4af" text-anchor="middle">RADIANT COSMETICS</text>
  <text x="300" y="125" font-family="Arial, sans-serif" font-size="17" fill="#ffffff" text-anchor="middle">SILK GLOW HERBAL SHAMPOO</text>

  <rect x="110" y="180" width="380" height="270" rx="16" fill="#fff1f2" stroke="#f43f5e" stroke-width="2"/>
  <circle cx="300" cy="295" r="75" fill="#ffe4e6" stroke="#fb7185" stroke-width="3"/>
  <text x="300" y="312" font-family="Arial, sans-serif" font-size="52" text-anchor="middle">🧴</text>
  <text x="300" y="360" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#be123c" text-anchor="middle">ALOE VERA &amp; AMLA CONDITIONER</text>

  <rect x="50" y="490" width="500" height="190" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
  <text x="75" y="530" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="#0f172a">FRONT DISPLAY PANEL</text>
  <text x="75" y="570" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0284c7">Net Volume: 200 ml</text>
  <text x="75" y="610" font-family="Arial, sans-serif" font-size="14" fill="#334155">Commodity: Ayurvedic &amp; Herbal Hair Cleanser</text>
  <text x="75" y="645" font-family="Arial, sans-serif" font-size="13" fill="#64748b">Batch: RC-2026-09 | Formulated for smooth hair</text>
</svg>`);

const SVG_SHAMPOO_BACK = toSvgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="#f8fafc">
  <rect width="600" height="750" fill="#fef2f2" stroke="#ef4444" stroke-width="4"/>
  <rect x="25" y="25" width="550" height="700" rx="16" fill="#ffffff" stroke="#ef4444" stroke-width="2"/>
  <rect x="40" y="40" width="520" height="60" rx="8" fill="#991b1b"/>
  <text x="300" y="80" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">BACK LABEL — STATUTORY VIOLATIONS DETECTED</text>

  <rect x="45" y="120" width="510" height="580" rx="8" fill="#fff5f5" stroke="#fed7d7"/>
  
  <text x="65" y="160" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#991b1b">1. PRODUCT:</text>
  <text x="230" y="160" font-family="Arial, sans-serif" font-size="14" fill="#334155">Silk Glow Shampoo</text>

  <text x="65" y="205" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#991b1b">2. NET QUANTITY:</text>
  <text x="230" y="205" font-family="Arial, sans-serif" font-size="14" fill="#334155">200 ml</text>

  <!-- Price Violation Highlight -->
  <rect x="55" y="235" width="485" height="55" rx="6" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
  <text x="70" y="260" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#dc2626">3. PRICE DECLARATION (NON-COMPLIANT):</text>
  <text x="70" y="280" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#991b1b">Price: 199 [MISSING 'MRP' &amp; 'INCL. OF ALL TAXES' STATEMENT]</text>

  <!-- Address Incomplete -->
  <text x="65" y="325" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#991b1b">4. MANUFACTURER ADDRESS:</text>
  <text x="65" y="348" font-family="Arial, sans-serif" font-size="13" fill="#7f1d1d">Mfd by: Radiant Cosmetics, Mumbai [INCOMPLETE POSTAL PIN &amp; DETAILS]</text>

  <!-- Date Violation -->
  <text x="65" y="390" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#dc2626">5. DATE OF PACKAGING:</text>
  <text x="230" y="390" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#b91c1c">2026 [MISSING MONTH — VIOLATES RULE 6(1)(d)]</text>

  <!-- Missing Consumer Care Grievance Box -->
  <rect x="55" y="430" width="485" height="100" rx="8" fill="#fee2e2" stroke="#ef4444" stroke-width="2" stroke-dasharray="6"/>
  <text x="300" y="465" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#991b1b" text-anchor="middle">❌ CRITICAL VIOLATION: CONSUMER CARE CELL ABSENT</text>
  <text x="300" y="490" font-family="Arial, sans-serif" font-size="12" fill="#7f1d1d" text-anchor="middle">No Consumer Redressal Contact Name, Address, Phone, or Email printed.</text>
  <text x="300" y="512" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#dc2626" text-anchor="middle">Liable for compoundable penalty under Section 36.</text>

  <text x="65" y="570" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#991b1b">6. COUNTRY OF ORIGIN:</text>
  <text x="250" y="570" font-family="Arial, sans-serif" font-size="14" fill="#334155">India</text>
</svg>`);

// -------------------------------------------------------------
// 3. AMUL TAAZA FRESH TONED MILK (DAIRY POUCH)
// -------------------------------------------------------------
const SVG_MILK_FRONT = toSvgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="#eff6ff">
  <rect width="600" height="750" fill="#0284c7" stroke="#0369a1" stroke-width="4"/>
  <rect x="25" y="25" width="550" height="700" rx="16" fill="#ffffff" stroke="#bae6fd" stroke-width="2"/>
  
  <!-- Dairy Header Band -->
  <rect x="40" y="40" width="520" height="110" rx="10" fill="#0369a1"/>
  <text x="300" y="85" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="#f0f9ff" text-anchor="middle">AMUL TAAZA</text>
  <text x="300" y="125" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#7dd3fc" text-anchor="middle">PASTEURISED TONED MILK</text>

  <!-- Pouch Center Graphic -->
  <rect x="100" y="180" width="400" height="240" rx="16" fill="#f0f9ff" stroke="#38bdf8" stroke-width="2"/>
  <circle cx="300" cy="285" r="70" fill="#e0f2fe" stroke="#0284c7" stroke-width="3"/>
  <text x="300" y="305" font-family="Arial, sans-serif" font-size="52" text-anchor="middle">🥛</text>
  <text x="300" y="360" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0369a1" text-anchor="middle">MIN. 3.0% FAT | MIN. 8.5% SNF</text>

  <!-- Statutory Panel -->
  <rect x="45" y="450" width="510" height="250" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
  <text x="65" y="480" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0f172a">STATUTORY DECLARATIONS (PACKAGED COMMODITIES)</text>
  
  <text x="65" y="515" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#0284c7">Net Volume: 1000 ml (1 L)</text>
  <text x="65" y="545" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#059669">MRP Rs. 54.00 (Incl. of all taxes)</text>
  <text x="65" y="572" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#0284c7">Unit Sale Price: ₹0.054 / ml</text>
  <text x="65" y="600" font-family="Arial, sans-serif" font-size="12" fill="#334155">Mfg / Pkd: 03/2026 | BATCH: AMUL-TONED-091</text>
  <text x="65" y="622" font-family="Arial, sans-serif" font-size="12" fill="#475569">Marketed by: Gujarat Cooperative Milk Marketing Federation Ltd, Anand 388001</text>
  <text x="65" y="644" font-family="Arial, sans-serif" font-size="12" fill="#15803d" font-weight="bold">Customer Care: 1800-258-3333 | customercare@amul.coop</text>
  <text x="65" y="666" font-family="Arial, sans-serif" font-size="12" fill="#334155">Country of Origin: India</text>
</svg>`);

const SVG_MILK_BACK = toSvgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="#f8fafc">
  <rect width="600" height="750" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="4"/>
  <rect x="25" y="25" width="550" height="700" rx="16" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
  <rect x="40" y="40" width="520" height="50" rx="8" fill="#0369a1"/>
  <text x="300" y="72" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">AMUL TAAZA NUTRITIONAL &amp; STORAGE PANEL</text>

  <rect x="45" y="110" width="510" height="600" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="70" y="145" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">NUTRITIONAL INFORMATION PER 100 ML:</text>
  <text x="70" y="175" font-family="Arial, sans-serif" font-size="13" fill="#334155">Energy: 58 kcal | Total Fat: 3.0 g | Protein: 3.2 g | Calcium: 120 mg</text>

  <text x="70" y="220" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">STORAGE INSTRUCTIONS:</text>
  <text x="70" y="245" font-family="Arial, sans-serif" font-size="12" fill="#475569">Keep refrigerated under 4°C. Consume within 48 hours of opening.</text>

  <rect x="65" y="280" width="470" height="110" rx="6" fill="#eff6ff" stroke="#93c5fd"/>
  <text x="85" y="310" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#1e40af">CONSUMER GRIEVANCE REDRESSAL CELL:</text>
  <text x="85" y="335" font-family="Arial, sans-serif" font-size="13" fill="#1e3a8a">Toll Free: 1800-258-3333 (Toll Free All India)</text>
  <text x="85" y="360" font-family="Arial, sans-serif" font-size="13" fill="#1e3a8a">Email: customercare@amul.coop | Web: www.amul.com</text>

  <text x="70" y="430" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">BARCODE (EAN-13):</text>
  <rect x="70" y="445" width="220" height="50" fill="#ffffff" stroke="#cbd5e1"/>
  <text x="180" y="475" font-family="monospace" font-size="16" text-anchor="middle">||||||||||||||||||||</text>
  <text x="180" y="490" font-family="monospace" font-size="10" text-anchor="middle">8901262010053</text>
</svg>`);

// -------------------------------------------------------------
// 4. SPICE HARVEST INSTANT MASALA (REVIEW - HIGH GLARE)
// -------------------------------------------------------------
const SVG_SPICE_FRONT = toSvgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="#fefce8">
  <rect width="600" height="750" fill="#fef9c3" stroke="#fde047" stroke-width="4"/>
  <rect x="25" y="25" width="550" height="700" rx="16" fill="#fffbeb" stroke="#eab308" stroke-width="2"/>
  <rect x="40" y="40" width="520" height="110" rx="12" fill="#713f12"/>
  <text x="300" y="90" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#fde047" text-anchor="middle">SPICE HARVEST</text>
  <text x="300" y="130" font-family="Arial, sans-serif" font-size="17" fill="#fef3c7" text-anchor="middle">INSTANT MASALA SPICE MIX</text>

  <rect x="100" y="180" width="400" height="240" rx="16" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
  <circle cx="300" cy="285" r="70" fill="#fef9c3" stroke="#eab308" stroke-width="3"/>
  <text x="300" y="302" font-family="Arial, sans-serif" font-size="48" text-anchor="middle">🌶️</text>
  <text x="300" y="348" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#854d0e" text-anchor="middle">AUTHENTIC INDIAN BLEND</text>

  <!-- Glare Flare Overlay Simulating Camera Flash Occlusion -->
  <polygon points="120,440 480,500 440,620 80,560" fill="#ffffff" fill-opacity="0.82"/>
  <text x="300" y="530" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#b45309" text-anchor="middle">⚠ SPECULAR GLARE REFLECTION</text>

  <rect x="50" y="470" width="500" height="210" rx="10" fill="#ffffff" fill-opacity="0.9" stroke="#e2e8f0" stroke-width="2"/>
  <text x="75" y="510" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0f172a">FRONT DECLARATIONS (PARTIALLY OCCLUDED)</text>
  <text x="75" y="550" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#d97706">Net Quantity: ~50g (Low OCR Confidence 58%)</text>
  <text x="75" y="590" font-family="Arial, sans-serif" font-size="14" fill="#334155">Commodity: Ground Spices &amp; Seasoning Mix</text>
  <text x="75" y="630" font-family="Arial, sans-serif" font-size="13" fill="#64748b">Mfg: Spice Harvest Pvt Ltd, Jaipur, Rajasthan</text>
</svg>`);

// -------------------------------------------------------------
// 5. CRUNCHY PROTEIN BITES (CONTRADICTION TEST: FRONT 100g vs BACK 80g)
// -------------------------------------------------------------
const SVG_PROTEIN_FRONT = toSvgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="#f8fafc">
  <rect width="600" height="750" fill="#312e81" stroke="#4338ca" stroke-width="4"/>
  <rect x="25" y="25" width="550" height="700" rx="16" fill="#ffffff" stroke="#6366f1" stroke-width="2"/>
  <rect x="40" y="40" width="520" height="110" rx="12" fill="#1e1b4b"/>
  <text x="300" y="85" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#a5b4fc" text-anchor="middle">NUTRIFIT FOODS</text>
  <text x="300" y="125" font-family="Arial, sans-serif" font-size="17" fill="#ffffff" text-anchor="middle">CRUNCHY PROTEIN BITES</text>

  <!-- Front Display: Bold 100g Net Weight -->
  <rect x="60" y="190" width="480" height="240" rx="16" fill="#e0e7ff" stroke="#6366f1" stroke-width="3"/>
  <text x="300" y="270" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#3730a3" text-anchor="middle">FRONT PRINCIPAL DISPLAY PANEL</text>
  <rect x="100" y="300" width="400" height="60" rx="10" fill="#4f46e5"/>
  <text x="300" y="340" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="middle">NET WEIGHT: 100 g</text>

  <rect x="50" y="470" width="500" height="200" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
  <text x="75" y="510" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0f172a">STATUTORY PROMISES:</text>
  <text x="75" y="545" font-family="Arial, sans-serif" font-size="14" fill="#334155">MRP: ₹99.00 (Incl. of all taxes)</text>
  <text x="75" y="580" font-family="Arial, sans-serif" font-size="14" fill="#334155">Commodity: High Protein Soya &amp; Pea Crunch</text>
  <text x="75" y="615" font-family="Arial, sans-serif" font-size="12" fill="#dc2626" font-weight="bold">Note for Metrology Screening: Front declares 100g mass.</text>
</svg>`);

const SVG_PROTEIN_BACK = toSvgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="#f8fafc">
  <rect width="600" height="750" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="4"/>
  <rect x="25" y="25" width="550" height="700" rx="16" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
  <rect x="40" y="40" width="520" height="50" rx="8" fill="#1e1b4b"/>
  <text x="300" y="72" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">BACK MANDATORY DECLARATIONS PANEL</text>

  <rect x="45" y="110" width="510" height="580" rx="8" fill="#ffffff" stroke="#e2e8f0"/>
  
  <!-- Contradiction Highlight -->
  <rect x="60" y="140" width="480" height="70" rx="8" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
  <text x="80" y="165" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#dc2626">NET QUANTITY (BACK DECLARATION):</text>
  <text x="80" y="192" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#991b1b">Net Quantity: 80 g (CONFLICT WITH FRONT 100g!)</text>

  <text x="65" y="245" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">MRP (INCL. TAXES):</text>
  <text x="230" y="245" font-family="Arial, sans-serif" font-size="14" fill="#334155">₹99.00 (Incl. of all taxes)</text>

  <text x="65" y="290" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">MANUFACTURER:</text>
  <text x="65" y="315" font-family="Arial, sans-serif" font-size="12" fill="#475569">NutriFit Wellness Foods Pvt Ltd, Sector 62, Noida, UP - 201309</text>

  <text x="65" y="360" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">DATE OF PACKING:</text>
  <text x="230" y="360" font-family="Arial, sans-serif" font-size="13" fill="#334155">03/2026 | BATCH: NF-B88</text>

  <rect x="60" y="410" width="480" height="90" rx="6" fill="#f0fdf4" stroke="#86efac"/>
  <text x="80" y="440" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#166534">CONSUMER CARE HELPLINE:</text>
  <text x="80" y="465" font-family="Arial, sans-serif" font-size="13" fill="#14532d">1800-889-1122 | support@nutrifitfoods.com</text>
</svg>`);

// -------------------------------------------------------------
// 6. CHAPTER III WHOLESALE BULK MASTER CARTON (PASS)
// -------------------------------------------------------------
const SVG_WHOLESALE_CARTON = toSvgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="650" height="700" viewBox="0 0 650 700" fill="#fef3c7">
  <rect width="650" height="700" fill="#d97706" stroke="#b45309" stroke-width="4"/>
  <rect x="25" y="25" width="600" height="650" rx="12" fill="#fffbeb" stroke="#92400e" stroke-width="3"/>
  <rect x="45" y="45" width="560" height="90" rx="8" fill="#78350f"/>
  <text x="325" y="85" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#fde68a" text-anchor="middle">LEGAL METROLOGY (PACKAGED COMMODITIES) RULES, 2011</text>
  <text x="325" y="115" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">CHAPTER III: PROVISIONS APPLICABLE TO WHOLESALE PACKAGES (RULES 24-26)</text>

  <rect x="45" y="155" width="560" height="40" rx="6" fill="#fef3c7" stroke="#d97706"/>
  <text x="325" y="180" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#92400e" text-anchor="middle">WHOLESALE MASTER SHIPPER CARTON — OUTER CONTAINER</text>

  <text x="65" y="230" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="#1e293b">AURA ORGANICS OATS DIGESTIVE COOKIES (WHOLESALE)</text>
  <text x="65" y="250" font-family="Arial, sans-serif" font-size="13" fill="#475569">Brand: Aura Organics | FSSAI Lic No: 10020043000987</text>

  <!-- Inner Units Mass (Rule 24) -->
  <rect x="45" y="275" width="560" height="110" rx="8" fill="#ffffff" stroke="#d97706" stroke-width="2"/>
  <text x="65" y="305" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#78350f">2. TOTAL QUANTITY &amp; INNER UNITS (RULE 24 MANDATE):</text>
  <text x="65" y="335" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#15803d">CONTAINS: 24 RETAIL CONSUMER PACKS × 100g EACH</text>
  <text x="65" y="365" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0369a1">TOTAL NET MASS: 2.40 kg | GROSS WEIGHT: 2.75 kg</text>

  <!-- Packer Address -->
  <rect x="45" y="400" width="560" height="90" rx="8" fill="#ffffff" stroke="#d97706"/>
  <text x="65" y="428" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#78350f">3. REGISTERED MANUFACTURER &amp; PACKER (RULE 24):</text>
  <text x="65" y="452" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#1e293b">Aura Organics Foods Private Limited</text>
  <text x="65" y="475" font-family="Arial, sans-serif" font-size="12" fill="#334155">Plot 42-B, Peenya Industrial Area, Phase II, Bengaluru, Karnataka - 560058, India</text>

  <!-- Pricing and Barcode -->
  <rect x="45" y="505" width="270" height="95" rx="8" fill="#ffffff" stroke="#d97706"/>
  <text x="60" y="530" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#78350f">4. DISPATCH &amp; PRICING:</text>
  <text x="60" y="555" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#b45309">WHOLESALE DISTRIBUTION</text>
  <text x="60" y="575" font-family="Arial, sans-serif" font-size="12" fill="#334155">MRP ₹50.00 / unit | Total: ₹1,200.00</text>

  <rect x="330" y="505" width="275" height="95" rx="8" fill="#ffffff" stroke="#d97706"/>
  <text x="345" y="530" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#78350f">5. PACKING &amp; SHIPPER CODE:</text>
  <text x="345" y="555" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#1e293b">Packed: 01/2026 | Batch: AURA-WH-091</text>
  <text x="345" y="580" font-family="Courier, monospace" font-size="15" font-weight="bold" fill="#0f172a">ITF-14: 18901030998121</text>

  <rect x="45" y="615" width="560" height="45" rx="6" fill="#fef2f2" stroke="#fca5a5"/>
  <text x="325" y="643" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#b91c1c" text-anchor="middle">OFFICIAL NOTICE: NOT FOR DIRECT LOOSE SALE BEFORE BREAKING BULK</text>
</svg>`);

// -------------------------------------------------------------
// 7. FARMFRESH SHARBATI ATTA 5KG (PASS)
// -------------------------------------------------------------
const SVG_ATTA_FRONT = toSvgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="#fffbeb">
  <rect width="600" height="750" fill="#78350f" stroke="#b45309" stroke-width="4"/>
  <rect x="25" y="25" width="550" height="700" rx="16" fill="#fffdfa" stroke="#d97706" stroke-width="2"/>
  <rect x="40" y="40" width="520" height="110" rx="12" fill="#451a03"/>
  <text x="300" y="85" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#fde68a" text-anchor="middle">FARMFRESH AGRO</text>
  <text x="300" y="125" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">100% SHARBATI CHAKKI FRESH ATTA</text>

  <rect x="80" y="180" width="440" height="250" rx="16" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/>
  <circle cx="300" cy="285" r="70" fill="#fde68a" stroke="#d97706" stroke-width="3"/>
  <text x="300" y="305" font-family="Arial, sans-serif" font-size="52" text-anchor="middle">🌾</text>
  <text x="300" y="355" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#92400e" text-anchor="middle">TRADITIONAL STONE GROUND</text>

  <rect x="45" y="460" width="510" height="240" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
  <text x="70" y="495" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0f172a">STATUTORY DECLARATION PANEL</text>
  <text x="70" y="535" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#0284c7">Net Quantity: 5 kg</text>
  <text x="70" y="565" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#059669">MRP: ₹260.00 (Incl. of all taxes)</text>
  <text x="70" y="590" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0284c7">Unit Sale Price: ₹52.00 / kg</text>
  <text x="70" y="615" font-family="Arial, sans-serif" font-size="12" fill="#334155">Date of Pkg: 02/2026 | BATCH: FF-ATT-992</text>
  <text x="70" y="638" font-family="Arial, sans-serif" font-size="12" fill="#475569">Mfd by: FarmFresh Agro Mills, Sehore, Madhya Pradesh - 466001</text>
  <text x="70" y="660" font-family="Arial, sans-serif" font-size="12" fill="#15803d" font-weight="bold">Customer Care: 1800-445-5667 | care@farmfresh.in</text>
</svg>`);

// -------------------------------------------------------------
// 8. PURE SIP ORANGE JUICE 1L (PASS)
// -------------------------------------------------------------
const SVG_JUICE_FRONT = toSvgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="#fff7ed">
  <rect width="600" height="750" fill="#ea580c" stroke="#c2410c" stroke-width="4"/>
  <rect x="25" y="25" width="550" height="700" rx="16" fill="#ffffff" stroke="#fdba74" stroke-width="2"/>
  <rect x="40" y="40" width="520" height="110" rx="12" fill="#9a3412"/>
  <text x="300" y="85" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#fed7aa" text-anchor="middle">PURE SIP BEVERAGES</text>
  <text x="300" y="125" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="#ffffff" text-anchor="middle">100% VALENCIA ORANGE JUICE</text>

  <rect x="100" y="180" width="400" height="240" rx="16" fill="#ffedd5" stroke="#f97316" stroke-width="2"/>
  <circle cx="300" cy="285" r="70" fill="#fed7aa" stroke="#ea580c" stroke-width="3"/>
  <text x="300" y="305" font-family="Arial, sans-serif" font-size="50" text-anchor="middle">🍊</text>
  <text x="300" y="355" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#9a3412" text-anchor="middle">NO ADDED SUGAR OR PRESERVATIVES</text>

  <rect x="45" y="460" width="510" height="240" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
  <text x="70" y="495" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0f172a">STATUTORY DECLARATIONS</text>
  <text x="70" y="535" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#0284c7">Net Volume: 1 L (1000 ml)</text>
  <text x="70" y="565" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#059669">MRP: ₹135.00 (Incl. of all taxes)</text>
  <text x="70" y="590" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0284c7">Unit Sale Price: ₹0.135 / ml</text>
  <text x="70" y="615" font-family="Arial, sans-serif" font-size="12" fill="#334155">Pkg Date: 03/2026 | BATCH: PS-ORJ-01</text>
  <text x="70" y="638" font-family="Arial, sans-serif" font-size="12" fill="#475569">Mfd by: Pure Sip Beverages Ltd, Whitefield, Bengaluru - 560066</text>
  <text x="70" y="660" font-family="Arial, sans-serif" font-size="12" fill="#15803d" font-weight="bold">Helpline: 1800-120-7878 | care@puresip.in</text>
</svg>`);

// -------------------------------------------------------------
// 9. NUTRIFIT CALIFORNIA ALMONDS 200G (PASS)
// -------------------------------------------------------------
const SVG_ALMONDS_FRONT = toSvgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="#fefce8">
  <rect width="600" height="750" fill="#713f12" stroke="#a16207" stroke-width="4"/>
  <rect x="25" y="25" width="550" height="700" rx="16" fill="#ffffff" stroke="#ca8a04" stroke-width="2"/>
  <rect x="40" y="40" width="520" height="110" rx="12" fill="#422006"/>
  <text x="300" y="85" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#fde047" text-anchor="middle">NUTRIFIT PREMIUM</text>
  <text x="300" y="125" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="#ffffff" text-anchor="middle">CALIFORNIA WHOLE ALMONDS</text>

  <rect x="100" y="180" width="400" height="240" rx="16" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
  <circle cx="300" cy="285" r="70" fill="#fef9c3" stroke="#eab308" stroke-width="3"/>
  <text x="300" y="305" font-family="Arial, sans-serif" font-size="50" text-anchor="middle">🥜</text>
  <text x="300" y="355" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#854d0e" text-anchor="middle">VACUUM SEALED FOR FRESHNESS</text>

  <rect x="45" y="460" width="510" height="240" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
  <text x="70" y="495" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0f172a">STATUTORY DECLARATION PANEL</text>
  <text x="70" y="535" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#0284c7">Net Weight: 200 g</text>
  <text x="70" y="565" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#059669">MRP: ₹240.00 (Incl. of all taxes)</text>
  <text x="70" y="590" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0284c7">Unit Sale Price: ₹1.20 / g</text>
  <text x="70" y="615" font-family="Arial, sans-serif" font-size="12" fill="#334155">Pkg Date: 02/2026 | BATCH: NF-ALM-551</text>
  <text x="70" y="638" font-family="Arial, sans-serif" font-size="12" fill="#475569">Packed by: NutriFit Foods Pvt Ltd, Navi Mumbai - 400705</text>
  <text x="70" y="660" font-family="Arial, sans-serif" font-size="12" fill="#15803d" font-weight="bold">Country of Origin: USA | Packed in India</text>
</svg>`);

// -------------------------------------------------------------
// 10. OFFICE WEBCAM CAPTURE (NEGATIVE TEST)
// -------------------------------------------------------------
const SVG_WEBCAM_SCENE = toSvgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450" fill="#1e293b">
  <rect width="600" height="450" fill="#0f172a"/>
  <!-- Office Desk -->
  <rect x="0" y="320" width="600" height="130" fill="#334155"/>
  <!-- Computer Monitor -->
  <rect x="220" y="140" width="160" height="110" rx="8" fill="#475569" stroke="#64748b" stroke-width="3"/>
  <rect x="235" y="155" width="130" height="80" fill="#090d16"/>
  <rect x="290" y="250" width="20" height="50" fill="#475569"/>
  <rect x="270" y="300" width="60" height="10" rx="4" fill="#64748b"/>
  <!-- Keyboard -->
  <polygon points="210,340 390,340 420,380 180,380" fill="#1e293b" stroke="#475569"/>
  <!-- Coffee Mug -->
  <rect x="120" y="330" width="35" height="45" rx="4" fill="#94a3b8"/>
  <path d="M 155 340 C 170 340, 170 365, 155 365" fill="none" stroke="#94a3b8" stroke-width="3"/>

  <!-- Warning Banner -->
  <rect x="50" y="30" width="500" height="80" rx="10" fill="#7f1d1d" fill-opacity="0.9" stroke="#ef4444" stroke-width="2"/>
  <text x="300" y="60" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#fecaca" text-anchor="middle">NEGATIVE TEST: NO PRE-PACKAGED COMMODITY DETECTED</text>
  <text x="300" y="88" font-family="Arial, sans-serif" font-size="12" fill="#ffffff" text-anchor="middle">Indoor webcam field of view. Rule engine will return NO_PACKAGE_DETECTED.</text>
</svg>`);

// -------------------------------------------------------------
// COMPREHENSIVE PREDEFINED DEMO CATALOG
// -------------------------------------------------------------
export const PREDEFINED_DEMO_PACKAGES: DemoPackagePreset[] = [
  {
    id: 'demo-compliant-cookies',
    title: 'Crunchy Wholegrain Oats Cookies',
    subtitle: '100% Compliant Standard Consumer Package (Rule 6 & Schedule II)',
    productName: 'Crunchy Wholegrain Oats Cookies',
    brand: 'Aura Organics Foods',
    category: 'Food',
    barcode: '8901234567890',
    packageLevel: 'RETAIL_CONSUMER',
    expectedStatus: 'PASS',
    badgeLabel: 'Clean Statutory Pass (Score 98%)',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Statutory benchmark sample containing all 9 mandatory declarations: Generic Name, Net Quantity in standard units, valid MRP with tax statement, Unit Sale Price (USP), complete packer address with PIN, manufacturing month/year, batch code, country of origin, and Consumer Care helpline.',
    calibMethod: 'REFERENCE_OBJECT',
    selectedRefObject: 'INR_5_COIN',
    predefinedFields: [
      { field: 'product_name', label: 'Generic Name', value: 'Wholegrain Oats Cookies', status: 'PASS', panel: 'Front', ruleCitation: 'Rule 6(1)(a)' },
      { field: 'net_quantity', label: 'Net Quantity', value: '200 g (2 x 100g Packs)', status: 'PASS', panel: 'Front', ruleCitation: 'Rule 6(1)(b) & Rule 11' },
      { field: 'mrp', label: 'Maximum Retail Price', value: '₹75.00 (Incl. of all taxes)', status: 'PASS', panel: 'Back', ruleCitation: 'Rule 6(1)(e)' },
      { field: 'unit_sale_price', label: 'Unit Sale Price (USP)', value: '₹0.38 / g', status: 'PASS', panel: 'Back', ruleCitation: 'Rule 6(11)' },
      { field: 'manufacturer_name', label: 'Manufacturer & Packer', value: 'Aura Organics Foods Pvt Ltd, Bengaluru 560058', status: 'PASS', panel: 'Back', ruleCitation: 'Rule 6(1)(aa)' },
      { field: 'mfg_date', label: 'Date of Packaging', value: '04/2026', status: 'PASS', panel: 'Back', ruleCitation: 'Rule 6(1)(d)' },
      { field: 'batch_number', label: 'Batch / Lot No', value: 'AO-2026-B84', status: 'PASS', panel: 'Back', ruleCitation: 'Rule 6(1)(g)' },
      { field: 'consumer_care', label: 'Consumer Grievance Cell', value: '1800-425-9988 | care@auraorganics.in', status: 'PASS', panel: 'Back', ruleCitation: 'Rule 6(1)(n)' },
      { field: 'country_of_origin', label: 'Country of Origin', value: 'India', status: 'PASS', panel: 'Back', ruleCitation: 'Rule 6(1)(f)' }
    ],
    images: [
      {
        id: 'img-demo-cookies-front',
        type: 'Front',
        name: 'aura_cookies_front.svg',
        url: SVG_COOKIES_FRONT,
        quality: { overall: 'GOOD', blurScore: 94, contrastScore: 92, brightnessScore: 88, resolution: '1920x1080', issues: [] }
      },
      {
        id: 'img-demo-cookies-back',
        type: 'Back',
        name: 'aura_cookies_back.svg',
        url: SVG_COOKIES_BACK,
        quality: { overall: 'GOOD', blurScore: 96, contrastScore: 94, brightnessScore: 90, resolution: '1920x1080', issues: [] }
      }
    ]
  },
  {
    id: 'demo-violation-shampoo',
    title: 'Silk Glow Herbal Shampoo (Missing CC & Bad MRP)',
    subtitle: 'Section 36 Statutory Non-Compliance (Zero-Tolerance Violation)',
    productName: 'Silk Glow Herbal Shampoo',
    brand: 'Radiant Cosmetics',
    category: 'Cosmetics',
    barcode: '8909876543210',
    packageLevel: 'RETAIL_CONSUMER',
    expectedStatus: 'FAIL',
    badgeLabel: 'Statutory Defect (Score 35%)',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    description: 'Real-world non-compliant sample demonstrating multiple statutory defects: absent Consumer Care redressal cell (Rule 6(1)(n)), raw number price without MRP or tax declaration ("Price: 199"), incomplete manufacturer address missing postal PIN code, and manufacturing date missing the mandatory month ("2026").',
    calibMethod: 'NONE',
    predefinedFields: [
      { field: 'product_name', label: 'Generic Name', value: 'Silk Glow Shampoo', status: 'PASS', panel: 'Front', ruleCitation: 'Rule 6(1)(a)' },
      { field: 'net_quantity', label: 'Net Volume', value: '200 ml', status: 'PASS', panel: 'Front', ruleCitation: 'Rule 6(1)(b)' },
      { field: 'mrp', label: 'Price Declaration', value: 'Price: 199 (Missing MRP / Taxes)', status: 'FAIL', panel: 'Back', ruleCitation: 'Rule 6(1)(e)', note: 'Violates mandatory format' },
      { field: 'consumer_care', label: 'Consumer Care Cell', value: 'NOT PRINTED (ABSENT)', status: 'FAIL', panel: 'Back', ruleCitation: 'Rule 6(1)(n)', note: 'Strict liability offense under Sec 36' },
      { field: 'mfg_date', label: 'Packaging Date', value: '2026 (Month Missing)', status: 'FAIL', panel: 'Back', ruleCitation: 'Rule 6(1)(d)' },
      { field: 'manufacturer_name', label: 'Manufacturer Address', value: 'Mumbai (Incomplete PIN)', status: 'FLAGGED', panel: 'Back', ruleCitation: 'Rule 6(1)(aa)' }
    ],
    images: [
      {
        id: 'img-demo-shampoo-front',
        type: 'Front',
        name: 'shampoo_front.svg',
        url: SVG_SHAMPOO_FRONT,
        quality: { overall: 'GOOD', blurScore: 92, contrastScore: 89, brightnessScore: 86, resolution: '1920x1080', issues: [] }
      },
      {
        id: 'img-demo-shampoo-back',
        type: 'Back',
        name: 'shampoo_back_violation.svg',
        url: SVG_SHAMPOO_BACK,
        quality: { overall: 'GOOD', blurScore: 90, contrastScore: 88, brightnessScore: 85, resolution: '1920x1080', issues: [] }
      }
    ]
  },
  {
    id: 'demo-fresh-milk',
    title: 'Amul Taaza Fresh Toned Milk (Dairy Pouch)',
    subtitle: 'High-Volume Dairy Commodity Screening (1000ml Pouch)',
    productName: 'Amul Taaza Fresh Toned Milk',
    brand: 'Amul (GCMMF)',
    category: 'Food',
    barcode: '8901262010053',
    packageLevel: 'RETAIL_CONSUMER',
    expectedStatus: 'PASS',
    badgeLabel: 'Dairy Standards (Score 95%)',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
    description: 'Dairy commodity pouch with complete metric volume declaration (1000 ml / 1 L), standard MRP formatting (₹54.00 Incl. of all taxes), Unit Sale Price (₹0.054/ml), Gujarat Cooperative packer address, and nationwide customer care phone.',
    calibMethod: 'REFERENCE_OBJECT',
    selectedRefObject: 'INR_5_COIN',
    predefinedFields: [
      { field: 'product_name', label: 'Product Name', value: 'Amul Taaza Pasteurised Toned Milk', status: 'PASS', panel: 'Front', ruleCitation: 'Rule 6(1)(a)' },
      { field: 'net_quantity', label: 'Net Volume', value: '1000 ml (1 L)', status: 'PASS', panel: 'Front', ruleCitation: 'Rule 11' },
      { field: 'mrp', label: 'MRP', value: 'Rs. 54.00 (Incl. of all taxes)', status: 'PASS', panel: 'Front', ruleCitation: 'Rule 6(1)(e)' },
      { field: 'unit_sale_price', label: 'Unit Sale Price', value: '₹0.054 / ml', status: 'PASS', panel: 'Front', ruleCitation: 'Rule 6(11)' },
      { field: 'manufacturer_name', label: 'Packer / Marketer', value: 'GCMMF Ltd, Anand 388001', status: 'PASS', panel: 'Front', ruleCitation: 'Rule 6(1)(aa)' },
      { field: 'mfg_date', label: 'Date of Packing', value: '03/2026', status: 'PASS', panel: 'Front', ruleCitation: 'Rule 6(1)(d)' },
      { field: 'consumer_care', label: 'Helpline', value: '1800-258-3333 | customercare@amul.coop', status: 'PASS', panel: 'Back', ruleCitation: 'Rule 6(1)(n)' }
    ],
    images: [
      {
        id: 'img-demo-milk-front',
        type: 'Front',
        name: 'amul_taaza_front.svg',
        url: SVG_MILK_FRONT,
        quality: { overall: 'GOOD', blurScore: 95, contrastScore: 92, brightnessScore: 90, resolution: '1920x1080', issues: [] }
      },
      {
        id: 'img-demo-milk-back',
        type: 'Back',
        name: 'amul_taaza_back.svg',
        url: SVG_MILK_BACK,
        quality: { overall: 'GOOD', blurScore: 94, contrastScore: 90, brightnessScore: 88, resolution: '1920x1080', issues: [] }
      }
    ]
  },
  {
    id: 'demo-bulk-carton',
    title: 'Wholesale Master Shipper Carton (Chapter III Rules 24–26)',
    subtitle: 'Outer Bulk Packaging Case (24 Retail Units × 100g)',
    productName: 'Aura Organics Wholesale Master Shipper Carton',
    brand: 'Aura Organics Foods',
    category: 'Food',
    barcode: '18901030998121',
    packageLevel: 'BULK_BOX',
    expectedStatus: 'PASS',
    badgeLabel: 'Chapter III Compliant (Score 100%)',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'Bulk master shipping container verifying Chapter III Legal Metrology provisions: retail unit count declaration ("CONTAINS: 24 RETAIL UNITS × 100g"), Total Net Mass (2.40 kg), Total Gross Weight (2.75 kg), ITF-14 shipper barcode, and wholesale disclaimer.',
    calibMethod: 'DECLARED_DIMENSIONS',
    declaredDims: { width: 380, height: 420, depth: 250 },
    bulkDetails: {
      unitsCount: 24,
      unitNetMass: '100 g',
      totalGrossWeight: '2.75 kg',
      masterBarcode: '18901030998121'
    },
    predefinedFields: [
      { field: 'bulk_box_declarations', label: 'Wholesale Shipper Case', value: 'Rule 24 Compliant', status: 'PASS', panel: 'Carton', ruleCitation: 'Rule 24' },
      { field: 'net_quantity', label: 'Inner Units & Mass', value: '24 units × 100g (Net 2.40 kg)', status: 'PASS', panel: 'Carton', ruleCitation: 'Rule 24(a)' },
      { field: 'mrp', label: 'Wholesale Price', value: 'MRP ₹50.00 / unit (Total ₹1,200)', status: 'PASS', panel: 'Carton', ruleCitation: 'Rule 24(c)' },
      { field: 'manufacturer_name', label: 'Manufacturer Address', value: 'Aura Organics Foods, Bengaluru 560058', status: 'PASS', panel: 'Carton', ruleCitation: 'Rule 24(b)' }
    ],
    images: [
      {
        id: 'img-demo-carton-outer',
        type: 'Front',
        name: 'wholesale_master_carton.svg',
        url: SVG_WHOLESALE_CARTON,
        quality: { overall: 'GOOD', blurScore: 97, contrastScore: 95, brightnessScore: 91, resolution: '1920x1080', issues: [] }
      }
    ]
  },
  {
    id: 'demo-spice-glare',
    title: 'Instant Masala Spice Mix (Camera Glare Ambiguity)',
    subtitle: 'Low Contrast & Specular Reflection Edge Case',
    productName: 'Instant Masala Spice Mix',
    brand: 'Spice Harvest',
    category: 'Food',
    barcode: '8903334445551',
    packageLevel: 'RETAIL_CONSUMER',
    expectedStatus: 'REVIEW',
    badgeLabel: 'Officer Review (Score 64%)',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'Simulates challenging field conditions with high specular glare over the Price and Quantity zones. The AI flags OCR confidence drops and safely routes the inspection to Officer REVIEW rather than false-passing.',
    calibMethod: 'NONE',
    predefinedFields: [
      { field: 'product_name', label: 'Product Name', value: 'Instant Masala Spice Mix', status: 'PASS', panel: 'Front', ruleCitation: 'Rule 6(1)(a)' },
      { field: 'net_quantity', label: 'Net Quantity', value: '~50g (Low OCR Confidence 58%)', status: 'FLAGGED', panel: 'Front', ruleCitation: 'Rule 6(1)(b)', note: 'Partial glare obstruction' },
      { field: 'mrp', label: 'MRP', value: 'Rs. 3? (Occluded by Glare)', status: 'FLAGGED', panel: 'Front', ruleCitation: 'Rule 6(1)(e)', note: 'Flash reflection artifact' }
    ],
    images: [
      {
        id: 'img-demo-spice-front',
        type: 'Front',
        name: 'spice_masala_glare.svg',
        url: SVG_SPICE_FRONT,
        quality: { overall: 'POOR', blurScore: 68, contrastScore: 62, brightnessScore: 94, resolution: '1920x1080', issues: ['Specular glare over price label'] }
      }
    ]
  },
  {
    id: 'demo-protein-contradiction',
    title: 'Crunchy Protein Bites (Contradiction Conflict Test)',
    subtitle: 'Cross-Image Multi-View Intelligence (Front 100g vs Back 80g)',
    productName: 'Crunchy Protein Bites',
    brand: 'NutriFit Foods',
    category: 'Food',
    barcode: '8904561237895',
    packageLevel: 'RETAIL_CONSUMER',
    expectedStatus: 'REVIEW',
    badgeLabel: 'Contradiction Flagged (Score 68%)',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    description: 'Designed to test Multi-View consistency. The front panel declares "100 g", while the back statutory table declares "80 g". The Cross-Image Intelligence engine catches the discrepancy and alerts the officer.',
    calibMethod: 'DECLARED_DIMENSIONS',
    declaredDims: { width: 140, height: 200, depth: 35 },
    predefinedFields: [
      { field: 'net_quantity', label: 'Front Panel Net Qty', value: '100 g', status: 'FLAGGED', panel: 'Front', ruleCitation: 'Rule 6(1)(b)' },
      { field: 'net_quantity', label: 'Back Panel Net Qty', value: '80 g (Discrepancy)', status: 'FLAGGED', panel: 'Back', ruleCitation: 'Rule 11', note: 'Contradicts front panel declaration' },
      { field: 'mrp', label: 'MRP', value: '₹99.00 (Incl. of all taxes)', status: 'PASS', panel: 'Back', ruleCitation: 'Rule 6(1)(e)' }
    ],
    images: [
      {
        id: 'img-demo-protein-front',
        type: 'Front',
        name: 'protein_front_100g.svg',
        url: SVG_PROTEIN_FRONT,
        quality: { overall: 'GOOD', blurScore: 91, contrastScore: 89, brightnessScore: 86, resolution: '1920x1080', issues: [] }
      },
      {
        id: 'img-demo-protein-back',
        type: 'Back',
        name: 'protein_back_80g.svg',
        url: SVG_PROTEIN_BACK,
        quality: { overall: 'GOOD', blurScore: 92, contrastScore: 90, brightnessScore: 87, resolution: '1920x1080', issues: [] }
      }
    ]
  },
  {
    id: 'demo-atta-flour',
    title: 'FarmFresh Sharbati Chakki Atta (5kg Flour Bag)',
    subtitle: 'Staple Grain Commodity Packaging Compliance',
    productName: 'FarmFresh Sharbati Chakki Atta 5kg',
    brand: 'FarmFresh Agro',
    category: 'Food',
    barcode: '8907778889991',
    packageLevel: 'RETAIL_CONSUMER',
    expectedStatus: 'PASS',
    badgeLabel: 'Clean Pass (Score 100%)',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Bulk consumer staple flour packaging with high mass declarations (5 kg), per-kilogram Unit Sale Price (₹52.00/kg), complete roller mill address in Madhya Pradesh, and verified customer care details.',
    calibMethod: 'REFERENCE_OBJECT',
    selectedRefObject: 'INR_5_COIN',
    predefinedFields: [
      { field: 'product_name', label: 'Product Name', value: '100% Sharbati Chakki Fresh Atta', status: 'PASS', panel: 'Front', ruleCitation: 'Rule 6(1)(a)' },
      { field: 'net_quantity', label: 'Net Quantity', value: '5 kg', status: 'PASS', panel: 'Front', ruleCitation: 'Rule 11' },
      { field: 'mrp', label: 'MRP', value: '₹260.00 (Incl. of all taxes)', status: 'PASS', panel: 'Front', ruleCitation: 'Rule 6(1)(e)' },
      { field: 'unit_sale_price', label: 'USP', value: '₹52.00 / kg', status: 'PASS', panel: 'Front', ruleCitation: 'Rule 6(11)' },
      { field: 'manufacturer_name', label: 'Mill Address', value: 'FarmFresh Agro Mills, Sehore, MP - 466001', status: 'PASS', panel: 'Front', ruleCitation: 'Rule 6(1)(aa)' }
    ],
    images: [
      {
        id: 'img-demo-atta-front',
        type: 'Front',
        name: 'farmfresh_atta_5kg.svg',
        url: SVG_ATTA_FRONT,
        quality: { overall: 'GOOD', blurScore: 95, contrastScore: 92, brightnessScore: 90, resolution: '1920x1080', issues: [] }
      }
    ]
  },
  {
    id: 'demo-orange-juice',
    title: 'Pure Sip 100% Valencia Orange Juice (1L Tetra-Pak)',
    subtitle: 'Aseptic Beverage Packaging with Unit Sale Price',
    productName: 'Pure Sip 100% Valencia Orange Juice',
    brand: 'Pure Sip Beverages',
    category: 'Beverages',
    barcode: '8902221113334',
    packageLevel: 'RETAIL_CONSUMER',
    expectedStatus: 'PASS',
    badgeLabel: 'Clean Pass (Score 98%)',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Beverage aseptic carton declaring Net Volume (1 L / 1000 ml), Unit Sale Price (₹0.135/ml), MRP ₹135.00, bottling address in Bengaluru, and 24-hour grievance helpline.',
    calibMethod: 'DECLARED_DIMENSIONS',
    declaredDims: { width: 90, height: 210, depth: 60 },
    predefinedFields: [
      { field: 'product_name', label: 'Product Name', value: '100% Valencia Orange Juice', status: 'PASS', panel: 'Front', ruleCitation: 'Rule 6(1)(a)' },
      { field: 'net_quantity', label: 'Net Volume', value: '1 L (1000 ml)', status: 'PASS', panel: 'Front', ruleCitation: 'Rule 11' },
      { field: 'mrp', label: 'MRP', value: '₹135.00 (Incl. of all taxes)', status: 'PASS', panel: 'Front', ruleCitation: 'Rule 6(1)(e)' },
      { field: 'unit_sale_price', label: 'Unit Sale Price', value: '₹0.135 / ml', status: 'PASS', panel: 'Front', ruleCitation: 'Rule 6(11)' }
    ],
    images: [
      {
        id: 'img-demo-juice-front',
        type: 'Front',
        name: 'orange_juice_1L.svg',
        url: SVG_JUICE_FRONT,
        quality: { overall: 'GOOD', blurScore: 96, contrastScore: 94, brightnessScore: 91, resolution: '1920x1080', issues: [] }
      }
    ]
  },
  {
    id: 'demo-almonds-pouch',
    title: 'NutriFit California Whole Almonds (200g)',
    subtitle: 'Imported Commodity Repackaged in India',
    productName: 'NutriFit California Whole Almonds',
    brand: 'NutriFit Premium',
    category: 'Food',
    barcode: '8905556667778',
    packageLevel: 'RETAIL_CONSUMER',
    expectedStatus: 'PASS',
    badgeLabel: 'Clean Pass (Score 98%)',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Repackaged imported dry fruit package declaring Country of Origin (USA), Indian packer address in Navi Mumbai, Net Weight (200 g), and Unit Sale Price (₹1.20/g).',
    calibMethod: 'REFERENCE_OBJECT',
    selectedRefObject: 'INR_5_COIN',
    predefinedFields: [
      { field: 'product_name', label: 'Product Name', value: 'California Whole Almonds', status: 'PASS', panel: 'Front', ruleCitation: 'Rule 6(1)(a)' },
      { field: 'net_quantity', label: 'Net Weight', value: '200 g', status: 'PASS', panel: 'Front', ruleCitation: 'Rule 11' },
      { field: 'country_of_origin', label: 'Country of Origin', value: 'USA (Packed in India)', status: 'PASS', panel: 'Front', ruleCitation: 'Rule 6(1)(f)' },
      { field: 'mrp', label: 'MRP', value: '₹240.00 (Incl. of all taxes)', status: 'PASS', panel: 'Front', ruleCitation: 'Rule 6(1)(e)' }
    ],
    images: [
      {
        id: 'img-demo-almonds-front',
        type: 'Front',
        name: 'almonds_pouch_200g.svg',
        url: SVG_ALMONDS_FRONT,
        quality: { overall: 'GOOD', blurScore: 94, contrastScore: 91, brightnessScore: 89, resolution: '1920x1080', issues: [] }
      }
    ]
  },
  {
    id: 'demo-webcam-scene',
    title: 'Office Webcam Capture (Non-Commodity Photo)',
    subtitle: 'Zero-Package Optical Negative Detection Baseline',
    productName: 'Office Webcam Capture (Non-Commodity Photo)',
    brand: 'N/A',
    category: 'Other',
    barcode: 'UNASSIGNED',
    packageLevel: 'RETAIL_CONSUMER',
    expectedStatus: 'NO_PACKAGE_DETECTED',
    badgeLabel: 'Negative Detection (Score 0%)',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    description: 'Indoor office scene containing computer monitor, desk, and keyboard without consumer packaged commodities. Verifies that the AI vision model halts extraction and issues NO_PACKAGE_DETECTED.',
    calibMethod: 'NONE',
    predefinedFields: [],
    images: [
      {
        id: 'img-demo-webcam',
        type: 'Front',
        name: 'webcam_stream.svg',
        url: SVG_WEBCAM_SCENE,
        quality: { overall: 'POOR', blurScore: 50, contrastScore: 55, brightnessScore: 60, resolution: '640x480', issues: ['No pre-packaged commodity detected in camera field'] }
      }
    ]
  }
];

// Helper to look up demo preset by id or fuzzy name
export function findDemoPackage(idOrName: string): DemoPackagePreset | undefined {
  const query = idOrName.toLowerCase().trim();
  return PREDEFINED_DEMO_PACKAGES.find(
    (pkg) =>
      pkg.id.toLowerCase() === query ||
      pkg.productName.toLowerCase().includes(query) ||
      pkg.title.toLowerCase().includes(query) ||
      pkg.brand.toLowerCase().includes(query)
  );
}

// Fallback images for any product name
export function getDemoImagesForProduct(productName: string, category: string = 'Food'): InspectionImage[] {
  const match = findDemoPackage(productName);
  if (match && match.images.length > 0) {
    return match.images;
  }
  // Default to compliant cookies if unknown
  return PREDEFINED_DEMO_PACKAGES[0].images;
}

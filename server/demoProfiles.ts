import { ExtractedDeclaration, InspectionImage } from '../src/types/index';
import type { MultimodalAnalysisResult } from './geminiService';

const DEMO_PROFILE_KIND_BY_ID: Record<string, string> = {
  'demo-webcam-scene': 'webcam',
  'demo-britannia-nutrichoice': 'britannia',
  'demo-fresh-milk': 'milk',
  'demo-bulk-carton': 'bulk',
  'demo-spice-glare': 'spice',
  'demo-atta-flour': 'atta',
  'demo-orange-juice': 'juice',
  'demo-almonds-pouch': 'almonds',
  'demo-violation-shampoo': 'violation',
  'demo-protein-contradiction': 'contradiction',
  'demo-compliant-cookies': 'aura',
};

export function isDemoPresetId(demoPresetId: string): boolean {
  return Object.prototype.hasOwnProperty.call(DEMO_PROFILE_KIND_BY_ID, demoPresetId);
}

export function getDemoFallbackExtraction(
  demoPresetId: string | undefined,
  images: InspectionImage[]
): MultimodalAnalysisResult | undefined {
  if (!demoPresetId) return undefined;
  const profileKind = DEMO_PROFILE_KIND_BY_ID[demoPresetId];
  if (!profileKind) return undefined;
  const frontImg = images.find((i) => i.type === 'Front') || images[0] || { id: 'img-front', type: 'Front', url: '', name: '' };
  const backImg = images.find((i) => i.type === 'Back') || images[1] || frontImg;

  // 0. Negative Detection Baseline
  if (profileKind === 'webcam') {
    return {
      is_package_detected: false,
      product: { name: "Office Workspace Tabletop", brand: "N/A", category: "Other" },
      declarations: [],
      image_quality: {
        overall: "POOR",
        issues: ["Zero retail pre-packaged commodities detected in optical camera frame."]
      },
      warnings: ["No consumer packaging label detected. Screening halted under SIH PS 26034 Protocol 1."],
      ai_notes: "Negative detection baseline: Indoor non-commodity desktop environment verified.",
      is_fallback: true
    };
  }

  // 1. If it is an explicit preset demo, load the exact demonstration profile
  if (profileKind === 'britannia') {
    const prodName = "Digestive Biscuits";
    const brandName = "Britannia";
    return {
      is_package_detected: true,
      product: { name: prodName, brand: brandName, category: "Food" },
      declarations: [
        {
          id: "decl-front-brand",
          field: "brand_name",
          label: "Brand Name / Trademark",
          original_text: "BRITANNIA",
          normalized_value: "Britannia",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [365, 290, 412, 405],
          bbox: { ymin: 36.5, xmin: 29.0, ymax: 41.2, xmax: 40.5 },
          notes: "Registered trademark 'BRITANNIA' clearly displayed in principal red oval on front panel."
        },
        {
          id: "decl-front-subbrand",
          field: "sub_brand",
          label: "Sub-Brand / Product Line",
          original_text: "nutri CHOICE",
          normalized_value: "NutriChoice",
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [422, 285, 532, 480],
          bbox: { ymin: 42.2, xmin: 28.5, ymax: 53.2, xmax: 48.0 },
          notes: "Prominent sub-brand 'nutri CHOICE' on Principal Display Panel."
        },
        {
          id: "decl-front-prodname",
          field: "product_name",
          label: "Generic / Common Commodity Name",
          original_text: "Digestive",
          normalized_value: "Digestive Biscuits",
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [542, 335, 586, 478],
          bbox: { ymin: 54.2, xmin: 33.5, ymax: 58.6, xmax: 47.8 },
          notes: "Generic commodity name 'Digestive Biscuits' displayed on Principal Display Panel under Rule 6(1)(a)."
        },
        {
          id: "decl-front-veg",
          field: "veg_non_veg",
          label: "Dietary Classification Mark",
          original_text: "Vegetarian Symbol (Green Dot in Square)",
          normalized_value: "100% Vegetarian",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [596, 285, 638, 318],
          bbox: { ymin: 59.6, xmin: 28.5, ymax: 63.8, xmax: 31.8 },
          notes: "Statutory green dot inside green square symbol verifying 100% vegetarian commodity."
        },
        {
          id: "decl-front-claim",
          field: "front_claims",
          label: "Front Dietary / Statutory Claim",
          original_text: "HI-Fibre",
          normalized_value: "High Dietary Fibre",
          found: true,
          status: "FOUND",
          confidence: 0.97,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [596, 325, 638, 410],
          bbox: { ymin: 59.6, xmin: 32.5, ymax: 63.8, xmax: 41.0 },
          notes: "Front-of-pack nutritional qualifier prominently displayed."
        },
        {
          id: "decl-back-ccphone",
          field: "consumer_care_phone",
          label: "Consumer Care Helpline Number",
          original_text: "1-800-4254449 / 1-800-30004530",
          normalized_value: "1800-425-4449",
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [182, 580, 214, 780],
          bbox: { ymin: 18.2, xmin: 58.0, ymax: 21.4, xmax: 78.0 },
          notes: "Toll-free customer care contact helpline."
        },
        {
          id: "decl-back-mfg",
          field: "manufacturer_name",
          label: "Manufacturer Name & Complete Address",
          original_text: "Britannia Industries Ltd., Prestige Shanthiniketan, Tower C, Whitefield, Bangalore-560048, Karnataka",
          normalized_value: "Britannia Industries Ltd., Prestige Shanthiniketan, Whitefield, Bangalore 560048",
          found: true,
          status: "FOUND",
          confidence: 0.96,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [222, 225, 258, 780],
          bbox: { ymin: 22.2, xmin: 22.5, ymax: 25.8, xmax: 78.0 },
          notes: "Full registered address with PIN code compliant with Rule 6(1)(a)."
        },
        {
          id: "decl-back-cc",
          field: "consumer_care",
          label: "Consumer Care Officer & Email",
          original_text: "Consumer Care Cell, Britannia Industries Ltd., Bangalore 560048 | feedback@britindia.com",
          normalized_value: "Executive, Care Cell, feedback@britindia.com",
          found: true,
          status: "FOUND",
          confidence: 0.96,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [264, 225, 302, 780],
          bbox: { ymin: 26.4, xmin: 22.5, ymax: 30.2, xmax: 78.0 },
          notes: "Dedicated consumer grievance cell address and grievance email."
        },
        {
          id: "decl-back-netqty",
          field: "net_quantity",
          label: "Net Quantity",
          original_text: "Net Quantity: 100g",
          normalized_value: "100 g",
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [502, 600, 536, 775],
          bbox: { ymin: 50.2, xmin: 60.0, ymax: 53.6, xmax: 77.5 },
          notes: "Net weight 100g compliant with standard unit rules."
        },
        {
          id: "decl-back-mrp",
          field: "mrp",
          label: "Maximum Retail Price (MRP)",
          original_text: "MRP ₹25.00 (Incl. of all taxes)",
          normalized_value: "25.00 INR",
          found: true,
          status: "FOUND",
          confidence: 0.96,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [544, 535, 584, 775],
          bbox: { ymin: 54.4, xmin: 53.5, ymax: 58.4, xmax: 77.5 },
          notes: "Statutory Maximum Retail Price with inclusive of all taxes wording."
        },
        {
          id: "decl-back-usp",
          field: "unit_sale_price",
          label: "Unit Sale Price (USP)",
          original_text: "Unit Sale Price: ₹0.25 / g",
          normalized_value: "0.25 INR/g",
          found: true,
          status: "FOUND",
          confidence: 0.95,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [592, 535, 632, 775],
          bbox: { ymin: 59.2, xmin: 53.5, ymax: 63.2, xmax: 77.5 },
          notes: "Per unit sale price declared compliant with Rule 6(11)."
        },
        {
          id: "decl-back-bb",
          field: "best_before",
          label: "Best Before / Date of Packaging",
          original_text: "BEST BEFORE SIX MONTHS FROM PACKAGING",
          normalized_value: "6 Months",
          found: true,
          status: "FOUND",
          confidence: 0.97,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [640, 535, 680, 775],
          bbox: { ymin: 64.0, xmin: 53.5, ymax: 68.0, xmax: 77.5 },
          notes: "Statutory shelf-life / best before declaration."
        },
        {
          id: "decl-back-barcode",
          field: "barcode",
          label: "Barcode / GTIN Number",
          original_text: "8 901063 142015",
          normalized_value: "8901063142015",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [658, 240, 715, 460],
          bbox: { ymin: 65.8, xmin: 24.0, ymax: 71.5, xmax: 46.0 },
          notes: "13-digit standard EAN-13 commodity barcode."
        },
        {
          id: "decl-back-origin",
          field: "country_of_origin",
          label: "Country of Origin",
          original_text: "Country of Origin: India",
          normalized_value: "India",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [732, 235, 768, 480],
          bbox: { ymin: 73.2, xmin: 23.5, ymax: 76.8, xmax: 48.0 },
          notes: "Statutory country of origin declaration under Rule 6(1)(a)."
        }
      ],
      image_quality: { overall: "GOOD", issues: [] },
      warnings: [],
      ai_notes: "Calibrated high-precision optical scan for Britannia NutriChoice Digestive Biscuits. All front Principal Display Panel (PDP) and back mandatory declarations fully resolved with tight bounding boxes.",
      is_fallback: true
    };
  }

  if (profileKind === 'milk') {
    const prodName = "Amul Taaza Pasteurised Toned Milk";
    const brandName = "Amul (GCMMF)";
    return {
      is_package_detected: true,
      product: { name: prodName, brand: brandName, category: "Food" },
      declarations: [
        {
          id: "decl-milk-brand",
          field: "brand_name",
          label: "Brand Name / Trademark",
          original_text: "AMUL TAAZA",
          normalized_value: "Amul Taaza",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [75, 240, 122, 760],
          bbox: { ymin: 7.5, xmin: 24.0, ymax: 12.2, xmax: 76.0 }
        },
        {
          id: "decl-1",
          field: "product_name",
          label: "Generic / Common Product Name",
          original_text: "PASTEURISED TONED MILK",
          normalized_value: prodName,
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [138, 200, 178, 800],
          bbox: { ymin: 13.8, xmin: 20.0, ymax: 17.8, xmax: 80.0 }
        },
        {
          id: "decl-milk-claims",
          field: "front_claims",
          label: "Front Dietary / Statutory Claim",
          original_text: "MIN. 3.0% FAT | MIN. 8.5% SNF",
          normalized_value: "Min 3.0% Fat, Min 8.5% SNF",
          found: true,
          status: "FOUND",
          confidence: 0.96,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [455, 230, 492, 770],
          bbox: { ymin: 45.5, xmin: 23.0, ymax: 49.2, xmax: 77.0 }
        },
        {
          id: "decl-2",
          field: "net_quantity",
          label: "Net Quantity / Volume",
          original_text: "Net Volume: 1000 ml (1 L)",
          normalized_value: "1000 ml",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [660, 105, 695, 560],
          bbox: { ymin: 66.0, xmin: 10.5, ymax: 69.5, xmax: 56.0 }
        },
        {
          id: "decl-3",
          field: "mrp",
          label: "Maximum Retail Price (MRP)",
          original_text: "MRP Rs. 54.00 (Incl. of all taxes)",
          normalized_value: "54.00 INR",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [703, 105, 735, 620],
          bbox: { ymin: 70.3, xmin: 10.5, ymax: 73.5, xmax: 62.0 }
        },
        {
          id: "decl-4",
          field: "unit_sale_price",
          label: "Unit Sale Price (USP)",
          original_text: "Unit Sale Price: ₹0.054 / ml",
          normalized_value: "0.054 INR/ml",
          found: true,
          status: "FOUND",
          confidence: 0.96,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [743, 105, 772, 500],
          bbox: { ymin: 74.3, xmin: 10.5, ymax: 77.2, xmax: 50.0 }
        },
        {
          id: "decl-6",
          field: "mfg_date",
          label: "Month & Year of Manufacture",
          original_text: "Mfg / Pkd: 03/2026 | BATCH: AMUL-TONED-091",
          normalized_value: "MAR-2026",
          found: true,
          status: "FOUND",
          confidence: 0.97,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [780, 105, 808, 640],
          bbox: { ymin: 78.0, xmin: 10.5, ymax: 80.8, xmax: 64.0 }
        },
        {
          id: "decl-5",
          field: "manufacturer_name",
          label: "Manufacturer / Packer Name & Address",
          original_text: "Marketed by: Gujarat Cooperative Milk Marketing Federation Ltd, Anand 388001",
          normalized_value: "GCMMF Ltd., Anand - 388001, Gujarat",
          found: true,
          status: "FOUND",
          confidence: 0.97,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [812, 105, 838, 910],
          bbox: { ymin: 81.2, xmin: 10.5, ymax: 83.8, xmax: 91.0 }
        },
        {
          id: "decl-9",
          field: "country_of_origin",
          label: "Country of Origin",
          original_text: "Country of Origin: India",
          normalized_value: "India",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [872, 105, 898, 400],
          bbox: { ymin: 87.2, xmin: 10.5, ymax: 89.8, xmax: 40.0 }
        },
        {
          id: "decl-8",
          field: "consumer_care",
          label: "Consumer Care Details",
          original_text: "CONSUMER GRIEVANCE REDRESSAL CELL: Toll Free: 1800-258-3333 | Email: customercare@amul.coop",
          normalized_value: "GCMMF Consumer Cell: 1800-258-3333, customercare@amul.coop",
          found: true,
          status: "FOUND",
          confidence: 0.96,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [373, 108, 520, 892],
          bbox: { ymin: 37.3, xmin: 10.8, ymax: 52.0, xmax: 89.2 }
        },
        {
          id: "decl-milk-barcode",
          field: "barcode",
          label: "Barcode / GTIN Number",
          original_text: "8901262010053",
          normalized_value: "8901262010053",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [593, 117, 660, 483],
          bbox: { ymin: 59.3, xmin: 11.7, ymax: 66.0, xmax: 48.3 }
        }
      ],
      image_quality: { overall: "GOOD", issues: [] },
      warnings: [],
      ai_notes: "Calibrated demo: High-volume dairy pouch meeting all statutory provisions under Rule 6, 11 & Rule 26 exemption for standard milk.",
      is_fallback: true
    };
  }

  if (profileKind === 'bulk') {
    const prodName = "Aura Organics Wholesale Master Shipper Carton";
    const brandName = "Aura Organics Foods";
    return {
      is_package_detected: true,
      product: { name: prodName, brand: brandName, category: "Food" },
      declarations: [
        {
          id: "decl-1",
          field: "product_name",
          label: "Generic / Common Product Name",
          original_text: "AURA ORGANICS OATS DIGESTIVE COOKIES (WHOLESALE)",
          normalized_value: prodName,
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [300, 95, 338, 880],
          bbox: { ymin: 30.0, xmin: 9.5, ymax: 33.8, xmax: 88.0 }
        },
        {
          id: "decl-bulk-brand",
          field: "brand_name",
          label: "Brand Name / Trademark",
          original_text: "Brand: Aura Organics",
          normalized_value: "Aura Organics",
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [342, 95, 370, 680],
          bbox: { ymin: 34.2, xmin: 9.5, ymax: 37.0, xmax: 68.0 }
        },
        {
          id: "decl-2",
          field: "net_quantity",
          label: "Wholesale Inner Retail Units & Total Mass",
          original_text: "CONTAINS: 24 RETAIL CONSUMER PACKS × 100g EACH | TOTAL NET MASS: 2.40 kg",
          normalized_value: "24 units x 100 g",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [393, 69, 550, 931],
          bbox: { ymin: 39.3, xmin: 6.9, ymax: 55.0, xmax: 93.1 }
        },
        {
          id: "decl-4",
          field: "manufacturer_name",
          label: "Manufacturer & Shipper Address",
          original_text: "Aura Organics Foods Private Limited, Plot 42-B, Peenya Industrial Area, Phase II, Bengaluru, Karnataka - 560058, India",
          normalized_value: "Aura Organics Foods Pvt. Ltd., Peenya, Bengaluru 560058",
          found: true,
          status: "FOUND",
          confidence: 0.97,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [571, 69, 700, 931],
          bbox: { ymin: 57.1, xmin: 6.9, ymax: 70.0, xmax: 93.1 }
        },
        {
          id: "decl-3",
          field: "mrp",
          label: "Maximum Retail Price / Wholesale Value",
          original_text: "MRP ₹50.00 / unit | Total: ₹1,200.00",
          normalized_value: "1200.00 INR",
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [721, 69, 857, 485],
          bbox: { ymin: 72.1, xmin: 6.9, ymax: 85.7, xmax: 48.5 }
        },
        {
          id: "decl-bulk-date",
          field: "mfg_date",
          label: "Month & Year of Packing",
          original_text: "Packed: 01/2026 | Batch: AURA-WH-091",
          normalized_value: "JAN-2026",
          found: true,
          status: "FOUND",
          confidence: 0.97,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [765, 520, 804, 915],
          bbox: { ymin: 76.5, xmin: 52.0, ymax: 80.4, xmax: 91.5 }
        },
        {
          id: "decl-bulk-barcode",
          field: "barcode",
          label: "Shipper ITF-14 Code",
          original_text: "ITF-14: 18901030998121",
          normalized_value: "18901030998121",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [812, 520, 848, 880],
          bbox: { ymin: 81.2, xmin: 52.0, ymax: 84.8, xmax: 88.0 }
        }
      ],
      image_quality: { overall: "GOOD", issues: [] },
      warnings: [],
      ai_notes: "Calibrated demo: Chapter III Wholesale Package (Rule 24) fully compliant with mandatory unit counts and gross mass.",
      is_fallback: true
    };
  }

  if (profileKind === 'spice') {
    const prodName = "Instant Masala Spice Mix";
    const brandName = "Spice Harvest";
    return {
      is_package_detected: true,
      product: { name: prodName, brand: brandName, category: "Food" },
      declarations: [
        {
          id: "decl-spice-brand",
          field: "brand_name",
          label: "Brand Name / Trademark",
          original_text: "SPICE HARVEST",
          normalized_value: "Spice Harvest",
          found: true,
          status: "FOUND",
          confidence: 0.96,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [85, 260, 130, 740],
          bbox: { ymin: 8.5, xmin: 26.0, ymax: 13.0, xmax: 74.0 }
        },
        {
          id: "decl-1",
          field: "product_name",
          label: "Generic / Common Product Name",
          original_text: "INSTANT MASALA SPICE MIX",
          normalized_value: prodName,
          found: true,
          status: "FOUND",
          confidence: 0.95,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [148, 220, 182, 780],
          bbox: { ymin: 14.8, xmin: 22.0, ymax: 18.2, xmax: 78.0 }
        },
        {
          id: "decl-2",
          field: "net_quantity",
          label: "Net Quantity (Low Contrast / Glare)",
          original_text: "Net Quantity: ~50g (Low OCR Confidence 58%)",
          normalized_value: "50 g",
          found: true,
          status: "UNCERTAIN",
          confidence: 0.58,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [710, 120, 746, 820],
          bbox: { ymin: 71.0, xmin: 12.0, ymax: 74.6, xmax: 82.0 }
        },
        {
          id: "decl-4",
          field: "manufacturer_name",
          label: "Manufacturer Name & Address",
          original_text: "Mfg: Spice Harvest Pvt Ltd, Jaipur, Rajasthan",
          normalized_value: "Spice Harvest Pvt Ltd, Jaipur, Rajasthan",
          found: true,
          status: "FOUND",
          confidence: 0.88,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [815, 120, 850, 720],
          bbox: { ymin: 81.5, xmin: 12.0, ymax: 85.0, xmax: 72.0 }
        }
      ],
      image_quality: { overall: "POOR", issues: ["Specular glare occlusion over price and quantity zones."] },
      warnings: ["Image Quality POOR: Specular glare over price zone. State routed to REVIEW for physical verification."],
      ai_notes: "Calibrated demo: Glare edge-case triggering automated REVIEW state to prevent false passes.",
      is_fallback: true
    };
  }

  if (profileKind === 'atta') {
    const prodName = "FarmFresh Sharbati Chakki Atta 5kg";
    const brandName = "FarmFresh Agro";
    return {
      is_package_detected: true,
      product: { name: prodName, brand: brandName, category: "Food" },
      declarations: [
        {
          id: "decl-atta-brand",
          field: "brand_name",
          label: "Brand Name / Trademark",
          original_text: "FARMFRESH AGRO",
          normalized_value: "FarmFresh Agro",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [75, 240, 124, 760],
          bbox: { ymin: 7.5, xmin: 24.0, ymax: 12.4, xmax: 76.0 }
        },
        {
          id: "decl-1",
          field: "product_name",
          label: "Generic / Common Product Name",
          original_text: "100% SHARBATI CHAKKI FRESH ATTA",
          normalized_value: "Sharbati Chakki Fresh Atta",
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [142, 160, 178, 840],
          bbox: { ymin: 14.2, xmin: 16.0, ymax: 17.8, xmax: 84.0 }
        },
        {
          id: "decl-2",
          field: "net_quantity",
          label: "Net Quantity",
          original_text: "Net Quantity: 5 kg",
          normalized_value: "5 kg",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [685, 110, 722, 480],
          bbox: { ymin: 68.5, xmin: 11.0, ymax: 72.2, xmax: 48.0 }
        },
        {
          id: "decl-3",
          field: "mrp",
          label: "Maximum Retail Price (MRP)",
          original_text: "MRP: ₹260.00 (Incl. of all taxes)",
          normalized_value: "260.00 INR",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [730, 110, 764, 600],
          bbox: { ymin: 73.0, xmin: 11.0, ymax: 76.4, xmax: 60.0 }
        },
        {
          id: "decl-4",
          field: "unit_sale_price",
          label: "Unit Sale Price (USP)",
          original_text: "Unit Sale Price: ₹52.00 / kg",
          normalized_value: "52.00 INR/kg",
          found: true,
          status: "FOUND",
          confidence: 0.97,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [768, 110, 796, 520],
          bbox: { ymin: 76.8, xmin: 11.0, ymax: 79.6, xmax: 52.0 }
        },
        {
          id: "decl-atta-date",
          field: "mfg_date",
          label: "Month & Year of Packaging",
          original_text: "Date of Pkg: 02/2026 | BATCH: FF-ATT-992",
          normalized_value: "FEB-2026",
          found: true,
          status: "FOUND",
          confidence: 0.97,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [800, 110, 826, 580],
          bbox: { ymin: 80.0, xmin: 11.0, ymax: 82.6, xmax: 58.0 }
        },
        {
          id: "decl-5",
          field: "manufacturer_name",
          label: "Manufacturer Name & Address",
          original_text: "Mfd by: FarmFresh Agro Mills, Sehore, Madhya Pradesh - 466001",
          normalized_value: "FarmFresh Agro Mills, Sehore, MP - 466001",
          found: true,
          status: "FOUND",
          confidence: 0.96,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [830, 110, 858, 880],
          bbox: { ymin: 83.0, xmin: 11.0, ymax: 85.8, xmax: 88.0 }
        },
        {
          id: "decl-6",
          field: "consumer_care",
          label: "Consumer Care Details",
          original_text: "Customer Care: 1800-445-5667 | care@farmfresh.in",
          normalized_value: "1800-445-5667 | care@farmfresh.in",
          found: true,
          status: "FOUND",
          confidence: 0.97,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [862, 110, 890, 780],
          bbox: { ymin: 86.2, xmin: 11.0, ymax: 89.0, xmax: 78.0 }
        }
      ],
      image_quality: { overall: "GOOD", issues: [] },
      warnings: [],
      ai_notes: "Calibrated demo: Staple grain packaging with 5kg net mass and mandatory per-kg Unit Sale Price.",
      is_fallback: true
    };
  }

  if (profileKind === 'juice') {
    const prodName = "Pure Sip 100% Valencia Orange Juice";
    const brandName = "Pure Sip Beverages";
    return {
      is_package_detected: true,
      product: { name: prodName, brand: brandName, category: "Beverages" },
      declarations: [
        {
          id: "decl-juice-brand",
          field: "brand_name",
          label: "Brand Name / Trademark",
          original_text: "PURE SIP BEVERAGES",
          normalized_value: "Pure Sip Beverages",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [75, 200, 124, 800],
          bbox: { ymin: 7.5, xmin: 20.0, ymax: 12.4, xmax: 80.0 }
        },
        {
          id: "decl-1",
          field: "product_name",
          label: "Generic / Common Product Name",
          original_text: "100% VALENCIA ORANGE JUICE",
          normalized_value: prodName,
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [142, 180, 178, 820],
          bbox: { ymin: 14.2, xmin: 18.0, ymax: 17.8, xmax: 82.0 }
        },
        {
          id: "decl-juice-claims",
          field: "front_claims",
          label: "Front Dietary / Statutory Claim",
          original_text: "NO ADDED SUGAR OR PRESERVATIVES",
          normalized_value: "No Added Sugar or Preservatives",
          found: true,
          status: "FOUND",
          confidence: 0.96,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [448, 190, 486, 810],
          bbox: { ymin: 44.8, xmin: 19.0, ymax: 48.6, xmax: 81.0 }
        },
        {
          id: "decl-2",
          field: "net_quantity",
          label: "Net Quantity",
          original_text: "Net Volume: 1 L (1000 ml)",
          normalized_value: "1 L",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [685, 110, 720, 560],
          bbox: { ymin: 68.5, xmin: 11.0, ymax: 72.0, xmax: 56.0 }
        },
        {
          id: "decl-3",
          field: "mrp",
          label: "Maximum Retail Price (MRP)",
          original_text: "MRP: ₹135.00 (Incl. of all taxes)",
          normalized_value: "135.00 INR",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [728, 110, 762, 600],
          bbox: { ymin: 72.8, xmin: 11.0, ymax: 76.2, xmax: 60.0 }
        },
        {
          id: "decl-4",
          field: "unit_sale_price",
          label: "Unit Sale Price (USP)",
          original_text: "Unit Sale Price: ₹0.135 / ml",
          normalized_value: "0.135 INR/ml",
          found: true,
          status: "FOUND",
          confidence: 0.97,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [766, 110, 795, 520],
          bbox: { ymin: 76.6, xmin: 11.0, ymax: 79.5, xmax: 52.0 }
        },
        {
          id: "decl-juice-date",
          field: "mfg_date",
          label: "Month & Year of Packaging",
          original_text: "Pkg Date: 03/2026 | BATCH: PS-ORJ-01",
          normalized_value: "MAR-2026",
          found: true,
          status: "FOUND",
          confidence: 0.97,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [800, 110, 826, 580],
          bbox: { ymin: 80.0, xmin: 11.0, ymax: 82.6, xmax: 58.0 }
        },
        {
          id: "decl-juice-mfg",
          field: "manufacturer_name",
          label: "Manufacturer Name & Address",
          original_text: "Mfd by: Pure Sip Beverages Ltd, Whitefield, Bengaluru - 560066",
          normalized_value: "Pure Sip Beverages Ltd, Whitefield, Bengaluru - 560066",
          found: true,
          status: "FOUND",
          confidence: 0.97,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [830, 110, 860, 840],
          bbox: { ymin: 83.0, xmin: 11.0, ymax: 86.0, xmax: 84.0 }
        },
        {
          id: "decl-5",
          field: "consumer_care",
          label: "Consumer Care Helpline",
          original_text: "Helpline: 1800-120-7878 | care@puresip.in",
          normalized_value: "1800-120-7878 | care@puresip.in",
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [863, 110, 892, 740],
          bbox: { ymin: 86.3, xmin: 11.0, ymax: 89.2, xmax: 74.0 }
        }
      ],
      image_quality: { overall: "GOOD", issues: [] },
      warnings: [],
      ai_notes: "Calibrated demo: Aseptic beverage carton fully compliant with Rule 6 & 11 standards.",
      is_fallback: true
    };
  }

  if (profileKind === 'almonds') {
    const prodName = "NutriFit California Whole Almonds";
    const brandName = "NutriFit Premium";
    return {
      is_package_detected: true,
      product: { name: prodName, brand: brandName, category: "Food" },
      declarations: [
        {
          id: "decl-alm-brand",
          field: "brand_name",
          label: "Brand Name / Trademark",
          original_text: "NUTRIFIT PREMIUM",
          normalized_value: "NutriFit Premium",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [75, 220, 124, 780],
          bbox: { ymin: 7.5, xmin: 22.0, ymax: 12.4, xmax: 78.0 }
        },
        {
          id: "decl-1",
          field: "product_name",
          label: "Generic / Common Product Name",
          original_text: "CALIFORNIA WHOLE ALMONDS",
          normalized_value: prodName,
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [142, 190, 178, 810],
          bbox: { ymin: 14.2, xmin: 19.0, ymax: 17.8, xmax: 81.0 }
        },
        {
          id: "decl-2",
          field: "net_quantity",
          label: "Net Quantity",
          original_text: "Net Weight: 200 g",
          normalized_value: "200 g",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [685, 110, 720, 460],
          bbox: { ymin: 68.5, xmin: 11.0, ymax: 72.0, xmax: 46.0 }
        },
        {
          id: "decl-4",
          field: "mrp",
          label: "Maximum Retail Price (MRP)",
          original_text: "MRP: ₹240.00 (Incl. of all taxes)",
          normalized_value: "240.00 INR",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [728, 110, 762, 600],
          bbox: { ymin: 72.8, xmin: 11.0, ymax: 76.2, xmax: 60.0 }
        },
        {
          id: "decl-alm-usp",
          field: "unit_sale_price",
          label: "Unit Sale Price (USP)",
          original_text: "Unit Sale Price: ₹1.20 / g",
          normalized_value: "1.20 INR/g",
          found: true,
          status: "FOUND",
          confidence: 0.97,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [766, 110, 795, 500],
          bbox: { ymin: 76.6, xmin: 11.0, ymax: 79.5, xmax: 50.0 }
        },
        {
          id: "decl-alm-date",
          field: "mfg_date",
          label: "Month & Year of Packaging",
          original_text: "Pkg Date: 02/2026 | BATCH: NF-ALM-551",
          normalized_value: "FEB-2026",
          found: true,
          status: "FOUND",
          confidence: 0.97,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [800, 110, 826, 580],
          bbox: { ymin: 80.0, xmin: 11.0, ymax: 82.6, xmax: 58.0 }
        },
        {
          id: "decl-alm-mfg",
          field: "manufacturer_name",
          label: "Packer Name & Address",
          original_text: "Packed by: NutriFit Foods Pvt Ltd, Navi Mumbai - 400705",
          normalized_value: "NutriFit Foods Pvt Ltd, Navi Mumbai - 400705",
          found: true,
          status: "FOUND",
          confidence: 0.97,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [830, 110, 860, 820],
          bbox: { ymin: 83.0, xmin: 11.0, ymax: 86.0, xmax: 82.0 }
        },
        {
          id: "decl-3",
          field: "country_of_origin",
          label: "Country of Origin",
          original_text: "Country of Origin: USA | Packed in India",
          normalized_value: "USA",
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [863, 110, 892, 720],
          bbox: { ymin: 86.3, xmin: 11.0, ymax: 89.2, xmax: 72.0 }
        }
      ],
      image_quality: { overall: "GOOD", issues: [] },
      warnings: [],
      ai_notes: "Calibrated demo: Repackaged imported dry fruit package with mandatory Country of Origin under Rule 6(1)(f).",
      is_fallback: true
    };
  }

  if (profileKind === 'violation') {
    const prodName = "Silk Glow Herbal Shampoo";
    const brandName = "Radiant Cosmetics";
    return {
      is_package_detected: true,
      product: { name: prodName, brand: brandName, category: "Cosmetics" },
      declarations: [
        {
          id: "decl-viol-brand-front",
          field: "brand_name",
          label: "Brand Name / Trademark",
          original_text: "RADIANT COSMETICS",
          normalized_value: "Radiant Cosmetics",
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [85, 240, 124, 760],
          bbox: { ymin: 8.5, xmin: 24.0, ymax: 12.4, xmax: 76.0 }
        },
        {
          id: "decl-viol-prod-front",
          field: "product_name",
          label: "Generic / Common Product Name",
          original_text: "SILK GLOW HERBAL SHAMPOO",
          normalized_value: prodName,
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [145, 200, 180, 800],
          bbox: { ymin: 14.5, xmin: 20.0, ymax: 18.0, xmax: 80.0 }
        },
        {
          id: "decl-viol-claims-front",
          field: "front_claims",
          label: "Front Dietary / Botanical Claim",
          original_text: "ALOE VERA & AMLA CONDITIONER",
          normalized_value: "Aloe Vera & Amla Conditioner",
          found: true,
          status: "FOUND",
          confidence: 0.96,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [455, 240, 492, 760],
          bbox: { ymin: 45.5, xmin: 24.0, ymax: 49.2, xmax: 76.0 }
        },
        {
          id: "decl-viol-qty-front",
          field: "net_quantity",
          label: "Net Quantity (Front PDP)",
          original_text: "Net Volume: 200 ml",
          normalized_value: "200 ml",
          found: true,
          status: "FOUND",
          confidence: 0.97,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [735, 115, 770, 480],
          bbox: { ymin: 73.5, xmin: 11.5, ymax: 77.0, xmax: 48.0 }
        },
        {
          id: "decl-viol-batch-front",
          field: "batch_number",
          label: "Batch / Lot Code",
          original_text: "Batch: RC-2026-09",
          normalized_value: "RC-2026-09",
          found: true,
          status: "FOUND",
          confidence: 0.94,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [835, 115, 868, 460],
          bbox: { ymin: 83.5, xmin: 11.5, ymax: 86.8, xmax: 46.0 }
        },
        {
          id: "decl-1",
          field: "product_name",
          label: "Commodity Name (Back)",
          original_text: "Silk Glow Shampoo",
          normalized_value: "Silk Glow Shampoo",
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: backImg.id,
          image_type: backImg.type,
          box_2d: [195, 105, 228, 720],
          bbox: { ymin: 19.5, xmin: 10.5, ymax: 22.8, xmax: 72.0 }
        },
        {
          id: "decl-2",
          field: "net_quantity",
          label: "Net Quantity (Back)",
          original_text: "200 ml",
          normalized_value: "200 ml",
          found: true,
          status: "FOUND",
          confidence: 0.96,
          image_id: backImg.id,
          image_type: backImg.type,
          box_2d: [255, 105, 288, 520],
          bbox: { ymin: 25.5, xmin: 10.5, ymax: 28.8, xmax: 52.0 }
        },
        {
          id: "decl-3",
          field: "mrp",
          label: "Maximum Retail Price (MRP)",
          original_text: "Price: 199",
          normalized_value: "199.00 INR",
          found: true,
          status: "UNCERTAIN",
          confidence: 0.65,
          image_id: backImg.id,
          image_type: backImg.type,
          box_2d: [313, 92, 387, 900],
          bbox: { ymin: 31.3, xmin: 9.2, ymax: 38.7, xmax: 90.0 }
        },
        {
          id: "decl-4",
          field: "manufacturer_name",
          label: "Manufacturer Name & Address",
          original_text: "Mfd by: Radiant Cosmetics, Mumbai",
          normalized_value: "Radiant Cosmetics, Mumbai",
          found: true,
          status: "FOUND",
          confidence: 0.85,
          image_id: backImg.id,
          image_type: backImg.type,
          box_2d: [415, 105, 475, 900],
          bbox: { ymin: 41.5, xmin: 10.5, ymax: 47.5, xmax: 90.0 }
        },
        {
          id: "decl-viol-date",
          field: "mfg_date",
          label: "Month & Year of Packaging",
          original_text: "2026",
          normalized_value: "2026",
          found: true,
          status: "UNCERTAIN",
          confidence: 0.64,
          image_id: backImg.id,
          image_type: backImg.type,
          box_2d: [500, 105, 535, 860],
          bbox: { ymin: 50.0, xmin: 10.5, ymax: 53.5, xmax: 86.0 }
        },
        {
          id: "decl-5",
          field: "consumer_care",
          label: "Consumer Care Details",
          original_text: "",
          normalized_value: "",
          found: false,
          status: "NOT_FOUND",
          confidence: 0.0,
          image_id: backImg.id,
          image_type: backImg.type
        },
        {
          id: "decl-viol-origin",
          field: "country_of_origin",
          label: "Country of Origin",
          original_text: "India",
          normalized_value: "India",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: backImg.id,
          image_type: backImg.type,
          box_2d: [740, 105, 775, 580],
          bbox: { ymin: 74.0, xmin: 10.5, ymax: 77.5, xmax: 58.0 }
        }
      ],
      image_quality: { overall: "GOOD", issues: [] },
      warnings: ["Consumer Care mandatory grievance cell information was not found on label (Statutory violation under Rule 6(1)(n))."],
      ai_notes: "Calibrated demo: Pre-screened cosmetic commodity with missing Consumer Care violation.",
      is_fallback: true
    };
  }

  if (profileKind === 'contradiction') {
    const prodName = "Crunchy Protein Bites";
    const brandName = "NutriFit Foods";
    return {
      is_package_detected: true,
      product: { name: prodName, brand: brandName, category: "Food" },
      declarations: [
        {
          id: "decl-contra-brand",
          field: "brand_name",
          label: "Brand Name / Trademark",
          original_text: "NUTRIFIT FOODS",
          normalized_value: "NutriFit Foods",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [88, 250, 126, 750],
          bbox: { ymin: 8.8, xmin: 25.0, ymax: 12.6, xmax: 75.0 }
        },
        {
          id: "decl-1",
          field: "product_name",
          label: "Generic / Common Product Name",
          original_text: "CRUNCHY PROTEIN BITES",
          normalized_value: prodName,
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [145, 210, 180, 790],
          bbox: { ymin: 14.5, xmin: 21.0, ymax: 18.0, xmax: 79.0 }
        },
        {
          id: "decl-2",
          field: "net_quantity",
          label: "Net Quantity (Front Panel)",
          original_text: "NET WEIGHT: 100 g",
          normalized_value: "100 g",
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [400, 167, 480, 833],
          bbox: { ymin: 40.0, xmin: 16.7, ymax: 48.0, xmax: 83.3 }
        },
        {
          id: "decl-contra-mrp-front",
          field: "mrp",
          label: "Maximum Retail Price (Front)",
          original_text: "MRP: ₹99.00 (Incl. of all taxes)",
          normalized_value: "99.00 INR",
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [705, 115, 740, 620],
          bbox: { ymin: 70.5, xmin: 11.5, ymax: 74.0, xmax: 62.0 }
        },
        {
          id: "decl-3",
          field: "net_quantity",
          label: "Net Quantity (Back Panel)",
          original_text: "Net Quantity: 80 g (CONFLICT WITH FRONT 100g!)",
          normalized_value: "80 g",
          found: true,
          status: "FOUND",
          confidence: 0.96,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [187, 100, 280, 900],
          bbox: { ymin: 18.7, xmin: 10.0, ymax: 28.0, xmax: 90.0 }
        },
        {
          id: "decl-4",
          field: "mrp",
          label: "Maximum Retail Price (Back)",
          original_text: "₹99.00 (Incl. of all taxes)",
          normalized_value: "99.00 INR",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [305, 105, 340, 780],
          bbox: { ymin: 30.5, xmin: 10.5, ymax: 34.0, xmax: 78.0 }
        },
        {
          id: "decl-contra-mfg",
          field: "manufacturer_name",
          label: "Manufacturer Name & Address",
          original_text: "NutriFit Wellness Foods Pvt Ltd, Sector 62, Noida, UP - 201309",
          normalized_value: "NutriFit Wellness Foods Pvt Ltd, Sector 62, Noida, UP - 201309",
          found: true,
          status: "FOUND",
          confidence: 0.96,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [368, 105, 432, 895],
          bbox: { ymin: 36.8, xmin: 10.5, ymax: 43.2, xmax: 89.5 }
        },
        {
          id: "decl-contra-date",
          field: "mfg_date",
          label: "Month & Year of Packaging",
          original_text: "03/2026 | BATCH: NF-B88",
          normalized_value: "MAR-2026",
          found: true,
          status: "FOUND",
          confidence: 0.97,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [458, 105, 492, 720],
          bbox: { ymin: 45.8, xmin: 10.5, ymax: 49.2, xmax: 72.0 }
        },
        {
          id: "decl-contra-cc",
          field: "consumer_care",
          label: "Consumer Care Helpline",
          original_text: "1800-889-1122 | support@nutrifitfoods.com",
          normalized_value: "1800-889-1122 | support@nutrifitfoods.com",
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [547, 100, 667, 900],
          bbox: { ymin: 54.7, xmin: 10.0, ymax: 66.7, xmax: 90.0 }
        }
      ],
      image_quality: { overall: "GOOD", issues: [] },
      warnings: ["Cross-image declaration contradiction detected between Front (100g) and Back (80g) views."],
      ai_notes: "Calibrated demo: Cross-image quantitative contradiction test.",
      is_fallback: true
    };
  }

  // Compliant Aura Organics Cookies Demo
  if (profileKind === 'aura') {
    const prodName = "Crunchy Wholegrain Oats Cookies";
    const brandName = "Aura Organics Foods";
    return {
      is_package_detected: true,
      product: { name: prodName, brand: brandName, category: "Food" },
      declarations: [
        {
          id: "decl-aura-brand",
          field: "brand_name",
          label: "Brand Name / Trademark",
          original_text: "AURA ORGANICS",
          normalized_value: "Aura Organics",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [85, 267, 128, 733],
          bbox: { ymin: 8.5, xmin: 26.7, ymax: 12.8, xmax: 73.3 },
          notes: "Registered brand trademark at top of Principal Display Panel."
        },
        {
          id: "decl-aura-prodname-front",
          field: "product_name",
          label: "Generic / Common Product Name",
          original_text: "CRUNCHY WHOLEGRAIN OATS COOKIES",
          normalized_value: "Crunchy Wholegrain Oats Cookies",
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [152, 130, 182, 870],
          bbox: { ymin: 15.2, xmin: 13.0, ymax: 18.2, xmax: 87.0 },
          notes: "Generic commodity name displayed on Front PDP."
        },
        {
          id: "decl-aura-claims",
          field: "front_claims",
          label: "Front Dietary / Statutory Claim",
          original_text: "100% WHOLE GRAIN & HIGH FIBRE",
          normalized_value: "100% Whole Grain & High Fibre",
          found: true,
          status: "FOUND",
          confidence: 0.97,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [464, 210, 496, 790],
          bbox: { ymin: 46.4, xmin: 21.0, ymax: 49.6, xmax: 79.0 },
          notes: "Front-of-pack nutritional qualifiers."
        },
        {
          id: "decl-aura-netqty-front",
          field: "net_quantity",
          label: "Net Quantity (Front PDP)",
          original_text: "Net Quantity: 200 g (2 × 100g Packs)",
          normalized_value: "200 g",
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [707, 125, 763, 875],
          bbox: { ymin: 70.7, xmin: 12.5, ymax: 76.3, xmax: 87.5 },
          notes: "Compliant net quantity statement on Front PDP."
        },
        {
          id: "decl-aura-veg",
          field: "veg_non_veg",
          label: "Dietary Classification Mark",
          original_text: "100% Vegetarian Commodity (Green Dot in Square)",
          normalized_value: "100% Vegetarian",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [861, 125, 901, 630],
          bbox: { ymin: 86.1, xmin: 12.5, ymax: 90.1, xmax: 63.0 },
          notes: "Statutory green dot inside green square symbol."
        },
        {
          id: "decl-aura-prodname-back",
          field: "product_name",
          label: "Commodity Name (Back)",
          original_text: "1. GENERIC PRODUCT NAME: Wholegrain Oats Cookies",
          normalized_value: "Wholegrain Oats Cookies",
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [175, 100, 202, 760],
          bbox: { ymin: 17.5, xmin: 10.0, ymax: 20.2, xmax: 76.0 },
          notes: "Item 1 of statutory back panel declarations."
        },
        {
          id: "decl-aura-netqty-back",
          field: "net_quantity",
          label: "Net Quantity (Back)",
          original_text: "2. NET QUANTITY (RULE 11): 200 g (2 x 100g Individual Packs)",
          normalized_value: "200 g",
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [221, 100, 248, 860],
          bbox: { ymin: 22.1, xmin: 10.0, ymax: 24.8, xmax: 86.0 },
          notes: "Item 2: Standard metric units declaration."
        },
        {
          id: "decl-aura-mrp",
          field: "mrp",
          label: "Maximum Retail Price (MRP)",
          original_text: "3. MRP (INCL. ALL TAXES): ₹75.00 (Incl. of all taxes)",
          normalized_value: "75.00 INR",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [268, 100, 295, 820],
          bbox: { ymin: 26.8, xmin: 10.0, ymax: 29.5, xmax: 82.0 },
          notes: "Item 3: All-inclusive retail price."
        },
        {
          id: "decl-aura-usp",
          field: "unit_sale_price",
          label: "Unit Sale Price (USP)",
          original_text: "4. UNIT SALE PRICE (USP): ₹0.38 / g",
          normalized_value: "0.38 INR/g",
          found: true,
          status: "FOUND",
          confidence: 0.95,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [315, 100, 342, 840],
          bbox: { ymin: 31.5, xmin: 10.0, ymax: 34.2, xmax: 84.0 },
          notes: "Item 4: Compliant unit sale price."
        },
        {
          id: "decl-aura-mfg",
          field: "manufacturer_name",
          label: "Manufacturer Name & Address",
          original_text: "5. MFD & PACKED BY: Aura Organics Foods Pvt Ltd, Plot 14, Phase III, KIADB Industrial Area, Peenya 2nd Stage, Bengaluru, Karnataka - 560058, India.",
          normalized_value: "Aura Organics Foods Pvt Ltd, Plot 14, Phase III, KIADB Industrial Area, Peenya 2nd Stage, Bengaluru - 560058",
          found: true,
          status: "FOUND",
          confidence: 0.96,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [361, 100, 444, 905],
          bbox: { ymin: 36.1, xmin: 10.0, ymax: 44.4, xmax: 90.5 },
          notes: "Item 5: Complete postal address with valid PIN code."
        },
        {
          id: "decl-aura-date",
          field: "mfg_date",
          label: "Month & Year of Manufacture",
          original_text: "6. DATE OF PACKING: 04/2026",
          normalized_value: "APR-2026",
          found: true,
          status: "FOUND",
          confidence: 0.97,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [467, 100, 494, 445],
          bbox: { ymin: 46.7, xmin: 10.0, ymax: 49.4, xmax: 44.5 },
          notes: "Item 6: Date of packing."
        },
        {
          id: "decl-aura-batch",
          field: "batch_number",
          label: "Batch / Lot Number",
          original_text: "BATCH: AO-2026-B84",
          normalized_value: "AO-2026-B84",
          found: true,
          status: "FOUND",
          confidence: 0.97,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [467, 460, 494, 820],
          bbox: { ymin: 46.7, xmin: 46.0, ymax: 49.4, xmax: 82.0 },
          notes: "Item 6: Traceability batch identifier."
        },
        {
          id: "decl-aura-bb",
          field: "best_before",
          label: "Best Before Duration",
          original_text: "7. BEST BEFORE / SHELF LIFE: 9 Months from Packaging Date",
          normalized_value: "9 Months",
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [514, 100, 541, 780],
          bbox: { ymin: 51.4, xmin: 10.0, ymax: 54.1, xmax: 78.0 },
          notes: "Item 7: Best before duration."
        },
        {
          id: "decl-aura-origin",
          field: "country_of_origin",
          label: "Country of Origin",
          original_text: "8. COUNTRY OF ORIGIN: India",
          normalized_value: "India",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [561, 100, 588, 550],
          bbox: { ymin: 56.1, xmin: 10.0, ymax: 58.8, xmax: 55.0 },
          notes: "Item 8: Country of origin statement."
        },
        {
          id: "decl-aura-cc",
          field: "consumer_care",
          label: "Consumer Care Details",
          original_text: "9. CONSUMER CARE GRIEVANCE CELL: Manager, Consumer Grievance Cell, at Mfd Address above | Toll Free: 1800-425-9988 | Email: care@auraorganics.in",
          normalized_value: "Manager, Consumer Grievance Cell, Toll Free: 1800-425-9988, Email: care@auraorganics.in",
          found: true,
          status: "FOUND",
          confidence: 0.97,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [620, 92, 747, 908],
          bbox: { ymin: 62.0, xmin: 9.2, ymax: 747 / 10, xmax: 90.8 },
          notes: "Item 9: Consumer care address, toll-free number, and email."
        },
        {
          id: "decl-aura-barcode",
          field: "barcode",
          label: "Barcode / GTIN Number",
          original_text: "8901234567890",
          normalized_value: "8901234567890",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [773, 100, 853, 467],
          bbox: { ymin: 77.3, xmin: 10.0, ymax: 85.3, xmax: 46.7 },
          notes: "13-digit retail EAN-13 barcode."
        }
      ],
      image_quality: { overall: "GOOD", issues: [] },
      warnings: [],
      ai_notes: "Calibrated demo: Fully compliant pre-screened biscuit sample.",
      is_fallback: true
    };
  }

  return undefined;
}

export function getDemoFrontRecalibration(
  demoPresetId: string,
  frontImage: InspectionImage
): ExtractedDeclaration[] | undefined {
  const dummyBack: InspectionImage = { id: 'dummy-back', type: 'Back', name: 'back.svg', url: '' };

  if (demoPresetId === 'demo-britannia-nutrichoice') {
    return [
      {
        id: "decl-front-brand-" + Date.now(),
        field: "brand_name",
        label: "Brand Name / Trademark",
        original_text: "BRITANNIA",
        normalized_value: "Britannia",
        found: true,
        status: "FOUND",
        confidence: 0.99,
        image_id: frontImage.id,
        image_type: "Front",
        box_2d: [365, 290, 412, 405],
        bbox: { ymin: 36.5, xmin: 29.0, ymax: 41.2, xmax: 40.5 },
        notes: "Trademark 'BRITANNIA' clearly displayed in principal red oval on front Principal Display Panel."
      },
      {
        id: "decl-front-subbrand-" + Date.now(),
        field: "sub_brand",
        label: "Sub-Brand / Product Line",
        original_text: "nutri CHOICE",
        normalized_value: "NutriChoice",
        found: true,
        status: "FOUND",
        confidence: 0.98,
        image_id: frontImage.id,
        image_type: "Front",
        box_2d: [422, 285, 532, 480],
        bbox: { ymin: 42.2, xmin: 28.5, ymax: 53.2, xmax: 48.0 },
        notes: "Prominent sub-brand 'nutri CHOICE' on Principal Display Panel."
      },
      {
        id: "decl-front-prodname-" + Date.now(),
        field: "product_name",
        label: "Generic / Common Commodity Name",
        original_text: "Digestive",
        normalized_value: "Digestive Biscuits",
        found: true,
        status: "FOUND",
        confidence: 0.98,
        image_id: frontImage.id,
        image_type: "Front",
        box_2d: [542, 335, 586, 478],
        bbox: { ymin: 54.2, xmin: 33.5, ymax: 58.6, xmax: 47.8 },
        notes: "Generic commodity name 'Digestive Biscuits' displayed on Principal Display Panel under Rule 6(1)(a)."
      },
      {
        id: "decl-front-veg-" + Date.now(),
        field: "veg_non_veg",
        label: "Dietary Classification Mark",
        original_text: "Vegetarian Symbol (Green Dot in Square)",
        normalized_value: "100% Vegetarian",
        found: true,
        status: "FOUND",
        confidence: 0.99,
        image_id: frontImage.id,
        image_type: "Front",
        box_2d: [596, 285, 638, 318],
        bbox: { ymin: 59.6, xmin: 28.5, ymax: 63.8, xmax: 31.8 },
        notes: "Statutory green dot inside green square symbol verifying 100% vegetarian commodity."
      },
      {
        id: "decl-front-claim-" + Date.now(),
        field: "front_claims",
        label: "Front Dietary / Statutory Claim",
        original_text: "HI-Fibre",
        normalized_value: "High Dietary Fibre",
        found: true,
        status: "FOUND",
        confidence: 0.97,
        image_id: frontImage.id,
        image_type: "Front",
        box_2d: [596, 325, 638, 410],
        bbox: { ymin: 59.6, xmin: 32.5, ymax: 63.8, xmax: 41.0 },
        notes: "Front-of-pack nutritional qualifier prominently displayed."
      }
    ];
  }

  const presetExtraction = getDemoFallbackExtraction(demoPresetId, [frontImage, dummyBack]);
  if (!presetExtraction) return undefined;

  return presetExtraction.declarations
    .filter((d) => d.image_id === frontImage.id || d.image_type?.toLowerCase() === 'front')
    .map((d, idx) => ({
      ...d,
      id: `decl-front-${d.field}-${Date.now()}-${idx}`
    }));
}

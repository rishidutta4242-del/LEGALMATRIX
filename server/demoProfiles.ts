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
          id: "decl-1",
          field: "product_name",
          label: "Generic / Common Product Name",
          original_text: prodName,
          normalized_value: prodName,
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: frontImg.id,
          image_type: "Front",
          bbox: { ymin: 14, xmin: 15, ymax: 24, xmax: 85 }
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
          bbox: { ymin: 68, xmin: 20, ymax: 78, xmax: 60 }
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
          bbox: { ymin: 79, xmin: 20, ymax: 87, xmax: 65 }
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
          bbox: { ymin: 88, xmin: 20, ymax: 95, xmax: 55 }
        },
        {
          id: "decl-5",
          field: "manufacturer_name",
          label: "Manufacturer / Packer Name & Address",
          original_text: "Marketed by: Gujarat Cooperative Milk Marketing Federation Ltd. (GCMMF), Amul Dairy Road, Anand - 388001, Gujarat, India.",
          normalized_value: "GCMMF Ltd., Amul Dairy Road, Anand - 388001, Gujarat",
          found: true,
          status: "FOUND",
          confidence: 0.97,
          image_id: backImg.id,
          image_type: "Back",
          bbox: { ymin: 35, xmin: 15, ymax: 50, xmax: 90 }
        },
        {
          id: "decl-6",
          field: "mfg_date",
          label: "Month & Year of Manufacture",
          original_text: "Date of Packaging: 03/2026",
          normalized_value: "MAR-2026",
          found: true,
          status: "FOUND",
          confidence: 0.97,
          image_id: frontImg.id,
          image_type: "Front",
          bbox: { ymin: 60, xmin: 20, ymax: 67, xmax: 55 }
        },
        {
          id: "decl-7",
          field: "best_before",
          label: "Best Before / Use By",
          original_text: "Best before 2 days from packaging when stored refrigerated below 4°C",
          normalized_value: "2 DAYS FROM PACKAGING",
          found: true,
          status: "FOUND",
          confidence: 0.95,
          image_id: backImg.id,
          image_type: "Back",
          bbox: { ymin: 52, xmin: 15, ymax: 62, xmax: 85 }
        },
        {
          id: "decl-8",
          field: "consumer_care",
          label: "Consumer Care Details",
          original_text: "Toll Free Helpline: 1800-258-3333 | Email: customercare@amul.coop | Address: GCMMF Consumer Cell, Anand 388001",
          normalized_value: "GCMMF Consumer Cell: 1800-258-3333, customercare@amul.coop",
          found: true,
          status: "FOUND",
          confidence: 0.96,
          image_id: backImg.id,
          image_type: "Back",
          bbox: { ymin: 65, xmin: 15, ymax: 80, xmax: 90 }
        },
        {
          id: "decl-9",
          field: "country_of_origin",
          label: "Country of Origin",
          original_text: "Product of India",
          normalized_value: "India",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          bbox: { ymin: 94, xmin: 20, ymax: 99, xmax: 45 }
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
          original_text: "WHOLESALE MASTER SHIPPER CASE - WHOLEGRAIN OATS COOKIES",
          normalized_value: prodName,
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: frontImg.id,
          image_type: "Front",
          bbox: { ymin: 15, xmin: 20, ymax: 25, xmax: 85 }
        },
        {
          id: "decl-2",
          field: "net_quantity",
          label: "Wholesale Inner Retail Units & Total Mass",
          original_text: "CONTAINS: 24 RETAIL UNITS × 100g (TOTAL NET MASS: 2.40 kg)",
          normalized_value: "24 units x 100 g",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          bbox: { ymin: 50, xmin: 20, ymax: 60, xmax: 85 }
        },
        {
          id: "decl-3",
          field: "mrp",
          label: "Maximum Retail Price / Wholesale Value",
          original_text: "MRP ₹50.00 / retail unit (Wholesale Case Value: ₹1,200.00 Incl. of all taxes)",
          normalized_value: "1200.00 INR",
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: frontImg.id,
          image_type: "Front",
          bbox: { ymin: 62, xmin: 20, ymax: 72, xmax: 85 }
        },
        {
          id: "decl-4",
          field: "manufacturer_name",
          label: "Manufacturer & Shipper Address",
          original_text: "Manufactured by: Aura Organics Foods Pvt. Ltd., Plot 108, Peenya Industrial Area Phase 1, Bengaluru 560058, Karnataka, India.",
          normalized_value: "Aura Organics Foods Pvt. Ltd., Peenya, Bengaluru 560058",
          found: true,
          status: "FOUND",
          confidence: 0.97,
          image_id: frontImg.id,
          image_type: "Front",
          bbox: { ymin: 74, xmin: 20, ymax: 86, xmax: 85 }
        },
        {
          id: "decl-5",
          field: "country_of_origin",
          label: "Country of Origin",
          original_text: "Country of Origin: India",
          normalized_value: "India",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          bbox: { ymin: 88, xmin: 20, ymax: 95, xmax: 50 }
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
          id: "decl-1",
          field: "product_name",
          label: "Generic / Common Product Name",
          original_text: prodName,
          normalized_value: prodName,
          found: true,
          status: "FOUND",
          confidence: 0.95,
          image_id: frontImg.id,
          image_type: "Front",
          bbox: { ymin: 15, xmin: 20, ymax: 25, xmax: 80 }
        },
        {
          id: "decl-2",
          field: "net_quantity",
          label: "Net Quantity (Low Contrast / Glare)",
          original_text: "Net Qty: ~50g (Low OCR Confidence 58%)",
          normalized_value: "50 g",
          found: true,
          status: "UNCERTAIN",
          confidence: 0.58,
          image_id: frontImg.id,
          image_type: "Front",
          bbox: { ymin: 35, xmin: 20, ymax: 45, xmax: 65 }
        },
        {
          id: "decl-3",
          field: "mrp",
          label: "Maximum Retail Price (MRP)",
          original_text: "MRP Rs. 3? (Partial Glare Occlusion)",
          normalized_value: "30.00 INR",
          found: true,
          status: "UNCERTAIN",
          confidence: 0.52,
          image_id: frontImg.id,
          image_type: "Front",
          bbox: { ymin: 46, xmin: 20, ymax: 56, xmax: 65 }
        },
        {
          id: "decl-4",
          field: "manufacturer_name",
          label: "Manufacturer Name & Address",
          original_text: "Mfg: Spice Harvest Pvt Ltd, Jaipur, Rajasthan - 302013",
          normalized_value: "Spice Harvest Pvt Ltd, Jaipur - 302013",
          found: true,
          status: "FOUND",
          confidence: 0.88,
          image_id: frontImg.id,
          image_type: "Front",
          bbox: { ymin: 58, xmin: 20, ymax: 70, xmax: 80 }
        },
        {
          id: "decl-5",
          field: "consumer_care",
          label: "Consumer Care Details",
          original_text: "Consumer Care: 0141-2345*** (Partial Occlusion)",
          normalized_value: "0141-2345678",
          found: true,
          status: "UNCERTAIN",
          confidence: 0.60,
          image_id: frontImg.id,
          image_type: "Front",
          bbox: { ymin: 72, xmin: 20, ymax: 82, xmax: 80 }
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
          id: "decl-1",
          field: "product_name",
          label: "Generic / Common Product Name",
          original_text: "100% Sharbati Chakki Fresh Atta",
          normalized_value: "Sharbati Chakki Fresh Atta",
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: frontImg.id,
          image_type: "Front",
          bbox: { ymin: 15, xmin: 20, ymax: 25, xmax: 80 }
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
          bbox: { ymin: 65, xmin: 20, ymax: 74, xmax: 55 }
        },
        {
          id: "decl-3",
          field: "mrp",
          label: "Maximum Retail Price (MRP)",
          original_text: "MRP ₹260.00 (Incl. of all taxes)",
          normalized_value: "260.00 INR",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          bbox: { ymin: 75, xmin: 20, ymax: 83, xmax: 60 }
        },
        {
          id: "decl-4",
          field: "unit_sale_price",
          label: "Unit Sale Price (USP)",
          original_text: "USP ₹52.00 / kg",
          normalized_value: "52.00 INR/kg",
          found: true,
          status: "FOUND",
          confidence: 0.97,
          image_id: frontImg.id,
          image_type: "Front",
          bbox: { ymin: 84, xmin: 20, ymax: 91, xmax: 50 }
        },
        {
          id: "decl-5",
          field: "manufacturer_name",
          label: "Manufacturer Name & Address",
          original_text: "Milled & Packed by: FarmFresh Agro Mills, Industrial Growth Centre, Sehore, Madhya Pradesh - 466001, India.",
          normalized_value: "FarmFresh Agro Mills, Sehore, MP - 466001",
          found: true,
          status: "FOUND",
          confidence: 0.96,
          image_id: frontImg.id,
          image_type: "Front",
          bbox: { ymin: 50, xmin: 20, ymax: 62, xmax: 85 }
        },
        {
          id: "decl-6",
          field: "country_of_origin",
          label: "Country of Origin",
          original_text: "Country of Origin: India",
          normalized_value: "India",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          bbox: { ymin: 92, xmin: 20, ymax: 98, xmax: 45 }
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
          id: "decl-1",
          field: "product_name",
          label: "Generic / Common Product Name",
          original_text: "100% Valencia Orange Juice",
          normalized_value: prodName,
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: frontImg.id,
          image_type: "Front",
          bbox: { ymin: 15, xmin: 20, ymax: 25, xmax: 85 }
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
          bbox: { ymin: 65, xmin: 20, ymax: 73, xmax: 60 }
        },
        {
          id: "decl-3",
          field: "mrp",
          label: "Maximum Retail Price (MRP)",
          original_text: "MRP ₹135.00 (Incl. of all taxes)",
          normalized_value: "135.00 INR",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          bbox: { ymin: 74, xmin: 20, ymax: 82, xmax: 60 }
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
          bbox: { ymin: 83, xmin: 20, ymax: 90, xmax: 55 }
        },
        {
          id: "decl-5",
          field: "country_of_origin",
          label: "Country of Origin",
          original_text: "Country of Origin: India",
          normalized_value: "India",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          bbox: { ymin: 91, xmin: 20, ymax: 98, xmax: 45 }
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
          id: "decl-1",
          field: "product_name",
          label: "Generic / Common Product Name",
          original_text: "California Whole Almonds",
          normalized_value: prodName,
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: frontImg.id,
          image_type: "Front",
          bbox: { ymin: 15, xmin: 20, ymax: 25, xmax: 80 }
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
          bbox: { ymin: 65, xmin: 20, ymax: 74, xmax: 55 }
        },
        {
          id: "decl-3",
          field: "country_of_origin",
          label: "Country of Origin",
          original_text: "Country of Origin: USA (Packed in India)",
          normalized_value: "USA",
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: frontImg.id,
          image_type: "Front",
          bbox: { ymin: 75, xmin: 20, ymax: 83, xmax: 75 }
        },
        {
          id: "decl-4",
          field: "mrp",
          label: "Maximum Retail Price (MRP)",
          original_text: "MRP ₹240.00 (Incl. of all taxes)",
          normalized_value: "240.00 INR",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          bbox: { ymin: 84, xmin: 20, ymax: 92, xmax: 60 }
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
      const brandName = "Radiant Cosmetics Ltd.";
      return {
        is_package_detected: true,
        product: { name: prodName, brand: brandName, category: "Cosmetics" },
        declarations: [
          {
            id: "decl-1",
            field: "product_name",
            label: "Generic / Common Product Name",
            original_text: prodName,
            normalized_value: prodName,
            found: true,
            status: "FOUND",
            confidence: 0.98,
            image_id: backImg.id,
            image_type: backImg.type,
            bbox: { ymin: 15, xmin: 20, ymax: 26, xmax: 80 }
          },
          {
            id: "decl-2",
            field: "net_quantity",
            label: "Net Quantity",
            original_text: "Net Vol: 200 ml",
            normalized_value: "200 ml",
            found: true,
            status: "FOUND",
            confidence: 0.95,
            image_id: backImg.id,
            image_type: backImg.type,
            bbox: { ymin: 30, xmin: 20, ymax: 40, xmax: 55 }
          },
          {
            id: "decl-3",
            field: "mrp",
            label: "Maximum Retail Price (MRP)",
            original_text: "MRP Rs. 210.00 (Incl. of all taxes)",
            normalized_value: "210.00 INR",
            found: true,
            status: "FOUND",
            confidence: 0.99,
            image_id: backImg.id,
            image_type: backImg.type,
            bbox: { ymin: 44, xmin: 20, ymax: 54, xmax: 80 }
          },
          {
            id: "decl-4",
            field: "manufacturer_name",
            label: "Manufacturer Name & Address",
            original_text: "Manufactured by: Radiant Cosmetics, Plot 18, Haridwar Industrial Area, UK - 249403",
            normalized_value: "Radiant Cosmetics, Plot 18, Haridwar Industrial Area, UK - 249403",
            found: true,
            status: "FOUND",
            confidence: 0.92,
            image_id: backImg.id,
            image_type: backImg.type,
            bbox: { ymin: 58, xmin: 20, ymax: 70, xmax: 85 }
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
            id: "decl-1",
            field: "product_name",
            label: "Generic / Common Product Name",
            original_text: prodName,
            normalized_value: prodName,
            found: true,
            status: "FOUND",
            confidence: 0.98,
            image_id: frontImg.id,
            image_type: "Front",
            bbox: { ymin: 15, xmin: 20, ymax: 26, xmax: 80 }
          },
          {
            id: "decl-2",
            field: "net_quantity",
            label: "Net Quantity (Front Panel)",
            original_text: "Net Wt: 100 g",
            normalized_value: "100 g",
            found: true,
            status: "FOUND",
            confidence: 0.96,
            image_id: frontImg.id,
            image_type: "Front",
            bbox: { ymin: 68, xmin: 20, ymax: 78, xmax: 55 }
          },
          {
            id: "decl-3",
            field: "net_quantity",
            label: "Net Quantity (Back Panel)",
            original_text: "Net Qty: 80 g (Special Pack)",
            normalized_value: "80 g",
            found: true,
            status: "FOUND",
            confidence: 0.94,
            image_id: backImg.id,
            image_type: "Back",
            bbox: { ymin: 30, xmin: 60, ymax: 42, xmax: 90 }
          },
          {
            id: "decl-4",
            field: "mrp",
            label: "Maximum Retail Price (MRP)",
            original_text: "MRP Rs. 85.00 (Incl. of all taxes)",
            normalized_value: "85.00 INR",
            found: true,
            status: "FOUND",
            confidence: 0.99,
            image_id: backImg.id,
            image_type: "Back",
            bbox: { ymin: 45, xmin: 20, ymax: 55, xmax: 75 }
          }
        ],
        image_quality: { overall: "GOOD", issues: [] },
        warnings: ["Cross-image declaration contradiction detected between Front (100g) and Back (80g) views."],
        ai_notes: "Calibrated demo: Cross-image quantitative contradiction test.",
        is_fallback: true
      };
    }

    // Compliant Aura Organics Demo
    if (profileKind === 'aura') {
      const prodName = "Aura Organics Oats Cookies";
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
          box_2d: [75, 180, 140, 820],
          bbox: { ymin: 7.5, xmin: 18.0, ymax: 14.0, xmax: 82.0 },
          notes: "Registered brand trademark at top of Principal Display Panel."
        },
        {
          id: "decl-aura-prodname-front",
          field: "product_name",
          label: "Generic / Common Product Name",
          original_text: "CRUNCHY WHOLEGRAIN OATS COOKIES",
          normalized_value: "Wholegrain Oats Cookies",
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [150, 120, 205, 880],
          bbox: { ymin: 15.0, xmin: 12.0, ymax: 20.5, xmax: 88.0 },
          notes: "Generic commodity name displayed on Front PDP."
        },
        {
          id: "decl-aura-claims",
          field: "front_claims",
          label: "Front Dietary / Statutory Claim",
          original_text: "100% WHOLE GRAIN • HIGH FIBRE • ZERO TRANS FAT",
          normalized_value: "100% Whole Grain, High Fibre",
          found: true,
          status: "FOUND",
          confidence: 0.97,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [450, 240, 500, 760],
          bbox: { ymin: 45.0, xmin: 24.0, ymax: 50.0, xmax: 76.0 },
          notes: "Front-of-pack nutritional qualifiers."
        },
        {
          id: "decl-aura-netqty-front",
          field: "net_quantity",
          label: "Net Quantity (Front PDP)",
          original_text: "Net Quantity: 200 g",
          normalized_value: "200 g",
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [710, 120, 760, 720],
          bbox: { ymin: 71.0, xmin: 12.0, ymax: 76.0, xmax: 72.0 },
          notes: "Compliant net quantity statement on Front PDP."
        },
        {
          id: "decl-aura-veg",
          field: "veg_non_veg",
          label: "Dietary Classification Mark",
          original_text: "Vegetarian Symbol (Green Dot in Square)",
          normalized_value: "100% Vegetarian",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: frontImg.id,
          image_type: "Front",
          box_2d: [820, 120, 875, 680],
          bbox: { ymin: 82.0, xmin: 12.0, ymax: 87.5, xmax: 68.0 },
          notes: "Statutory green dot inside green square symbol."
        },
        {
          id: "decl-aura-prodname-back",
          field: "product_name",
          label: "Commodity Name (Back)",
          original_text: "1. COMMODITY NAME: Wholegrain Oats Cookies",
          normalized_value: "Wholegrain Oats Cookies",
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [175, 100, 212, 850],
          bbox: { ymin: 17.5, xmin: 10.0, ymax: 21.2, xmax: 85.0 },
          notes: "Item 1 of statutory back panel declarations."
        },
        {
          id: "decl-aura-netqty-back",
          field: "net_quantity",
          label: "Net Quantity (Back)",
          original_text: "2. NET QUANTITY: 200 g",
          normalized_value: "200 g",
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [228, 100, 265, 850],
          bbox: { ymin: 22.8, xmin: 10.0, ymax: 26.5, xmax: 85.0 },
          notes: "Item 2: Standard metric units declaration."
        },
        {
          id: "decl-aura-mrp",
          field: "mrp",
          label: "Maximum Retail Price (MRP)",
          original_text: "3. MRP (INCL. TAXES): ₹75.00",
          normalized_value: "75.00 INR",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [282, 100, 318, 850],
          bbox: { ymin: 28.2, xmin: 10.0, ymax: 31.8, xmax: 85.0 },
          notes: "Item 3: All-inclusive retail price."
        },
        {
          id: "decl-aura-usp",
          field: "unit_sale_price",
          label: "Unit Sale Price (USP)",
          original_text: "4. UNIT SALE PRICE: ₹0.38 / g",
          normalized_value: "0.38 INR/g",
          found: true,
          status: "FOUND",
          confidence: 0.95,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [335, 100, 372, 680],
          bbox: { ymin: 33.5, xmin: 10.0, ymax: 37.2, xmax: 68.0 },
          notes: "Item 4: Compliant unit sale price."
        },
        {
          id: "decl-aura-mfg",
          field: "manufacturer_name",
          label: "Manufacturer Name & Address",
          original_text: "5. MFD & PACKED BY: Aura Organics Foods, Plot 42, Food Park, Phase-II, Okhla, New Delhi - 110020, India.",
          normalized_value: "Aura Organics Foods, Plot 42, Food Park, Phase-II, Okhla, New Delhi - 110020",
          found: true,
          status: "FOUND",
          confidence: 0.96,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [390, 100, 480, 890],
          bbox: { ymin: 39.0, xmin: 10.0, ymax: 48.0, xmax: 89.0 },
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
          box_2d: [500, 100, 538, 850],
          bbox: { ymin: 50.0, xmin: 10.0, ymax: 53.8, xmax: 85.0 },
          notes: "Item 6: Date of packing."
        },
        {
          id: "decl-aura-bb",
          field: "best_before",
          label: "Best Before Duration",
          original_text: "7. BEST BEFORE: 9 Months from date of packaging",
          normalized_value: "9 Months",
          found: true,
          status: "FOUND",
          confidence: 0.98,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [555, 100, 592, 850],
          bbox: { ymin: 55.5, xmin: 10.0, ymax: 59.2, xmax: 85.0 },
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
          box_2d: [610, 100, 646, 620],
          bbox: { ymin: 61.0, xmin: 10.0, ymax: 64.6, xmax: 62.0 },
          notes: "Item 8: Country of origin statement."
        },
        {
          id: "decl-aura-cc",
          field: "consumer_care",
          label: "Consumer Care Details",
          original_text: "9. CONSUMER CARE GRIEVANCE CELL: Executive, Care Cell at Mfd Address, Tel: 1800-200-4455, Email: care@auraorganics.in",
          normalized_value: "Executive, Care Cell, Tel: 1800-200-4455, Email: care@auraorganics.in",
          found: true,
          status: "FOUND",
          confidence: 0.96,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [670, 95, 795, 905],
          bbox: { ymin: 67.0, xmin: 9.5, ymax: 79.5, xmax: 90.5 },
          notes: "Item 9: Consumer care address, toll-free number, and email."
        },
        {
          id: "decl-aura-barcode",
          field: "barcode",
          label: "Barcode / GTIN Number",
          original_text: "8 906012 345678",
          normalized_value: "8906012345678",
          found: true,
          status: "FOUND",
          confidence: 0.99,
          image_id: backImg.id,
          image_type: "Back",
          box_2d: [815, 100, 885, 460],
          bbox: { ymin: 81.5, xmin: 10.0, ymax: 88.5, xmax: 46.0 },
          notes: "13-digit retail barcode."
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

  // Aura Organics Oats preset check
  if (demoPresetId === 'demo-compliant-cookies') {
    return [
      {
        id: "decl-front-brand-" + Date.now(),
        field: "brand_name",
        label: "Brand Name / Trademark",
        original_text: "AURA ORGANICS",
        normalized_value: "Aura Organics",
        found: true,
        status: "FOUND",
        confidence: 0.99,
        image_id: frontImage.id,
        image_type: "Front",
        box_2d: [120, 200, 220, 800],
        bbox: { ymin: 12.0, xmin: 20.0, ymax: 22.0, xmax: 80.0 },
        notes: "Brand mark prominently displayed at top of PDP."
      },
      {
        id: "decl-front-prodname-" + Date.now(),
        field: "product_name",
        label: "Generic / Common Commodity Name",
        original_text: "Rolled Oats",
        normalized_value: "Rolled Oats (Whole Grain)",
        found: true,
        status: "FOUND",
        confidence: 0.98,
        image_id: frontImage.id,
        image_type: "Front",
        box_2d: [250, 180, 420, 820],
        bbox: { ymin: 25.0, xmin: 18.0, ymax: 42.0, xmax: 82.0 },
        notes: "Generic commodity name correctly sized and positioned."
      },
      {
        id: "decl-front-netqty-" + Date.now(),
        field: "net_quantity",
        label: "Net Quantity (Front PDP)",
        original_text: "Net Wt: 1 kg (1000 g)",
        normalized_value: "1 kg",
        found: true,
        status: "FOUND",
        confidence: 0.99,
        image_id: frontImage.id,
        image_type: "Front",
        box_2d: [680, 250, 780, 750],
        bbox: { ymin: 68.0, xmin: 25.0, ymax: 78.0, xmax: 75.0 },
        notes: "Net weight on Principal Display Panel compliant with Rule 7."
      },
      {
        id: "decl-front-veg-" + Date.now(),
        field: "veg_non_veg",
        label: "Dietary Classification Mark",
        original_text: "100% Vegetarian (Green Dot)",
        normalized_value: "Vegetarian",
        found: true,
        status: "FOUND",
        confidence: 0.98,
        image_id: frontImage.id,
        image_type: "Front",
        box_2d: [800, 750, 880, 850],
        bbox: { ymin: 80.0, xmin: 75.0, ymax: 88.0, xmax: 85.0 },
        notes: "Vegetarian dietary symbol verified."
      }
    ];
  }
  return undefined;
}

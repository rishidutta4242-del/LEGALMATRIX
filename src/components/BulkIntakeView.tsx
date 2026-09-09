import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { submitBulkIntake } from '../services/api';
import { ProductCategory, InspectionRecord } from '../types/index';
import {
  UploadCloud,
  Globe,
  Layers,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  ArrowRight,
  RefreshCw,
  Plus,
  Trash2,
  PackageCheck,
  FileUp,
  Download,
  ShieldAlert,
  HelpCircle,
  ShoppingBag,
  Boxes,
  Award
} from 'lucide-react';

interface BatchItemResult {
  index: number;
  source: string;
  status: 'SUCCESS' | 'ERROR';
  product_name?: string;
  inspection_id?: string;
  error?: string;
  inspection?: InspectionRecord;
}

export const BulkIntakeView: React.FC = () => {
  const { officerName, viewInspection, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'URLS' | 'CSV_FILE' | 'BULK_BOXES'>('URLS');
  const [batchName, setBatchName] = useState<string>('Market Surveillance Batch — Q2');
  const [urlInput, setUrlInput] = useState<string>(
    `https://www.amazon.in/dp/B08XYZ1234 (Aura Whole Oats 500g)
https://www.flipkart.com/item/itm987654 (Radiant Herbal Shampoo 200ml)
https://blinkit.com/prn/fresh-pressed-juice-1l (Pure Sip Orange Juice 1L)
https://zeptonow.com/pn/roasted-almonds-200g (NutriFit California Almonds 200g)
https://www.bigbasket.com/pd/123456/atta-5kg (FarmFresh Sharbati Atta 5kg)`
  );

  const [bulkBoxInput, setBulkBoxInput] = useState<string>(
    `Aura Organics Oats Cookies (24x 100g) | Aura Organics Foods | Food | 18901030998121 | 24 | 100g | 2.75kg | Warehouse Master Carton
Pure Sip 100% Valencia Orange Juice (12x 1L) | Pure Sip Beverages | Beverages | 18903050776258 | 12 | 1000ml | 13.2kg | Logistics CFS Shipper
Radiant Herbal Shampoo (48x 200ml) | Radiant Cosmetics Ltd | Cosmetics | 18902040887160 | 48 | 200ml | 11.5kg | Distributor Master Shipper
NutriFit California Roasted Almonds (30x 200g) | NutriFit Foods | Food | 18904561237892 | 30 | 200g | 6.8kg | FMCG Wholesale Outer Carton`
  );

  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [parsedCsvItems, setParsedCsvItems] = useState<any[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [results, setResults] = useState<InspectionRecord[]>([]);
  const [itemResults, setItemResults] = useState<BatchItemResult[]>([]);

  // Sample CSV Template Downloader
  const handleDownloadCsvTemplate = () => {
    const headers = 'product_name,brand,category,barcode,net_quantity,mrp,source_url,notes';
    const sampleRows = [
      'Aura Rolled Oats 500g,Aura Organics,Food,8901030998124,500 g,₹185.00,https://www.amazon.in/dp/B08XYZ1234,Online marketplace sweep',
      'Radiant Keratin Shampoo 200ml,Radiant Herbals,Cosmetics,8902040887163,200 ml,₹240.00,https://www.flipkart.com/item/itm987654,Rule 6 check',
      'Pure Sip Orange Juice 1L,Pure Sip,Beverages,8903050776251,1000 ml,₹130.00,https://blinkit.com/prn/orange-juice,Quick-commerce audit'
    ].join('\n');

    const blob = new Blob([`${headers}\n${sampleRows}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'LegalMetrix_Intake_Template.csv';
    link.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded sample CSV template.', 'info');
  };

  // Defensive CSV Parser
  const parseCSV = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) {
      showToast('CSV file is empty or missing data rows.', 'error');
      return;
    }

    const rawHeaders = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/["']/g, ''));

    // Map common aliases
    const nameIdx = rawHeaders.findIndex((h) => h.includes('name') || h.includes('title') || h.includes('product') || h.includes('commodity'));
    const brandIdx = rawHeaders.findIndex((h) => h.includes('brand') || h.includes('make') || h.includes('manufacturer'));
    const catIdx = rawHeaders.findIndex((h) => h.includes('category') || h.includes('type'));
    const barIdx = rawHeaders.findIndex((h) => h.includes('barcode') || h.includes('gtin') || h.includes('ean') || h.includes('upc'));
    const netQtyIdx = rawHeaders.findIndex((h) => h.includes('quantity') || h.includes('qty') || h.includes('net') || h.includes('weight'));
    const mrpIdx = rawHeaders.findIndex((h) => h.includes('mrp') || h.includes('price'));
    const urlIdx = rawHeaders.findIndex((h) => h.includes('url') || h.includes('link') || h.includes('source'));
    const notesIdx = rawHeaders.findIndex((h) => h.includes('note') || h.includes('remark') || h.includes('desc'));

    const items: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Basic CSV cell extraction respecting quotes
      const cells: string[] = [];
      let inQuote = false;
      let cur = '';
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"') {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          cells.push(cur.trim().replace(/^"|"$/g, ''));
          cur = '';
        } else {
          cur += char;
        }
      }
      cells.push(cur.trim().replace(/^"|"$/g, ''));

      const pName = nameIdx >= 0 ? cells[nameIdx] : `Commodity Item #${i}`;
      let cat: ProductCategory = 'Food';
      const rawCat = catIdx >= 0 ? (cells[catIdx] || '').toLowerCase() : '';
      if (rawCat.includes('cosmetic') || rawCat.includes('personal')) cat = 'Cosmetics';
      else if (rawCat.includes('beverage') || rawCat.includes('drink') || rawCat.includes('juice')) cat = 'Beverages';
      else if (rawCat.includes('electric') || rawCat.includes('device')) cat = 'Electrical';
      else if (rawCat.includes('house') || rawCat.includes('clean')) cat = 'Household';

      items.push({
        source_type: 'SKU_CATALOG',
        product_name: pName,
        brand: brandIdx >= 0 ? cells[brandIdx] : 'Unspecified Brand',
        category: cat,
        barcode: barIdx >= 0 ? cells[barIdx] : '',
        net_quantity: netQtyIdx >= 0 ? cells[netQtyIdx] : undefined,
        mrp: mrpIdx >= 0 ? cells[mrpIdx] : undefined,
        source_url: urlIdx >= 0 ? cells[urlIdx] : undefined,
        notes: notesIdx >= 0 ? cells[notesIdx] : undefined
      });
    }

    setParsedCsvItems(items);
    showToast(`Parsed ${items.length} commodities from CSV manifest.`, 'success');
  };

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.type.includes('csv') && !file.type.includes('text')) {
      showToast('Please upload a valid CSV file.', 'error');
      return;
    }
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      parseCSV(content);
    };
    reader.readAsText(file);
  };

  const handleRunBatch = async () => {
    let itemsToProcess: any[] = [];

    if (activeTab === 'URLS') {
      const rawLines = urlInput
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (rawLines.length === 0) {
        showToast('Please enter at least one product URL or SKU identifier.', 'error');
        return;
      }

      itemsToProcess = rawLines.map((line, idx) => {
        let cat: ProductCategory = 'Food';
        const lineLower = line.toLowerCase();
        if (lineLower.includes('shampoo') || lineLower.includes('cosmetic') || lineLower.includes('cream')) cat = 'Cosmetics';
        else if (lineLower.includes('juice') || lineLower.includes('drink') || lineLower.includes('water')) cat = 'Beverages';

        const explicitName = line.includes('(') ? line.split('(')[1].replace(')', '').trim() : undefined;

        return {
          source_type: 'ECOMMERCE_URL',
          source_url: line.split('(')[0].trim(),
          product_name: explicitName || `Market Commodity #${idx + 1}`,
          category: cat,
          brand: lineLower.includes('aura') ? 'Aura Organics' : lineLower.includes('radiant') ? 'Radiant Herbals' : lineLower.includes('pure sip') ? 'Pure Sip' : undefined
        };
      });
    } else if (activeTab === 'BULK_BOXES') {
      const rawLines = bulkBoxInput
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (rawLines.length === 0) {
        showToast('Please enter at least one wholesale master carton / bulk box entry.', 'error');
        return;
      }

      itemsToProcess = rawLines.map((line) => {
        const parts = line.split('|').map((p) => p.trim());
        const pName = parts[0] || 'Wholesale Master Shipper Carton';
        const brand = parts[1] || 'Registered Manufacturer';
        const cat = (parts[2] as ProductCategory) || 'Food';
        const itf14 = parts[3] || '18901030998121';
        const units = parseInt(parts[4] || '24', 10);
        const unitNet = parts[5] || '100g';
        const grossWeight = parts[6] || '2.75kg';
        const notes = parts[7] || 'Wholesale Master Carton Inspection under Chapter III Rules 24–26';

        return {
          source_type: 'SKU_CATALOG',
          product_name: pName,
          brand,
          category: cat,
          barcode: itf14,
          package_level: 'BULK_BOX',
          bulk_box_details: {
            inner_retail_units_count: units,
            unit_net_quantity: unitNet,
            total_gross_weight: grossWeight,
            master_shipper_barcode: itf14
          },
          dimensions: { width: 380, height: 420, depth: 260, unit: 'mm' },
          notes
        };
      });
    } else {
      if (parsedCsvItems.length === 0) {
        showToast('Please upload a CSV file containing at least one commodity record.', 'error');
        return;
      }
      itemsToProcess = parsedCsvItems;
    }

    try {
      setIsProcessing(true);
      const res = await submitBulkIntake({
        batch_name: batchName,
        officer_name: officerName,
        items: itemsToProcess
      });

      setResults(res.inspections || []);
      setItemResults(res.items_results || []);

      if (res.failed_count && res.failed_count > 0) {
        showToast(
          `Batch screened: ${res.successful_count} passed/reviewed, ${res.failed_count} item(s) encountered intake errors.`,
          'warning'
        );
      } else {
        showToast(`Successfully processed batch of ${res.processed_count} products.`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Batch intake failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportCSV = () => {
    if (results.length === 0) {
      showToast('No processed batch items to export.', 'error');
      return;
    }

    const headers = [
      'Inspection ID',
      'Product Name',
      'Brand',
      'Category',
      'Status',
      'Screening Score',
      'Violations Count',
      'Custody SHA-256 Hash',
      'Batch Identifier',
      'Date Screened'
    ];

    const rows = results.map((r) => [
      r.id,
      `"${(r.product_name || '').replace(/"/g, '""')}"`,
      `"${(r.brand || '').replace(/"/g, '""')}"`,
      r.category,
      r.status,
      r.screening_score,
      r.rule_evaluations?.filter((re) => re.status === 'FAIL').length || 0,
      r.chain_of_custody?.image_sha256 || 'SHA256:VERIFIED',
      `"${r.location || batchName}"`,
      r.created_at
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `LegalMetrix_Batch_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Batch surveillance report exported to CSV.', 'success');
  };

  const failedItems = itemResults.filter((r) => r.status === 'ERROR');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight flex flex-wrap items-center gap-2 sm:gap-3">
            <span>Bulk &amp; E-Commerce Market Intake</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              Surveillance Ingestion
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Automated compliance pipeline for marketplace scrapers, multi-SKU manifests, and batch e-commerce label intake under Rule 6(10) &amp; Rule 18.
          </p>
        </div>

        {results.length > 0 && (
          <button
            type="button"
            id="btn-export-batch-csv"
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-2 transition"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export Batch CSV</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Configuration (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Layers className="h-4 w-4 text-purple-600" />
              <span>Batch Ingestion Configuration</span>
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Batch / Operation Title</label>
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
              />
            </div>

            {/* Ingestion Mode Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('URLS')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-1 transition cursor-pointer ${
                  activeTab === 'URLS' ? 'bg-white text-purple-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Marketplace URLs</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('BULK_BOXES')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-1 transition cursor-pointer ${
                  activeTab === 'BULK_BOXES' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Boxes className="h-3.5 w-3.5" />
                <span>Bulk Master Boxes</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('CSV_FILE')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-1 transition cursor-pointer ${
                  activeTab === 'CSV_FILE' ? 'bg-white text-purple-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>CSV Upload</span>
              </button>
            </div>

            {/* TAB 1: URLs View */}
            {activeTab === 'URLS' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Marketplace Product URLs / SKUs</label>
                  <span className="text-[11px] text-slate-400">One per line</span>
                </div>
                <textarea
                  rows={6}
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Paste Amazon, Flipkart, Blinkit, Zepto, or BigBasket product URLs..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono resize-none leading-relaxed"
                />

                {/* Preset Quick Actions */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider self-center mr-1">
                    Marketplace Stubs:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setUrlInput((prev) =>
                        `${prev}\nhttps://www.amazon.in/dp/B09ABC5678 (Aura Organic Rolled Oats 1kg)`
                      )
                    }
                    className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono border border-slate-200"
                  >
                    + Amazon.in
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setUrlInput((prev) =>
                        `${prev}\nhttps://www.flipkart.com/item/itm112233 (Radiant Herbal Conditioner 250ml)`
                      )
                    }
                    className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono border border-slate-200"
                  >
                    + Flipkart
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setUrlInput((prev) =>
                        `${prev}\nhttps://zeptonow.com/pn/cold-pressed-groundnut-oil-1l (Pure Groundnut Oil 1L)`
                      )
                    }
                    className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono border border-slate-200"
                  >
                    + Zepto
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setUrlInput((prev) =>
                        `${prev}\nhtt://broken-url-test-example (Intentional Malformed Input Test)`
                      )
                    }
                    className="text-[10px] px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-700 rounded font-mono border border-red-200"
                    title="Test individual item error handling"
                  >
                    + Malformed URL
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: CSV File Upload */}
            {activeTab === 'CSV_FILE' && (
              <div className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                    dragOver
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-slate-300 hover:border-purple-400 bg-slate-50'
                  }`}
                >
                  <FileUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-xs font-bold text-slate-800">
                    {csvFileName ? `Selected: ${csvFileName}` : 'Click or Drag & Drop Manifest CSV'}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Supports columns for Product Name, Brand, Category, Barcode, MRP, and URLs
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadCsvTemplate}
                    className="text-xs text-purple-700 hover:text-purple-900 font-semibold flex items-center space-x-1"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Sample CSV Template</span>
                  </button>

                  {parsedCsvItems.length > 0 && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {parsedCsvItems.length} items parsed
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Wholesale Master Cartons & Bulk Boxes View */}
            {activeTab === 'BULK_BOXES' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <Boxes className="h-4 w-4 text-amber-600" />
                    <span>Wholesale Master Cartons (Chapter III Rules 24–26)</span>
                  </label>
                  <span className="text-[10px] text-amber-800 bg-amber-100 font-bold px-1.5 py-0.5 rounded">
                    Bulk Shipper Manifest
                  </span>
                </div>

                <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                  <strong>Statutory Scope:</strong> Evaluates wholesale master shipping boxes, secondary outer cartons, and logistics shippers under <strong>Rule 24</strong> (outer container mandatory declarations: registered manufacturer, commodity name, inner unit counts or net quantity) and <strong>Rule 26</strong> exemptions.
                </div>

                <div className="text-[11px] text-slate-500 font-mono">
                  Format: <code>Product Name | Brand | Category | ITF-14 Barcode | Units | Unit Net Mass | Gross Wt | Notes</code>
                </div>

                <textarea
                  rows={6}
                  value={bulkBoxInput}
                  onChange={(e) => setBulkBoxInput(e.target.value)}
                  placeholder="Enter bulk cartons (one per line)..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono resize-none leading-relaxed"
                />

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider self-center mr-1">
                    Add Sample Box:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setBulkBoxInput((prev) =>
                        `${prev}\nFarmFresh Whole Wheat Flour (10x 5kg) | FarmFresh Mills | Food | 18901234567891 | 10 | 5kg | 52.0kg | Master Burlap Outer Bag`
                      )
                    }
                    className="text-[10px] px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded font-mono border border-amber-200 cursor-pointer"
                  >
                    + Wheat Atta (10x 5kg)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setBulkBoxInput((prev) =>
                        `${prev}\nCleanPro Liquid Detergent (6x 2L) | CleanPro India | Household | 18909876543214 | 6 | 2000ml | 13.8kg | Corrugated Shipper Box`
                      )
                    }
                    className="text-[10px] px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded font-mono border border-amber-200 cursor-pointer"
                  >
                    + Detergent (6x 2L)
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              id="btn-run-batch"
              disabled={isProcessing}
              onClick={handleRunBatch}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>PROCESSING BATCH SCREENING...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-white" />
                  <span>START BATCH INTAKE &amp; AI SCREENING</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Stream (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <PackageCheck className="h-4 w-4 text-purple-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Screened Products ({results.length})
                </h2>
              </div>
              {results.length > 0 && (
                <div className="flex items-center space-x-3 text-xs font-semibold">
                  <span className="text-emerald-700">
                    Pass: {results.filter((r) => r.status === 'PASS').length}
                  </span>
                  <span className="text-red-700">
                    Fail: {results.filter((r) => r.status === 'FAIL').length}
                  </span>
                  <span className="text-amber-700">
                    Review: {results.filter((r) => r.status === 'REVIEW').length}
                  </span>
                </div>
              )}
            </div>

            {/* Per-Item Error Warning Notice if any item failed */}
            {failedItems.length > 0 && (
              <div className="p-4 bg-red-50 border-b border-red-200 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-red-900">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span>{failedItems.length} Item(s) Encountered Intake Errors (Non-Fatal)</span>
                </div>
                <div className="space-y-1">
                  {failedItems.map((fail) => (
                    <div key={fail.index} className="text-[11px] text-red-800 bg-white/80 p-2 rounded border border-red-200 flex items-start justify-between">
                      <div>
                        <span className="font-bold">Item #{fail.index + 1}: </span>
                        <code className="text-[10px] text-slate-700">{fail.source}</code>
                        <div className="text-red-600 font-medium mt-0.5">{fail.error}</div>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                        Skipped
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.length === 0 && failedItems.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Globe className="h-8 w-8 mx-auto text-slate-300" />
                <p className="text-xs font-medium">
                  No batch processed yet. Enter URLs or upload a CSV on the left and click "Start Batch Intake".
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {results.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="text-xs font-mono font-bold text-slate-500">{item.id}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.status === 'PASS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'FAIL'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.status}
                        </span>
                        {item.package_level === 'BULK_BOX' ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1">
                            <Boxes className="h-3 w-3" />
                            <span>Bulk Master Box (Ch. III)</span>
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            Retail Pack (Ch. II)
                          </span>
                        )}
                        {item.certificate_id && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
                            <Award className="h-3 w-3 text-emerald-600" />
                            <span>Certificate Issued</span>
                          </span>
                        )}
                        <span className="text-[11px] font-medium text-slate-400 font-mono">
                          Score: {item.screening_score}/100
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 truncate">{item.product_name}</h3>
                      <p className="text-[11px] text-slate-500">
                        Brand: {item.brand} • Category: {item.category} • Barcode: {item.barcode || 'N/A'} • Violations: {item.rule_evaluations?.filter((e) => e.status === 'FAIL').length || 0}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => viewInspection(item, 'compliance_results')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1 shrink-0 transition cursor-pointer"
                    >
                      <span>Inspect</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Production Ingestion API Disclaimer Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs space-y-1.5 text-slate-600">
              <div className="flex items-center space-x-2 text-slate-800 font-bold">
                <Globe className="h-4 w-4 text-purple-600" />
                <span>Production Pipeline &amp; Enterprise API Integration</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                This intake console is configured for manual field officer sweeps and verification audits. For automated, high-throughput e-commerce surveillance (e.g., continuous daily scraping of &gt;10,000 SKUs from Amazon, Flipkart, Blinkit, or enterprise ERPs), ingest pipelines stream directly to the official LegalMetrix REST API (<code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-purple-700 font-mono">POST /api/bulk-intake</code>) using registered departmental API Gateway credentials.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

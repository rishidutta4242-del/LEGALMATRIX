import React, { useState } from 'react';
import {
  Scale,
  ShieldAlert,
  AlertTriangle,
  Calculator,
  Building,
  FileText,
  Copy,
  CheckCircle2,
  X,
  Info,
  BookOpen,
  ChevronRight
} from 'lucide-react';

interface PenaltyReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultOffence?: 'SEC_36_1' | 'SEC_36_2' | 'RULE_18_MRP' | 'SEC_39_REG';
  linkedInspectionId?: string;
  productName?: string;
  manufacturerName?: string;
}

interface StatutorySection {
  code: string;
  title: string;
  actRef: string;
  description: string;
  firstOffenceFine: string;
  secondOffenceFine: string;
  subsequentOffenceFine: string;
  imprisonmentRisk: string;
  compoundingApplicable: boolean;
  compoundingAuthority: string;
  corporateLiability: string;
}

const STATUTORY_SECTIONS: Record<string, StatutorySection> = {
  SEC_36_1: {
    code: 'SEC_36_1',
    title: 'Penalty for Non-Standard Packages & Rule 6 Violations',
    actRef: 'Section 36(1), Legal Metrology Act, 2009',
    description:
      'Selling, distributing, delivering, packing or causing to be sold or delivered any non-standard pre-packaged commodity or packages without mandatory declarations (Rule 6).',
    firstOffenceFine: 'Up to ₹25,000',
    secondOffenceFine: 'Up to ₹50,000',
    subsequentOffenceFine: 'Up to ₹1,00,000',
    imprisonmentRisk: 'Imprisonment up to 1 year, or both (subsequent offences)',
    compoundingApplicable: true,
    compoundingAuthority: 'Authorized Legal Metrology Officer (Section 48)',
    corporateLiability: 'Company and Nominated Director / Person-in-charge (Section 49)'
  },
  SEC_36_2: {
    code: 'SEC_36_2',
    title: 'Manufacture / Packing of Non-Standard Pre-Packaged Commodities',
    actRef: 'Section 36(2), Legal Metrology Act, 2009',
    description:
      'Whoever manufactures or packs or causes to be manufactured or packed any non-standard commodity with intent that it will be sold or distributed.',
    firstOffenceFine: 'Not less than ₹25,000 but may extend to ₹50,000',
    secondOffenceFine: 'Up to ₹1,00,000',
    subsequentOffenceFine: 'Up to ₹1,00,000 + prosecution',
    imprisonmentRisk: 'Imprisonment for a term which may extend to 1 year, or fine, or both',
    compoundingApplicable: true,
    compoundingAuthority: 'Deputy Controller / Authorized Officer',
    corporateLiability: 'Company + Quality Head / Factory Occupier (Section 49)'
  },
  RULE_18_MRP: {
    code: 'RULE_18_MRP',
    title: 'Dual Pricing, Overcharging beyond MRP & Prohibited Over-Stickering',
    actRef: 'Rule 18(2) r/w Section 36(1), Legal Metrology (PC) Rules, 2011',
    description:
      'No retail dealer or other person including manufacturer, packer, or importer shall sell any commodity at a price exceeding the retail sale price declared on the package.',
    firstOffenceFine: 'Up to ₹25,000 per violation',
    secondOffenceFine: 'Up to ₹50,000',
    subsequentOffenceFine: 'Up to ₹1,00,000',
    imprisonmentRisk: 'Up to 1 year for persistent contravention',
    compoundingApplicable: true,
    compoundingAuthority: 'Inspector / Authorized Field Officer',
    corporateLiability: 'Retail chain operator & Store Manager'
  },
  SEC_39_REG: {
    code: 'SEC_39_REG',
    title: 'Non-Registration of Manufacturer / Packer / Importer',
    actRef: 'Rule 27 r/w Section 39, Legal Metrology Act, 2009',
    description:
      'Failure to register name, corporate address, and packaging premises with the Director or Controller of Legal Metrology within the stipulated 90 days.',
    firstOffenceFine: 'Fine up to ₹5,000',
    secondOffenceFine: 'Fine up to ₹10,000',
    subsequentOffenceFine: 'Prosecution & Market Stop Order',
    imprisonmentRisk: 'Not applicable (monetary compounding)',
    compoundingApplicable: true,
    compoundingAuthority: 'Controller of Legal Metrology',
    corporateLiability: 'Principal Officers & Registered Directors'
  }
};

export const PenaltyReferenceModal: React.FC<PenaltyReferenceModalProps> = ({
  isOpen,
  onClose,
  defaultOffence = 'SEC_36_1',
  linkedInspectionId,
  productName,
  manufacturerName
}) => {
  const [selectedOffence, setSelectedOffence] = useState<string>(defaultOffence);
  const [offenceOccurrence, setOffenceOccurrence] = useState<'1ST' | '2ND' | 'SUBSEQUENT'>('1ST');
  const [skuCount, setSkuCount] = useState<number>(1);
  const [isCorporate, setIsCorporate] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const section = STATUTORY_SECTIONS[selectedOffence] || STATUTORY_SECTIONS.SEC_36_1;

  // Compounding estimation logic
  let baseEstimate = 0;
  let maxEstimate = 0;

  if (selectedOffence === 'SEC_36_1') {
    if (offenceOccurrence === '1ST') {
      baseEstimate = 5000 * skuCount;
      maxEstimate = 25000 * skuCount;
    } else if (offenceOccurrence === '2ND') {
      baseEstimate = 25000 * skuCount;
      maxEstimate = 50000 * skuCount;
    } else {
      baseEstimate = 50000 * skuCount;
      maxEstimate = 100000 * skuCount;
    }
  } else if (selectedOffence === 'SEC_36_2') {
    if (offenceOccurrence === '1ST') {
      baseEstimate = 25000 * skuCount;
      maxEstimate = 50000 * skuCount;
    } else {
      baseEstimate = 50000 * skuCount;
      maxEstimate = 100000 * skuCount;
    }
  } else if (selectedOffence === 'RULE_18_MRP') {
    if (offenceOccurrence === '1ST') {
      baseEstimate = 10000 * skuCount;
      maxEstimate = 25000 * skuCount;
    } else {
      baseEstimate = 25000 * skuCount;
      maxEstimate = 50000 * skuCount;
    }
  } else {
    baseEstimate = 2000 * skuCount;
    maxEstimate = 5000 * skuCount;
  }

  const handleCopyNotice = () => {
    const noticeText = `STATUTORY SHOW CAUSE / COMPOUNDING NOTICE
UNDER LEGAL METROLOGY ACT, 2009 & PACKAGED COMMODITIES RULES, 2011

To: ${manufacturerName || 'The Manufacturer / Packer / Retailer'}
Reference Inspection ID: ${linkedInspectionId || 'LM-AUDIT-2026-REF'}
Commodity: ${productName || 'Pre-packaged Commodity under Surveillance'}

Statutory Provision Violated: ${section.actRef}
Offence Classification: ${section.title}
Offence Occurrence: ${offenceOccurrence} Offence (${isCorporate ? 'Corporate Entity under Section 49' : 'Individual'})

FINDINGS & STATUTORY LIABILITY:
Upon optical and physical examination, the subject commodity fails to comply with the mandatory declarations stipulated under the Legal Metrology (Packaged Commodities) Rules, 2011. 

Pursuant to ${section.actRef}, the statutory penalty liability for this contravention ranges between ₹${baseEstimate.toLocaleString(
      'en-IN'
    )} to ₹${maxEstimate.toLocaleString('en-IN')} (or imprisonment under Section 36(1) for subsequent offences).

You are hereby afforded an opportunity under Section 48 of the Legal Metrology Act, 2009 for Compounding of Offence within 15 days of receipt of this notice, failing which formal prosecution proceedings shall be initiated before the Court of Judicial Magistrate First Class.

Issued By: Directorate of Legal Metrology, Government of India.`;

    navigator.clipboard.writeText(noticeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-300 max-w-3xl w-full shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <Scale className="h-5 w-5 text-blue-400" />
            <div>
              <h2 className="text-sm font-bold tracking-wide">Statutory Penalty &amp; Compounding Reference</h2>
              <p className="text-[10px] text-slate-400">Legal Metrology Act, 2009 &amp; Packaged Commodities Rules, 2011</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Offence Selector Tabs */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Select Statutory Provision:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {Object.values(STATUTORY_SECTIONS).map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setSelectedOffence(item.code)}
                  className={`p-3 rounded-xl border text-left transition ${
                    selectedOffence === item.code
                      ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <div className="font-mono text-[10px] text-blue-700">{item.actRef}</div>
                  <div className="text-xs mt-0.5 line-clamp-1">{item.title}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Provision Summary Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{section.title}</h3>
                <span className="text-[11px] font-mono font-bold text-blue-800">{section.actRef}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Compounding Available (Sec 48)
              </span>
            </div>

            <p className="text-slate-600 leading-relaxed">{section.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">1st Offence Fine</span>
                <span className="font-bold text-slate-900 text-xs mt-0.5 block">{section.firstOffenceFine}</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">2nd Offence Fine</span>
                <span className="font-bold text-slate-900 text-xs mt-0.5 block">{section.secondOffenceFine}</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Subsequent Offence</span>
                <span className="font-bold text-red-700 text-xs mt-0.5 block">{section.subsequentOffenceFine}</span>
              </div>
            </div>

            {section.imprisonmentRisk && (
              <div className="flex items-center space-x-2 text-[11px] text-red-800 bg-red-50 p-2 rounded border border-red-200">
                <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                <span><strong>Custodial Sentence Risk:</strong> {section.imprisonmentRisk}</span>
              </div>
            )}
          </div>

          {/* Interactive Compounding Calculator */}
          <div className="p-5 bg-white rounded-xl border border-blue-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs">
                <Calculator className="h-4 w-4 text-blue-600" />
                <span>Statutory Compounding Fee Estimator</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Sec 48 Framework</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Offence Sequence</label>
                <select
                  value={offenceOccurrence}
                  onChange={(e) => setOffenceOccurrence(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none"
                >
                  <option value="1ST">1st Contravention</option>
                  <option value="2ND">2nd Contravention</option>
                  <option value="SUBSEQUENT">Subsequent Offence</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Seized SKU Batches</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={skuCount}
                  onChange={(e) => setSkuCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Entity Liability</label>
                <select
                  value={isCorporate ? 'CORP' : 'IND'}
                  onChange={(e) => setIsCorporate(e.target.value === 'CORP')}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none"
                >
                  <option value="CORP">Company (Section 49)</option>
                  <option value="IND">Sole Proprietor</option>
                </select>
              </div>
            </div>

            {/* Calculated Estimated Range */}
            <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700">
                  Recommended Compounding Range (Indicative)
                </span>
                <div className="text-2xl font-black text-blue-950 font-mono mt-0.5">
                  ₹{baseEstimate.toLocaleString('en-IN')} – ₹{maxEstimate.toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] text-blue-700">
                  For {skuCount} non-compliant product lot(s) • {section.compoundingAuthority}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyNotice}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 shrink-0"
              >
                {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Copied Notice!' : 'Copy Show Cause Notice'}</span>
              </button>
            </div>
          </div>

          {/* Section 49 Corporate Governance Note */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center space-x-2 font-bold text-slate-800">
              <Building className="h-4 w-4 text-slate-600" />
              <span>Section 49 — Offences by Companies &amp; Nominated Directors</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Where an offence under this Act has been committed by a company, the person nominated by the company under Section 49(2) or, in the absence of nomination, every director, manager, secretary or other officer responsible for the conduct of the business shall be deemed guilty of the contravention.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold"
          >
            Close Reference Guide
          </button>
        </div>
      </div>
    </div>
  );
};

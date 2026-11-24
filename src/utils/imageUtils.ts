// Utility functions for safe image handling, normalization, and fallback packaging graphics

export function normalizeImageUrl(url?: string | null, fallbackLabel: string = 'Legal Metrology Label'): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return createFallbackSvg(fallbackLabel);
  }

  const trimmed = url.trim();

  // If it's a raw SVG string without data URI prefix
  if (trimmed.startsWith('<svg') || trimmed.startsWith('<?xml')) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`;
  }

  // Already a valid Data URI or HTTP URL
  if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
    return trimmed;
  }

  return trimmed;
}

export function createFallbackSvg(label: string, subtitle: string = 'Pre-Packaged Commodity'): string {
  const cleanLabel = (label || 'Commodity Packaging').slice(0, 40);
  const cleanSubtitle = (subtitle || 'Legal Metrology Enforcement').slice(0, 45);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="#f8fafc">
    <rect width="600" height="750" fill="#0f172a"/>
    <rect x="20" y="20" width="560" height="710" rx="16" fill="#1e293b" stroke="#334155" stroke-width="2"/>
    <rect x="40" y="40" width="520" height="90" rx="10" fill="#090d16"/>
    <text x="300" y="80" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#38bdf8" text-anchor="middle">${escapeXml(cleanLabel)}</text>
    <text x="300" y="110" font-family="Arial, sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">${escapeXml(cleanSubtitle)}</text>
    
    <rect x="60" y="160" width="480" height="280" rx="12" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
    <circle cx="300" cy="280" r="60" fill="#1e293b" stroke="#38bdf8" stroke-width="3"/>
    <text x="300" y="295" font-family="Arial, sans-serif" font-size="44" text-anchor="middle">📦</text>
    <text x="300" y="370" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#f8fafc" text-anchor="middle">OFFICIAL PACKAGING EVIDENCE ARCHIVE</text>
    <text x="300" y="395" font-family="Arial, sans-serif" font-size="12" fill="#64748b" text-anchor="middle">Legal Metrology Act, 2009 — Schedule II Calibrated Panel</text>

    <rect x="40" y="470" width="520" height="220" rx="10" fill="#0f172a" stroke="#334155"/>
    <text x="60" y="505" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#38bdf8">STATUTORY DECLARATION PANEL</text>
    <text x="60" y="535" font-family="Arial, sans-serif" font-size="12" fill="#94a3b8">Commodity: Standard Packaged Good</text>
    <text x="60" y="565" font-family="Arial, sans-serif" font-size="12" fill="#94a3b8">Net Quantity: Standard Metric Units (g / kg / ml / L)</text>
    <text x="60" y="595" font-family="Arial, sans-serif" font-size="12" fill="#94a3b8">MRP: Max. Retail Price (inclusive of all taxes)</text>
    <text x="60" y="625" font-family="Arial, sans-serif" font-size="12" fill="#94a3b8">Date of Pkg / Mfg: Specified with Month and Year</text>
    <text x="60" y="655" font-family="Arial, sans-serif" font-size="12" fill="#94a3b8">Consumer Care: Name, Address, Tel &amp; Email provided</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

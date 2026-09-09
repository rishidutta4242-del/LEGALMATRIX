import React from 'react';

interface NationalEmblemProps {
  className?: string;
  size?: number; // size in px, default 54
  showMinistryText?: boolean;
}

/**
 * Authentic Vector Representation of the State Emblem of India
 * (Lion Capital of Ashoka with Abacus, Ashoka Chakra, Sacred Bull, Galloping Horse,
 * Lotus Base, and Devanagari Motto "सत्यमेव जयते")
 */
export const NationalEmblemIndia: React.FC<NationalEmblemProps> = ({
  className = '',
  size = 64,
  showMinistryText = false
}) => {
  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg
        width={size}
        height={Math.round(size * 1.2)}
        viewBox="0 0 120 144"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-slate-900"
      >
        {/* Ashoka Lion Capital - Central Lion Head & Mane */}
        <g id="central-lion">
          {/* Crown & Forehead */}
          <path
            d="M60 12 C55 12 51 15 50 19 C48 16 43 17 42 21 C41 26 44 29 46 32 C43 33 41 36 41 40 C41 44 44 48 48 50 C46 54 47 58 50 61 C53 64 57 65 60 65 C63 65 67 64 70 61 C73 58 74 54 72 50 C76 48 79 44 79 40 C79 36 77 33 74 32 C76 29 79 26 78 21 C77 17 72 16 70 19 C69 15 65 12 60 12 Z"
            fill="#1e293b"
          />
          {/* Facial features - Eyes, Muzzle & Whiskers */}
          <ellipse cx="54" cy="30" rx="2.5" ry="3.5" fill="#f8fafc" />
          <circle cx="54.5" cy="30" r="1.5" fill="#0f172a" />
          <ellipse cx="66" cy="30" rx="2.5" ry="3.5" fill="#f8fafc" />
          <circle cx="65.5" cy="30" r="1.5" fill="#0f172a" />
          {/* Nose & Snout */}
          <path d="M58 33 L62 33 L60 38 Z" fill="#f8fafc" />
          <path d="M57 40 Q60 43 63 40" stroke="#f8fafc" strokeWidth="1.5" strokeLinecap="round" />
          {/* Forehead tilak / brow definition */}
          <path d="M60 16 L60 25" stroke="#f8fafc" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* Left Flanking Lion (profile) */}
        <g id="left-lion">
          <path
            d="M40 24 C34 22 28 26 27 32 C26 38 29 44 32 48 C30 52 32 58 36 61 C39 63 43 63 46 60 C42 55 40 48 40 40 C40 34 41 28 40 24 Z"
            fill="#334155"
          />
          <circle cx="31" cy="33" r="2" fill="#f8fafc" />
          <circle cx="31" cy="33" r="1" fill="#0f172a" />
          <path d="M26 38 Q30 40 33 37" stroke="#f8fafc" strokeWidth="1.2" />
        </g>

        {/* Right Flanking Lion (profile) */}
        <g id="right-lion">
          <path
            d="M80 24 C86 22 92 26 93 32 C94 38 91 44 88 48 C90 52 88 58 84 61 C81 63 77 63 74 60 C78 55 80 48 80 40 C80 34 79 28 80 24 Z"
            fill="#334155"
          />
          <circle cx="89" cy="33" r="2" fill="#f8fafc" />
          <circle cx="89" cy="33" r="1" fill="#0f172a" />
          <path d="M94 38 Q90 40 87 37" stroke="#f8fafc" strokeWidth="1.2" />
        </g>

        {/* Abacus Frieze (Circular band beneath lions) */}
        <g id="abacus">
          {/* Main Abacus Block */}
          <rect x="18" y="68" width="84" height="24" rx="3" fill="#1e293b" />
          <rect x="20" y="70" width="80" height="20" rx="2" fill="#0f172a" stroke="#cbd5e1" strokeWidth="0.8" />

          {/* Central Ashoka Chakra in the Abacus */}
          <g id="abacus-chakra">
            <circle cx="60" cy="80" r="8" stroke="#38bdf8" strokeWidth="1.2" fill="#0284c7" />
            <circle cx="60" cy="80" r="2" fill="#f8fafc" />
            {/* 24 spokes (sample spokes) */}
            {[...Array(12)].map((_, i) => (
              <line
                key={i}
                x1={60 + 2 * Math.cos((i * 30 * Math.PI) / 180)}
                y1={80 + 2 * Math.sin((i * 30 * Math.PI) / 180)}
                x2={60 + 7.5 * Math.cos((i * 30 * Math.PI) / 180)}
                y2={80 + 7.5 * Math.sin((i * 30 * Math.PI) / 180)}
                stroke="#f8fafc"
                strokeWidth="0.8"
              />
            ))}
          </g>

          {/* Sacred Bull on Right of Abacus */}
          <g id="bull">
            <path
              d="M78 76 C80 73 83 73 85 75 C87 77 86 80 84 82 C82 84 80 84 78 82 Z"
              fill="#e2e8f0"
            />
            <path d="M85 73 L87 70" stroke="#f8fafc" strokeWidth="1" />
            <circle cx="83" cy="76" r="0.8" fill="#0f172a" />
          </g>

          {/* Galloping Horse on Left of Abacus */}
          <g id="horse">
            <path
              d="M42 76 C40 73 37 73 35 75 C33 77 34 80 36 82 C38 84 40 84 42 82 Z"
              fill="#e2e8f0"
            />
            <path d="M35 73 L33 70" stroke="#f8fafc" strokeWidth="1" />
            <circle cx="37" cy="76" r="0.8" fill="#0f172a" />
          </g>
        </g>

        {/* Bell-shaped Inverted Lotus Base */}
        <g id="lotus-pedestal">
          <path
            d="M26 95 C30 102 42 108 60 108 C78 108 90 102 94 95 L90 93 C76 99 44 99 30 93 Z"
            fill="#334155"
          />
          {/* Petal flutes */}
          <path d="M40 95 C45 104 55 106 60 106 C65 106 75 104 80 95" stroke="#94a3b8" strokeWidth="1" fill="none" />
          <line x1="48" y1="96" x2="49" y2="103" stroke="#94a3b8" strokeWidth="0.8" />
          <line x1="60" y1="96" x2="60" y2="106" stroke="#94a3b8" strokeWidth="1" />
          <line x1="72" y1="96" x2="71" y2="103" stroke="#94a3b8" strokeWidth="0.8" />
          {/* Plinth footer */}
          <rect x="34" y="108" width="52" height="4" rx="1.5" fill="#1e293b" />
        </g>

        {/* Motto: "सत्यमेव जयते" (Satyameva Jayate - Truth Alone Triumphs) */}
        <g id="motto">
          <text
            x="60"
            y="126"
            textAnchor="middle"
            fontFamily="'Noto Serif Devanagari', 'Mangal', 'Yashomudra', 'Georgia', serif"
            fontSize="11"
            fontWeight="bold"
            fill="#0f172a"
            letterSpacing="0.8"
          >
            सत्यमेव जयते
          </text>
          <text
            x="60"
            y="138"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontSize="7"
            fontWeight="600"
            fill="#475569"
            letterSpacing="1.2"
          >
            GOVERNMENT OF INDIA
          </text>
        </g>
      </svg>

      {showMinistryText && (
        <div className="text-center mt-1 space-y-0.5">
          <div className="text-xs font-bold text-slate-900 tracking-wider">
            भारत सरकार • GOVERNMENT OF INDIA
          </div>
          <div className="text-[11px] font-semibold text-slate-700">
            उपभोक्ता मामले विभाग • Department of Consumer Affairs
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            विधिक मापविज्ञान निदेशालय • Directorate of Legal Metrology
          </div>
        </div>
      )}
    </div>
  );
};

interface OfficialSealProps {
  size?: number; // size in px, default 96
  certId?: string;
  officerBadge?: string;
  className?: string;
}

/**
 * Authentic Official Indian Government Circular Rubber Stamp / Ink Seal
 * Features:
 * - Concentric double ring with decorative serrated/beaded rim
 * - Curved text on circular arcs via SVG <textPath>
 * - Top: "DIRECTORATE OF LEGAL METROLOGY • GOVT. OF INDIA"
 * - Bottom: "★ सत्यमेव जयते ★ STATUTORY VERIFIED ★"
 * - Center: Ashoka Chakra with "OFFICIAL SEAL"
 * - Authentic indelible royal blue stamp ink styling with natural rotation
 */
export const OfficialGovtSealStamp: React.FC<OfficialSealProps> = ({
  size = 100,
  certId = 'LM-2026',
  officerBadge,
  className = ''
}) => {
  const sealId = React.useId().replace(/:/g, '');
  const topPathId = `seal-top-path-${sealId}`;
  const bottomPathId = `seal-bottom-path-${sealId}`;

  return (
    <div
      className={`inline-flex flex-col items-center justify-center relative select-none transform -rotate-6 transition-transform hover:rotate-0 duration-300 ${className}`}
      title="Official Government of India Statutory Seal"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="filter drop-shadow-[0_2px_4px_rgba(30,58,138,0.18)]"
      >
        <defs>
          {/* Top arc path for uppercase header text */}
          <path
            id={topPathId}
            d="M 28 100 A 72 72 0 0 1 172 100"
            fill="none"
          />
          {/* Bottom arc path for Hindi motto & statutory verification text */}
          <path
            id={bottomPathId}
            d="M 170 104 A 72 72 0 0 1 30 104"
            fill="none"
          />
        </defs>

        {/* Outer Serrated / Beaded Ring */}
        <circle
          cx="100"
          cy="100"
          r="95"
          stroke="#1e3a8a"
          strokeWidth="1.8"
          strokeDasharray="2 3"
          fill="none"
          opacity="0.85"
        />

        {/* Outer Heavy Circular Border */}
        <circle
          cx="100"
          cy="100"
          r="91"
          stroke="#1e3a8a"
          strokeWidth="3.2"
          fill="#f8fafc"
          fillOpacity="0.4"
        />

        {/* Middle Hairline Border */}
        <circle
          cx="100"
          cy="100"
          r="86"
          stroke="#1e3a8a"
          strokeWidth="1"
          fill="none"
        />

        {/* Top Arc Circular Text: DIRECTORATE OF LEGAL METROLOGY • GOVT. OF INDIA */}
        <text
          fill="#1e3a8a"
          fontSize="9.5"
          fontWeight="bold"
          fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
          letterSpacing="1.2"
        >
          <textPath
            href={`#${topPathId}`}
            startOffset="50%"
            textAnchor="middle"
          >
            DIRECTORATE OF LEGAL METROLOGY • GOVT OF INDIA
          </textPath>
        </text>

        {/* Bottom Arc Circular Text: ★ सत्यमेव जयते ★ STATUTORY SEAL ★ */}
        <text
          fill="#1e3a8a"
          fontSize="9.2"
          fontWeight="bold"
          fontFamily="'Noto Serif Devanagari', 'Arial', sans-serif"
          letterSpacing="1.1"
        >
          <textPath
            href={`#${bottomPathId}`}
            startOffset="50%"
            textAnchor="middle"
          >
            ★ सत्यमेव जयते ★ STATUTORY SEAL ★
          </textPath>
        </text>

        {/* Inner Separator Ring */}
        <circle
          cx="100"
          cy="100"
          r="58"
          stroke="#1e3a8a"
          strokeWidth="2"
          fill="none"
        />
        <circle
          cx="100"
          cy="100"
          r="54"
          stroke="#1e3a8a"
          strokeWidth="0.8"
          strokeDasharray="2 2"
          fill="none"
        />

        {/* Central Seal Graphics */}
        <g id="center-seal-graphics">
          {/* Ashoka 24-spoke Dharma Chakra */}
          <circle
            cx="100"
            cy="90"
            r="20"
            stroke="#1e3a8a"
            strokeWidth="2.2"
            fill="#eff6ff"
          />
          <circle cx="100" cy="90" r="4.5" fill="#1e3a8a" />
          {/* 24 Spoke rays */}
          {[...Array(24)].map((_, i) => (
            <line
              key={i}
              x1={100 + 4.5 * Math.cos((i * 15 * Math.PI) / 180)}
              y1={90 + 4.5 * Math.sin((i * 15 * Math.PI) / 180)}
              x2={100 + 19 * Math.cos((i * 15 * Math.PI) / 180)}
              y2={90 + 19 * Math.sin((i * 15 * Math.PI) / 180)}
              stroke="#1e3a8a"
              strokeWidth="1.2"
            />
          ))}

          {/* Central Ribbons & Identification */}
          <rect
            x="50"
            y="114"
            width="100"
            height="18"
            rx="3"
            fill="#1e3a8a"
          />
          <text
            x="100"
            y="126"
            textAnchor="middle"
            fontFamily="'Arial Black', Arial, sans-serif"
            fontSize="9"
            fontWeight="900"
            fill="#ffffff"
            letterSpacing="1.2"
          >
            OFFICIAL SEAL
          </text>

          {/* Secondary Inspection Reference */}
          <text
            x="100"
            y="142"
            textAnchor="middle"
            fontFamily="'JetBrains Mono', monospace, sans-serif"
            fontSize="7.5"
            fontWeight="bold"
            fill="#1e3a8a"
            letterSpacing="0.6"
          >
            {certId.length > 16 ? certId.slice(0, 16) : certId}
          </text>
        </g>
      </svg>
    </div>
  );
};

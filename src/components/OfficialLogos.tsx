import React from 'react';

/**
 * Logo 1: Bangladesh Government Official Seal (গণপ্রজাতন্ত্রী বাংলাদেশ সরকার)
 * Matches uploaded gov_logo_url.png
 * - Green circular outer ring
 * - White band with Bengali text "গণপ্রজাতন্ত্রী বাংলাদেশ" (top) and "সরকার" (bottom)
 * - 4 Red 5-pointed stars (2 on left, 2 on right)
 * - Inner Red circle
 * - Yellow silhouette map of Bangladesh in center
 */
export const BdGovernmentSeal: React.FC<{ className?: string }> = ({ className = "w-20 h-20" }) => (
  <svg viewBox="0 0 240 240" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      {/* Path for Top Text: গণপ্রজাতন্ত্রী বাংলাদেশ */}
      <path id="bdGovTextTop" d="M 32,120 A 88,88 0 0,1 208,120" fill="none" />
      {/* Path for Bottom Text: সরকার */}
      <path id="bdGovTextBottom" d="M 204,124 A 84,84 0 0,1 36,124" fill="none" />
    </defs>

    {/* Outer Green Ring */}
    <circle cx="120" cy="120" r="116" fill="#ffffff" stroke="#006a4e" strokeWidth="6" />

    {/* Inner Green Border separating text ring and red center */}
    <circle cx="120" cy="120" r="78" fill="none" stroke="#006a4e" strokeWidth="2.5" />

    {/* Top Text: গণপ্রজাতন্ত্রী বাংলাদেশ */}
    <text fill="#006a4e" fontSize="16.5" fontWeight="900" fontFamily="'Tiro Bangla', serif" letterSpacing="0.8">
      <textPath href="#bdGovTextTop" startOffset="50%" textAnchor="middle">
        গণপ্রজাতন্ত্রী বাংলাদেশ
      </textPath>
    </text>

    {/* Bottom Text: সরকার */}
    <text fill="#006a4e" fontSize="21" fontWeight="900" fontFamily="'Tiro Bangla', serif" letterSpacing="2">
      <textPath href="#bdGovTextBottom" startOffset="50%" textAnchor="middle">
        সরকার
      </textPath>
    </text>

    {/* Left 2 Red Stars */}
    <polygon points="26,145 28.5,152 35.5,152 30,156 32,163 26,159 20,163 22,156 16.5,152 23.5,152" fill="#e11d48" />
    <polygon points="42,174 44.5,180 51.5,180 46,184 48,191 42,187 36,191 38,184 32.5,180 39.5,180" fill="#e11d48" />

    {/* Right 2 Red Stars */}
    <polygon points="214,145 216.5,152 223.5,152 218,156 220,163 214,159 208,163 210,156 204.5,152 211.5,152" fill="#e11d48" />
    <polygon points="198,174 200.5,180 207.5,180 202,184 204,191 198,187 192,191 194,184 188.5,180 195.5,180" fill="#e11d48" />

    {/* Inner Red Disc (Color of National Flag Red Circle) */}
    <circle cx="120" cy="120" r="76" fill="#e11d48" />

    {/* Yellow Silhouette of Bangladesh Geographic Map */}
    <g transform="translate(76, 52) scale(0.68)">
      <path
        d="M 45,5 C 47,8 44,12 50,15 C 53,16 57,14 60,18 C 62,21 59,27 63,30 C 67,33 73,30 78,34 C 81,37 80,42 85,45 C 91,48 95,43 100,47 C 104,50 102,57 106,62 C 109,66 116,68 118,74 C 119,79 113,85 115,90 C 117,94 122,96 122,102 C 122,107 116,111 118,116 C 120,121 127,124 128,130 C 129,136 123,141 124,146 C 125,152 131,157 130,164 C 129,170 121,173 120,178 C 118,183 121,189 119,194 C 117,199 110,202 108,206 C 106,204 105,198 102,195 C 98,191 91,192 88,187 C 86,183 89,177 87,173 C 84,168 77,169 75,163 C 73,158 76,152 74,147 C 71,141 64,142 61,136 C 58,131 60,124 57,119 C 53,113 46,115 42,109 C 39,104 42,97 39,92 C 36,86 29,88 27,81 C 25,75 29,69 27,63 C 25,58 19,57 18,51 C 17,45 22,40 23,34 C 24,28 20,23 23,17 C 26,11 34,10 38,6 Z"
        fill="#ffdd00"
        stroke="#eab308"
        strokeWidth="1.2"
      />
      {/* Chittagong / Hill Tracts South-Eastern projection */}
      <path
        d="M 108,140 C 114,144 118,150 120,158 C 122,166 126,174 126,184 C 126,192 121,200 123,208 C 124,213 120,217 118,220 C 116,215 113,210 114,204 C 114,196 110,190 108,182 C 106,174 104,166 103,158 Z"
        fill="#ffdd00"
      />
      {/* Sylhet North-Eastern projection */}
      <path
        d="M 85,25 C 93,22 102,24 110,28 C 115,31 121,36 125,42 C 121,45 115,44 110,42 C 104,40 98,36 92,34 Z"
        fill="#ffdd00"
      />
    </g>
  </svg>
);

/**
 * Logo 2: 12 No. Ambariya Union Council Official Seal (১২ নং আমবাড়ীয়া ইউনিয়ন পরিষদ)
 * Matches uploaded union_logo_url.png
 * - Outer gold circular ring
 * - Circular Red band with white text:
 *   - Top arc: "১২ নং আমবাড়ীয়া ইউনিয়ন পরিষদ"
 *   - Bottom arc: "মিরপুর, কুষ্টিয়া"
 * - Inner gold separator ring
 * - Green central disc with:
 *   - 3 gold 5-pointed stars at the top (center star larger)
 *   - White blooming Shapla (Water Lily) flower with elegant multiple petals and stem
 *   - Golden paddy rice ears (ধানের শীষ) on both left and right
 *   - Small golden tree on lower right
 *   - Golden undulating river waves at the bottom
 */
export const UnionCouncilSeal: React.FC<{ className?: string }> = ({ className = "w-20 h-20" }) => (
  <svg viewBox="0 0 240 240" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      {/* Curved path for Top Text */}
      <path id="unionTextTop" d="M 28,120 A 92,92 0 0,1 212,120" fill="none" />
      {/* Curved path for Bottom Text */}
      <path id="unionTextBottom" d="M 206,124 A 86,86 0 0,1 34,124" fill="none" />
    </defs>

    {/* Outer Gold Border */}
    <circle cx="120" cy="120" r="117" fill="#ffffff" stroke="#eab308" strokeWidth="5.5" />

    {/* Red Circular Band */}
    <circle cx="120" cy="120" r="114" fill="#c0262d" />

    {/* Inner Gold Separator Ring */}
    <circle cx="120" cy="120" r="77" fill="#065f46" stroke="#eab308" strokeWidth="4.5" />

    {/* Top Text: ১২ নং আমবাড়ীয়া ইউনিয়ন পরিষদ */}
    <text fill="#ffffff" fontSize="17" fontWeight="900" fontFamily="'Tiro Bangla', serif" letterSpacing="0.4">
      <textPath href="#unionTextTop" startOffset="50%" textAnchor="middle">
        ১২ নং আমবাড়ীয়া ইউনিয়ন পরিষদ
      </textPath>
    </text>

    {/* Bottom Text: মিরপুর, কুষ্টিয়া */}
    <text fill="#ffffff" fontSize="18" fontWeight="900" fontFamily="'Tiro Bangla', serif" letterSpacing="1">
      <textPath href="#unionTextBottom" startOffset="50%" textAnchor="middle">
        মিরপুর, কুষ্টিয়া
      </textPath>
    </text>

    {/* Inside Green Disc: */}
    {/* 3 Gold Stars at Top */}
    {/* Center larger star */}
    <polygon points="120,53 123,61 131,61 125,66 127,74 120,69 113,74 115,66 109,61 117,61" fill="#eab308" />
    {/* Left smaller star */}
    <polygon points="91,62 93,68 99,68 94,72 96,78 91,74 86,78 88,72 83,68 89,68" fill="#eab308" />
    {/* Right smaller star */}
    <polygon points="149,62 151,68 157,68 152,72 154,78 149,74 144,78 146,72 141,68 147,68" fill="#eab308" />

    {/* Golden Paddy Rice Ears (ধানের শীষ) on Left */}
    <g stroke="#eab308" strokeWidth="2.5" fill="#eab308">
      <path d="M 64,142 C 58,126 56,104 68,76" fill="none" strokeLinecap="round" />
      {/* Left grains */}
      <ellipse cx="61" cy="88" rx="4" ry="7" transform="rotate(-30 61 88)" />
      <ellipse cx="57" cy="100" rx="4" ry="7.5" transform="rotate(-25 57 100)" />
      <ellipse cx="56" cy="113" rx="4" ry="7.5" transform="rotate(-15 56 113)" />
      <ellipse cx="58" cy="126" rx="4" ry="7" transform="rotate(-5 58 126)" />
      <ellipse cx="67" cy="80" rx="3.5" ry="6.5" transform="rotate(-35 67 80)" />
      <ellipse cx="68" cy="94" rx="3.5" ry="7" transform="rotate(20 68 94)" />
      <ellipse cx="66" cy="107" rx="3.5" ry="7" transform="rotate(25 66 107)" />
      <ellipse cx="66" cy="120" rx="3.5" ry="7" transform="rotate(30 66 120)" />
    </g>

    {/* Golden Paddy Rice Ears (ধানের শীষ) on Right */}
    <g stroke="#eab308" strokeWidth="2.5" fill="#eab308">
      <path d="M 176,142 C 182,126 184,104 172,76" fill="none" strokeLinecap="round" />
      {/* Right grains */}
      <ellipse cx="179" cy="88" rx="4" ry="7" transform="rotate(30 179 88)" />
      <ellipse cx="183" cy="100" rx="4" ry="7.5" transform="rotate(25 183 100)" />
      <ellipse cx="184" cy="113" rx="4" ry="7.5" transform="rotate(15 184 113)" />
      <ellipse cx="182" cy="126" rx="4" ry="7" transform="rotate(5 182 126)" />
      <ellipse cx="173" cy="80" rx="3.5" ry="6.5" transform="rotate(35 173 80)" />
      <ellipse cx="172" cy="94" rx="3.5" ry="7" transform="rotate(-20 172 94)" />
      <ellipse cx="174" cy="107" rx="3.5" ry="7" transform="rotate(-25 174 107)" />
      <ellipse cx="174" cy="120" rx="3.5" ry="7" transform="rotate(-30 174 120)" />
    </g>

    {/* Blooming White Shapla (Water Lily) in Center */}
    {/* Stem */}
    <path d="M 117,130 L 117,148 L 123,148 L 123,130 Z" fill="#ffffff" />
    
    {/* Center Top Main Petal */}
    <path
      d="M 120,80 C 114,94 110,112 118,130 C 122,130 126,112 120,80 Z"
      fill="#ffffff"
    />
    {/* Inner Left Petal */}
    <path
      d="M 120,88 C 110,96 100,110 106,128 C 112,128 116,118 120,88 Z"
      fill="#f8fafc"
    />
    {/* Inner Right Petal */}
    <path
      d="M 120,88 C 130,96 140,110 134,128 C 128,128 124,118 120,88 Z"
      fill="#f8fafc"
    />
    {/* Outer Left Mid Petal */}
    <path
      d="M 118,98 C 104,104 90,116 94,131 C 102,131 110,122 118,98 Z"
      fill="#ffffff"
    />
    {/* Outer Right Mid Petal */}
    <path
      d="M 122,98 C 136,104 150,116 146,131 C 138,131 130,122 122,98 Z"
      fill="#ffffff"
    />
    {/* Bottom Horizontal Left Flap */}
    <path
      d="M 116,126 C 98,120 84,124 74,131 C 86,135 102,134 116,126 Z"
      fill="#ffffff"
    />
    {/* Bottom Horizontal Right Flap */}
    <path
      d="M 124,126 C 142,120 156,124 166,131 C 154,135 138,134 124,126 Z"
      fill="#ffffff"
    />

    {/* Golden Tree Symbol on Lower Right */}
    <g transform="translate(148, 134)">
      <circle cx="12" cy="7" r="7.5" fill="#eab308" />
      <circle cx="7" cy="11" r="5" fill="#eab308" />
      <circle cx="17" cy="11" r="5" fill="#eab308" />
      <path d="M 11,14 L 11,20 L 13,20 L 13,14 Z" fill="#eab308" />
    </g>

    {/* Golden River Waves (নদীমাতৃক ঢেউ) at Bottom */}
    <path
      d="M 66,152 C 78,148 88,155 100,152 C 112,148 122,155 134,152 C 146,148 158,155 174,152"
      stroke="#eab308"
      strokeWidth="2.8"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M 72,160 C 84,156 94,163 106,160 C 118,156 128,163 140,160 C 152,156 162,163 168,160"
      stroke="#eab308"
      strokeWidth="2.8"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M 80,168 C 92,164 102,171 114,168 C 126,164 136,171 148,168 C 154,165 158,167 160,168"
      stroke="#eab308"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Logo 3: Translucent Shapla Water Lily Emblem for Watermark (Jolsap)
 * Required: Opacity 0.15 (opacity-15), dead-center behind certificate text body.
 * Features:
 * - Beautiful national Shapla (Water Lily) flower floating on river waves
 * - Flanked by stylized paddy sheaves
 * - 4 stars on top
 * - Jute leaves
 */
export const WatermarkShapla: React.FC<{ className?: string }> = ({ className = "w-96 h-96" }) => (
  <svg viewBox="0 0 300 300" className={className} xmlns="http://www.w3.org/2000/svg">
    <g fill="#0d5c3a" stroke="#0d5c3a">
      {/* 4 Stars at Top */}
      <polygon points="125,32 127.5,38 134,38 129,42 131,48 125,44 119,48 121,42 116,38 122.5,38" />
      <polygon points="105,44 107.5,50 114,50 109,54 111,60 105,56 99,60 101,54 96,50 102.5,50" />
      <polygon points="175,32 177.5,38 184,38 179,42 181,48 175,44 169,48 171,42 166,38 172.5,38" />
      <polygon points="195,44 197.5,50 204,50 199,54 201,60 195,56 189,60 191,54 186,50 192.5,50" />

      {/* Jute Leaves on Top */}
      <path d="M 150,22 C 146,36 145,50 150,62 C 155,50 154,36 150,22 Z" fill="#0d5c3a" />
      <path d="M 136,32 C 136,44 140,54 148,60 C 144,52 140,42 136,32 Z" fill="#0d5c3a" />
      <path d="M 164,32 C 164,44 160,54 152,60 C 156,52 160,42 164,32 Z" fill="#0d5c3a" />

      {/* Flanking Paddy Sheaves on Left */}
      <path d="M 68,200 C 50,150 56,90 92,54" fill="none" strokeWidth="4.5" strokeLinecap="round" />
      <ellipse cx="68" cy="85" rx="6" ry="14" transform="rotate(-35 68 85)" />
      <ellipse cx="58" cy="110" rx="6.5" ry="15" transform="rotate(-25 58 110)" />
      <ellipse cx="54" cy="138" rx="6.5" ry="15" transform="rotate(-15 54 138)" />
      <ellipse cx="56" cy="165" rx="6" ry="14" transform="rotate(-5 56 165)" />
      <ellipse cx="80" cy="72" rx="5.5" ry="13" transform="rotate(-45 80 72)" />
      <ellipse cx="80" cy="100" rx="6" ry="14" transform="rotate(20 80 100)" />
      <ellipse cx="76" cy="126" rx="6" ry="14" transform="rotate(25 76 126)" />
      <ellipse cx="74" cy="154" rx="6" ry="14" transform="rotate(30 74 154)" />

      {/* Flanking Paddy Sheaves on Right */}
      <path d="M 232,200 C 250,150 244,90 208,54" fill="none" strokeWidth="4.5" strokeLinecap="round" />
      <ellipse cx="232" cy="85" rx="6" ry="14" transform="rotate(35 232 85)" />
      <ellipse cx="242" cy="110" rx="6.5" ry="15" transform="rotate(25 242 110)" />
      <ellipse cx="246" cy="138" rx="6.5" ry="15" transform="rotate(15 246 138)" />
      <ellipse cx="244" cy="165" rx="6" ry="14" transform="rotate(5 244 165)" />
      <ellipse cx="220" cy="72" rx="5.5" ry="13" transform="rotate(45 220 72)" />
      <ellipse cx="220" cy="100" rx="6" ry="14" transform="rotate(-20 220 100)" />
      <ellipse cx="224" cy="126" rx="6" ry="14" transform="rotate(-25 224 126)" />
      <ellipse cx="226" cy="154" rx="6" ry="14" transform="rotate(-30 226 154)" />

      {/* Main Shapla Flower (Water Lily) in Center */}
      {/* Central Petal */}
      <path
        d="M 150,75 C 138,102 130,138 146,176 C 154,176 162,138 150,75 Z"
        fill="#0d5c3a"
      />
      {/* Intermediate Petals */}
      <path
        d="M 150,90 C 132,106 116,132 126,172 C 138,172 144,152 150,90 Z"
        fill="#0d5c3a"
      />
      <path
        d="M 150,90 C 168,106 184,132 174,172 C 162,172 156,152 150,90 Z"
        fill="#0d5c3a"
      />
      {/* Outer Petals */}
      <path
        d="M 148,110 C 122,122 98,145 106,175 C 120,175 134,158 148,110 Z"
        fill="#0d5c3a"
      />
      <path
        d="M 152,110 C 178,122 202,145 194,175 C 180,175 166,158 152,110 Z"
        fill="#0d5c3a"
      />
      {/* Horizontal Bottom Flaps */}
      <path
        d="M 144,166 C 114,155 92,162 76,174 C 96,182 122,180 144,166 Z"
        fill="#0d5c3a"
      />
      <path
        d="M 156,166 C 186,155 208,162 224,174 C 204,182 178,180 156,166 Z"
        fill="#0d5c3a"
      />

      {/* River Waves below flower */}
      <path
        d="M 85,200 C 105,192 125,204 150,196 C 175,188 195,204 215,196"
        fill="none"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M 96,212 C 116,204 136,216 150,208 C 164,200 184,216 204,208"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M 112,224 C 128,218 140,226 150,220 C 160,214 172,226 188,220"
        fill="none"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </g>
  </svg>
);

/**
 * Default Shapla Watermark SVG Data URI for direct <img> src usage
 */
export const DEFAULT_SHAPLA_WATERMARK_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
    <g fill="#0d5c3a" stroke="#0d5c3a">
      <polygon points="125,32 127.5,38 134,38 129,42 131,48 125,44 119,48 121,42 116,38 122.5,38" />
      <polygon points="105,44 107.5,50 114,50 109,54 111,60 105,56 99,60 101,54 96,50 102.5,50" />
      <polygon points="175,32 177.5,38 184,38 179,42 181,48 175,44 169,48 171,42 166,38 172.5,38" />
      <polygon points="195,44 197.5,50 204,50 199,54 201,60 195,56 189,60 191,54 186,50 192.5,50" />
      <path d="M 150,22 C 146,36 145,50 150,62 C 155,50 154,36 150,22 Z" fill="#0d5c3a" />
      <path d="M 136,32 C 136,44 140,54 148,60 C 144,52 140,42 136,32 Z" fill="#0d5c3a" />
      <path d="M 164,32 C 164,44 160,54 152,60 C 156,52 160,42 164,32 Z" fill="#0d5c3a" />
      <path d="M 68,200 C 50,150 56,90 92,54" fill="none" stroke-width="4.5" stroke-linecap="round" />
      <ellipse cx="68" cy="85" rx="6" ry="14" transform="rotate(-35 68 85)" />
      <ellipse cx="58" cy="110" rx="6.5" ry="15" transform="rotate(-25 58 110)" />
      <ellipse cx="54" cy="138" rx="6.5" ry="15" transform="rotate(-15 54 138)" />
      <ellipse cx="56" cy="165" rx="6" ry="14" transform="rotate(-5 56 165)" />
      <ellipse cx="80" cy="72" rx="5.5" ry="13" transform="rotate(-45 80 72)" />
      <ellipse cx="80" cy="100" rx="6" ry="14" transform="rotate(20 80 100)" />
      <ellipse cx="76" cy="126" rx="6" ry="14" transform="rotate(25 76 126)" />
      <ellipse cx="74" cy="154" rx="6" ry="14" transform="rotate(30 74 154)" />
      <path d="M 232,200 C 250,150 244,90 208,54" fill="none" stroke-width="4.5" stroke-linecap="round" />
      <ellipse cx="232" cy="85" rx="6" ry="14" transform="rotate(35 232 85)" />
      <ellipse cx="242" cy="110" rx="6.5" ry="15" transform="rotate(25 242 110)" />
      <ellipse cx="246" cy="138" rx="6.5" ry="15" transform="rotate(15 246 138)" />
      <ellipse cx="244" cy="165" rx="6" ry="14" transform="rotate(5 244 165)" />
      <ellipse cx="220" cy="72" rx="5.5" ry="13" transform="rotate(45 220 72)" />
      <ellipse cx="220" cy="100" rx="6" ry="14" transform="rotate(-20 220 100)" />
      <ellipse cx="224" cy="126" rx="6" ry="14" transform="rotate(-25 224 126)" />
      <ellipse cx="226" cy="154" rx="6" ry="14" transform="rotate(-30 226 154)" />
      <path d="M 150,75 C 138,102 130,138 146,176 C 154,176 162,138 150,75 Z" fill="#0d5c3a" />
      <path d="M 150,90 C 132,106 116,132 126,172 C 138,172 144,152 150,90 Z" fill="#0d5c3a" />
      <path d="M 150,90 C 168,106 184,132 174,172 C 162,172 156,152 150,90 Z" fill="#0d5c3a" />
      <path d="M 148,110 C 122,122 98,145 106,175 C 120,175 134,158 148,110 Z" fill="#0d5c3a" />
      <path d="M 152,110 C 178,122 202,145 194,175 C 180,175 166,158 152,110 Z" fill="#0d5c3a" />
      <path d="M 144,166 C 114,155 92,162 76,174 C 96,182 122,180 144,166 Z" fill="#0d5c3a" />
      <path d="M 156,166 C 186,155 208,162 224,174 C 204,182 178,180 156,166 Z" fill="#0d5c3a" />
      <path d="M 85,200 C 105,192 125,204 150,196 C 175,188 195,204 215,196" fill="none" stroke-width="4.5" stroke-linecap="round" />
      <path d="M 96,212 C 116,204 136,216 150,208 C 164,200 184,216 204,208" fill="none" stroke-width="4" stroke-linecap="round" />
      <path d="M 112,224 C 128,218 140,226 150,220 C 160,214 172,226 188,220" fill="none" stroke-width="3.5" stroke-linecap="round" />
    </g>
  </svg>`
)}`;

/**
 * Resolves the active watermark image src:
 * 1. custom_watermark_logo_base64 from localStorage
 * 2. savedWatermarkLogo from localStorage
 * 3. settings.watermarkLogoUrl passed from context
 * 4. Fallback to default Shapla Watermark SVG Data URI
 */
export const getActiveWatermarkSrc = (settingsWatermark?: string): string => {
  // Show a watermark only when one has been uploaded in Union Settings.
  // No built-in or localStorage fallback is used.
  return settingsWatermark?.trim() || '';
};

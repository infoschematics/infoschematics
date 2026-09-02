/** The gradients, patterns and cloud shapes the fabric artwork draws itself
 * with. A single `<defs>` output rendered once, inside the stage's own
 * `<defs>`, so every fabric component can reference these ids without
 * carrying its own copy. */
export function FabricDefs() {
  return (
    <>
      <linearGradient id="internet-fill" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#193b54" stopOpacity="0.88" />
        <stop offset="1" stopColor="#102638" stopOpacity="0.72" />
      </linearGradient>
      <linearGradient id="satcom-fill" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#172f43" stopOpacity="0.96" />
        <stop offset="1" stopColor="#0d2030" stopOpacity="0.9" />
      </linearGradient>
      <radialGradient id="mobile-fill" cx="50%" cy="35%" r="75%">
        <stop offset="0" stopColor="#1b4555" stopOpacity="0.94" />
        <stop offset="1" stopColor="#102838" stopOpacity="0.8" />
      </radialGradient>
      <linearGradient id="telemetry-fill" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#152c40" stopOpacity="0.9" />
        <stop offset="1" stopColor="#0c1c29" stopOpacity="0.8" />
      </linearGradient>
      <pattern height="20" id="telemetry-grid" patternUnits="userSpaceOnUse" width="20">
        <path d="M20 0 H0 V20" fill="none" stroke="#8dc7e7" strokeOpacity="0.08" strokeWidth="1" />
        <circle cx="1" cy="1" fill="#9cd5f5" r="1.2" opacity="0.22" />
      </pattern>
      <pattern height="34" id="fabric-grid" patternUnits="userSpaceOnUse" width="34">
        <path d="M34 0 H0 V34" fill="none" stroke="#8dc7e7" strokeOpacity="0.08" strokeWidth="1" />
        <circle cx="1" cy="1" fill="#9cd5f5" r="1.4" opacity="0.25" />
      </pattern>
      <path
        d="M460 157C491 112 577 102 644 127C749 72 896 82 976 120C1080 94 1209 107 1277 142C1305 154 1320 164 1320 177V232C1315 245 1295 254 1265 257H534C497 257 460 242 460 222Z"
        id="internet-cloud-shape"
      />
      <clipPath id="internet-cloud-clip">
        <use href="#internet-cloud-shape" />
      </clipPath>
      <path
        d="M1115 592C1070 567 1095 522 1145 519C1180 482 1265 482 1310 515C1385 487 1510 507 1540 552C1565 592 1520 622 1455 612H1170C1145 612 1125 605 1115 592Z"
        id="mobile-cloud-shape"
      />
      <clipPath id="mobile-cloud-clip">
        <use href="#mobile-cloud-shape" />
      </clipPath>
    </>
  )
}

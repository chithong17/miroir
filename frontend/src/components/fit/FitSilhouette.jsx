const clamp = (value, minimum, maximum) =>
  Math.max(minimum, Math.min(maximum, value));

function Callout({
  accent,
  anchorX,
  anchorY,
  align = "right",
  detail,
  filterId = "fit-card-shadow",
  label,
}) {
  const width = 112;
  const height = 38;
  const boxX = align === "right" ? 196 : 12;
  const boxY = anchorY - height / 2;
  const elbowX = align === "right" ? 188 : 132;
  const boxEdge = align === "right" ? boxX : boxX + width;

  return (
    <g>
      <path
        d={`M${anchorX} ${anchorY} H${elbowX} L${boxEdge} ${anchorY}`}
        fill="none"
        stroke={accent}
        strokeLinecap="round"
        strokeWidth="1.6"
      />
      <circle cx={anchorX} cy={anchorY} fill={accent} r="4.5" />
      <rect
        x={boxX}
        y={boxY}
        width={width}
        height={height}
        rx="9"
        fill="white"
        stroke="#E4E7EC"
        filter={`url(#${filterId})`}
      />
      <circle cx={boxX + 11} cy={boxY + 12} r="3" fill={accent} />
      <text
        x={boxX + 18}
        y={boxY + 15}
        fill="#20242C"
        fontSize="9"
        fontWeight="800"
      >
        {label}
      </text>
      <text x={boxX + 10} y={boxY + 29} fill="#737B8C" fontSize="8">
        {detail}
      </text>
    </g>
  );
}

function Mannequin({ bodyMeasurements }) {
  const bust = Number(bodyMeasurements?.bust) || 88;
  const waist = Number(bodyMeasurements?.waist) || 70;
  const hips = Number(bodyMeasurements?.hips) || 94;
  const shoulder = Number(bodyMeasurements?.shoulder) || 39;
  const shoulderHalf = clamp(shoulder * 0.82, 29, 38);
  const bustHalf = clamp(bust * 0.34, 28, 39);
  const waistHalf = clamp(waist * 0.33, 23, 34);
  const hipHalf = clamp(hips * 0.33, 30, 42);

  return (
    <g stroke="#B9BEC8" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M145 37 C145 20 153 10 160 10 C167 10 175 20 175 37 C175 54 169 68 160 72 C151 68 145 54 145 37 Z"
        fill="#FFFDF9"
        strokeWidth="1.25"
      />
      <path d="M146 32 Q160 20 174 32" fill="none" strokeWidth="1" />
      <path d="M152 68 L152 86 M168 68 L168 86" fill="none" strokeWidth="1.2" />
      <path
        d={`M${160 - shoulderHalf} 99 C${160 - bustHalf} 128 ${160 - bustHalf} 164 ${160 - waistHalf} 206 C${160 - hipHalf} 235 ${160 - hipHalf} 265 129 286 L135 474 M${160 + shoulderHalf} 99 C${160 + bustHalf} 128 ${160 + bustHalf} 164 ${160 + waistHalf} 206 C${160 + hipHalf} 235 ${160 + hipHalf} 265 191 286 L185 474`}
        fill="none"
        strokeWidth="1.25"
      />
      <path
        d={`M${160 - shoulderHalf} 100 C103 144 98 211 111 273 M${160 + shoulderHalf} 100 C217 144 222 211 209 273`}
        fill="none"
        strokeWidth="1.25"
      />
      <path d="M129 286 Q160 302 191 286 M135 474 Q126 482 124 489 M185 474 Q194 482 196 489" fill="none" strokeWidth="1.1" />
      <path d="M160 289 V474" fill="none" strokeDasharray="2 5" strokeWidth="0.8" />
    </g>
  );
}

function MeasurementEditor({
  accent,
  label,
  measurementKey,
  onChange,
  unit,
  value,
  width = 144,
  x,
  y,
}) {
  return (
    <foreignObject x={x} y={y} width={width} height="60">
      <label
        xmlns="http://www.w3.org/1999/xhtml"
        className="block h-[54px] rounded-[12px] border border-[#DDE2E9] bg-white px-3 py-1.5 shadow-md"
      >
        <span className="flex items-center gap-1.5 text-[14px] font-extrabold text-[#20242C]">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
          {label}
        </span>
        <span className="mt-0.5 flex items-center gap-1">
          <input
            aria-label={`${label} (${unit})`}
            className="min-w-0 flex-1 appearance-none bg-transparent text-[18px] font-black text-[#20242C] outline-none"
            inputMode="decimal"
            min="1"
            type="number"
            value={value || ""}
            onChange={(event) => onChange(measurementKey, event.target.value)}
          />
          <span className="text-[11px] font-bold text-[#737B8C]">{unit}</span>
        </span>
      </label>
    </foreignObject>
  );
}

export function BodyMeasurementPreview({ measurements, onChange }) {
  const edit = onChange || (() => {});

  return (
    <div className="rounded-[24px] border border-line bg-gradient-to-b from-white to-[#F7F8FA] p-2">
      <svg
        viewBox="-40 0 400 505"
        className="mx-auto h-auto max-h-[270px] w-full max-w-[520px] md:max-h-[380px]"
        role="img"
        aria-label="Dáng cơ thể theo số đo đã nhập"
      >
        <path
          d="M45 18 V488 M39 18 H51 M39 488 H51"
          fill="none"
          stroke="#97B775"
          strokeLinecap="round"
          strokeWidth="1.5"
        />
        <Mannequin bodyMeasurements={measurements} />
        <path d="M125 101 H195 M125 96 V106 M195 96 V106" fill="none" stroke="#6AAED6" strokeWidth="1.4" />
        <path d="M127 158 Q160 166 193 158" fill="none" stroke="#6AAED6" strokeDasharray="3 3" strokeWidth="1.4" />
        <path d="M134 207 Q160 214 186 207" fill="none" stroke="#97B775" strokeDasharray="3 3" strokeWidth="1.4" />
        <path d="M126 252 Q160 263 194 252" fill="none" stroke="#A47BC1" strokeDasharray="3 3" strokeWidth="1.4" />
        <path d="M195 101 H216 M127 158 H118 M186 207 H216 M126 252 H118" fill="none" stroke="#AEB5C0" strokeWidth="1.4" />
        <path d="M45 28 H118 M160 453 V445" fill="none" stroke="#AEB5C0" strokeWidth="1.2" />
        <MeasurementEditor accent="#97B775" x={-26} y={22} label="Chiều cao" measurementKey="height" unit="cm" value={measurements?.height} onChange={edit} />
        <MeasurementEditor accent="#6AAED6" x={216} y={72} label="Vai" measurementKey="shoulder" unit="cm" value={measurements?.shoulder} onChange={edit} />
        <MeasurementEditor accent="#6AAED6" x={-26} y={128} label="Ngực" measurementKey="bust" unit="cm" value={measurements?.bust} onChange={edit} />
        <MeasurementEditor accent="#97B775" x={216} y={178} label="Eo" measurementKey="waist" unit="cm" value={measurements?.waist} onChange={edit} />
        <MeasurementEditor accent="#A47BC1" x={-26} y={222} label="Mông" measurementKey="hips" unit="cm" value={measurements?.hips} onChange={edit} />
        <MeasurementEditor accent="#97B775" x={100} y={445} label="Cân nặng" measurementKey="weight" unit="kg" value={measurements?.weight} onChange={edit} width={120} />
      </svg>
    </div>
  );
}

function TopGarment({ category, geometry, zones }) {
  const { left, right, hemY } = geometry;
  const outerwear = category === "outerwear";
  const cuffY = clamp(
    176 + (Number(geometry.sleeveLength) || 60) * 1.45,
    248,
    278,
  );
  const chest = zones.chest;
  const waist = zones.waist;
  const shoulder = zones.shoulder;

  return (
    <g stroke="#252A33" strokeLinecap="round" strokeLinejoin="round">
      <path
        d={`M${left + 7} 103 L${left - 4} 108 L${left - 26} 132 L${left - 10} 164 L${left - 2} ${hemY - 13} Q160 ${hemY + 9} ${right + 2} ${hemY - 13} L${right + 10} 164 L${right + 26} 132 L${right + 4} 108 L${right - 7} 103 Q160 119 ${left + 7} 103 Z`}
        fill="url(#garment-fabric)"
        strokeWidth="1.6"
      />
      <path
        d={`M${left - 23} 130 C${left - 43} 165 ${left - 51} 213 ${left - 45} ${cuffY} L${left - 29} ${cuffY + 4} C${left - 17} 211 ${left - 8} 169 ${left - 5} 141 Z`}
        fill="url(#garment-fabric)"
        strokeWidth="1.6"
      />
      <path
        d={`M${right + 23} 130 C${right + 43} 165 ${right + 51} 213 ${right + 45} ${cuffY} L${right + 29} ${cuffY + 4} C${right + 17} 211 ${right + 8} 169 ${right + 5} 141 Z`}
        fill="url(#garment-fabric)"
        strokeWidth="1.6"
      />
      <path
        d={`M${left - 45} ${cuffY - 4} L${left - 28} ${cuffY} L${left - 31} ${cuffY + 12} L${left - 47} ${cuffY + 8} Z M${right + 45} ${cuffY - 4} L${right + 28} ${cuffY} L${right + 31} ${cuffY + 12} L${right + 47} ${cuffY + 8} Z`}
        fill="#F5F2EB"
        strokeWidth="1.2"
      />
      <path
        d={`M${left + 10} 105 L147 94 L160 119 L136 131 Z M${right - 10} 105 L173 94 L160 119 L184 131 Z`}
        fill="#FCFAF5"
        strokeWidth="1.3"
      />
      <path d={`M160 119 V${hemY - 2}`} fill="none" strokeWidth="1" />
      {outerwear ? (
        <>
          <path d={`M151 127 L143 ${hemY - 20} M169 127 L177 ${hemY - 20}`} fill="none" stroke="#858B96" strokeWidth="0.8" />
          <path d={`M139 ${hemY - 39} H151 M169 ${hemY - 39} H181`} fill="none" strokeWidth="1" />
        </>
      ) : null}
      <path d={`M${left + 5} 175 Q160 187 ${right - 5} 175`} fill="none" stroke={chest.accent} strokeOpacity=".72" strokeWidth="5" />
      <path d={`M${left + 2} ${hemY - 34} Q160 ${hemY - 25} ${right - 2} ${hemY - 34}`} fill="none" stroke={waist.accent} strokeOpacity=".64" strokeWidth="5" />
      <path d={`M${left - 2} 111 Q160 126 ${right + 2} 111`} fill="none" stroke={shoulder.accent} strokeOpacity=".62" strokeWidth="4" />
      <path d={`M${left - 17} 155 Q${left - 27} 194 ${left - 35} 230 M${right + 17} 155 Q${right + 27} 194 ${right + 35} 230`} fill="none" stroke="#A3A8B1" strokeDasharray="3 3" strokeWidth=".8" />
    </g>
  );
}

function BottomGarment({ geometry, zones }) {
  const { left, right } = geometry;
  return (
    <g stroke="#252A33" strokeLinecap="round" strokeLinejoin="round">
      <path
        d={`M${left - 2} 224 Q160 214 ${right + 2} 224 L187 474 L164 474 L159 286 L153 474 L129 474 L${left - 2} 224 Z`}
        fill="url(#garment-fabric)"
        strokeWidth="1.6"
      />
      <path d={`M${left} 231 Q160 239 ${right} 231`} fill="none" stroke={zones.waist.accent} strokeOpacity=".72" strokeWidth="6" />
      <path d={`M${left + 2} 269 Q160 283 ${right - 2} 269`} fill="none" stroke={zones.hips.accent} strokeOpacity=".66" strokeWidth="6" />
      <path d="M160 230 L159 286 M142 248 L151 257 M178 248 L169 257" fill="none" stroke="#9298A3" strokeWidth=".9" />
    </g>
  );
}

function DressGarment({ geometry, zones }) {
  const { left, right, hemY } = geometry;
  return (
    <g stroke="#252A33" strokeLinecap="round" strokeLinejoin="round">
      <path
        d={`M${left + 8} 104 L148 96 L160 117 L172 96 L${right - 8} 104 L${right + 12} 150 L${right - 4} 211 L${right + 43} ${hemY} Q160 ${hemY + 13} ${left - 43} ${hemY} L${left + 4} 211 L${left - 12} 150 Z`}
        fill="url(#garment-fabric)"
        strokeWidth="1.6"
      />
      <path d="M148 97 L160 118 L172 97" fill="#FCFAF5" strokeWidth="1.1" />
      <path d={`M${left + 7} 174 Q160 185 ${right - 7} 174`} fill="none" stroke={zones.chest.accent} strokeOpacity=".72" strokeWidth="5" />
      <path d={`M${left + 6} 215 Q160 224 ${right - 6} 215`} fill="none" stroke={zones.waist.accent} strokeOpacity=".67" strokeWidth="6" />
      <path d={`M${left - 4} 260 Q160 276 ${right + 4} 260`} fill="none" stroke={zones.hips.accent} strokeOpacity=".62" strokeWidth="7" />
      <path d={`M160 118 V${hemY - 5}`} fill="none" stroke="#A3A8B1" strokeDasharray="3 4" strokeWidth=".8" />
    </g>
  );
}

export default function FitSilhouette({
  bodyMeasurements,
  category,
  measurements,
  zones,
}) {
  const chest = Number(measurements?.chest) || 100;
  const garmentWidth = clamp(57 + (chest - 90) * 0.42, 57, 82);
  const left = 160 - garmentWidth / 2;
  const right = 160 + garmentWidth / 2;
  const rawLength = Number(measurements?.length);
  const hemY = category === "dress"
    ? clamp(260 + (rawLength || 92) * 1.45, 375, 438)
    : clamp(188 + (rawLength || 66) * 1.18, 252, 286);
  const geometry = {
    left,
    right,
    hemY,
    sleeveLength: measurements?.sleeveLength,
  };
  const easeDetail = (name) => {
    const value = zones[name]?.ease;
    return value === null || value === undefined
      ? "Chưa đủ số đo"
      : `${value > 0 ? "+" : ""}${value} cm độ dư`;
  };

  return (
    <svg
      viewBox="0 0 320 505"
      className="mx-auto h-auto max-h-[29vh] w-full max-w-[520px] md:max-h-[60vh]"
      role="img"
      aria-labelledby="fit-visual-title fit-visual-description"
    >
      <title id="fit-visual-title">Mô phỏng độ vừa vặn theo kích thước</title>
      <desc id="fit-visual-description">
        Mannequin và trang phục minh họa các vùng ôm, vừa hoặc rộng.
      </desc>
      <defs>
        <linearGradient id="garment-fabric" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset=".58" stopColor="#F8F6F0" />
          <stop offset="1" stopColor="#ECE8DF" />
        </linearGradient>
        <filter id="fit-card-shadow" x="-20%" y="-30%" width="150%" height="170%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor="#151922" floodOpacity=".1" />
        </filter>
      </defs>
      <Mannequin bodyMeasurements={bodyMeasurements} />
      {category === "bottom" ? (
        <BottomGarment geometry={geometry} zones={zones} />
      ) : category === "dress" ? (
        <DressGarment geometry={geometry} zones={zones} />
      ) : (
        <TopGarment category={category} geometry={geometry} zones={zones} />
      )}
      {category === "bottom" ? (
        <>
          <Callout
            accent={zones.waist.accent}
            anchorX={right - 4}
            anchorY={232}
            label={`Eo · ${zones.waist.label}`}
            detail={easeDetail("waist")}
          />
          <Callout
            accent={zones.hips.accent}
            anchorX={left + 4}
            anchorY={270}
            align="left"
            label={`Mông · ${zones.hips.label}`}
            detail={easeDetail("hips")}
          />
          <Callout
            accent="#667085"
            anchorX={185}
            anchorY={392}
            label="Dài quần"
            detail={measurements?.outseam
              ? `${measurements.outseam} cm`
              : measurements?.inseam
                ? `Ống trong ${measurements.inseam} cm`
                : "Ước tính theo kiểu quần"}
          />
        </>
      ) : (
        <>
          <Callout
            accent={zones.shoulder.accent}
            anchorX={left - 2}
            anchorY={112}
            align="left"
            label={`Vai · ${zones.shoulder.label}`}
            detail={easeDetail("shoulder")}
          />
          <Callout
            accent={zones.chest.accent}
            anchorX={right - 3}
            anchorY={176}
            label={`Ngực · ${zones.chest.label}`}
            detail={easeDetail("chest")}
          />
          <Callout
            accent={zones.waist.accent}
            anchorX={left + 4}
            anchorY={218}
            align="left"
            label={`Eo · ${zones.waist.label}`}
            detail={easeDetail("waist")}
          />
          <Callout
            accent={zones.hips.accent}
            anchorX={right + 8}
            anchorY={category === "dress" ? 261 : 252}
            label={`Mông · ${zones.hips.label}`}
            detail={easeDetail("hips")}
          />
        </>
      )}
    </svg>
  );
}

import { useNavigate } from "react-router-dom";

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: "#e8f8f5" }}
    >
      {/* ——— Sky area with clouds & birds ——— */}
      <div className="relative flex-1 flex flex-col items-center justify-end pb-4">

        {/* Clouds — full width SVG overlay */}
        <svg
          viewBox="0 0 1400 280"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Cloud 1 */}
          <g opacity="0.9">
            <ellipse cx="220" cy="90" rx="55" ry="32" fill="white" stroke="#6dd5ca" strokeWidth="2.5"/>
            <ellipse cx="180" cy="102" rx="36" ry="24" fill="white" stroke="#6dd5ca" strokeWidth="2.5"/>
            <ellipse cx="264" cy="102" rx="44" ry="27" fill="white" stroke="#6dd5ca" strokeWidth="2.5"/>
          </g>
          {/* Cloud 2 */}
          <g opacity="0.88">
            <ellipse cx="700" cy="70" rx="65" ry="35" fill="white" stroke="#6dd5ca" strokeWidth="2.5"/>
            <ellipse cx="648" cy="84" rx="42" ry="27" fill="white" stroke="#6dd5ca" strokeWidth="2.5"/>
            <ellipse cx="758" cy="82" rx="50" ry="30" fill="white" stroke="#6dd5ca" strokeWidth="2.5"/>
          </g>
          {/* Cloud 3 */}
          <g opacity="0.82">
            <ellipse cx="1160" cy="82" rx="58" ry="31" fill="white" stroke="#6dd5ca" strokeWidth="2.5"/>
            <ellipse cx="1110" cy="94" rx="38" ry="24" fill="white" stroke="#6dd5ca" strokeWidth="2.5"/>
            <ellipse cx="1210" cy="93" rx="45" ry="27" fill="white" stroke="#6dd5ca" strokeWidth="2.5"/>
          </g>
          {/* Cloud 4 small */}
          <g opacity="0.7">
            <ellipse cx="950" cy="55" rx="40" ry="22" fill="white" stroke="#6dd5ca" strokeWidth="2"/>
            <ellipse cx="918" cy="65" rx="27" ry="17" fill="white" stroke="#6dd5ca" strokeWidth="2"/>
            <ellipse cx="984" cy="64" rx="32" ry="19" fill="white" stroke="#6dd5ca" strokeWidth="2"/>
          </g>
          {/* Birds */}
          <g stroke="#3a8a82" strokeWidth="2.5" fill="none" strokeLinecap="round">
            <path d="M1210,130 q9,-7 18,0"/>
            <path d="M1232,120 q8,-6 16,0"/>
            <path d="M1252,132 q7,-5 14,0"/>
            <path d="M1276,115 q8,-6 15,0"/>
            <path d="M1295,126 q6,-5 12,0"/>
          </g>
        </svg>

        {/* 404 text */}
        <div className="relative z-10 text-center">
          <h1
            className="font-black leading-none select-none"
            style={{
              fontSize: "clamp(100px, 16vw, 200px)",
              color: "#1a3530",
              letterSpacing: "-0.03em",
            }}
          >
            404
          </h1>
          <p className="text-gray-500 text-base mt-1 mb-5">ไม่พบหน้าที่คุณกำลังมองหา</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full text-sm font-semibold text-white border-0 cursor-pointer transition-all duration-150 hover:opacity-90 active:scale-95"
            style={{ backgroundColor: "#3dada3" }}
          >
            ← กลับหน้าที่แล้ว
          </button>
        </div>
      </div>

      {/* ——— Landscape — full width, bleeds edge to edge ——— */}
      <svg
        viewBox="0 0 1400 320"
        preserveAspectRatio="xMidYMax meet"
        className="w-full block"
        style={{ marginTop: "-2px", display: "block" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Back mountains */}
        <path
          d="M0,220 C100,180 200,100 340,85 C420,78 470,130 530,145
             C590,160 650,90 780,70 C870,56 940,110 1020,125
             C1100,140 1180,170 1300,160 C1350,157 1380,165 1400,168
             L1400,320 L0,320 Z"
          fill="#c2ede8"
        />
        <path
          d="M0,220 C100,180 200,100 340,85 C420,78 470,130 530,145
             C590,160 650,90 780,70 C870,56 940,110 1020,125
             C1100,140 1180,170 1300,160 C1350,157 1380,165 1400,168"
          fill="none" stroke="#5bc8be" strokeWidth="2.5" strokeLinecap="round"
        />

        {/* Front hills */}
        <path
          d="M0,265 C80,242 180,210 300,205 C370,202 420,228 490,235
             C560,242 620,210 720,198 C800,188 870,220 960,228
             C1040,236 1130,215 1240,220 C1310,224 1360,240 1400,248
             L1400,320 L0,320 Z"
          fill="#7dd8d0"
        />
        <path
          d="M0,265 C80,242 180,210 300,205 C370,202 420,228 490,235
             C560,242 620,210 720,198 C800,188 870,220 960,228
             C1040,236 1130,215 1240,220 C1310,224 1360,240 1400,248"
          fill="none" stroke="#3dada3" strokeWidth="2" strokeLinecap="round"
        />

        {/* Ground */}
        <path
          d="M0,288 C120,272 260,266 420,270 C560,274 660,285 780,282
             C900,279 1020,268 1160,272 C1280,276 1350,285 1400,290
             L1400,320 L0,320 Z"
          fill="#4dbfb5"
        />

        {/* ——— Shadow puddles on ground ——— */}
        <ellipse cx="380" cy="296" rx="55" ry="10" fill="#3dada3" opacity="0.5"/>
        <ellipse cx="700" cy="294" rx="48" ry="9"  fill="#3dada3" opacity="0.5"/>
        <ellipse cx="1020" cy="297" rx="52" ry="9" fill="#3dada3" opacity="0.5"/>

        {/* ——— Rocks ——— */}
        <ellipse cx="295" cy="284" rx="22" ry="11" fill="#9ad4cf" stroke="#5bc8be" strokeWidth="1.5"/>
        <ellipse cx="285" cy="283" rx="13" ry="8"  fill="#b8e8e4" stroke="#5bc8be" strokeWidth="1.2"/>
        <ellipse cx="1080" cy="283" rx="20" ry="10" fill="#9ad4cf" stroke="#5bc8be" strokeWidth="1.5"/>
        <ellipse cx="1070" cy="282" rx="12" ry="7"  fill="#b8e8e4" stroke="#5bc8be" strokeWidth="1.2"/>
        <ellipse cx="680" cy="288" rx="18" ry="9"  fill="#9ad4cf" stroke="#5bc8be" strokeWidth="1.4"/>

        {/* ——— Grass tufts ——— */}
        {[310, 470, 660, 840, 1000, 1120].map((x, i) => (
          <g key={i} stroke="#2e8c82" strokeWidth="2.2" strokeLinecap="round">
            <line x1={x}    y1={280} x2={x - 6}  y2={266}/>
            <line x1={x+9}  y1={279} x2={x + 8}  y2={264}/>
            <line x1={x+18} y1={280} x2={x + 22} y2={267}/>
            <line x1={x-9}  y1={280} x2={x - 14} y2={268}/>
          </g>
        ))}

        {/* ——— LEFT: bare trees ——— */}
        <g stroke="#235c56" strokeWidth="3" fill="none" strokeLinecap="round">
          <line x1="110" y1="278" x2="110" y2="192"/>
          <line x1="110" y1="244" x2="80"  y2="210"/>
          <line x1="110" y1="244" x2="140" y2="213"/>
          <line x1="110" y1="224" x2="85"  y2="202"/>
          <line x1="110" y1="224" x2="135" y2="204"/>
          <line x1="110" y1="208" x2="88"  y2="190"/>
          <line x1="110" y1="208" x2="132" y2="192"/>
          <line x1="110" y1="196" x2="92"  y2="178"/>
          <line x1="110" y1="196" x2="128" y2="180"/>
        </g>
        <g stroke="#235c56" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <line x1="195" y1="278" x2="195" y2="215"/>
          <line x1="195" y1="252" x2="172" y2="224"/>
          <line x1="195" y1="252" x2="218" y2="227"/>
          <line x1="195" y1="236" x2="176" y2="214"/>
          <line x1="195" y1="236" x2="214" y2="216"/>
          <line x1="195" y1="220" x2="180" y2="204"/>
          <line x1="195" y1="220" x2="210" y2="206"/>
        </g>

        {/* ——— LEFT: full trees ——— */}
        {/* small back */}
        <rect x="34" y="238" width="10" height="42" rx="3" fill="#235c56"/>
        <ellipse cx="39" cy="226" rx="30" ry="36" fill="#5bc8be"/>
        <ellipse cx="22" cy="242" rx="18" ry="22" fill="#5bc8be"/>
        <ellipse cx="56" cy="240" rx="20" ry="24" fill="#5bc8be"/>
        {/* large front */}
        <rect x="218" y="234" width="14" height="48" rx="4" fill="#235c56"/>
        <ellipse cx="225" cy="218" rx="42" ry="50" fill="#4dbfb5"/>
        <ellipse cx="204" cy="238" rx="24" ry="30" fill="#4dbfb5"/>
        <ellipse cx="246" cy="236" rx="26" ry="32" fill="#4dbfb5"/>

        {/* ——— RIGHT: full trees ——— */}
        <rect x="1145" y="234" width="14" height="48" rx="4" fill="#235c56"/>
        <ellipse cx="1152" cy="218" rx="42" ry="50" fill="#4dbfb5"/>
        <ellipse cx="1131" cy="238" rx="24" ry="30" fill="#4dbfb5"/>
        <ellipse cx="1173" cy="236" rx="26" ry="32" fill="#4dbfb5"/>
        {/* small back */}
        <rect x="1348" y="240" width="10" height="40" rx="3" fill="#235c56"/>
        <ellipse cx="1353" cy="228" rx="30" ry="35" fill="#5bc8be"/>
        <ellipse cx="1336" cy="244" rx="18" ry="21" fill="#5bc8be"/>
        <ellipse cx="1370" cy="242" rx="19" ry="22" fill="#5bc8be"/>

        {/* ——— RIGHT: bare trees ——— */}
        <g stroke="#235c56" strokeWidth="3" fill="none" strokeLinecap="round">
          <line x1="1290" y1="278" x2="1290" y2="195"/>
          <line x1="1290" y1="244" x2="1260" y2="212"/>
          <line x1="1290" y1="244" x2="1320" y2="214"/>
          <line x1="1290" y1="224" x2="1265" y2="204"/>
          <line x1="1290" y1="224" x2="1315" y2="206"/>
          <line x1="1290" y1="208" x2="1268" y2="190"/>
          <line x1="1290" y1="208" x2="1312" y2="192"/>
          <line x1="1290" y1="197" x2="1274" y2="180"/>
          <line x1="1290" y1="197" x2="1306" y2="182"/>
        </g>
        <g stroke="#235c56" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <line x1="1205" y1="278" x2="1205" y2="215"/>
          <line x1="1205" y1="252" x2="1182" y2="226"/>
          <line x1="1205" y1="252" x2="1228" y2="228"/>
          <line x1="1205" y1="236" x2="1185" y2="216"/>
          <line x1="1205" y1="236" x2="1225" y2="218"/>
          <line x1="1205" y1="220" x2="1188" y2="204"/>
          <line x1="1205" y1="220" x2="1222" y2="206"/>
        </g>

        {/* ——— Center: small accent trees ——— */}
        <rect x="556" y="256" width="7" height="30" rx="2" fill="#235c56"/>
        <ellipse cx="560" cy="246" rx="20" ry="25" fill="#5bc8be"/>
        <rect x="832" y="252" width="7" height="32" rx="2" fill="#235c56"/>
        <ellipse cx="836" cy="242" rx="22" ry="27" fill="#5bc8be"/>
      </svg>
    </div>
  );
}

export default NotFoundPage;

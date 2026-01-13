(() => {
  const toast = document.getElementById("toast");
  const toastText = document.getElementById("toastText");
  const narrative = document.getElementById("narrative");

  const savingsEl = document.getElementById("savingsValue");
  const trustEl = document.getElementById("trustValue");
  const trustFill = document.getElementById("trustFill");
  const trustHint = document.getElementById("trustHint");
  const trustCard = document.getElementById("trustCard");

  // State
  let savings = 0.23;
  let trust = 100; // percent
  let anim = { savings: null, trust: null };
  let toastQueue = [];
  let toastShowing = false;
  let toastTimer = null;

  const narratives = [
    "This initiative aligns operational efficiency with shareholder expectations.",
    "We are proactively optimizing spend ahead of macroeconomic headwinds.",
    "This unlocks cross-functional efficiency without impacting core deliverables.",
    "The change is optics-positive while remaining EBITDA-neutral.",
    "We’re simplifying resources to maximize focus and execution velocity.",
    "We are right-sizing spend while protecting the customer experience (definitions vary)."
  ];

  const FALLBACK_CUTS = [
    { thing: "Air conditioning", save: 4200, trust: 6 },
    { thing: "Office chairs", save: 1800, trust: 9 },
    { thing: "Coffee lids", save: 240, trust: 3 },
    { thing: "Team lunches", save: 1200, trust: 7 },
    { thing: "Silence", save: 0, trust: 5 },
    { thing: "Hope", save: 0, trust: 12 },
    { thing: "Keyboard sharing program", save: 600, trust: 10 },
    { thing: "Printer ink (replace with positive thoughts)", save: 300, trust: 4 },
    { thing: "Weekend existence", save: 0, trust: 8 }
  ];

  let cutIdeas = [...FALLBACK_CUTS];

  function money(n){
    return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
  }
  function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }

  // Toast queue so rapid clicks feel instant
  function showToast(text){
    toastQueue.push(text);
    pumpToast();
  }
  function pumpToast(){
    if (toastShowing) return;
    const next = toastQueue.shift();
    if (!next) return;

    toastShowing = true;
    toastText.textContent = next;
    toast.style.display = "block";
    toast.style.opacity = "1";

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => {
        toast.style.display = "none";
        toastShowing = false;
        pumpToast();
      }, 180);
    }, 1600);
  }

  // Number animation (fast, cancelable)
  function animateValue(kind, from, to, duration=520){
    const start = performance.now();
    if (anim[kind]) cancelAnimationFrame(anim[kind]);

    const step = (t) => {
      const p = clamp((t - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = from + (to - from) * eased;

      if (kind === "savings" && savingsEl) savingsEl.textContent = money(v);
      if (kind === "trust") updateTrustUI(v);

      if (p < 1) {
        anim[kind] = requestAnimationFrame(step);
      } else {
        anim[kind] = null;
      }
    };

    anim[kind] = requestAnimationFrame(step);
  }

  function updateTrustUI(v){
    trust = clamp(v, 0, 100);
    if (trustEl) trustEl.textContent = `${Math.round(trust)}%`;

    if (trustFill) {
      trustFill.style.width = `${trust}%`;
      trustFill.style.opacity = clamp(trust / 100, 0.05, 1).toFixed(2);
    }

    // main gag: whole card fades + softly blurs as trust drops
    if (trustCard) {
      const opacity = clamp(trust / 100, 0.06, 1);
      const blur = (1 - opacity) * 2.2;
      trustCard.style.setProperty("--trustOpacity", opacity.toFixed(2));
      trustCard.style.setProperty("--trustBlur", `${blur.toFixed(2)}px`);
    }

    if (trustHint) {
      if (trust > 75) trustHint.textContent = "still mostly here";
      else if (trust > 45) trustHint.textContent = "getting… thin";
      else if (trust > 20) trustHint.textContent = "legally present, spiritually gone";
      else trustHint.textContent = "now an abstract concept";
    }
  }

  function applyOptimization(extraMsg, add=0, trustHit=0){
    const baseAdd = 50 + Math.random() * 450;
    const baseTrust = 2 + Math.random() * 6;

    const newSavings = savings + baseAdd + add;
    const newTrust = trust - baseTrust - trustHit;

    animateValue("savings", savings, newSavings);
    animateValue("trust", trust, newTrust);

    savings = newSavings;
    trust = newTrust;

    if (extraMsg) showToast(extraMsg);
  }

  async function loadCuts(){
    try{
      // NOTE: must be served over HTTP(S). fetch won't work from file://
      const res = await fetch("cuts.json", { cache: "no-store" });
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("not array");
      const cleaned = data
        .filter(x => x && typeof x.thing === "string")
        .map(x => ({
          thing: String(x.thing).slice(0, 80),
          save: Number(x.save) || 0,
          trust: clamp(Number(x.trust) || 0, 0, 50)
        }));
      if (cleaned.length) {
        cutIdeas = cleaned;
        showToast("Cuts loaded from cuts.json. Accountability externalized.");
      }
    } catch {
      // keep fallback silently
    }
  }

  // Wire buttons
  const applyBtn = document.getElementById("applyCuts");
  const nextBtn = document.getElementById("whatNext");
  const genBtn = document.getElementById("genNarrative");

  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      applyOptimization("Cost optimization applied. Morale review scheduled.");
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const pick = cutIdeas[Math.floor(Math.random() * cutIdeas.length)];
      applyOptimization(`Next cut: ${pick.thing}.`, pick.save, pick.trust);
    });
  }

  if (genBtn && narrative) {
    genBtn.addEventListener("click", () => {
      narrative.textContent = narratives[Math.floor(Math.random() * narratives.length)];
      showToast("Narrative generated. Avoid follow-up questions.");
    });
  }

  // Init UI
  if (savingsEl) savingsEl.textContent = money(savings);
  updateTrustUI(trust);

  // Load external cuts.json (optional)
  loadCuts();
})();
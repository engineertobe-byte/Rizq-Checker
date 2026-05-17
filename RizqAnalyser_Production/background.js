// background.js - Core Logic
const KEYWORD_MAPS = {
  COMPANY: {
    riba: ['bank', 'banking', 'interest', 'loan', 'mortgage', 'credit', 'lending', 'usury', 'investment bank', 'commercial bank', 'retail bank', 'private bank'],
    alcohol: ['alcohol', 'liquor', 'wine', 'beer', 'brewery', 'distillery', 'vodka', 'whiskey', 'champagne', 'spirits'],
    gambling: ['casino', 'gambling', 'betting', 'lottery', 'poker', 'wager', 'sports betting', 'online gambling'],
    pork: ['pork', 'swine', 'pig', 'bacon', 'ham', 'porcine'],
    adult: ['pornography', 'adult entertainment', 'sex industry', 'brothel', 'escort', 'strip club', 'onlyfans'],
    weapons: ['weapon', 'arms manufacturer', 'defense contractor', 'military contractor', 'gun manufacturer', 'firearm', 'missile', 'tank'],
    tobacco: ['tobacco', 'cigarette', 'cigar', 'nicotine', 'vaping', 'e-cigarette'],
    fraud: ['pyramid scheme', 'ponzi', 'scam', 'crypto scam'],
    prohibited_trade: ['drug marketplace', 'dark web', 'illicit trade', 'prohibited goods', 'haram commerce'],
    spyware: ['spyware', 'surveillance software', 'keylogger', 'stalkerware', 'employee monitoring'],
    piracy: ['software piracy', 'keygen', 'crack', 'warez', 'pirated software', 'drm removal'],
    exam_cheating: ['exam cheating', 'plagiarism tool', 'essay mill', 'academic dishonesty'],
    riba_software: ['banking software', 'trading platform', 'loan management', 'mortgage software', 'interest calculator'],
    immorality_software: ['deepfake', 'document forgery', 'fake news generator', 'phishing tool'],
    mlm: ['multi-level marketing', 'network marketing', 'pyramid selling', 'herbalife', 'amway', 'avon', 'mary kay', 'nu skin', 'forever living', 'tupperware', 'cutco', 'primerica', 'beachbody', 'younique', 'monat', 'it works', 'arbonne', 'doterra', 'young living', 'scentsy', 'lularoe', 'advocare', 'usana', 'qnet', 'jeunesse', 'worldventures', 'onecoin', 'bitconnect', 'crowd1']
  },
  SHUBHA: {
    insurance: ['insurance', 'reinsurance', 'actuarial', 'underwriting'],
    crypto: ['cryptocurrency', 'bitcoin', 'blockchain', 'crypto exchange', 'defi', 'nft'],
    media: ['music', 'film studio', 'entertainment', 'streaming', 'hollywood'],
    food: ['restaurant chain', 'fast food', 'food processing', 'meat packing'],
    tech: ['saas', 'software', 'data analytics', 'cloud computing', 'ai company']
  },
  ROLE_HARAM: {
    accounting_riba: ['accountant', 'accounting', 'bookkeeper', 'financial analyst', 'treasury', 'credit analyst', 'loan officer', 'mortgage advisor', 'cfo', 'finance manager'],
    software_haram: ['software engineer', 'developer', 'programmer', 'backend', 'frontend', 'full stack', 'mobile developer', 'devops'],
    marketing_haram: ['marketing manager', 'digital marketing', 'growth hacker', 'seo', 'content marketer', 'brand manager', 'advertising'],
    data_haram: ['data scientist', 'data analyst', 'data engineer', 'business intelligence', 'machine learning'],
    legal_haram: ['lawyer', 'attorney', 'legal counsel', 'contract manager', 'paralegal', 'regulatory affairs']
  },
  ROLE_SHUBHA: {
    mixed_role: ['general manager', 'operations manager', 'project manager', 'product manager', 'hr manager', 'consultant', 'business analyst']
  }
};

const CAT_MAP = {
  riba: "riba", alcohol: "alcohol_gambling", gambling: "alcohol_gambling", pork: "pork", adult: "indecency",
  weapons: "destruction", tobacco: "harm", fraud: "fraud", prohibited_trade: "prohibited_trade",
  spyware: "spyware", piracy: "piracy", exam_cheating: "fraud", riba_software: "riba", 
  immorality_software: "indecency", mlm: "mlm"
};

async function fetchWikidata(companyName) {
  try {
    const sparql = `SELECT ?itemLabel ?industryLabel ?sectorLabel ?productLabel WHERE {
      ?item rdfs:label "${companyName}"@en.
      OPTIONAL { ?item wdt:P452 ?industry. }
      OPTIONAL { ?item wdt:P112 ?sector. }
      OPTIONAL { ?item wdt:P1056 ?product. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en,ar". }
    } LIMIT 10`;
    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
    const response = await fetch(url);
    const data = await response.json();
    return data.results.bindings;
  } catch (e) { return null; }
}

async function fallbackWikidata(companyName) {
  try {
    const sparql = `SELECT ?itemLabel WHERE {
      ?item rdfs:label ?label.
      FILTER(CONTAINS(LCASE(STR(?label)), LCASE("${companyName}")))
      FILTER(LANG(?label) = "en")
    } LIMIT 5`;
    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
    const response = await fetch(url);
    const data = await response.json();
    return data.results.bindings;
  } catch (e) { return null; }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyze") {
    handleAnalysis(request.data).then(sendResponse);
    return true;
  }
  if (request.action === "getScripture") {
    fetchScripture(request.key).then(sendResponse);
    return true;
  }
});

async function fetchScripture(key) {
  try {
    const response = await fetch(chrome.runtime.getURL("data/scriptures.json"));
    const data = await response.json();
    return data[key] || data["halal"];
  } catch (e) {
    return { english: "Error loading scripture", arabic: "", source: "N/A" };
  }
}

async function handleAnalysis({ company, role }) {
  let companyVerdict = "HALAL";
  let companyReason = "Business activity appears permissible";
  let scriptureKey = "halal";

  const bindings = await fetchWikidata(company) || await fallbackWikidata(company);
  let companyText = "";
  if (bindings) {
    companyText = bindings.map(b => `${b.industryLabel?.value || ""} ${b.sectorLabel?.value || ""} ${b.productLabel?.value || ""}`).join(" ").toLowerCase();
  } else {
    companyText = company.toLowerCase();
  }

  for (const [cat, keywords] of Object.entries(KEYWORD_MAPS.COMPANY)) {
    if (keywords.some(kw => companyText.includes(kw))) {
      companyVerdict = "HARAM";
      companyReason = `Activity in ${cat} is not permissible.`;
      scriptureKey = CAT_MAP[cat] || "halal";
      break;
    }
  }
  if (companyVerdict === "HALAL") {
    for (const [cat, keywords] of Object.entries(KEYWORD_MAPS.SHUBHA)) {
      if (keywords.some(kw => companyText.includes(kw))) {
        companyVerdict = "SHUBHA";
        companyReason = `Activity in ${cat} may be ambiguous.`;
        scriptureKey = "shubha_mixed";
        break;
      }
    }
  }

  let roleVerdict = "HALAL";
  let roleReason = "Role responsibilities appear permissible";
  let roleScriptureKey = null;

  const roleText = role.toLowerCase();
  for (const [cat, keywords] of Object.entries(KEYWORD_MAPS.ROLE_HARAM)) {
    if (keywords.some(kw => roleText.includes(kw))) {
      roleVerdict = "HARAM";
      roleReason = `Responsibilities involve ${cat.replace('_', ' ')}.`;
      roleScriptureKey = "role_software_sin"; 
      break;
    }
  }
  if (roleVerdict === "HALAL") {
    for (const [cat, keywords] of Object.entries(KEYWORD_MAPS.ROLE_SHUBHA)) {
      if (keywords.some(kw => roleText.includes(kw))) {
        roleVerdict = "SHUBHA";
        roleReason = `Responsibilities contain mixed elements.`;
        roleScriptureKey = "shubha_mixed";
        break;
      }
    }
  }

  let finalVerdict = "HALAL";
  if (companyVerdict === "HARAM" || roleVerdict === "HARAM") finalVerdict = "HARAM";
  else if (companyVerdict === "SHUBHA" || roleVerdict === "SHUBHA") finalVerdict = "SHUBHA";

  let finalScriptureKey = scriptureKey;
  if (roleVerdict === "HARAM" && companyVerdict === "HALAL") finalScriptureKey = roleScriptureKey;
  else if (roleVerdict === "SHUBHA" && companyVerdict === "HALAL") finalScriptureKey = roleScriptureKey;

  return {
    verdict: finalVerdict,
    company: { name: company, verdict: companyVerdict, reason: companyReason },
    role: { name: role, verdict: roleVerdict, reason: roleReason },
    scriptureKey: finalScriptureKey
  };
}

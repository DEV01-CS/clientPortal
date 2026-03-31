import { TrendingUp, Building2, ShieldAlert, BookOpen, PiggyBank, Scale, Wrench, FileWarning, Clock, AlertOctagon } from "lucide-react";

/**
 * Education content — substantive UK leaseholder / service charge knowledge.
 * Each article has: title, summary (2–3 sentences of real info),
 * keyPoints (3–5 bullet facts), category, icon, readTime, and an optional link.
 *
 * API-ready: replace getEducationArticles() body with:
 *   const response = await api.get('/api/education/');
 *   return response.data;
 */

const EDUCATION_ARTICLES = [
  {
    id: "edu-1",
    title: "Why Do Service Charges Increase Every Year?",
    summary:
      "Service charges are not capped by law in England and Wales, which means your managing agent can pass on virtually any cost increase. The main drivers are labour inflation, rising insurance premiums, energy costs for communal areas, and planned maintenance cycles. Knowing the breakdown of your budget is the first step to challenging unreasonable rises.",
    keyPoints: [
      "Demand notice must be accompanied by a Summary of Rights — if not, you can withhold payment.",
      "You can apply to the First-tier Tribunal (Property Chamber) to challenge charges as 'unreasonable'.",
      "Reserve fund contributions are legitimate, but should be justified by a Long-Term Maintenance Plan.",
      "Request a detailed service charge budget itemisation in writing — your landlord must provide it.",
      "Average service charges in London rose by ~12% in 2024, driven by insurance (+28%) and energy (+19%).",
    ],
    category: "Service Charges",
    icon: TrendingUp,
    readTime: 5,
    link: null,
  },
  {
    id: "edu-2",
    title: "How Building Characteristics Affect Your Service Charge",
    summary:
      "The age, height, construction type, and facilities of your building are the biggest structural cost drivers. A 1970s concrete high-rise with a lift, communal heating, and a concierge will typically cost 3–5× more per sq ft to manage than a converted Victorian terrace. Understanding these factors helps you benchmark whether your charge is fair.",
    keyPoints: [
      "Lift maintenance contracts typically add £40–£120/flat/year depending on building height.",
      "Communal heating systems are among the largest variables — can be £500–£2,000/year per flat.",
      "Older buildings (pre-1985) face higher repair frequencies; expect major works cycles every 7–12 years.",
      "Buildings with large grounds or private car parks carry significantly higher insurance and upkeep.",
      "High-rise buildings (over 11m) face mandatory EWS1 fire assessment costs under new building safety rules.",
    ],
    category: "Property",
    icon: Building2,
    readTime: 5,
    link: null,
  },
  {
    id: "edu-3",
    title: "Section 20 Consultation: Your Rights for Major Works",
    summary:
      "Section 20 of the Landlord and Tenant Act 1985 requires landlords and managing agents to consult leaseholders before any qualifying works or long-term agreements costing more than £250 per leaseholder. Failure to follow the correct three-stage consultation process means the landlord can only recover £250 per leaseholder regardless of actual cost.",
    keyPoints: [
      "Stage 1 — Notice of Intent: landlord must notify you of proposed works and invite observations (30-day window).",
      "Stage 2 — Estimates: at least two estimates must be obtained and made available to all leaseholders.",
      "Stage 3 — Notice of Proposal: leaseholders get another 30 days to comment on the chosen contractor.",
      "If the landlord skips any stage, you can apply to the tribunal to limit your contribution to £250.",
      "Urgent works are exempt but the landlord must apply to the tribunal for dispensation of consultation.",
    ],
    category: "Legal",
    icon: ShieldAlert,
    readTime: 6,
    link: null,
  },
  {
    id: "edu-4",
    title: "Section 20B: The 18-Month Rule You Must Know",
    summary:
      "Under Section 20B of the Landlord and Tenant Act 1985, landlords must demand payment of a service charge within 18 months of the cost being incurred. If they miss this deadline, the charge becomes irrecoverable unless they served a 'Section 20B notice' within those 18 months warning you that costs had been incurred. This is one of the most commonly missed defences for leaseholders.",
    keyPoints: [
      "18-month clock starts when the landlord (or their supplier) incurs the cost — not when work is done.",
      "A valid S20B notice 'stops the clock' and preserves the landlord's right to recover costs later.",
      "If no notice was served and 18 months have passed, the charge is legally irrecoverable from you.",
      "Always check the dates on your service charge demands against when works actually occurred.",
      "This defence has been successfully used to write off thousands of pounds in back-charges.",
    ],
    category: "Legal",
    icon: FileWarning,
    readTime: 5,
    link: null,
  },
  {
    id: "edu-5",
    title: "Your Rights as a Leaseholder: The Complete Overview",
    summary:
      "Leaseholders in England and Wales have extensive statutory rights that are frequently not communicated by managing agents. From inspecting accounts to applying for Right to Manage, understanding your rights is the foundation of controlling your service charge costs and building management quality.",
    keyPoints: [
      "Right to request a written Summary of Costs — must be provided within 1 month (s.21, LTA 1985).",
      "Right to inspect receipts and supporting invoices within 6 months of the summary.",
      "Right to apply to the First-tier Tribunal to have charges assessed as 'payable' or 'reasonable'.",
      "Right to Manage (RTM): leaseholders holding 50%+ of qualifying leases can take over management without buying the freehold.",
      "Collective Enfranchisement: 50%+ of leaseholders can force the sale of the freehold at a statutory price.",
    ],
    category: "Legal",
    icon: Scale,
    readTime: 7,
    link: null,
  },
  {
    id: "edu-6",
    title: "How to Read and Challenge Your Service Charge Accounts",
    summary:
      "Annual service charge accounts should be certified by a qualified accountant and itemised by cost category. Many leaseholders pay charges they are entitled to challenge simply because they don't know what to look for. The key is to compare each line against the permitted costs in your lease and the actual works carried out.",
    keyPoints: [
      "Compare the actual expenditure against the budget estimate — significant overspend requires explanation.",
      "Check whether your lease permits the specific cost categories being charged (e.g. management fee %",
      "Management fees above 10–15% of total expenditure may be challengeable as unreasonable.",
      "Ask for 'comparative estimates' — were at least three quotes obtained for large contracts?",
      "Reserve fund transfers to a separate bank account must be itemised; commingled funds are a red flag.",
    ],
    category: "Service Charges",
    icon: BookOpen,
    readTime: 6,
    link: null,
  },
  {
    id: "edu-7",
    title: "Planned Maintenance & Reserve Funds Explained",
    summary:
      "A well-managed building should have a Long-Term Maintenance Plan (LTMP) covering at least 10 years, and a reserve (sinking) fund to smooth out major one-off costs like roof replacements or lift refurbishments. Without a reserve fund, leaseholders face large one-off 'major works' demands — sometimes £20,000+ — with little warning.",
    keyPoints: [
      "Reserve fund contributions are held on trust for leaseholders and belong to the building, not the landlord.",
      "If you sell your flat, any reserve fund balance typically stays with the building — negotiate this on sale.",
      "Ask for the current LTMP and reserve fund balance in writing before purchasing a leasehold property.",
      "Healthy reserve: typically 1–2% of the building's reinstatement value per year.",
      "Under-funded buildings often see sudden large Section 20 major works demands.",
    ],
    category: "Property",
    icon: Wrench,
    readTime: 5,
    link: null,
  },
  {
    id: "edu-8",
    title: "Budgeting for Your Annual Service Charge",
    summary:
      "Unlike mortgage payments, service charges are variable and can increase significantly year-on-year. Building a personal buffer fund and understanding the payment demand cycle can prevent serious financial stress. Most service charge years run April–March, with interim payments in advance and a balancing payment after accounts are certified.",
    keyPoints: [
      "Set aside 10–15% above your current annual charge as a personal contingency each year.",
      "Major works demands can arrive with as little as 30 days' notice — a lump sum buffer is essential.",
      "You can negotiate payment plans for large demands — managing agents are generally required to consider them.",
      "Late payment typically incurs simple interest at the rate specified in your lease (often 4% above base rate).",
      "If charges are in dispute, you can pay 'under protest' in writing to avoid forfeiture while you challenge.",
    ],
    category: "Finance",
    icon: PiggyBank,
    readTime: 4,
    link: null,
  },
  {
    id: "edu-9",
    title: "The Leasehold Reform Act 2024: What Changes for You",
    summary:
      "The Leasehold and Freehold Reform Act 2024 makes the single largest set of changes to leasehold law in decades. Key changes include abolishing 2-year waiting period for lease extension, making it easier to enfranchise, and capping ground rents on new leases at a peppercorn. However, many provisions are still pending secondary legislation.",
    keyPoints: [
      "Lease extensions: the qualifying period of 2 years' ownership is abolished — you can extend immediately.",
      "Standard lease extension term is now 990 years (up from 90 years for houses, 50 for flats).",
      "New leases: ground rent must be a peppercorn (zero) — any higher rent is unenforceable.",
      "Building safety: new rights around fire safety works cost recovery and remediation funding.",
      "Many provisions require further secondary legislation before they come into force — check DLUHC updates.",
    ],
    category: "Industry",
    icon: AlertOctagon,
    readTime: 6,
    link: null,
  },
  {
    id: "edu-10",
    title: "How to Find Out if Your Service Charge is Fair",
    summary:
      "Benchmarking your service charge against comparable buildings is the most practical way to assess fairness. Tools like the LEASE comparator, tribunal decisions database, and published market data let you see what similar buildings in your area typically pay. This evidence is essential if you decide to challenge your charge at tribunal.",
    keyPoints: [
      "ARMA (Association of Residential Managing Agents) publishes annual benchmarking data by region and building type.",
      "Search the First-tier Tribunal (Property Chamber) online register for past decisions on similar properties.",
      "A reasonable all-in service charge for a 2-bed flat in England ranges from £1,500–£4,500/year depending on facilities.",
      "London premiums are significant — Zone 1–2 flats average £3,500–£8,000/year with concierge.",
      "Engage a RICS-qualified surveyor for a formal service charge audit if you suspect systemic overcharging.",
    ],
    category: "Service Charges",
    icon: Clock,
    readTime: 5,
    link: null,
  },
];

export const getEducationArticles = async () => {
  // TODO: Replace with API call when backend is ready:
  // const response = await api.get('/api/education/');
  // return response.data;
  return EDUCATION_ARTICLES;
};

export const getEducationCategories = () => {
  const categories = [...new Set(EDUCATION_ARTICLES.map((a) => a.category))];
  return ["All", ...categories];
};

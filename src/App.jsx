import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Trash2, Upload, Download, ShoppingCart, AlertTriangle, CheckCircle2, Euro, Store, CalendarDays, RefreshCw, Tag, ExternalLink } from "lucide-react";
import './App.css'

const DEFAULT_STORES = ["Aldi", "Lidl", "Intermarché", "Carrefour", "Auchan", "Leclerc"];

const PROMOTION_CATALOGUES = [
  { store: "Aldi", url: "https://www.aldi.fr/catalogues.html", note: "Catalogue et offres de la semaine" },
  { store: "Lidl", url: "https://www.lidl.fr/c/catalogues-en-ligne/s10017753", note: "Prospectus et offres en cours" },
  { store: "Intermarché", url: "https://www.intermarche.com/catalogues", note: "Catalogues selon votre magasin" },
  { store: "Carrefour", url: "https://www.carrefour.fr/catalogue", note: "Promotions et catalogues en ligne" },
  { store: "Auchan", url: "https://www.auchan.fr/catalogue/", note: "Catalogue et promotions Auchan" },
  { store: "Leclerc", url: "https://www.e.leclerc/prospectus", note: "Prospectus et offres E.Leclerc" }
];

const DEFAULT_PRODUCTS = [
  { id: crypto.randomUUID(), name: "Pâtes", category: "Féculents", unit: "kg", qty: 2, prices: { Aldi: 1.30, Lidl: 1.40, Intermarché: 1.55 }, source: "Base manuelle", promoUntil: "" },
  { id: crypto.randomUUID(), name: "Riz", category: "Féculents", unit: "kg", qty: 1, prices: { Aldi: 2.20, Lidl: 2.30, Intermarché: 2.50 }, source: "Base manuelle", promoUntil: "" },
  { id: crypto.randomUUID(), name: "Pommes de terre", category: "Fruits & légumes", unit: "2,5 kg", qty: 1, prices: { Aldi: 3.49, Lidl: 3.70, Intermarché: 3.99 }, source: "Base manuelle", promoUntil: "" },
  { id: crypto.randomUUID(), name: "Lait demi-écrémé", category: "Frais", unit: "L", qty: 6, prices: { Aldi: 0.99, Lidl: 1.02, Intermarché: 1.10 }, source: "Base manuelle", promoUntil: "" },
  { id: crypto.randomUUID(), name: "Œufs", category: "Frais", unit: "x12", qty: 1, prices: { Aldi: 3.20, Lidl: 3.40, Intermarché: 3.80 }, source: "Base manuelle", promoUntil: "" },
  { id: crypto.randomUUID(), name: "Yaourts nature", category: "Frais", unit: "x12", qty: 1, prices: { Aldi: 2.50, Lidl: 2.70, Intermarché: 2.99 }, source: "Base manuelle", promoUntil: "" },
  { id: crypto.randomUUID(), name: "Sauce tomate", category: "Placard", unit: "brique", qty: 3, prices: { Aldi: 0.75, Lidl: 0.80, Intermarché: 0.95 }, source: "Base manuelle", promoUntil: "" },
  { id: crypto.randomUUID(), name: "Thon ou sardines", category: "Conserves", unit: "boîte", qty: 3, prices: { Aldi: 1.45, Lidl: 1.55, Intermarché: 1.80 }, source: "Base manuelle", promoUntil: "" },
  { id: crypto.randomUUID(), name: "Légumes surgelés", category: "Surgelés", unit: "kg", qty: 2, prices: { Aldi: 2.20, Lidl: 2.30, Intermarché: 2.60 }, source: "Base manuelle", promoUntil: "" },
  { id: crypto.randomUUID(), name: "Lessive ou liquide vaisselle", category: "Entretien", unit: "produit", qty: 1, prices: { Aldi: 3.00, Lidl: 3.10, Intermarché: 3.50 }, source: "Base manuelle", promoUntil: "" }
];

function euro(value) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(value || 0));
}

function safeNumber(value) {
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function getBestPrice(product) {
  const entries = Object.entries(product.prices || {}).filter(([, price]) => safeNumber(price) > 0);
  if (!entries.length) return { store: "—", price: 0 };
  const [store, price] = entries.sort((a, b) => safeNumber(a[1]) - safeNumber(b[1]))[0];
  return { store, price: safeNumber(price) };
}

function StatCard({ title, value, icon, danger, subtitle }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl shadow-sm border p-5 bg-white ${danger ? "border-red-200" : "border-slate-200"}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${danger ? "text-red-600" : "text-slate-900"}`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-xl ${danger ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-700"}`}>{icon}</div>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [budget, setBudget] = useState(() => safeNumber(localStorage.getItem("budgetCourses_budget")) || 80);
  const [products, setProducts] = useState(() => {
    try { return JSON.parse(localStorage.getItem("budgetCourses_products")) || DEFAULT_PRODUCTS; } catch { return DEFAULT_PRODUCTS; }
  });
  const [expenses, setExpenses] = useState(() => {
    try { return JSON.parse(localStorage.getItem("budgetCourses_expenses")) || []; } catch { return []; }
  });
  const [selectedStoreMode, setSelectedStoreMode] = useState("meilleur");
  const [activeTab, setActiveTab] = useState("courses");
  const [search, setSearch] = useState("");
  const [newProduct, setNewProduct] = useState({ name: "", category: "Placard", unit: "unité", qty: 1 });
  const [newExpense, setNewExpense] = useState({ label: "", store: "Aldi", amount: "", date: new Date().toISOString().slice(0, 10) });
  const [catalogText, setCatalogText] = useState("Pâtes;Aldi;1,18;kg;2026-05-08;2026-05-15;Catalogue Aldi\nLait demi-écrémé;Lidl;0,95;L;2026-05-08;2026-05-15;Catalogue Lidl\nSauce tomate;Intermarché;0,69;brique;2026-05-08;2026-05-15;Anti-Crise / catalogue");
  const [message, setMessage] = useState("");

  useEffect(() => localStorage.setItem("budgetCourses_budget", String(budget)), [budget]);
  useEffect(() => localStorage.setItem("budgetCourses_products", JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem("budgetCourses_expenses", JSON.stringify(expenses)), [expenses]);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return products;
    return products.filter(p => [p.name, p.category, p.source].join(" ").toLowerCase().includes(q));
  }, [products, search]);

  const plannedTotal = useMemo(() => {
    return products.reduce((sum, p) => {
      const price = selectedStoreMode === "meilleur" ? getBestPrice(p).price : safeNumber(p.prices?.[selectedStoreMode]);
      return sum + price * safeNumber(p.qty);
    }, 0);
  }, [products, selectedStoreMode]);

  const spentTotal = useMemo(() => expenses.reduce((sum, e) => sum + safeNumber(e.amount), 0), [expenses]);
  const remaining = budget - spentTotal;
  const plannedGap = budget - plannedTotal;

  function addProduct() {
    if (!newProduct.name.trim()) return;
    setProducts(prev => [...prev, {
      id: crypto.randomUUID(),
      name: newProduct.name.trim(),
      category: newProduct.category,
      unit: newProduct.unit,
      qty: safeNumber(newProduct.qty) || 1,
      prices: {},
      source: "Ajout manuel",
      promoUntil: ""
    }]);
    setNewProduct({ name: "", category: "Placard", unit: "unité", qty: 1 });
  }

  function updatePrice(id, store, value) {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, prices: { ...(p.prices || {}), [store]: safeNumber(value) } } : p));
  }

  function updateQty(id, value) {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, qty: safeNumber(value) } : p));
  }

  function removeProduct(id) {
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  function addExpense() {
    if (!newExpense.label.trim() || !safeNumber(newExpense.amount)) return;
    setExpenses(prev => [{ id: crypto.randomUUID(), ...newExpense, amount: safeNumber(newExpense.amount) }, ...prev]);
    setNewExpense({ label: "", store: newExpense.store, amount: "", date: new Date().toISOString().slice(0, 10) });
  }

  function removeExpense(id) {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }

  function importCatalog() {
    const lines = catalogText.split(/\n+/).map(l => l.trim()).filter(Boolean);
    let updates = 0;
    let created = 0;

    setProducts(prev => {
      let next = [...prev];
      for (const line of lines) {
        const [nameRaw, storeRaw, priceRaw, unitRaw, , endRaw, sourceRaw] = line.split(";").map(x => (x || "").trim());
        if (!nameRaw || !storeRaw || !priceRaw) continue;
        const price = safeNumber(priceRaw);
        const idx = next.findIndex(p => p.name.toLowerCase() === nameRaw.toLowerCase());
        if (idx >= 0) {
          next[idx] = {
            ...next[idx],
            unit: unitRaw || next[idx].unit,
            prices: { ...(next[idx].prices || {}), [storeRaw]: price },
            source: sourceRaw || "Import catalogue",
            promoUntil: endRaw || next[idx].promoUntil
          };
          updates++;
        } else {
          next.push({
            id: crypto.randomUUID(),
            name: nameRaw,
            category: "Import catalogue",
            unit: unitRaw || "unité",
            qty: 1,
            prices: { [storeRaw]: price },
            source: sourceRaw || "Import catalogue",
            promoUntil: endRaw || ""
          });
          created++;
        }
      }
      return next;
    });
    setMessage(`${updates} prix mis à jour, ${created} produits ajoutés.`);
  }

  function exportCsv() {
    const header = "Produit;Catégorie;Quantité;Unité;Meilleur magasin;Meilleur prix;Source;Promo jusqu'au";
    const rows = products.map(p => {
      const best = getBestPrice(p);
      return [p.name, p.category, p.qty, p.unit, best.store, String(best.price).replace(".", ","), p.source, p.promoUntil].join(";");
    });
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "budget-courses-catalogues.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm p-5 md:p-6 border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Budget Courses & Catalogues</h1>
              <p className="text-slate-600 mt-1">Suivi des dépenses, prix par enseigne, promos catalogue et panier optimisé.</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 rounded-2xl p-2">
              <Euro size={18} />
              <input value={budget} onChange={e => setBudget(safeNumber(e.target.value))} className="w-24 bg-transparent font-bold outline-none" />
              <span className="text-sm text-slate-500">budget semaine</span>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Sections de l’application">
          <button role="tab" aria-selected={activeTab === "courses"} onClick={() => setActiveTab("courses")} className={`rounded-xl px-4 py-2 font-semibold ${activeTab === "courses" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-700"}`}>Mes courses</button>
          <button role="tab" aria-selected={activeTab === "promotions"} onClick={() => setActiveTab("promotions")} className={`rounded-xl px-4 py-2 font-semibold ${activeTab === "promotions" ? "bg-emerald-700 text-white" : "bg-white border border-slate-200 text-slate-700"}`}>Promotions</button>
        </div>

        <div className={`grid md:grid-cols-4 gap-4 ${activeTab === "courses" ? "" : "hidden"}`}>
          <StatCard title="Budget semaine" value={euro(budget)} icon={<Euro />} />
          <StatCard title="Dépensé réel" value={euro(spentTotal)} icon={<ShoppingCart />} danger={spentTotal > budget} />
          <StatCard title="Reste disponible" value={euro(remaining)} icon={remaining >= 0 ? <CheckCircle2 /> : <AlertTriangle />} danger={remaining < 0} />
          <StatCard title="Panier prévu" value={euro(plannedTotal)} icon={<Store />} danger={plannedTotal > budget} subtitle={plannedGap >= 0 ? `Marge ${euro(plannedGap)}` : `Dépassement ${euro(Math.abs(plannedGap))}`} />
        </div>

        <div className={`grid lg:grid-cols-3 gap-6 ${activeTab === "courses" ? "" : "hidden"}`}>
          <section className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Liste de courses optimisée</h2>
                <p className="text-sm text-slate-500">Choisis "meilleur prix" ou une enseigne précise.</p>
              </div>
              <div className="flex gap-2">
                <select value={selectedStoreMode} onChange={e => setSelectedStoreMode(e.target.value)} className="rounded-xl border border-slate-300 p-2 bg-white">
                  <option value="meilleur">Meilleur prix</option>
                  {DEFAULT_STORES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={exportCsv} className="rounded-xl border border-slate-300 px-3 flex items-center gap-2 hover:bg-slate-50"><Download size={16} /> CSV</button>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2">
              <Search size={18} className="text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher produit, catégorie, source..." className="bg-transparent outline-none w-full" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2">Produit</th>
                    <th>Qté</th>
                    <th>Meilleur</th>
                    <th>Aldi</th>
                    <th>Lidl</th>
                    <th>Intermarché</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => {
                    const best = getBestPrice(p);
                    const chosenPrice = selectedStoreMode === "meilleur" ? best.price : safeNumber(p.prices?.[selectedStoreMode]);
                    const lineTotal = chosenPrice * safeNumber(p.qty);
                    return (
                      <tr key={p.id} className="border-b last:border-b-0 hover:bg-slate-50">
                        <td className="py-3 min-w-48">
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-xs text-slate-500">{p.category} · {p.unit} · {p.source}{p.promoUntil ? ` · jusqu'au ${p.promoUntil}` : ""}</div>
                        </td>
                        <td><input type="number" value={p.qty} onChange={e => updateQty(p.id, e.target.value)} className="w-16 rounded-lg border p-1" /></td>
                        <td><span className="font-semibold">{best.store}</span><br/><span className="text-slate-500">{euro(best.price)}</span></td>
                        {["Aldi", "Lidl", "Intermarché"].map(store => (
                          <td key={store}><input value={p.prices?.[store] ?? ""} onChange={e => updatePrice(p.id, store, e.target.value)} className="w-20 rounded-lg border p-1" placeholder="—" /></td>
                        ))}
                        <td className="font-bold">{euro(lineTotal)}</td>
                        <td><button onClick={() => removeProduct(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 size={16} /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid md:grid-cols-5 gap-2 bg-slate-50 p-3 rounded-2xl">
              <input value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Nouveau produit" className="rounded-xl border p-2 md:col-span-2" />
              <select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} className="rounded-xl border p-2">
                {categories.concat(["Placard", "Frais", "Entretien", "Import catalogue"]).filter((v,i,a)=>a.indexOf(v)===i).map(c => <option key={c}>{c}</option>)}
              </select>
              <input value={newProduct.unit} onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })} placeholder="Unité" className="rounded-xl border p-2" />
              <button onClick={addProduct} className="rounded-xl bg-slate-900 text-white px-3 flex items-center justify-center gap-2"><Plus size={16} /> Ajouter</button>
            </div>
          </section>

          <section className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><Upload size={20}/> Import catalogue</h2>
              <p className="text-sm text-slate-500">Format : Produit;Enseigne;Prix;Unité;Début;Fin;Source</p>
              <textarea value={catalogText} onChange={e => setCatalogText(e.target.value)} className="w-full min-h-40 rounded-xl border p-3 text-sm font-mono" />
              <button onClick={importCatalog} className="w-full rounded-xl bg-emerald-600 text-white py-3 font-semibold flex items-center justify-center gap-2"><RefreshCw size={16}/> Mettre à jour les prix</button>
              {message && <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl p-3">{message}</p>}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingCart size={20}/> Dépenses réelles</h2>
              <input value={newExpense.label} onChange={e => setNewExpense({ ...newExpense, label: e.target.value })} placeholder="Ex : courses Lidl" className="w-full rounded-xl border p-2" />
              <div className="grid grid-cols-2 gap-2">
                <select value={newExpense.store} onChange={e => setNewExpense({ ...newExpense, store: e.target.value })} className="rounded-xl border p-2">{DEFAULT_STORES.map(s => <option key={s}>{s}</option>)}</select>
                <input value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} placeholder="Montant" className="rounded-xl border p-2" />
              </div>
              <input type="date" value={newExpense.date} onChange={e => setNewExpense({ ...newExpense, date: e.target.value })} className="w-full rounded-xl border p-2" />
              <button onClick={addExpense} className="w-full rounded-xl bg-slate-900 text-white py-3 font-semibold flex items-center justify-center gap-2"><Plus size={16}/> Ajouter dépense</button>
              <div className="space-y-2 max-h-72 overflow-auto">
                {expenses.map(e => (
                  <div key={e.id} className="flex justify-between items-center bg-slate-50 rounded-xl p-3">
                    <div>
                      <div className="font-semibold">{e.label}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1"><CalendarDays size={12}/>{e.date} · {e.store}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{euro(e.amount)}</span>
                      <button onClick={() => removeExpense(e.id)} className="text-red-600"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <section className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6 ${activeTab === "promotions" ? "" : "hidden"}`} aria-labelledby="promotions-title">
          <div className="mb-5">
            <h2 id="promotions-title" className="text-xl font-bold flex items-center gap-2"><Tag size={20}/> Promotions par magasin</h2>
            <p className="text-sm text-slate-600 mt-1">Ouvre le catalogue officiel de chaque enseigne pour consulter ses produits en promotion sur internet.</p>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {PROMOTION_CATALOGUES.map(({ store, url, note }) => (
              <article key={store} className="rounded-2xl border border-slate-200 p-4 bg-slate-50 flex flex-col gap-3">
                <div><h3 className="font-bold text-lg">{store}</h3><p className="text-sm text-slate-600">{note}</p></div>
                <a href={url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 text-white px-4 py-3 font-semibold hover:bg-emerald-800">Voir les promotions <ExternalLink size={16}/></a>
              </article>
            ))}
          </div>
          <p className="mt-5 text-sm text-slate-500 bg-amber-50 border border-amber-100 rounded-xl p-3">Les offres changent selon la période et parfois selon le magasin. Les prix et produits sont affichés par les enseignes sur leurs sites officiels ; ils ne sont pas importés automatiquement dans cette application.</p>
        </section>

        <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-5 ${activeTab === "courses" ? "" : "hidden"}`}>
          <h2 className="text-xl font-bold mb-3">Règle d'utilisation</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-600">
            <div className="bg-slate-50 rounded-2xl p-4"><b>1. Chaque semaine</b><br/>Tu importes ou saisis les prix vus dans les catalogues Anti-Crise, Lidl, Aldi, Intermarché, Carrefour, etc.</div>
            <div className="bg-slate-50 rounded-2xl p-4"><b>2. Avant d'acheter</b><br/>Tu regardes la colonne "meilleur prix" et le total prévu par rapport au budget de 80 €.</div>
            <div className="bg-slate-50 rounded-2xl p-4"><b>3. Après les courses</b><br/>Tu ajoutes la dépense réelle pour suivre ce qu'il reste dans la semaine.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

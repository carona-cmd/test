(function () {
  "use strict";
  const LS_LPP = "lpp.base", LS_DEC = "lpp.decisions";
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const eur = (n) => (n == null || isNaN(n) ? "—" : Number(n).toLocaleString("fr-FR", { style: "currency", currency: "EUR" }));
  const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  function load(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } }
  function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { alert("Stockage impossible : " + e.message); } }

  let base = load(LS_LPP, null);
  let lpp = base ? base.items : window.LPP_DEMO;
  let decisions = load(LS_DEC, []);
  let current = null;

  function showSource() {
    $("#sourceInfo").textContent = base
      ? `Base importée : ${base.name} — ${lpp.length} codes (le ${new Date(base.at).toLocaleDateString("fr-FR")}).`
      : `Données de démonstration (${lpp.length} codes fictifs). Importez le fichier officiel de la LPP pour des résultats réels.`;
  }

  // ---------- Recherche ----------
  function search(q) {
    q = q.trim();
    if (!q) return [];
    const digits = q.replace(/\s/g, "");
    if (/^\d+$/.test(digits)) return lpp.filter((x) => x.code.startsWith(digits)).slice(0, 50);
    const terms = norm(q).split(/\s+/);
    return lpp.filter((x) => { const l = norm(x.libelle); return terms.every((t) => l.includes(t)); }).slice(0, 50);
  }

  function renderResults(list, q) {
    const ul = $("#results");
    if (!q) { ul.innerHTML = ""; return; }
    if (!list.length) { ul.innerHTML = `<li class="empty">Aucun code LPP trouvé pour « ${esc(q)} ».</li>`; return; }
    ul.innerHTML = list.map((x) => `<li tabindex="0" data-code="${esc(x.code)}"><span class="c">${esc(x.code)}</span><span>${esc(x.libelle)}</span></li>`).join("");
  }

  $("#searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = $("#q").value, list = search(q);
    if (list.length === 1 || (list[0] && list[0].code === q.trim())) { $("#results").innerHTML = ""; openCode(list[0].code); }
    else renderResults(list, q);
  });
  $("#q").addEventListener("input", () => renderResults(search($("#q").value), $("#q").value.trim()));
  $("#results").addEventListener("click", (e) => { const li = e.target.closest("li[data-code]"); if (li) openCode(li.dataset.code); });
  $("#results").addEventListener("keydown", (e) => { if (e.key === "Enter") { const li = e.target.closest("li[data-code]"); if (li) openCode(li.dataset.code); } });

  function openCode(code) {
    current = lpp.find((x) => x.code === code);
    if (!current) return;
    $("#detail").hidden = false;
    $("#dCode").textContent = current.code;
    $("#dLib").textContent = current.libelle;
    const meta = [current.chapitre, current.ep ? "Soumis à entente préalable" : null, current.dateFin ? "Fin de prise en charge : " + current.dateFin : null].filter(Boolean);
    $("#dMeta").textContent = meta.join(" · ");
    $("#dTarif").textContent = eur(current.tarif);
    $("#decisionForm").reset();
    $("#decisionForm").date.value = new Date().toISOString().slice(0, 10);
    renderDecisions();
    $("#results").innerHTML = "";
    $("#detail").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ---------- Décisions ----------
  $("#decisionForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!current) return;
    const f = new FormData(e.target);
    const d = Object.fromEntries(f.entries());
    decisions.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      code: current.code, libelle: current.libelle, tarif: current.tarif,
      patient: d.patient.trim(), date: d.date, decision: d.decision, medecin: d.medecin.trim(),
      quantite: d.quantite, duree: d.duree, motif: d.motif.trim(), creeLe: new Date().toISOString()
    });
    save(LS_DEC, decisions);
    e.target.reset();
    e.target.date.value = new Date().toISOString().slice(0, 10);
    renderDecisions();
  });

  function table(list, withCode) {
    if (!list.length) return `<p class="empty">Aucune décision enregistrée.</p>`;
    return `<div class="table-wrap"><table><thead><tr>
      <th>Date</th>${withCode ? "<th>Code LPP</th>" : ""}<th>Dossier</th><th>Décision</th><th>Qté</th><th>Durée</th><th>Médecin</th><th>Motif</th><th></th>
      </tr></thead><tbody>${list.map((d) => `<tr>
        <td>${esc(new Date(d.date).toLocaleDateString("fr-FR"))}</td>
        ${withCode ? `<td><a href="#" data-open="${esc(d.code)}">${esc(d.code)}</a></td>` : ""}
        <td>${esc(d.patient)}</td>
        <td><span class="badge b-${esc(d.decision.replace(" ", "-"))}">${esc(d.decision)}</span></td>
        <td>${esc(d.quantite)}</td><td>${d.duree ? esc(d.duree) + " j" : "—"}</td>
        <td>${esc(d.medecin)}</td><td class="motif">${esc(d.motif)}</td>
        <td><button class="btn ghost small" data-del="${esc(d.id)}" type="button">Suppr.</button></td>
      </tr>`).join("")}</tbody></table></div>`;
  }

  function renderDecisions() {
    if (current) $("#codeDecisions").innerHTML = table(decisions.filter((d) => d.code === current.code), false);
    $("#allDecisions").innerHTML = table(decisions, true);
  }

  document.addEventListener("click", (e) => {
    const del = e.target.closest("[data-del]");
    if (del && confirm("Supprimer cette décision ?")) {
      decisions = decisions.filter((d) => d.id !== del.dataset.del);
      save(LS_DEC, decisions); renderDecisions();
    }
    const op = e.target.closest("[data-open]");
    if (op) { e.preventDefault(); openCode(op.dataset.open); }
  });

  // ---------- Export / import décisions ----------
  function download(name, text, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const cols = ["date", "code", "libelle", "tarif", "patient", "decision", "quantite", "duree", "medecin", "motif", "creeLe"];
  $("#exportCsv").addEventListener("click", () => {
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = "﻿" + [cols.join(";"), ...decisions.map((d) => cols.map((c) => q(d[c])).join(";"))].join("\r\n");
    download("decisions-lpp.csv", csv, "text/csv;charset=utf-8");
  });
  $("#exportJson").addEventListener("click", () => download("decisions-lpp.json", JSON.stringify(decisions, null, 2), "application/json"));
  $("#importJson").addEventListener("change", async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const arr = JSON.parse(await file.text());
      if (!Array.isArray(arr)) throw new Error("format inattendu");
      const ids = new Set(decisions.map((d) => d.id));
      const added = arr.filter((d) => d && d.code && !ids.has(d.id));
      decisions = [...added, ...decisions];
      save(LS_DEC, decisions); renderDecisions();
      alert(`${added.length} décision(s) importée(s).`);
    } catch (err) { alert("Import impossible : " + err.message); }
    e.target.value = "";
  });

  // ---------- Import de la base LPP (CSV) ----------
  function parseCSV(text) {
    const first = text.split(/\r?\n/, 1)[0];
    const sep = [";", "\t", ",", "|"].sort((a, b) => first.split(b).length - first.split(a).length)[0];
    const rows = []; let row = [], cell = "", inQ = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQ) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false; } else cell += ch; }
      else if (ch === '"') inQ = true;
      else if (ch === sep) { row.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
      else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((c) => c.trim()));
  }

  function findCol(headers, patterns) {
    const h = headers.map(norm);
    for (const p of patterns) { const i = h.findIndex((x) => p.test(x)); if (i >= 0) return i; }
    return -1;
  }

  $("#importFile").addEventListener("change", async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const buf = await file.arrayBuffer();
    let text = new TextDecoder("utf-8").decode(buf);
    if (text.includes("�")) text = new TextDecoder("windows-1252").decode(buf);
    const rows = parseCSV(text.replace(/^﻿/, ""));
    if (rows.length < 2) { alert("Fichier vide ou illisible."); return; }
    const H = rows[0];
    const iCode = findCol(H, [/^code/, /code.?lpp/, /cod_?tips/, /code/]);
    const iLib = findCol(H, [/libel/, /designation/, /nom/]);
    const iTarif = findCol(H, [/^tarif/, /tarif/, /prix/, /montant/]);
    const iChap = findCol(H, [/chapitre/, /titre/, /arbo/]);
    const iEp = findCol(H, [/entente/, /^ep$/, /accord.?prealable/]);
    const iFin = findCol(H, [/date.?fin/, /fin/]);
    if (iCode < 0 || iLib < 0) { alert("Colonnes « code » et « libellé » introuvables dans l'en-tête :\n" + H.join(" | ")); return; }
    const num = (v) => { if (v == null) return null; const n = parseFloat(String(v).replace(/\s/g, "").replace(",", ".")); return isNaN(n) ? null : n; };
    const map = new Map();
    for (const r of rows.slice(1)) {
      const code = (r[iCode] || "").trim().replace(/\s/g, "");
      if (!code) continue;
      map.set(code, {
        code, libelle: (r[iLib] || "").trim(),
        tarif: iTarif >= 0 ? num(r[iTarif]) : null,
        chapitre: iChap >= 0 ? (r[iChap] || "").trim() : "",
        ep: iEp >= 0 ? /^(o|oui|1|y|yes|true|x)$/i.test((r[iEp] || "").trim()) : false,
        dateFin: iFin >= 0 ? (r[iFin] || "").trim() : ""
      });
    }
    const items = [...map.values()];
    if (!items.length) { alert("Aucun code lu."); return; }
    base = { name: file.name, at: Date.now(), items };
    lpp = items; save(LS_LPP, base); showSource();
    alert(`${items.length} codes LPP importés.`);
    e.target.value = "";
  });

  $("#resetData").addEventListener("click", () => {
    if (!confirm("Revenir aux données de démonstration ? (les décisions sont conservées)")) return;
    localStorage.removeItem(LS_LPP); base = null; lpp = window.LPP_DEMO; showSource();
  });

  showSource();
  renderDecisions();
})();

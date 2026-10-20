// Site du BDE C'CNAM Strasbourg.
// Tout le contenu vient des fichiers du dossier content/ : on modifie ces fichiers
// (ou l'espace d'administration), jamais ce script.
(function () {
  const FILES = ["site", "evenements", "partenaires", "equipe", "galerie"];
  const VIEWS = ["accueil", "evenements", "galerie", "partenaires", "equipe", "contact", "adhesion"];
  const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const paras = (list) => (list || []).map((t) => `<p>${esc(t)}</p>`).join("");
  const todo = (label) => `<span class="todo">${esc(label)} à compléter</span>`;
  const initials = (nom) => nom.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const safeUrl = (u) => (/^(https?:|mailto:|\/|images\/|\.\/|data:image\/)/i.test(u || "") ? u : "");

  function parseDate(d) {
    const [y, m, j] = String(d).split("-").map(Number);
    return new Date(y, (m || 1) - 1, j || 1);
  }
  function today() { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }

  // Les images envoyées depuis l'espace d'administration arrivent en "/images/Mon fichier #1.png" :
  // on retire le "/" du début et on encode le nom (espaces, #, parenthèses) pour que l'image s'affiche.
  function imagePath(v) {
    const m = /^\/?images\/(.+)$/.exec(v);
    if (!m) return v;
    let name = m[1];
    try { name = decodeURIComponent(name); } catch (e) {}
    return "images/" + encodeURIComponent(name).replace(/[()']/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
  }

  async function load() {
    if (window.SITE_CONTENT) return window.SITE_CONTENT;
    const out = {};
    await Promise.all(FILES.map(async (f) => {
      // Un fichier vide ou abîmé ne doit pas casser tout le site : on l'affiche comme vide.
      try {
        const r = await fetch(`content/${f}.json`, { cache: "no-cache" });
        // L'espace d'administration enregistre les images en "/images/..." : on les rend relatives.
        out[f] = JSON.parse(await r.text(), (k, v) => (typeof v === "string" ? imagePath(v) : v)) || {};
      } catch (e) {
        console.warn(`content/${f}.json illisible`, e);
        out[f] = {};
      }
    }));
    return out;
  }

  const head = (eyebrow, title, lead) =>
    `<div class="wrap page-head"><p class="eyebrow">${esc(eyebrow)}</p><h1>${title}</h1>${lead ? `<p class="lead">${esc(lead)}</p>` : ""}</div>`;

  function eventCard(e, past) {
    const d = parseDate(e.date);
    const img = safeUrl(e.image) ? `<img src="${esc(e.image)}" alt="" loading="lazy">` : "";
    const link = safeUrl(e.lien) ? `<a class="btn btn-red" href="${esc(e.lien)}" target="_blank" rel="noopener">S'inscrire</a>` : "";
    const meta = [e.heure && e.heure.replace(":", "h"), e.lieu].filter(Boolean).map(esc).join(" · ");
    return `<article class="event${past ? " past" : ""}">
      <div class="event-date"><div class="event-day">${d.getDate()}</div><div class="event-month">${MOIS[d.getMonth()]} ${d.getFullYear()}</div></div>
      <div class="event-body">
        ${e.exemple ? `<span class="tag">Exemple</span>` : ""}
        <h3>${esc(e.titre)}</h3>
        ${meta ? `<p class="event-meta">${meta}</p>` : ""}
        ${e.description ? `<p>${esc(e.description)}</p>` : ""}
        ${img}
        ${link ? `<div>${link}</div>` : ""}
      </div>
    </article>`;
  }

  function splitEvents(list) {
    const t = today();
    const sorted = [...(list || [])].sort((a, b) => parseDate(a.date) - parseDate(b.date));
    return {
      next: sorted.filter((e) => parseDate(e.date) >= t),
      past: sorted.filter((e) => parseDate(e.date) < t).reverse(),
    };
  }

  const render = {
    accueil(c) {
      const s = c.site;
      const { next } = splitEvents(c.evenements.evenements);
      return `
      <div class="hero"${safeUrl(s.photo_accueil) ? ` style="--hero-photo:url('${esc(s.photo_accueil)}')"` : ""}><div class="wrap hero-in">
        ${safeUrl(s.logo) ? `<img class="hero-logo" src="${esc(s.logo)}" alt="Logo C'CNAM, BDE Strasbourg">` : ""}
        <div class="hero-text">
        <span class="hopla">Hopla !</span>
        <p class="eyebrow" style="color:#fff;opacity:.85">Le BDE du CNAM Strasbourg</p>
        <h1>On étudie, on se rencontre, <em>on profite.</em></h1>
        <p>${esc(s.accroche)}</p>
        <div class="btns">
          <a class="btn btn-dark" href="#adhesion">Rejoindre le BDE</a>
          <a class="btn btn-light" href="#evenements">Voir les événements</a>
        </div>
        </div>
      </div></div>
      <div class="timber" aria-hidden="true"></div>

      <div class="wrap section">
        <p class="eyebrow">Qui sommes-nous ?</p>
        <h2>L'association étudiante de toutes les filières du CNAM</h2>
        <div class="prose">${paras(s.qui_sommes_nous)}</div>
      </div>

      <div class="wrap section">
        <p class="eyebrow">Nos objectifs</p>
        <div class="goals">${s.objectifs.map((o, i) => `
          <div class="goal"><span class="goal-n">${i + 1}</span><h3>${esc(o.titre)}</h3><p>${esc(o.texte)}</p></div>`).join("")}
        </div>
      </div>

      <div class="band"><div class="wrap band-in">
        <div class="prose">
          <p class="eyebrow">Notre vision</p>
          <h2>Construite <span>avec et pour</span> les étudiants</h2>
          ${paras(s.vision)}
        </div>
        <div class="prose">
          <p class="eyebrow">Et concrètement ?</p>
          <p>${esc(s.concretement)}</p>
          <ul class="band-list"><li>Soirées et sorties</li><li>Un WEI, pourquoi pas</li><li>Forums et rencontres pros</li><li>Tes projets à toi</li></ul>
        </div>
      </div></div>

      <div class="wrap section">
        <div class="split">
          <div class="panel">
            <p class="eyebrow">Prochain événement</p>
            ${next[0] ? `<h3>${esc(next[0].titre)}</h3><p>${parseDate(next[0].date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}${next[0].lieu ? " · " + esc(next[0].lieu) : ""}</p>` : `<h3>Bientôt annoncé</h3><p>Le programme de l'année arrive. Reste connecté !</p>`}
            <div><a class="btn btn-line" href="#evenements">Tous les événements</a></div>
          </div>
          <div class="panel">
            <p class="eyebrow">Entreprises et partenaires</p>
            <h3>Rencontrez les étudiants du CNAM</h3>
            <p>Soutenez la vie étudiante et gagnez en visibilité auprès de futurs alternants, stagiaires et diplômés.</p>
            <div><a class="btn btn-red" href="#partenaires">Devenir partenaire</a></div>
          </div>
        </div>
      </div>

      <div class="wrap section">
        <div class="prose"><h2>${esc(s.appel)}</h2><p>${esc(s.slogan)}</p></div>
        <div class="btns" style="margin-top:20px"><a class="btn btn-red" href="#contact">Nous contacter</a></div>
      </div>`;
    },

    evenements(c) {
      const { next, past } = splitEvents(c.evenements.evenements);
      return head("Agenda", "Événements", "Soirées, sorties, rencontres pros : tout ce qui se passe au BDE cette année.") + `
      <div class="wrap">
        <h2 class="section" style="padding-block:0 16px;font-size:28px">À venir</h2>
        ${next.length ? `<div class="events">${next.map((e) => eventCard(e)).join("")}</div>` :
          `<div class="empty"><h3>Le programme arrive bientôt</h3><p>Aucun événement n'est annoncé pour le moment. Suis-nous sur les réseaux pour ne rien rater.</p></div>`}
        ${past.length ? `<h2 class="section" style="padding-block:48px 16px;font-size:28px">Événements passés</h2><div class="events">${past.map((e) => eventCard(e, true)).join("")}</div>` : ""}
      </div>`;
    },

    galerie(c) {
      const albums = c.galerie.albums || [];
      return head("Souvenirs", "Galerie photos", "Les meilleurs moments de l'année, soirée après soirée.") + `
      <div class="wrap">
        ${albums.length ? albums.map((a) => `
          <section class="album">
            <div class="album-head"><h2>${esc(a.titre)}</h2>${a.date ? `<span>${parseDate(a.date).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</span>` : ""}</div>
            <div class="photos">${(a.photos || []).filter((p) => safeUrl(p.src)).map((p) => `
              <figure class="photo" tabindex="0" data-src="${esc(p.src)}" data-cap="${esc(p.legende)}"><img src="${esc(p.src)}" alt="${esc(p.legende || a.titre)}" loading="lazy"></figure>`).join("")}
            </div>
          </section>`).join("") :
          `<div class="empty"><h3>Les premières photos arrivent</h3><p>Dès nos premiers événements, tu retrouveras ici les albums photos de l'année.</p></div>`}
      </div>`;
    },

    partenaires(c) {
      const list = c.partenaires.partenaires || [];
      const p = c.site.partenariat;
      return head("Ils nous soutiennent", "Partenaires", "Les entreprises et structures qui font vivre la vie étudiante du CNAM Strasbourg avec nous.") + `
      <div class="wrap">
        ${list.length ? `<div class="partners">${list.map((x) => {
          const url = safeUrl(x.site);
          const tagName = url ? "a" : "div";
          return `<${tagName} class="partner"${url ? ` href="${esc(url)}" target="_blank" rel="noopener"` : ""}>
            ${safeUrl(x.logo) ? `<div class="partner-logo"><img src="${esc(x.logo)}" alt="${esc(x.nom)}"></div>` : ""}
            ${x.type ? `<span class="partner-type">${esc(x.type)}</span>` : ""}
            <h3>${esc(x.nom)}</h3>
            ${x.description ? `<p>${esc(x.description)}</p>` : ""}
          </${tagName}>`;
        }).join("")}</div>` :
          `<div class="empty"><h3>Nos premiers partenaires arrivent</h3><p>Nous construisons nos partenariats pour cette année. Votre structure pourrait être la première à apparaître ici.</p></div>`}
      </div>
      <div class="band" style="margin-top:56px"><div class="wrap band-in">
        <div class="prose">
          <p class="eyebrow">Devenir partenaire</p>
          <h2>Soutenez la vie étudiante, <span>rencontrez vos futurs talents</span></h2>
          <p>${esc(p.texte)}</p>
          <div class="btns" style="margin-top:8px"><a class="btn btn-red" href="#contact">Proposer un partenariat</a></div>
        </div>
        <ul class="band-list">${p.offres.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>
      </div></div>`;
    },

    equipe(c) {
      return head("Le bureau", "L'équipe", "Les étudiants qui font tourner C'CNAM Strasbourg cette année.") + `
      <div class="wrap"><div class="team">${(c.equipe.membres || []).map((m) => `
        <div class="member">
          <div class="avatar">${safeUrl(m.photo) ? `<img src="${esc(m.photo)}" alt="${esc(m.nom)}" loading="lazy">` : esc(initials(m.nom))}</div>
          <div><h3>${esc(m.nom)}</h3><p>${esc(m.role)}</p></div>
        </div>`).join("")}
      </div></div>`;
    },

    contact(c) {
      const k = c.site.contact;
      const row = (label, val, href) => `<div class="contact-row"><dt>${label}</dt><dd>${val ? (href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(val)}</a>` : esc(val)) : todo(label)}</dd></div>`;
      const handle = (u) => (u || "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
      return head("On t'écoute", "Contact", "Une idée de soirée, une question, un projet de partenariat ? Écris-nous.") + `
      <div class="wrap"><dl class="contact-list">
        ${row("E-mail", k.email, k.email ? "mailto:" + k.email : "")}
        ${row("Instagram", handle(k.instagram), safeUrl(k.instagram))}
        ${row("LinkedIn", handle(k.linkedin), safeUrl(k.linkedin))}
        ${row("Adresse", k.adresse)}
      </dl></div>`;
    },

    adhesion(c) {
      const a = c.site.adhesion;
      return head("Rejoins-nous", "Adhésion", a.texte) + `
      <div class="wrap"><div class="split">
        <div class="panel">
          <p class="eyebrow">Ce que tu y gagnes</p>
          <ul class="checks">${a.avantages.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        </div>
        <div class="panel">
          <p class="eyebrow">Cotisation annuelle</p>
          ${a.prix ? `<p class="price">${esc(a.prix)}</p>` : `<p>${todo("Tarif")}</p>`}
          <p>Toutes les filières et tous les niveaux sont les bienvenus, que tu sois en formation initiale, en alternance ou en reprise d'études.</p>
          <div>${safeUrl(a.lien) ? `<a class="btn btn-red" href="${esc(a.lien)}" target="_blank" rel="noopener">J'adhère</a>` : `<span class="btn btn-line" aria-disabled="true">Lien d'adhésion bientôt disponible</span>`}</div>
        </div>
      </div></div>`;
    },
  };

  function show() {
    const id = location.hash.slice(1);
    const view = VIEWS.includes(id) ? id : "accueil";
    document.querySelectorAll(".view").forEach((v) => { v.hidden = v.dataset.view !== view; });
    document.querySelectorAll(".nav a").forEach((a) => {
      if (a.getAttribute("href") === "#" + view) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    document.getElementById("nav").classList.remove("open");
    document.getElementById("burger").setAttribute("aria-expanded", "false");
    window.scrollTo(0, 0);
  }

  function lightbox(fig) {
    const box = document.createElement("div");
    box.className = "lightbox";
    box.innerHTML = `<button type="button">Fermer</button><div><img src="${esc(fig.dataset.src)}" alt=""><p>${esc(fig.dataset.cap)}</p></div>`;
    const close = () => box.remove();
    box.addEventListener("click", (e) => { if (e.target === box || e.target.tagName === "BUTTON") close(); });
    document.addEventListener("keydown", function k(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", k); } });
    document.body.appendChild(box);
  }

  async function start() {
    const burger = document.getElementById("burger");
    burger.addEventListener("click", () => {
      const open = document.getElementById("nav").classList.toggle("open");
      burger.setAttribute("aria-expanded", String(open));
    });

    let content;
    try { content = await load(); }
    catch (e) {
      document.getElementById("app").innerHTML = `<div class="wrap page-head"><h1>Oups</h1><p class="lead">Le contenu du site n'a pas pu être chargé.</p></div>`;
      return;
    }
    document.querySelectorAll(".view").forEach((v) => { v.innerHTML = render[v.dataset.view](content); });
    document.getElementById("app").addEventListener("click", (e) => {
      const fig = e.target.closest(".photo"); if (fig) lightbox(fig);
    });
    window.addEventListener("hashchange", show);
    show();
  }

  start();
})();

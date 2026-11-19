/* ====== CONFIGURATION (à modifier) ====== */
// Numéro WhatsApp de la boutique : format international, sans "+" ni espaces
// Exemple : 212612345678
const NUMERO_WHATSAPP = "212600000000";

const T_HOMME = [40, 41, 42, 43, 44, 45];
const T_MIXTE = [38, 39, 40, 41, 42, 43, 44];

// Catalogue : pour ajouter un produit, ajoute une ligne ici.
// Sans "image", une illustration de la "couleur" indiquée est affichée :
// remplace-la en ajoutant image: "ton-fichier.jpg" (photo dans le même dossier).
const PRODUITS = [
  { id: 1,  nom: "Basket Urbaine",       categorie: "Baskets",    prix: 299, image: "shoes.jpg",  vignette: "urb.png",   tailles: T_MIXTE, populaire: true },
  { id: 2,  nom: "Chaussure classique",  categorie: "Classiques", prix: 399, image: "claasi.jpg", vignette: "class.png", tailles: T_HOMME, populaire: true },
  { id: 3,  nom: "Basket Tendance",      categorie: "Baskets",    prix: 279, ancienPrix: 349, image: "tend.jpg", vignette: "tend.jpg", tailles: T_MIXTE, populaire: true },
  { id: 4,  nom: "Running Pro",          categorie: "Sport",      prix: 349, couleur: "#2563eb", tailles: T_MIXTE, populaire: true },
  { id: 5,  nom: "Mocassin Cuir",        categorie: "Classiques", prix: 459, couleur: "#8b5a2b", tailles: T_HOMME },
  { id: 6,  nom: "Sandale Confort",      categorie: "Sandales",   prix: 149, couleur: "#d97706", tailles: T_MIXTE },
  { id: 7,  nom: "Botte Chelsea",        categorie: "Bottes",     prix: 529, couleur: "#3f2a1d", tailles: T_HOMME },
  { id: 8,  nom: "Sneakers Blanches",    categorie: "Baskets",    prix: 319, ancienPrix: 399, couleur: "#cbd5e1", tailles: T_MIXTE },
  { id: 9,  nom: "Chaussure de Ville",   categorie: "Classiques", prix: 429, couleur: "#111827", tailles: T_HOMME },
  { id: 10, nom: "Claquette Été",        categorie: "Sandales",   prix: 99,  couleur: "#16a34a", tailles: T_MIXTE }
];

/* ====== PANIER (stocké dans le navigateur) ====== */
const CLE_PANIER = "panier";
const QTE_MAX = 10;

function lirePanier() {
  try {
    const donnees = JSON.parse(localStorage.getItem(CLE_PANIER));
    return Array.isArray(donnees) ? donnees : [];
  } catch (e) {
    return [];
  }
}

function sauverPanier(panier) {
  try {
    localStorage.setItem(CLE_PANIER, JSON.stringify(panier));
  } catch (e) { /* stockage indisponible : on ignore */ }
  majBadge();
}

function trouverProduit(id) {
  return PRODUITS.find(function (p) { return p.id === id; });
}

// Les prix viennent toujours du catalogue, jamais du panier stocké
function lignesValides() {
  return lirePanier()
    .filter(function (l) { return trouverProduit(l.id) && Number.isInteger(l.qte) && l.qte > 0; })
    .map(function (l) { return { id: l.id, taille: l.taille, qte: l.qte, produit: trouverProduit(l.id) }; });
}

function nbArticles() {
  return lignesValides().reduce(function (s, l) { return s + l.qte; }, 0);
}

function totalPanier() {
  return lignesValides().reduce(function (s, l) { return s + l.qte * l.produit.prix; }, 0);
}

function ajouterAuPanier(id, taille) {
  const panier = lirePanier();
  const ligne = panier.find(function (l) { return l.id === id && l.taille === taille; });
  if (ligne) {
    ligne.qte = Math.min(ligne.qte + 1, QTE_MAX);
  } else {
    panier.push({ id: id, taille: taille, qte: 1 });
  }
  sauverPanier(panier);
}

function changerQuantite(id, taille, delta) {
  const panier = lirePanier();
  const ligne = panier.find(function (l) { return l.id === id && l.taille === taille; });
  if (!ligne) return;
  ligne.qte = Math.min(ligne.qte + delta, QTE_MAX);
  sauverPanier(panier.filter(function (l) { return l.qte > 0; }));
  afficherPanier();
}

function supprimerLigne(id, taille) {
  sauverPanier(lirePanier().filter(function (l) { return !(l.id === id && l.taille === taille); }));
  afficherPanier();
}

/* ====== INTERFACE ====== */
function majBadge() {
  document.querySelectorAll(".cartcount").forEach(function (el) {
    el.textContent = nbArticles();
  });
}

function notifier(message) {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.setAttribute("role", "status");
    document.body.appendChild(t);
  }
  t.textContent = message;
  t.classList.add("visible");
  clearTimeout(t._minuteur);
  t._minuteur = setTimeout(function () { t.classList.remove("visible"); }, 2000);
}

function el(tag, classe, texte) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texte !== undefined) e.textContent = texte;
  return e;
}

// Photo du produit, ou illustration de couleur si aucune photo n'est fournie
function imageProduit(p, champ) {
  if (p[champ] || p.image) return p[champ] || p.image;
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
    '<path d="M50 212V182Q50 160 72 155L132 140Q152 98 192 110L232 150Q300 160 332 190Q352 200 352 215Z" fill="' + (p.couleur || "#999") + '"/>' +
    '<rect x="50" y="212" width="302" height="24" rx="12" fill="#222"/>' +
    '<path d="M150 135L172 160M175 125L197 150" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".6"/></svg>';
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function creerCarte(p, champImage) {
  const carte = el("div", "prod-card");

  const zone = el("div", "prod-img");
  const img = el("img");
  img.src = imageProduit(p, champImage);
  img.alt = p.nom;
  img.loading = "lazy";
  zone.appendChild(img);
  if (p.ancienPrix) {
    zone.appendChild(el("span", "badge", "-" + Math.round((1 - p.prix / p.ancienPrix) * 100) + "%"));
  }

  const prix = el("div", "prix-bloc");
  prix.appendChild(el("span", "price", p.prix + " DH"));
  if (p.ancienPrix) prix.appendChild(el("s", "price-old", p.ancienPrix + " DH"));

  const choix = el("select", "taille");
  choix.setAttribute("aria-label", "Pointure de " + p.nom);
  choix.add(new Option("Pointure", ""));
  p.tailles.forEach(function (t) { choix.add(new Option(t, t)); });

  const bouton = el("button", "btn btn-small", "Ajouter au panier");
  bouton.type = "button";
  bouton.addEventListener("click", function () {
    if (!choix.value) {
      notifier("Choisissez une pointure");
      choix.focus();
      return;
    }
    ajouterAuPanier(p.id, Number(choix.value));
    notifier(p.nom + " ajouté au panier");
  });

  carte.append(zone, el("p", "prod-cat", p.categorie), el("h3", "", p.nom), prix, choix, bouton);
  return carte;
}

// Affiche une liste de produits dans le conteneur indiqué
// champImage : "image" (boutique) ou "vignette" (accueil)
function afficherProduits(idConteneur, liste, champImage) {
  const conteneur = document.getElementById(idConteneur);
  if (!conteneur) return;
  conteneur.textContent = "";
  if (liste.length === 0) {
    conteneur.appendChild(el("p", "", "Aucun produit dans cette catégorie."));
    return;
  }
  liste.forEach(function (p) { conteneur.appendChild(creerCarte(p, champImage)); });
}

// Page boutique : filtres par catégorie (+ ?cat=Sandales dans l'adresse) et tri par prix
function initBoutique() {
  const filtres = document.getElementById("filtres");
  const tri = document.getElementById("tri");
  const compteur = document.getElementById("compteur");
  if (!filtres || !tri || !compteur) return;

  const categories = ["Tous"].concat(Array.from(new Set(PRODUITS.map(function (p) { return p.categorie; }))));
  const demande = new URLSearchParams(window.location.search).get("cat");
  let actif = categories.indexOf(demande) !== -1 ? demande : "Tous";

  function rendre() {
    let liste = PRODUITS.filter(function (p) { return actif === "Tous" || p.categorie === actif; });
    if (tri.value === "asc") liste = liste.slice().sort(function (a, b) { return a.prix - b.prix; });
    if (tri.value === "desc") liste = liste.slice().sort(function (a, b) { return b.prix - a.prix; });
    afficherProduits("liste-produits", liste, "image");
    compteur.textContent = liste.length + (liste.length > 1 ? " produits" : " produit");
    filtres.querySelectorAll("button").forEach(function (b) {
      b.classList.toggle("actif", b.dataset.cat === actif);
    });
  }

  categories.forEach(function (c) {
    const b = el("button", "chip", c);
    b.type = "button";
    b.dataset.cat = c;
    b.addEventListener("click", function () { actif = c; rendre(); });
    filtres.appendChild(b);
  });
  tri.addEventListener("change", rendre);
  rendre();
}

/* ====== PAGE PANIER ====== */
function cellule(contenu) {
  const td = document.createElement("td");
  if (typeof contenu === "string") td.textContent = contenu;
  else td.appendChild(contenu);
  return td;
}

function boutonAction(texte, libelle, action) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "btn-qte";
  b.textContent = texte;
  b.setAttribute("aria-label", libelle);
  b.addEventListener("click", action);
  return b;
}

function afficherPanier() {
  const corps = document.getElementById("lignes-panier");
  if (!corps) return;
  corps.textContent = "";

  const lignes = lignesValides();
  document.getElementById("panier-vide").hidden = lignes.length > 0;
  document.getElementById("panier-contenu").hidden = lignes.length === 0;

  lignes.forEach(function (l) {
    const tr = document.createElement("tr");

    const blocQte = document.createElement("span");
    blocQte.className = "qte";
    const nombre = document.createElement("span");
    nombre.textContent = l.qte;
    blocQte.append(
      boutonAction("−", "Diminuer la quantité", function () { changerQuantite(l.id, l.taille, -1); }),
      nombre,
      boutonAction("+", "Augmenter la quantité", function () { changerQuantite(l.id, l.taille, 1); })
    );

    tr.append(
      cellule(l.produit.nom),
      cellule(String(l.taille)),
      cellule(blocQte),
      cellule((l.qte * l.produit.prix) + " DH"),
      cellule(boutonAction("Supprimer", "Retirer " + l.produit.nom + " du panier", function () { supprimerLigne(l.id, l.taille); }))
    );
    corps.appendChild(tr);
  });

  document.getElementById("total").textContent = totalPanier() + " DH";
}

function construireMessage(client, lignes) {
  const detail = lignes.map(function (l) {
    return "- " + l.produit.nom + ", pointure " + l.taille + " x" + l.qte + " = " + (l.qte * l.produit.prix) + " DH";
  });
  return ["Nouvelle commande", ""]
    .concat(detail)
    .concat([
      "",
      "Total : " + totalPanier() + " DH",
      "Paiement : à la livraison",
      "",
      "Nom : " + client.nom,
      "Téléphone : " + client.tel,
      "Ville : " + client.ville,
      "Adresse : " + client.adresse
    ])
    .join("\n");
}

function afficherErreur(texte) {
  const zone = document.getElementById("erreur-commande");
  zone.textContent = texte;
  zone.hidden = !texte;
}

function validerCommande(evenement) {
  evenement.preventDefault();
  afficherErreur("");

  const f = evenement.target.elements;
  const client = {
    nom: f["nom"].value.trim(),
    tel: f["tel"].value.trim(),
    ville: f["ville"].value.trim(),
    adresse: f["adresse"].value.trim()
  };
  const lignes = lignesValides();

  if (lignes.length === 0) {
    afficherErreur("Votre panier est vide.");
    return;
  }
  if (client.nom.length < 3) {
    afficherErreur("Entrez votre nom complet.");
    f["nom"].focus();
    return;
  }
  // Numéro marocain : 06/07/05 xx xx xx xx ou +212 6/7/5 ...
  const telPropre = client.tel.replace(/[\s.\-]/g, "");
  if (!/^(\+212|0)[5-7]\d{8}$/.test(telPropre)) {
    afficherErreur("Numéro de téléphone invalide. Exemple : 06 12 34 56 78");
    f["tel"].focus();
    return;
  }
  if (client.ville.length < 2) {
    afficherErreur("Entrez votre ville.");
    f["ville"].focus();
    return;
  }
  if (client.adresse.length < 8) {
    afficherErreur("Entrez votre adresse complète de livraison.");
    f["adresse"].focus();
    return;
  }

  const lien = "https://wa.me/" + NUMERO_WHATSAPP + "?text=" + encodeURIComponent(construireMessage(client, lignes));
  window.open(lien, "_blank", "noopener");

  document.getElementById("lien-whatsapp").href = lien;
  document.getElementById("panier-contenu").hidden = true;
  document.getElementById("confirmation").hidden = false;
  sauverPanier([]);
}

/* ====== INITIALISATION ====== */
(function init() {
  majBadge();

  // Clic sur l'icône du panier : ouvre la page panier
  document.querySelectorAll(".cart:not(a)").forEach(function (el) {
    el.style.cursor = "pointer";
    el.setAttribute("role", "link");
    el.setAttribute("tabindex", "0");
    el.setAttribute("aria-label", "Voir le panier");
    el.addEventListener("click", function () { window.location.href = "panier.html"; });
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter") window.location.href = "panier.html";
    });
  });

  afficherPanier();
  initBoutique();

  const formulaire = document.getElementById("form-commande");
  if (formulaire) formulaire.addEventListener("submit", validerCommande);
})();

/* ====== CONFIGURATION (à modifier) ====== */
// Numéro WhatsApp de la boutique : format international, sans "+" ni espaces
// Exemple : 212612345678
const NUMERO_WHATSAPP = "212600000000";

// Catalogue : pour ajouter un produit, ajoute simplement une ligne ici
const PRODUITS = [
  { id: 1, nom: "Basket Urbaine",      prix: 299, image: "shoes.jpg",  vignette: "urb.png",   tailles: [39, 40, 41, 42, 43, 44] },
  { id: 2, nom: "Chaussure classique", prix: 399, image: "claasi.jpg", vignette: "class.png", tailles: [40, 41, 42, 43, 44, 45] },
  { id: 3, nom: "Basket Tendance",     prix: 279, image: "tend.jpg",   vignette: "tend.jpg",  tailles: [38, 39, 40, 41, 42, 43] }
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

// Affiche les cartes produits dans le conteneur indiqué
// ids : liste d'identifiants à afficher (ou null pour tous) ; champImage : "image" ou "vignette"
function afficherProduits(idConteneur, ids, champImage) {
  const conteneur = document.getElementById(idConteneur);
  if (!conteneur) return;
  conteneur.textContent = "";

  PRODUITS.filter(function (p) { return !ids || ids.indexOf(p.id) !== -1; }).forEach(function (p) {
    const carte = document.createElement("div");
    carte.className = "prod-card";

    const img = document.createElement("img");
    img.src = p[champImage];
    img.alt = p.nom;

    const titre = document.createElement("h3");
    titre.textContent = p.nom;

    const prix = document.createElement("p");
    prix.className = "price";
    prix.textContent = p.prix + " DH";

    const choix = document.createElement("select");
    choix.className = "taille";
    choix.setAttribute("aria-label", "Pointure de " + p.nom);
    choix.add(new Option("Pointure", ""));
    p.tailles.forEach(function (t) { choix.add(new Option(t, t)); });

    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.className = "btn btn-small";
    bouton.textContent = "Ajouter au panier";
    bouton.addEventListener("click", function () {
      if (!choix.value) {
        notifier("Choisissez une pointure");
        choix.focus();
        return;
      }
      ajouterAuPanier(p.id, Number(choix.value));
      notifier(p.nom + " ajouté au panier");
    });

    carte.append(img, titre, prix, choix, bouton);
    conteneur.appendChild(carte);
  });
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
  document.querySelectorAll(".cart").forEach(function (el) {
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

  const formulaire = document.getElementById("form-commande");
  if (formulaire) formulaire.addEventListener("submit", validerCommande);
})();

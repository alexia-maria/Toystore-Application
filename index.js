const express = require("express");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
var sass = require("sass");
const { Client } = require("pg");
var client = new Client({
  database: "alexia",
  user: "useralexia",
  password: "sihleanu",
  host: "localhost",
  port: 5432,
});
client.connect();

app = express();

obGlobal = {
  obErori: null,
  obImagini: null,
  folderScss: path.join(__dirname, "/resurse/scss"),
  folderCss: path.join(__dirname, "/resurse/css"),
  folderBackup: path.join(__dirname, "backup"),
  optiuniMeniu: [],
};

client.query(
  "select * from unnest(enum_range(null::categ_prajitura))",
  function (err, rezCategorie) {}
);
console.log("Folder proiect", __dirname);
console.log("Nume fisier", __filename);
console.log("Director de lucru", process.cwd());

vectorFoldere = ["temp", "temp1", "backup"];
for (let folder of vectorFoldere) {
  let caleFolder = path.join(__dirname, folder);

  if (!fs.existsSync(caleFolder)) {
    fs.mkdirSync(caleFolder);
  }
}

function compileazaScss(caleScss, caleCss) {
  if (!caleCss) {
    let vectorCale = caleScss.split("\\");
    let numeFisExt = vectorCale[vectorCale.length - 1];
    let numeFis = numeFisExt.split(".")[0];

    caleCss = numeFis + ".css";
  }
  if (!path.isAbsolute(caleScss)) {
    caleScss = path.join(obGlobal.folderScss, caleScss);
  }

  if (!path.isAbsolute(caleCss)) {
    caleCss = path.join(obGlobal.folderCss, caleCss);
  } // la acest punct avem cai absolute in pathScss si pathCss

  //dupa comentariu
  let vectorCale = caleCss.split("\\");
  let numeFisCss = vectorCale[vectorCale.length - 1];

  let caleResBackup = path.join(obGlobal.folderBackup, "resurse/css");
  if (!fs.existsSync(caleResBackup)) {
    fs.mkdirSync(caleResBackup, { recursive: true });
  }

  if (fs.existsSync(caleCss)) {
    fs.copyFileSync(
      caleCss,
      path.join(obGlobal.folderBackup, "resurse/css", numeFisCss)
    );
  }
  rez = sass.compile(caleScss, { sourceMap: true });
  fs.writeFileSync(caleCss, rez.css);
}

compileazaScss("a.scss");

vFisiere = fs.readdirSync(obGlobal.folderScss);
for (let numeFis of vFisiere) {
  if (path.extname(numeFis) == ".scss") {
    compileazaScss(numeFis);
  }
}

fs.watch(obGlobal.folderScss, function (eveniment, numeFis) {
  console.log(eveniment, numeFis);
  if (eveniment == "change" || eveniment == "rename") {
    let caleCompleta = path.join(obGlobal.folderScss, numeFis);
    if (fs.existsSync(caleCompleta)) {
      compileazaScss(caleCompleta);
    }
  }
});

app.set("view engine", "ejs");

app.use("/resurse", express.static(__dirname + "/resurse"));

app.use("/node_modules", express.static(__dirname + "/node_modules"));

app.use("/", function (req, res, next) {
  res.locals.optiuniMeniu = obGlobal.optiuniMeniu;
  next();
});

app.use(/^\/resurse(\/[a-zA-Z0-9]*(?!\.)[a-zA-Z0-9]*)*$/, function (req, res) {
  afiseazaEroare(res, 403);
});

app.get("/favicon.ico", function (req, res) {
  res.sendFile(__dirname + "/resurse/imagini/favicon.ico");
});

app.get("/ceva", function (req, res) {
  res.send("altceva");
});

app.get(["/index", "/", "/home"], function (req, res) {
  res.render("pagini/index", {
    ip: req.ip,
    imagini: obGlobal.obImagini.imagini,
  });
});

app.get("/despre", function (req, res) {
  res.render("pagini/despre");
});

app.get("/galerie", function (req, res) {
  res.render("pagini/galerie", {
    imagini: obGlobal.obImagini.imagini,
  });
});

app.get("*/galerie-animata.css", function (req, res) {
  var sirScss = fs
    .readFileSync(__dirname + "/resurse/scss_ejs/galerie_animata.scss")
    .toString("utf8");
  var numar = Math.floor(Math.random() * 5 + 5);
  rezScss = ejs.render(sirScss, { nrimag: numar });
  console.log(rezScss);
  var caleScss = __dirname + "/temp/galerie_animata.scss";
  fs.writeFileSync(caleScss, rezScss);
  try {
    rezCompilare = sass.compile(caleScss, { sourceMap: true });

    var caleCss = __dirname + "/temp/galerie_animata.css";
    fs.writeFileSync(caleCss, rezCompilare.css);
    res.setHeader("Content-Type", "text/css");
    res.sendFile(caleCss);
  } catch (err) {
    console.log(err);
    res.send("Eroare");
  }
});

app.get("*/galerie-animata.css.map", function (req, res) {
  res.sendFile(path.join(__dirname, "temp/galerie-animata.css.map"));
});

app.get("/produse", function (req, res) {
  //TO DO query pentru a selecta toate produsele
  //TO DO se adauaga filtrarea dupa tipul produsului
  //TO DO se selecteaza si toate valorile din enum-ul categ_prajitura
  client.query(
    "select * from unnest(enum_range(null::categ_prajitura))",
    function (err, rezCategorie) {
      // console.log(err);
      // console.log(rez);
      let conditieWhere = "";
      if (req.query.tip) {
        conditieWhere = `where tip_produs = ${req.query.tip}`;
      }

      client.query(
        "select * from prajituri " + conditieWhere,
        function (err, rez) {
          console.log(300);
          if (err) {
            console.log(err);
            afiseazaEroare(res, 2);
          } else
            res.render("pagini/produse", {
              produse: rez.rows,
              optiuni: rezCategorie.rows,
            });
        }
      );
    }
  );
});

app.get("/produs/:id", function (req, res) {
  console.log(req.params);

  client.query(" TO DO ", function (err, rezultat) {
    if (err) {
      console.log(err);
      afisareEroare(res, 2);
    } else res.render("pagini/produs", { prod: "" });
  });
});

app.get("/*", function (req, res) {
  console.log("cale:", req.url);
  try {
    res.render("pagini" + req.url, function (err, rezRandare) {
      console.log("Eroarea: ", err);
      console.log("Rezultat randare: ", rezRandare);
      if (err) {
        console.log(err);
        if (err.message.startsWith("Failed to lookup view"))
          //  afiseazaEroare(res, { identificator: 404, titlu: "ceva" });
          afiseazaEroare(res, 404);
        else afiseazaEroare(res);
      } else {
        res.send(rezRandare);
      }
    });
  } catch (err) {
    console.log(err);
    if (err.message.startsWith("Cannot find module")) {
      afiseazaEroare(res, 404, "fisier resursa negasit");
    }
  }
});

function initializeazaErori() {
  var continut = fs
    .readFileSync(__dirname + "/resurse/json/erori.json")
    .toString("utf-8");

  obGlobal.obErori = JSON.parse(continut);
  // for(let i = 0; i < obErori.info_erori.length; i++)

  for (let i of obGlobal.obErori.info_erori) {
    i.imagine = "/" + obGlobal.obErori.cale_baza + "/" + i.imagine;
  }
}

initializeazaErori();

function initializeazaImagini() {
  var continut = fs
    .readFileSync(__dirname + "/resurse/json/galerie.json")
    .toString("utf-8");
  obGlobal.obImagini = JSON.parse(continut);
  let caleAbs = path.join(__dirname, obGlobal.obImagini.cale_galerie);
  let caleMediu = path.join(caleAbs, "mediu");
  let caleMic = path.join(caleAbs, "mic");
  console.log("calea mica este ", caleMic);
  console.log("calea medie este ", caleMediu);
  if (!fs.existsSync(caleMediu)) {
    console.log("am creat");
    fs.mkdirSync(caleMediu);
  }

  let copie = obGlobal.obImagini.imagini;
  let c = obGlobal.obImagini;

  //creeaza un folder pentru imaginile medii

  for (let imag of obGlobal.obImagini.imagini) {
    [numeFis, ext] = imag.fisier.split(".");
    let caleAbsFisier = path.join(caleAbs, imag.fisier);
    let caleAbsFisierMediu = path.join(caleMediu, numeFis) + ".webp";

    sharp(caleAbsFisier).resize(400).toFile(caleAbsFisierMediu);
    imag.fisier_mediu =
      "/" +
      path.join(obGlobal.obImagini.cale_galerie, "mediu", numeFis + ".webp");
    imag.fisier = "/" + obGlobal.obImagini.cale_galerie + "/" + imag.fisier;
  }

  if (!fs.existsSync(caleMic)) {
    console.log("Am creat");
    fs.mkdirSync(caleMic);
  }

  for (let imag1 of copie) {
    [a, b, c, d, e] = imag1.fisier.split("/");
    [numeFis1, ext1] = e.split(".");
    console.log(numeFis1);
    let caleAbsFisierM = path.join(caleAbs, e);
    let caleAbsFisierMic = path.join(caleMic, numeFis1) + ".webp";
    sharp(caleAbsFisierM).resize(300).toFile(caleAbsFisierMic);
    imag1.fisier_mic =
      "/" +
      path.join(obGlobal.obImagini.cale_galerie, "mic", numeFis1 + ".webp");
    imag1.fisier = "/" + obGlobal.obImagini.cale_galerie + "/" + e;
  }
}

initializeazaImagini();

function afiseazaEroare(
  res,
  _identificator,
  _titlu = "titlu default",
  _text,
  _imagine
) {
  let vErori = obGlobal.obErori.info_erori;
  let eroare = vErori.find(function (elem) {
    return elem.identificator == _identificator;
  });
  if (eroare) {
    let titlu1 = _titlu == "titlu default" ? eroare.titlu || _titlu : _titlu;
    let text1 = _text || eroare.text;
    let imagine1 = _imagine || eroare.imagine;
    if (eroare.status)
      res.status(eroare.identificator).render("pagini/eroare", {
        titlu: titlu1,
        text: text1,
        imagine: imagine1,
      });
    else
      res.render("pagini/eroare", {
        titlu: titlu1,
        text: text1,
        imagine: imagine1,
      });
  } else {
    let errDef = obGlobal.obErori.eroare_default;
    res.render("pagini/eroare", {
      titlu: errDef.titlu,
      text: errDef.text,
      imagine: obGlobal.obErori.cale_baza + "/" + errDef.imagine,
    });
  }
}

app.listen(8080);
console.log("Serverul a pornit");

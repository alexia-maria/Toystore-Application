const express = require("express");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
var sass = require("sass");
const ejs = require("ejs");
const AccesBD = require("./module_proprii/accesbd.js");
const { Client } = require("pg");
const { Utilizator } = require("./module_proprii/utilizator");
const formidable = require("formidable");
const session = require("express-session");
const Drepturi = require("./module_proprii/drepturi.js");

const QRCode = require("qrcode");
const puppeteer = require("puppeteer");
const mongodb = require("mongodb");
const helmet = require("helmet");
const xmljs = require("xml-js");

const request = require("request");

/*
AccessBD.getInstanta().select(
  {
    tabel: "jucarii",
    campuri: ["nume", "pret"],
    vectorConditii: [
      ["nume = 'Alias'", "pret>120"],
      ["nume = 'Activity'", "pret<300"],
    ],
  },
  function (err, rez) {
    console.log(err);
    console.log(rez);
  }
);*/
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
  protocol: "http://",
  numeDomeniu: "localhost:8080",
  clientMongo: mongodb.MongoClient,
  bdMongo: null,
};

client.query(
  "select * from unnest(enum_range(null::varsta))",
  function (err, rezCategorie) {}
);
console.log("Folder proiect", __dirname);
console.log("Nume fisier", __filename);
console.log("Director de lucru", process.cwd());

var url = "mongodb://localhost:27017"; //pentru versiuni mai vechi de Node
var url = "mongodb://0.0.0.0:27017";

obGlobal.clientMongo.connect(url, function (err, bd) {
  if (err) console.log(err);
  else {
    obGlobal.bdMongo = bd.db("proiect_web");
  }
});

app.use(
  session({
    // aici se creeaza proprietatea session a requestului (pot folosi req.session)
    secret: "abcdefg", //folosit de express session pentru criptarea id-ului de sesiune
    resave: true,
    saveUninitialized: false,
  })
);

vectorFoldere = ["temp", "temp1", "backup", "poze_uploadate"];
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

app.use("/*", function (req, res, next) {
  res.locals.optiuniMeniu = obGlobal.optiuniMeniu;
  res.locals.Drepturi = Drepturi;
  if (req.session.utilizator) {
    req.utilizator = res.locals.utilizator = new Utilizator(
      req.session.utilizator
    );
  }
  next();
});

app.use(["/produse_cos", "/cumpara"], express.json({ limit: "2mb" })); //obligatoriu de setat pt request body de tip json

app.use(["/contact"], express.urlencoded({ extended: true }));

app.use(/^\/resurse(\/[a-zA-Z0-9]*(?!\.)[a-zA-Z0-9]*)*$/, function (req, res) {
  afiseazaEroare(res, 403);
});

app.get("/favicon.ico", function (req, res) {
  res.sendFile(__dirname + "/resurse/imagini/favicon.ico");
});

app.get("/ceva", function (req, res) {
  res.send("altceva");
});

app.get(["/index", "/", "/home", "/login"], async function (req, res) {
  let sir = req.session.mesajLogin;
  req.session.mesajLogin = null;

  res.render("pagini/index", {
    ip: req.ip,
    imagini: obGlobal.obImagini.imagini,
    mesajLogin: sir,
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
    "select * from unnest(enum_range(null::varsta_rec))",
    function (err, rezCategorie) {
      let conditieWhere = "";
      if (req.query.varsta) {
        conditieWhere = ` and varsta = '${req.query.varsta}'`;
      }

      client.query(
        "select * from unnest(enum_range(null::disponibil))",
        function (err, rezDisp) {
          let conditieWhere2 = "";
          if (req.query.disponibilitate) {
            conditieWhere2 = ` and disponibilitate = '${req.query.disponibilitate}'`;
          }

          client.query(
            "select * from unnest(enum_range(null::exped))",
            function (err, rezExped) {
              let conditieWhere3 = "";
              if (req.query.expediere) {
                conditieWhere = ` and expediere = '${req.query.expediere}'`;
              }

              client.query(
                "select * from unnest(enum_range(null::categ_jucarie))",
                function (err, rezJuc) {
                  let conditieWhere4 = "";
                  if (req.query.categorie) {
                    conditieWhere = ` and categorie = '${req.query.categorie}'`;
                  }
                  client.query(
                    "select * from jucarii order by pret asc",
                    function (err, rezPret) {
                      console.log(rezPret);

                      client.query(
                        " select * from jucarii where 1 = 1 " +
                          conditieWhere +
                          conditieWhere2 +
                          conditieWhere3 +
                          conditieWhere4,
                        function (err, rez) {
                          console.log(rezPret.rowCount);
                          console.log(rezPret.rows[0].pret);
                          console.log(rezPret.rows[rezPret.rowCount - 1].pret);
                          console.log(rezExped.rows);
                          console.log(rezJuc.rows);

                          if (err) {
                            console.log(err);
                            afiseazaEroare(res, 2);
                          } else
                            res.render("pagini/produse", {
                              produse: rez.rows,
                              optiuniDatalist: rezDisp.rows,
                              optiuni: rezCategorie.rows,
                              pretMin: rezPret.rows[0].pret,
                              pretMax: rezPret.rows[rezPret.rowCount - 1].pret,
                              optiuniExpediere: rezExped.rows,
                              optiuniCategorie: rezJuc.rows,
                            });
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});
//});
//});

app.get("/produs/:id", function (req, res) {
  console.log(req.params);

  client.query(
    `select * from jucarii where id = ${req.params.id}`,
    function (err, rezultat) {
      if (err) {
        console.log(err);
        afiseazaEroare(res, 2);
      } else res.render("pagini/produs", { prod: rezultat.rows[0] });
    }
  );
});

//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////Cos virtual
app.post("/produse_cos", function (req, res) {
  console.log(req.body);
  if (req.body.ids_prod.length != 0) {
    //TO DO : cerere catre AccesBD astfel incat query-ul sa fi `select nume, descriere, pret, gramaj, imagine from prajituri where id in (lista de id-uri)`
    AccesBD.getInstanta().select(
      {
        tabel: "jucarii",
        campuri: "nume,descriere,pret".split(","),
        vectorConditii: [[`id in (${req.body.ids_prod})`]],
      },
      function (err, rez) {
        if (err) res.send([]);
        else res.send(rez.rows);
      }
    );
  } else {
    res.send([]);
  }
});

cale_qr = __dirname + "/resurse/imagini/qrcode";
if (fs.existsSync(cale_qr))
  fs.rmSync(cale_qr, { force: true, recursive: true });
fs.mkdirSync(cale_qr);
client.query("select id from jucarii", function (err, rez) {
  for (let prod of rez.rows) {
    let cale_prod =
      obGlobal.protocol + obGlobal.numeDomeniu + "/produs/" + prod.id;
    //console.log(cale_prod);
    QRCode.toFile(cale_qr + "/" + prod.id + ".png", cale_prod);
  }
});

async function genereazaPdf(stringHTML, numeFis, callback) {
  const chrome = await puppeteer.launch();
  const document = await chrome.newPage();
  console.log("inainte load");
  await document.setContent(stringHTML, { waitUntil: "load" });

  console.log("dupa load");
  await document.pdf({ path: numeFis, format: "A4" });
  await chrome.close();
  if (callback) callback(numeFis);
}

app.post("/cumpara", function (req, res) {
  console.log(req.body);
  console.log("Utilizator:", req?.utilizator);
  console.log(
    "Utilizator:",
    req?.utilizator?.rol?.areDreptul?.(Drepturi.cumparareProduse)
  );
  console.log(
    "Drept:",
    req?.utilizator?.areDreptul?.(Drepturi.cumparareProduse)
  );
  if (req?.utilizator?.areDreptul?.(Drepturi.cumparareProduse)) {
    AccesBD.getInstanta().select(
      {
        tabel: "jucarii",
        campuri: ["*"],
        vectorConditii: [[`id in (${req.body.ids_prod})`]],
      },
      function (err, rez) {
        if (!err && rez.rowCount > 0) {
          console.log("produse:", rez.rows);
          let rezFactura = ejs.render(
            fs.readFileSync("./views/pagini/factura.ejs").toString("utf-8"),
            {
              protocol: obGlobal.protocol,
              domeniu: obGlobal.numeDomeniu,
              utilizator: req.session.utilizator,
              produse: rez.rows,
            }
          );
          console.log(rezFactura);
          let numeFis = `./temp/factura${new Date().getTime()}.pdf`;
          genereazaPdf(rezFactura, numeFis, function (numeFis) {
            mesajText = `Stimate ${req.session.utilizator.username} aveti mai jos rezFactura.`;
            mesajHTML = `<h2>Stimate ${req.session.utilizator.username},</h2> aveti mai jos rezFactura.`;
            req.utilizator.trimiteMail("Factura", mesajText, mesajHTML, [
              {
                filename: "factura.pdf",
                content: fs.readFileSync(numeFis),
              },
            ]);
            res.send("Totul e bine!");
          });
          rez.rows.forEach(function (elem) {
            elem.cantitate = 1;
          });
          let jsonFactura = {
            data: new Date(),
            username: req.session.utilizator.username,
            produse: rez.rows,
          };
          if (obGlobal.bdMongo) {
            obGlobal.bdMongo
              .collection("facturi")
              .insertOne(jsonFactura, function (err, rezmongo) {
                if (err) console.log(err);
                else console.log("Am inserat factura in mongodb");

                obGlobal.bdMongo
                  .collection("facturi")
                  .find({})
                  .toArray(function (err, rezInserare) {
                    if (err) console.log(err);
                    else console.log(rezInserare);
                  });
              });
          }
        }
      }
    );
  } else {
    res.send("Nu puteti cumpara daca nu sunteti logat sau nu aveti dreptul!");
  }
});

app.get("/grafice", function (req, res) {
  if (
    !(
      req?.session?.utilizator &&
      req.utilizator.areDreptul(Drepturi.vizualizareGrafice)
    )
  ) {
    afisEroare(res, 403);
    return;
  }
  res.render("pagini/grafice");
});

app.get("/update_grafice", function (req, res) {
  obGlobal.bdMongo
    .collection("facturi")
    .find({})
    .toArray(function (err, rezultat) {
      res.send(JSON.stringify(rezultat));
    });
});

app.post("/inregistrare", function (req, res) {
  var username;
  var poza;
  console.log("ceva");
  var formular = new formidable.IncomingForm();
  formular.parse(req, function (err, campuriText, campuriFisier) {
    //4
    console.log("Inregistrare:", campuriText);

    console.log(campuriFisier);
    var eroare = "";

    var utilizNou = new Utilizator();
    try {
      utilizNou.setareNume = campuriText.nume;
      utilizNou.setareUsername = campuriText.username;
      utilizNou.email = campuriText.email;
      utilizNou.setarePrenume = campuriText.prenume;

      utilizNou.parola = campuriText.parola;
      utilizNou.culoare_chat = campuriText.culoare_chat;
      utilizNou.poza = poza;
      Utilizator.getUtilizDupaUsername(
        campuriText.username,
        {},
        function (u, parametru, eroareUser) {
          if (eroareUser == -1) {
            //nu exista username-ul in BD
            utilizNou.salvareUtilizator();
          } else {
            eroare += "Mai exista username-ul";
          }

          if (!eroare) {
            res.render("pagini/inregistrare", {
              raspuns: "Inregistrare cu succes!",
            });
          } else
            res.render("pagini/inregistrare", { err: "Eroare: " + eroare });
        }
      );
    } catch (e) {
      console.log(e);
      eroare += "Eroare site; reveniti mai tarziu";
      console.log(eroare);
      res.render("pagini/inregistrare", { err: "Eroare: " + eroare });
    }
  });
  formular.on("field", function (nume, val) {
    // 1

    console.log(`--- ${nume}=${val}`);

    if (nume == "username") username = val;
  });
  formular.on("fileBegin", function (nume, fisier) {
    //2
    console.log("fileBegin");

    console.log(nume, fisier);
    //TO DO in folderul poze_uploadate facem folder cu numele utilizatorului
    let folderUser = path.join(__dirname, "poze_uploadate", username);
    //folderUser=__dirname+"/poze_uploadate/"+username
    console.log(folderUser);
    if (!fs.existsSync(folderUser)) fs.mkdirSync(folderUser);
    fisier.filepath = path.join(folderUser, fisier.originalFilename);
    poza = fisier.originalFilename;
    //fisier.filepath=folderUser+"/"+fisier.originalFilename
  });
  formular.on("file", function (nume, fisier) {
    //3
    console.log("file");
    console.log(nume, fisier);
  });
});

app.post("/login", function (req, res) {
  var username;
  console.log("ceva");
  var formular = new formidable.IncomingForm();
  formular.parse(req, function (err, campuriText, campuriFisier) {
    Utilizator.getUtilizDupaUsername(
      campuriText.username,
      {
        req: req,
        res: res,
        parola: campuriText.parola,
      },
      function (u, obparam) {
        let parolaCriptata = Utilizator.criptareParola(obparam.parola);
        if (u.parola == parolaCriptata && u.confirmat_mail) {
          u.poza = u.poza
            ? path.join("poze_uploadate", u.username, u.poza)
            : "";
          obparam.req.session.utilizator = u;

          obparam.req.session.mesajLogin = "Bravo! Te-ai logat!";
          obparam.res.redirect("/index");
          //obparam.res.render("/login");
        } else {
          console.log("Eroare logare");
          obparam.req.session.mesajLogin =
            "Date logare incorecte sau nu a fost confirmat mailul!";
          obparam.res.redirect("/index");
        }
      }
    );
  });
});

app.post("/profil", function (req, res) {
  console.log("profil");
  if (!req.session.utilizator) {
    randeazaEroare(res, 403);
    res.render("pagini/eroare_generala", { text: "Nu sunteti logat." });
    return;
  }
  var formular = new formidable.IncomingForm();

  formular.parse(req, function (err, campuriText, campuriFile) {
    var parolaCriptata = Utilizator.criptareParola(campuriText.parola);
    // AccesBD.getInstanta().update(
    //     {tabel:"utilizatori",
    //     campuri:["nume","prenume","email","culoare_chat"],
    //     valori:[`${campuriText.nume}`,`${campuriText.prenume}`,`${campuriText.email}`,`${campuriText.culoare_chat}`],
    //     conditiiAnd:[`parola='${parolaCriptata}'`]
    // },
    AccesBD.getInstanta().updateParametrizat(
      {
        tabel: "utilizatori",
        campuri: ["nume", "prenume", "email", "culoare_chat"],
        valori: [
          `${campuriText.nume}`,
          `${campuriText.prenume}`,
          `${campuriText.email}`,
          `${campuriText.culoare_chat}`,
        ],
        vectorConditii: [
          [`parola='${parolaCriptata}'`, `username='${campuriText.username}'`],
        ],
      },
      function (err, rez) {
        if (err) {
          console.log(err);
          afiseazaEroare(res, 2);
          return;
        }
        console.log(rez.rowCount);
        if (rez.rowCount == 0) {
          res.render("pagini/profil", {
            mesaj: "Update-ul nu s-a realizat. Verificati parola introdusa.",
          });
          return;
        } else {
          //actualizare sesiune
          console.log("ceva");
          req.session.utilizator.nume = campuriText.nume;
          req.session.utilizator.prenume = campuriText.prenume;
          req.session.utilizator.email = campuriText.email;
          req.session.utilizator.culoare_chat = campuriText.culoare_chat;
          res.locals.utilizator = req.session.utilizator;
        }

        res.render("pagini/profil", {
          mesaj: "Update-ul s-a realizat cu succes.",
        });
      }
    );
  });
});

app.get("/useri", function (req, res) {
  if (req?.utilizator?.areDreptul?.(Drepturi.vizualizareUtilizatori)) {
    AccesBD.getInstanta().select(
      { tabel: "utilizatori", campuri: ["*"], vectorConditii: [[]] },
      function (err, rezQuery) {
        console.log(err);
        res.render("pagini/useri", { useri: rezQuery.rows });
      }
    );
  } else {
    afiseazaEroare(res, 403);
  }
});

app.post("/sterge_utiliz", function (req, res) {
  if (req?.utilizator?.areDreptul?.(Drepturi.stergereUtilizatori)) {
    var formular = new formidable.IncomingForm();

    formular.parse(req, function (err, campuriText, campuriFile) {
      AccesBD.getInstanta().delete(
        {
          tabel: "utilizatori",
          vectorConditii: [[`id=${campuriText.id_utiliz}`]],
        },
        function (err, rezQuery) {
          console.log(err);
          res.redirect("/useri");
        }
      );
    });
  } else {
    afisareEroare(res, 403);
  }
});

app.get("/logout", function (req, res) {
  req.session.destroy();
  res.locals.utilizator = null;
  res.render("pagini/logout");
});

//http://${Utilizator.numeDomeniu}/cod/${utiliz.username}/${token}
app.get("/cod/:username/:token", function (req, res) {
  console.log(req.params);
  try {
    Utilizator.getUtilizDupaUsername(
      req.params.username,
      { res: res, token: req.params.token },
      function (u, obparam) {
        AccesBD.getInstanta().update(
          {
            tabel: "utilizatori",
            campuri: { confirmat_mail: "true" },
            vectorConditii: [[`cod='${obparam.token}'`]],
          },
          function (err, rezUpdate) {
            if (err || rezUpdate.rowCount == 0) {
              console.log("Cod:", err);
              afisareEroare(res, 3);
            } else {
              res.render("pagini/confirmare.ejs");
            }
          }
        );
      }
    );
  } catch (e) {
    console.log(e);
    renderError(res, 2);
  }
});

app.get("/*.ejs", function (req, res) {
  afisareEroare(res, 400);
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
/*
document.getElementById("adauga").onclick = function () {
  var p = document.createElement("p");
  p.innerHTML = "ceva";
  // document.body.appendChild(p);
  document.body.insertBefore(p, this);
  document.body.appendChild(document.getElementById("de_mutat"));

  document.getElementById("sterge").onclick = function () {
    let paragrafe = document.getElementsByTagName("p");
    if (paragrafe.length) {
      let ultimul = paragrafe[paragrafe.lenght - 1];
      ultimul.remove();
    }
  };
};
*/
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

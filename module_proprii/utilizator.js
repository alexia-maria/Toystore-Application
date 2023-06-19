const AccesBD = require("./accesbd.js");
const parole = require("./parole.js");

const { RolFactory } = require("./roluri.js");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

class Utilizator {
  static tipConexiune = "local";
  static tabel = "utilizatori";
  static parolaCriptare = "tehniciweb";
  static emailServer = "am3200394@gmail.com";
  static lungimeCod = 64;
  static numeDomeniu = "localhost:8080";
  #eroare;

  constructor({
    id,
    username,
    nume,
    prenume,
    email,
    parola,
    rol,
    culoare_chat = "black",
    poza,
  } = {}) {
    this.id = id;

    //optional sa facem asta in constructor
    try {
      if (this.checkUsername(username)) this.username = username;
    } catch (e) {
      this.#eroare = e.message;
    }

    for (let prop in arguments[0]) {
      this[prop] = arguments[0][prop];
    }
    if (this.rol)
      this.rol = this.rol.cod
        ? RolFactory.creeazaRol(this.rol.cod)
        : RolFactory.creeazaRol(this.rol);
    console.log(this.rol);

    this.#eroare = "";
  }
  /**
   *
   * @param {string} nume numele introdus de utilizator
   * @returns {boolean} true daca nu contine decat caracterele pe care ni le dorim(litere ale alfabetului), false altfel
   */
  checkName(nume) {
    // return nume != "" && nume.match(new RegExp("^[A-Z][a-z] ?-*?[a-z]?+$/gm"));
    return nume != "" && nume.match(new RegExp("^[A-Z][a-z]+$"));
  }

  set setareNume(nume) {
    if (this.checkName(nume)) this.nume = nume;
    else {
      throw new Error("Nume gresit");
    }
  }

  checkName(prenume) {
    // return (
    //  prenume != "" && prenume.match(new RegExp("^[A-Z][a-z] ?-*?[a-z]?+$/gm"))
    return prenume != "" && prenume.match(new RegExp("^[A-Z][a-z]+$"));
    //  );
  }

  set setarePrenume(prenume) {
    if (this.checkName(prenume)) this.prenume = prenume;
    else {
      throw new Error("Prenume gresit");
    }
  }

  /*
   * folosit doar la inregistrare si modificare profil
   */
  set setareUsername(username) {
    if (this.checkUsername(username)) this.username = username;
    else {
      throw new Error("Username gresit");
    }
  }
  /**
   *
   * @param {string} username
   * @returns {boolean} true daca nu contine decat caracterele pe care ni le dorim, false altfel
   */
  checkUsername(username) {
    return username != "" && username.match(new RegExp("^[A-Za-z0-9#_./]+$"));
  }

  /**
   *
   * @param {string} parola parola care trebuie criptata
   * @returns {string} parola rezultata in urma criptarii
   */

  static criptareParola(parola) {
    return crypto
      .scryptSync(parola, Utilizator.parolaCriptare, Utilizator.lungimeCod)
      .toString("hex");
  }

  salvareUtilizator() {
    let parolaCriptata = Utilizator.criptareParola(this.parola);
    let utiliz = this;
    let token = parole.genereazaToken(100);
    AccesBD.getInstanta(Utilizator.tipConexiune).insert(
      {
        tabel: Utilizator.tabel,
        campuri: {
          username: this.username,
          nume: this.nume,
          prenume: this.prenume,
          parola: parolaCriptata,
          email: this.email,
          culoare_chat: this.culoare_chat,
          cod: token,
          poza: this.poza,
        },
      },
      function (err, rez) {
        if (err) console.log(err);

        utiliz.trimiteMail(
          "Cont nou",
          "Bine ai venit in comunitatea Funtopia. Username-ul tau este " +
            utiliz.username,
          `<h1>Bine ai venit in comunitatea Funtopia!</h1><div>Username-ul tau este<p style='color:green'><b>${utiliz.username}.<b><p></div> <p><a href='http://${Utilizator.numeDomeniu}/cod/${utiliz.username}/${token}'>Click aici pentru confirmare</a></p>`
        );
      }
    );
  }
  //xjxwhotvuuturmqm
  /**
   *
   * @param {string} subiect
   * @param {string} mesajText
   * @param {string} mesajHtml
   * @param {Array} atasamente
   */
  async trimiteMail(subiect, mesajText, mesajHtml, atasamente = []) {
    var transp = nodemailer.createTransport({
      service: "gmail",
      secure: false,
      auth: {
        //date login
        user: Utilizator.emailServer,
        pass: "ukisbvgowfzalahc",
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    //genereaza html
    await transp.sendMail({
      from: Utilizator.emailServer,
      to: this.email, //TO DO
      subject: subiect, //"Te-ai inregistrat cu succes",
      text: mesajText, //"Username-ul tau este "+username
      html: mesajHtml, // `<h1>Salut!</h1><p style='color:blue'>Username-ul tau este ${username}.</p> <p><a href='http://${numeDomeniu}/cod/${username}/${token}'>Click aici pentru confirmare</a></p>`,
      attachments: atasamente,
    });
    console.log("trimis mail");
  }
  /**
   *
   * @param {string} username username-ul pe care il cautam
   * @returns {Object}
   */
  static async getUtilizDupaUsernameAsync(username) {
    if (!username) return null;
    try {
      let rezSelect = await AccesBD.getInstanta(
        Utilizator.tipConexiune
      ).selectAsync({
        tabel: "utilizatori",
        campuri: ["*"],
        vectorConditii: [[`username='${username}'`]],
      });
      if (rezSelect.rowCount != 0) {
        return new Utilizator(rezSelect.rows[0]);
      } else {
        console.log("getUtilizDupaUsernameAsync: Nu am gasit utilizatorul");
        return null;
      }
    } catch (e) {
      console.log(e);
      return null;
    }
  }
  /**
   *
   * @param {string} username username-ul cautat
   * @param {Object} obparam un obiect care are anumite campuri setate
   * @param {function} proceseazaUtiliz o functie callback care verifica daca parametrii setati ai obiectului transmis ca parametru corespund username-ului dorit
   * @returns daca nu apar erori apeleaza functia callback
   */
  static getUtilizDupaUsername(username, obparam, proceseazaUtiliz) {
    if (!username) return null;
    let eroare = null;
    AccesBD.getInstanta(Utilizator.tipConexiune).select(
      {
        tabel: "utilizatori",
        campuri: ["*"],
        vectorConditii: [[`username='${username}'`]],
      },
      function (err, rezSelect) {
        let u = null;
        if (err) {
          console.error("Utilizator:", err);
          console.log("Utilizator", rezSelect.rows.length);
          //throw new Error()
          eroare = -2;
        } else if (rezSelect.rowCount == 0) {
          eroare = -1;
        } else {
          //constructor({id, username, nume, prenume, email, rol, culoare_chat="black", poza}={})
          u = new Utilizator(rezSelect.rows[0]);
        }
        proceseazaUtiliz(u, obparam, eroare);
      }
    );
  }

  areDreptul(drept) {
    return this.rol.areDreptul(drept);
  }
}
module.exports = { Utilizator: Utilizator };

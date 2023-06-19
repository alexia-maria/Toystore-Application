function setCookie(nume, val, timpExpirare) {
  //timpExpirare in milisecunde
  d = new Date();
  d.setTime(d.getTime() + timpExpirare);
  document.cookie = `${nume}=${val}; expires=${d.toUTCString()}`;
}

function getCookie(nume) {
  vectorParametri = document.cookie.split(";"); // ["a=10","b=ceva"]
  for (let param of vectorParametri) {
    if (param.trim().startsWith(nume + "=")) return param.split("=")[1];
  }
  return null;
}

function replaceAtIndex(character, word, index) {
  var tempStr = "";

  for (var i = 0; i < word.length; i++) {
    if (i == index) {
      tempStr += character;
    } else {
      tempStr += word[i];
    }
  }

  return tempStr;
}

window.addEventListener("load", function () {
  let iduriProduse = localStorage.getItem("cos_virtual");
  iduriProduse = iduriProduse ? iduriProduse.split(",") : []; //["3","1","10","4","2"]

  for (let idp of iduriProduse) {
    let ch = document.querySelector(`[value='${idp}'].select-cos`);
    if (ch) {
      ch.checked = true;
    } else {
      console.log("id cos virtual inexistent:", idp);
    }
  }

  //----------- adaugare date in cosul virtual (din localStorage)
  let checkboxuri = document.getElementsByClassName("select-cos");
  for (let ch of checkboxuri) {
    ch.onchange = function () {
      let iduriProduse = localStorage.getItem("cos_virtual");
      iduriProduse = iduriProduse ? iduriProduse.split(",") : [];

      if (this.checked) {
        iduriProduse.push(this.value);
      } else {
        let poz = iduriProduse.indexOf(this.value);
        if (poz != -1) {
          iduriProduse.splice(poz, 1);
        }
      }

      localStorage.setItem("cos_virtual", iduriProduse.join(","));
    };
  }
  document.getElementById("inp-pret").oninput = function () {
    document.getElementById("infoRange").innerHTML = `(${this.value})`;
  };
  function filtrare() {
    if (/^[A-Za-z]*$/.test(document.getElementById("i_textarea").value)) {
      document.getElementById("i_textarea").classList.remove("is-invalid");
    } else {
      document.getElementById("i_textarea").classList.add("is-invalid");
    }
    let val_desc = document.getElementById("inp-descriere").value.toLowerCase();

    console.log("Dupa prelucrare ", val_desc);
    let val_nrjuc;
    let gr_radio = document.getElementsByName("gr_rad");

    for (let r of gr_radio) {
      if (r.checked) {
        val_nrjuc = r.value;
        break;
      }
    }

    let gr_check = document.getElementsByName("nou-check");
    console.log(gr_check);

    let val_exped = [];
    let i = 0;

    /*  for (let ch of gr_check) {
      if (ch.checked) {
        val_exped[i] = ch.value;
        i++;
      }
    } */

    let val_pret = document.getElementById("inp-pret").value;

    let val_categ = document.getElementById("inp-categorie").value;

    let val_dispo = document.getElementById("i_datalist").value;

    let val_textarea = document.getElementById("i_textarea").value;

    var produse = document.getElementsByClassName("produs");

    let val_jucarie = [];
    for (var o of document.getElementById("inp-jucarie").options) {
      if (o.selected) {
        val_jucarie.push(o.value);
      }
    }

    if (!/^[A-Za-zț]*$/.test(document.getElementById("inp-descriere").value)) {
      alert("In campul descriere puteti introduce doar litere");
      document.getElementById("inp-descriere").value = "toate";
    }

    for (let i = 1; i <= val_desc.length; i++) {
      if (val_desc[i] == "ș") {
        val_desc = replaceAtIndex("s", val_desc, i);
      }

      if (val_desc[i] == "ă" || val_desc[i] == "â") {
        val_desc = replaceAtIndex("a", val_desc, i);
      }

      if (val_desc[i] == "ț") {
        console.log("!!!!!!!!");
        val_desc = replaceAtIndex("t", val_desc, i);
        console.log(val_desc[i]);
      }
    }

    for (let prod of produse) {
      prod.style.display = "none";
      let cond1;
      if (val_desc == "toate") {
        cond1 = true;
      } else {
        let descriere = prod
          .getElementsByClassName("val-descriere")[0]
          .innerHTML.toLowerCase();
        console.log("Descrierea din baza " + descriere);
        console.log(val_desc);
        cond1 = descriere.includes(val_desc);
      }

      let cond2 = true;

      if (val_nrjuc != "toate") {
        [nra, nrb] = val_nrjuc.split(":");
        nra = parseInt(nra);
        nrb = parseInt(nrb);
        let nrjuc = parseInt(
          prod.getElementsByClassName("val-nrjuc")[0].innerHTML
        );

        cond2 = nra <= nrjuc && nrjuc <= nrb;
      }

      let pret = parseInt(prod.getElementsByClassName("val-pret")[0].innerHTML);

      let categorie = prod.getElementsByClassName("val-varsta")[0].innerHTML;

      cond3 = val_pret <= pret;

      let cond4 = val_categ == categorie || val_categ == "toate";

      let dispo = prod
        .getElementsByClassName("val-disponibil")[0]
        .innerHTML.toLowerCase();

      let cond5 = dispo.startsWith(val_dispo);

      let cond6 = true;

      /*  if (!val_exped.includes("toate")) {
        let exped = prod.getElementsByClassName("val-expediere")[0].innerHTML;
        cond6 = val_exped.includes(exped);
      }*/
      for (let ch of gr_check)
        if (ch.checked) {
          console.log("heiiiiiiiiii");
          let data = prod.getElementsByClassName("val-adaugare")[0].innerHTML;
          let data2 = new Date("6/01/2023");
          console.log(data);
          console.log(data2);
          if (data < data2) {
            cond6 = false;
          }
        }

      let cond7;
      if (val_textarea == "orice") {
        cond7 = true;
      } else {
        let textarea = prod.getElementsByClassName("val-nume")[0].innerHTML;

        cond7 = textarea.startsWith(val_textarea);
      }

      let jucarie = prod.getElementsByClassName("val-categorie")[0].innerHTML;

      let cond8;
      if (val_jucarie.includes("toate")) {
        cond8 = true;
      } else {
        cond8 = val_jucarie.includes(jucarie);
      }
      if (
        cond1 &&
        cond2 &&
        cond3 &&
        cond4 &&
        cond5 &&
        cond6 &&
        cond7 &&
        cond8
      ) {
        prod.style.display = "block";
      }
    }
  }

  document.getElementById("inp-descriere").onchange = filtrare;
  document.getElementById("inp-descriere").onkeyup = filtrare;
  document.getElementById("butoane").onchange = filtrare;
  document.getElementById("inp-pret").onchange = filtrare;
  document.getElementById("inp-categorie").onchange = filtrare;
  document.getElementById("inp-jucarie").onchange = filtrare;
  document.getElementById("i_datalist").onchange = filtrare;
  document.getElementsByName("nou").onchange = filtrare;
  document.getElementById("i_textarea").onchange = filtrare;
  document.getElementById("i_textarea").onkeyup = filtrare;
  document.getElementById("filtrare").onclick = filtrare;

  document.getElementById("resetare").onclick = function () {
    if (confirm("Sunteti sigur ca doriti sa resetati filtrele?")) {
      document.getElementById("inp-descriere").value = "";

      document.getElementById("inp-pret").value =
        document.getElementById("inp-pret").min;
      document.getElementById("inp-categorie").value = "toate";
      document.getElementById("i_rad4").checked = true;
      var produse = document.getElementsByClassName("produs");
      document.getElementById("infoRange").innerHTML = "(0)";
    } else {
      let p = document.createElement("p");
      p.innerHTML = "Resetare incompleta";
      p.id = "info-reset";
      let ps = document.getElementById("p-suma");
      container = ps.parentNode;
      let frate = ps.nextElementSibling;
      container.insertBefore(p, frate);

      setTimeout(function () {
        let info = document.getElementById("info-reset");
        if (info) {
          info.remove();
        }
      }, 1000);
    }
  };
  function sortare(semn) {
    var produse = document.getElementsByClassName("produs");
    var v_produse = Array.from(produse);
    v_produse.sort(function (a, b) {
      let nume_a = a.getElementsByClassName("val-nume")[0].innerHTML;
      let nume_b = b.getElementsByClassName("val-nume")[0].innerHTML;

      if (nume_a.localeCompare(nume_b) == 0) {
        let pret_a = parseFloat(
          a.getElementsByClassName("val-pret")[0].innerHTML
        );
        let pret_b = parseFloat(
          b.getElementsByClassName("val-nume")[0].innerHTML
        );

        let juc_a = parseFloat(
          a.getElementsByClassName("val-nrjuc")[0].innerHTML
        );
        let juc_b = parseFloat(
          b.getElementsByClassName("val-nrjuc")[0].innerHTML
        );

        let rap_a = pret_a / juc_a;
        let rap_b = pret_b / juc_b;
        return semn * (rap_a - rap_b);
      }
      return semn * nume_a.localeCompare(nume_b);
    });
    for (let prod of v_produse) {
      prod.parentElement.appendChild(prod);
    }
  }
  document.getElementById("sortCrescNume").onclick = function () {
    sortare(1);
  };
  document.getElementById("sortDescrescNume").onclick = function () {
    sortare(-1);
  };

  //document.getElementById("ok2").onclick = checkCookie;

  window.onkeydown = function (e) {
    if (document.getElementById("info-suma")) {
      return;
    }
    if (e.key == "c" && e.altKey) {
      var produse = document.getElementsByClassName("produs");
      let suma = 0;
      for (let prod of produse) {
        if (prod.style.display != "none") {
          let pret = parseFloat(
            prod.getElementsByClassName("val-pret")[0].innerHTML
          );
          suma = suma + pret;
        }
      }

      let div = document.createElement("div");
      div.innerHTML = suma;
      div.id = "info-suma";
      let ps = document.getElementById("p-suma");
      container = ps.parentNode;
      let frate = ps.nextElementSibling;
      container.insertBefore(div, frate);

      setTimeout(function () {
        let info = document.getElementById("info-suma");
        if (info) {
          info.remove();
        }
      }, 2000);
    }
  };
});

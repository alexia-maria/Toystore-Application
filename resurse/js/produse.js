window.addEventListener("load", function () {
  document.getElementById("inp-pret").oninput = function () {
    document.getElementById("infoRange").innerHTML = `(${this.value})`;
  };
  function filtrare() {
    console.log("!!!!!!!!!!!!!!");
    console.log(document.getElementById("i_textarea").value);
    if (/^[A-Za-z]*$/.test(document.getElementById("i_textarea").value)) {
      document.getElementById("i_textarea").classList.remove("is-invalid");
    } else {
      document.getElementById("i_textarea").classList.add("is-invalid");
    }
    let val_nume = document.getElementById("inp-nume").value.toLowerCase();
    let val_nrjuc;
    let gr_radio = document.getElementsByName("gr_rad");

    for (let r of gr_radio) {
      if (r.checked) {
        val_nrjuc = r.value;
        break;
      }
    }

    let gr_check = document.getElementsByName("gr_chck");

    let val_exped = [];
    let i = 0;

    for (let ch of gr_check) {
      if (ch.checked) {
        console.log("E bifat");
        val_exped[i] = ch.value;
        i++;
      }
    }

    let val_pret = document.getElementById("inp-pret").value;
    console.log(val_pret);
    let val_categ = document.getElementById("inp-categorie").value;

    let val_dispo = document.getElementById("i_datalist").value;

    let val_textarea = document.getElementById("i_textarea").value;

    console.log(val_categ);
    console.log(document.getElementById("infoRange").innerHTML);

    var produse = document.getElementsByClassName("produs");

    let val_jucarie = [];
    for (var o of document.getElementById("inp-jucarie").options) {
      if (o.selected) {
        val_jucarie.push(o.value);
      }
    }

    for (let prod of produse) {
      prod.style.display = "none";
      let nume = prod
        .getElementsByClassName("val-nume")[0]
        .innerHTML.toLowerCase();

      let cond1 = nume.startsWith(val_nume);

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

      if (!val_exped.includes("toate")) {
        let exped = prod.getElementsByClassName("val-expediere")[0].innerHTML;
        cond6 = val_exped.includes(exped);
        console.log(exped);
        console.log(val_exped);
        console.log(cond6);
      }

      console.log(cond6);

      let cond7;
      if (val_textarea == "orice") {
        cond7 = true;
      } else {
        let textarea = prod.getElementsByClassName("val-culoare")[0].innerHTML;

        cond7 = val_textarea.startsWith(textarea);
      }

      let jucarie = prod.getElementsByClassName("val-categorie")[0].innerHTML;
      console.log(jucarie);

      let cond8;
      if (val_jucarie.includes("toate")) {
        cond8 = true;
      } else {
        cond8 = val_jucarie.includes(jucarie);
      }
      console.log(cond7);
      console.log(val_textarea);

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

  document.getElementById("inp-nume").onchange = filtrare;
  document.getElementById("inp-nume").onkeyup = filtrare;
  document.getElementById("butoane").onchange = filtrare;
  document.getElementById("inp-pret").onchange = filtrare;
  document.getElementById("inp-categorie").onchange = filtrare;
  document.getElementById("inp-jucarie").onchange = filtrare;
  document.getElementById("i_datalist").onchange = filtrare;
  document.getElementsByName("gr_chck").onchange = filtrare;
  document.getElementById("i_textarea").onchange = filtrare;
  document.getElementById("i_textarea").onkeyup = filtrare;
  document.getElementById("filtrare").onclick = filtrare;

  document.getElementById("resetare").onclick = function () {
    document.getElementById("inp-nume").value = "";

    document.getElementById("inp-pret").value =
      document.getElementById("inp-pret").min;
    document.getElementById("inp-categorie").value = "toate";
    document.getElementById("i_rad4").checked = true;
    var produse = document.getElementsByClassName("produs");
    document.getElementById("infoRange").innerHTML = "(0)";
    for (let prod of produse) {
      prod.style.display = "block";
    }
  };
  function sortare(semn) {
    var produse = document.getElementsByClassName("produs");
    var v_produse = Array.from(produse);
    v_produse.sort(function (a, b) {
      let pret_a = parseFloat(
        a.getElementsByClassName("val-pret")[0].innerHTML
      );
      let pret_b = parseFloat(
        b.getElementsByClassName("val-pret")[0].innerHTML
      );
      if (pret_a == pret_b) {
        let nume_a = a.getElementsByClassName("val-nume")[0].innerHTML;
        let nume_b = b.getElementsByClassName("val-nume")[0].innerHTML;
        return semn * nume_a.localeCompare(nume_b);
      }
      return semn * (pret_a - pret_b);
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

  window.onkeydown = function (e) {
    console.log(e);
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

      let p = document.createElement("p");
      p.innerHTML = suma;
      p.id = "info-suma";
      let ps = document.getElementById("p-suma");
      container = ps.parentNode;
      let frate = ps.nextElementSibling;
      container.insertBefore(p, frate);

      setTimeout(function () {
        let info = document.getElementById("info-suma");
        if (info) {
          info.remove();
        }
      }, 2000);
    }
  };
});

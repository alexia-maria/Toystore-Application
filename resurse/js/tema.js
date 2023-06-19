tema = localStorage.getItem("tema");
let arrayT = ["light", "holiday", "valentine"];
let temaAnt = "light";
console.log(tema);

window.addEventListener("DOMContentLoaded", function () {
  this.document.body.classList.add("light");
  document.getElementById("sel-tema").onclick = function () {
    let val_tema = document.getElementById("sel-tema").value;
    console.log("tema noua " + val_tema);
    console.log("tema veche " + temaAnt);
    document.body.classList.remove(temaAnt);
    localStorage.removeItem(temaAnt);

    document.body.classList.add(val_tema);
    localStorage.setItem(tema, val_tema);

    temaAnt = val_tema;

    /* if (i <= 1) {
      console.log("am ajuns la tema ", arrayT[i]);
      document.body.classList.remove(arrayT[i]);
      localStorage.removeItem("tema");
      i++;
      document.body.classList.add(arrayT[i]);
      localStorage.setItem(tema, arrayT[i]);
      console.log("am ajuns la tema 2 ", arrayT[i]);
    } else {
      console.log("am ajuns la tema ", arrayT[i]);
      document.body.classList.remove(arrayT[i]);
      localStorage.removeItem("tema");
      i = 0;
      document.body.classList.add(arrayT[i]);
      localStorage.setItem(tema, arrayT[i]);
    }
    /*  if (document.body.classList.contains("valentine")) {
      document.body.classList.remove("valentine");
      localStorage.removeItem("tema");
    } else {
      document.body.classList.add("valentine");
      localStorage.setItem(tema, "valentine");
    }*/
  };
});

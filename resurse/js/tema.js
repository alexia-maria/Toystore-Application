tema = localStorage.getItem("tema");
let arrayT = ["light", "holiday", "valentine"];
console.log(tema);

window.addEventListener("DOMContentLoaded", function () {
  let i = 0;
  document.getElementById("tema").onclick = function () {
    if (i <= 1) {
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

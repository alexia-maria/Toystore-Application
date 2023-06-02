window.addEventListener("DOMContentLoaded", function () {
  acc = localStorage.getItem("collapseThree");
  if (acc == "show") {
    document.getElementById("collapseThree").classList.add("show");
  }
  /*
  document.getElementById("buton_ac").onclick = function () {
    console.log(document.getElementById("buton_ac").classList);
    document.getElementById("collapseThree").classList.toggle("show");
  };*/
  document.getElementById("buton_ac").onclick = function () {
    if (document.getElementById("collapseThree").classList.contains("show")) {
      document.getElementById("collapseThree").classList.remove("show");
      localStorage.removeItem("collapseThree");
    } else {
      document.getElementById("collapseThree").classList.add("show");
      localStorage.setItem("collapseThree", "show");
      console.log(acc);
    }
  };
});

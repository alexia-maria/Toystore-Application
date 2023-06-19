window.onload = function () {
  var formular = document.getElementById("form_inreg");
  var elem = document.getElementsByTagName("input");
  console.log(elem);
  if (formular) {
    formular.onclick = function () {
      console.log(document.getElementById("inp-nume"));
    };
    formular.onsubmit = function () {
      if (
        document.getElementById("parl").value !=
        document.getElementById("rparl").value
      ) {
        alert(
          'Nu ati introdus acelasi sir pentru campurile "parola" si "reintroducere parola".'
        );
        return false;
      }

      if (document.getElementById("parl").value.length <= 2) {
        alert("Parola introdusa trebuie sa contina cel putin 3 caractere");
        return false;
      }

      if (!document.getElementById("inp-email").value.includes("@gmail.com")) {
        alert("Nu ati introdus o adresa de email corecta");
        return false;
      }

      if (
        !document
          .getElementById("inp-nume")
          .value.match(new RegExp("^[A-Z][a-z]+$"))
      ) {
        alert("Campul nume trebuie sa contina doar litere mari si mici.");
        return false;
      }

      if (
        !document
          .getElementById("inp-prenume")
          .value.match(new RegExp("^[A-Z][a-z]+$"))
      ) {
        alert("Campul prenume trebuie sa contina doar litere mari si mici.");
        return false;
      }

      for (let e of elem) {
        if (e.required) {
          if (!e.value) {
            alert("Nu ati completat toate campurile obligatorii");
            return false;
          }
        }
      }

      return true;
    };
  }
};

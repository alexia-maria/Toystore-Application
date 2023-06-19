class Produs {
  /**
     * @typedef {object} ObiectProdus - obiect care contine toate proprietatile unui produs, destructurate
     * 
     * /

    /**
     * Returneaza instanta unica a clasei
     *
     * @param {ObiectConexiune} un obiect cu datele pentru query
     * @returns {AccesBD}
     */
  constructor({
    id,
    nume,
    descriere,
    pret,
    gramaj,
    tip_produs,
    calorii,
    categorie,
    ingrediente,
    pt_diabetici,
    imagine,
    data_adaugare,
  } = {}) {
    for (let prop in arguments[0]) {
      this[prop] = arguments[0][prop];
    }
  }
}

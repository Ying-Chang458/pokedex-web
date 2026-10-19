
let pokemones = [];
let cantidadCargada = 0;
let totalPokemones = 0;
let tipoSeleccionado = "all";
let juegoActual = null;
let cargando = false;


const nombresTipos = {
    normal: "Normal", fire: "Fuego", water: "Agua", grass: "Planta",
    electric: "Eléctrico", ice: "Hielo", fighting: "Lucha", poison: "Veneno",
    ground: "Tierra", flying: "Volador", psychic: "Psíquico", bug: "Bicho",
    rock: "Roca", ghost: "Fantasma", dragon: "Dragón", dark: "Siniestro",
    steel: "Acero", fairy: "Hada"
};
const nombresEstadisticas = {
    hp: "PS", attack: "Ataque", defense: "Defensa",
    "special-attack": "Ataque especial", "special-defense": "Defensa especial",
    speed: "Velocidad"
};

function imagenPokemon(pokemon) {
   
    return pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default || "";
}

function mostrarCargando(mostrar) {
    document.getElementById("cargando").classList.toggle("oculto", !mostrar);
}

async function obtenerPokemones() {
    if (cargando || (totalPokemones > 0 && cantidadCargada >= totalPokemones)) {
        return;
    }

    cargando = true;
    let boton = document.getElementById("botonCargar");
    boton.disabled = true;
    boton.textContent = "Cargando...";
    mostrarCargando(true);
    document.getElementById("mensajeEstado").classList.add("oculto");

    try {
        let url = "https://pokeapi.co/api/v2/pokemon?limit=20&offset=" + cantidadCargada;
        let response = await fetch(url);
        if (!response.ok) throw new Error("Error al obtener la lista");
        let data = await response.json();

        // Cada enlace trae los tipos, habilidades y estadísticas del Pokémon.
        let promesas = data.results.map(async function (pokemon) {
            let respuesta = await fetch(pokemon.url);
            if (!respuesta.ok) throw new Error("Error al obtener un Pokémon");
            return await respuesta.json();
        });
        let nuevosPokemones = await Promise.all(promesas);

        pokemones = pokemones.concat(nuevosPokemones);
        cantidadCargada += nuevosPokemones.length;
        totalPokemones = data.count;
        mostrarPokemones();

       
        if (juegoActual === null && pokemones.length > 0) {
            nuevoJuego();
        }
    } catch (error) {
        document.getElementById("mensajeEstado").textContent =
            "No se pudieron cargar los Pokémon. Comprueba tu internet y vuelve a intentarlo.";
        document.getElementById("mensajeEstado").classList.remove("oculto");
        console.error(error);
    } finally {
        cargando = false;
        mostrarCargando(false);
        boton.disabled = totalPokemones > 0 && cantidadCargada >= totalPokemones;
        boton.textContent = boton.disabled ? "¡Ya cargaste todos!" : "Cargar 20 Pokémon más ↓";
    }
}

function mostrarPokemones() {
    let texto = document.getElementById("buscador").value.toLowerCase().trim();
    let filtrados = pokemones.filter(function (pokemon) {
        let coincideNombre = pokemon.name.replaceAll("-", " ").includes(texto) || pokemon.name.includes(texto);
        let coincideTipo = tipoSeleccionado === "all" ||
            pokemon.types.some(function (dato) { return dato.type.name === tipoSeleccionado; });
        return coincideNombre && coincideTipo;
    });

    let inicio_html = '<div id="container-grid">';
    let contenido_html = "";
    let fin_html = "</div>";

    filtrados.forEach(function (pokemon) {
        let tipoPrincipal = pokemon.types[0].type.name;
        let etiquetas = "";
        pokemon.types.forEach(function (dato) {
            let tipo = dato.type.name;
            etiquetas += `<span class="etiqueta-tipo ${tipo}">${nombresTipos[tipo] || tipo}</span>`;
        });

        contenido_html += `
            <button class="item-grid tipo-${tipoPrincipal}" onclick="abrirDetalles(${pokemon.id})" type="button" aria-label="Ver detalles de ${pokemon.name}">
                <span class="numero-pokemon">#${String(pokemon.id).padStart(4, "0")}</span>
                <span class="imagen-fondo">
                    <img src="${imagenPokemon(pokemon)}" alt="${pokemon.name}" loading="lazy">
                </span>
                <strong class="nombre-pokemon">${pokemon.name.replaceAll("-", " ")}</strong>
                <span class="tipos-pokemon">${etiquetas}</span>
            </button>`;
    });

    let resultado = inicio_html + contenido_html + fin_html;
    document.getElementById("contenido").innerHTML = resultado;
    document.getElementById("contador").textContent = pokemones.length + " Pokémon cargados";
    document.getElementById("resultadoTexto").textContent = filtrados.length + " mostrados";

    // Mensaje si la búsqueda o el filtro no tiene resultados.
    let mensaje = document.getElementById("mensajeEstado");
    if (filtrados.length === 0 && pokemones.length > 0) {
        mensaje.textContent = "¡Ups! No encontramos ese Pokémon entre los que has cargado. Prueba otro nombre o tipo.";
        mensaje.classList.remove("oculto");
    } else {
        mensaje.classList.add("oculto");
    }
}

function filtrarTipo(tipo, boton) {
    tipoSeleccionado = tipo;
    document.querySelectorAll(".filtro").forEach(function (filtro) {
        filtro.classList.remove("activo");
    });
    boton.classList.add("activo");
    mostrarPokemones();
}


function abrirDetalles(id) {
    let pokemon = pokemones.find(function (dato) { return dato.id === id; });
    if (!pokemon) return;

    let tipos = "";
    pokemon.types.forEach(function (dato) {
        let tipo = dato.type.name;
        tipos += `<span class="etiqueta-tipo ${tipo}">${nombresTipos[tipo] || tipo}</span>`;
    });

    let habilidades = pokemon.abilities.map(function (dato) {
        return dato.ability.name.replaceAll("-", " ");
    }).join(", ");

    let estadisticas = "";
    pokemon.stats.forEach(function (dato) {
        let nombre = nombresEstadisticas[dato.stat.name] || dato.stat.name;
        let cantidad = dato.base_stat;
        let porcentaje = Math.min(cantidad / 200 * 100, 100);
        estadisticas += `
            <div class="estadistica">
                <div class="estadistica-texto"><span>${nombre}</span><strong>${cantidad}</strong></div>
                <div class="barra-estadistica"><div style="width: ${porcentaje}%"></div></div>
            </div>`;
    });

    document.getElementById("detalleContenido").innerHTML = `
        <div class="detalle-cabecera">
            <span class="detalle-numero">#${String(pokemon.id).padStart(4, "0")}</span>
            <div><img src="${imagenPokemon(pokemon)}" alt="${pokemon.name}"></div>
            <h2>${pokemon.name.replaceAll("-", " ")}</h2>
            <div class="tipos-pokemon">${tipos}</div>
        </div>
        <div class="detalle-datos">
            <div class="dato"><small>Altura</small><strong>${pokemon.height / 10} m</strong></div>
            <div class="dato"><small>Peso</small><strong>${pokemon.weight / 10} kg</strong></div>
        </div>
        <p class="detalle-habilidades"><strong>Habilidades:</strong> ${habilidades}</p>
        <div class="detalle-estadisticas"><h3>Estadísticas</h3>${estadisticas}</div>`;

    document.getElementById("ventanaDetalles").showModal();
}

function cerrarDetalles() {
    document.getElementById("ventanaDetalles").close();
}

// Minijuego: selecciona al azar un Pokémon ya cargado.
function nuevoJuego() {
    if (pokemones.length === 0) return;

    let numero = Math.floor(Math.random() * pokemones.length);
    juegoActual = pokemones[numero];
    let imagen = document.getElementById("imagenJuego");
    imagen.src = imagenPokemon(juegoActual);
    imagen.hidden = false;
    imagen.classList.add("silueta");
    document.querySelector(".signo-pregunta").classList.add("oculto");
    document.getElementById("respuestaJuego").value = "";
    document.getElementById("respuestaJuego").disabled = false;
    document.getElementById("botonAdivinar").disabled = false;
    document.getElementById("mensajeJuego").textContent = "¡Observa bien la silueta!";
}

function adivinarPokemon(event) {
    event.preventDefault();
    if (juegoActual === null) return;

    let respuesta = document.getElementById("respuestaJuego").value.toLowerCase().trim().replaceAll(" ", "-");
    let mensaje = document.getElementById("mensajeJuego");

    if (respuesta === juegoActual.name) {
        mensaje.textContent = "¡Correcto! Era " + juegoActual.name.replaceAll("-", " ") + ". 🎉";
        document.getElementById("imagenJuego").classList.remove("silueta");
        document.getElementById("respuestaJuego").disabled = true;
        document.getElementById("botonAdivinar").disabled = true;
    } else {
        mensaje.textContent = "¡Casi! Inténtalo de nuevo. 💪";
    }
}

// Botón que aparece cuando bajamos por la página.
window.addEventListener("scroll", function () {
    document.getElementById("volverArriba").classList.toggle("visible", window.scrollY > 450);
});
function volverArriba() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Al abrir la página se cargan automáticamente los primeros 20 Pokémon.
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("ventanaDetalles").addEventListener("click", function (event) {
        if (event.target === this) cerrarDetalles();
    });
    obtenerPokemones();
});

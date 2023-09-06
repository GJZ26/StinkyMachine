
const collection_div_container = document.getElementById("collection-file");
const doclist = document.getElementById("documentList")

function formatSize(sizeInBytes) {
    const kilobytes = sizeInBytes / 1024;
    if (kilobytes < 1024) {
        return kilobytes.toFixed(2) + ' KB';
    } else {
        const megabytes = kilobytes / 1024;
        return megabytes.toFixed(2) + ' MB';
    }
}

function formatDateTime(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return ` | ${day}/${month}/${year} - ${hours}:${minutes} | `;
}

function listFiles(files) {
    doclist.innerHTML = ""
    if (files.length == 0) {
        const nodeChido = document.createElement("p")
        nodeChido.textContent = "Ninguno, claramente..."
        doclist.appendChild(nodeChido)
        return
    }
    for (let i = 0; i < files.length; i++) {
        let node = document.createElement("li");
        let sizeNode = document.createElement("span");
        let dateNode = document.createElement("span");

        node.id = files[i].name

        sizeNode.classList.add("sizeNode")
        dateNode.classList.add("dateNode")

        sizeNode.textContent = formatSize(files[i].size)
        dateNode.textContent = formatDateTime(new Date(files[i].lastModified));

        node.textContent = files[i].name
        node.appendChild(dateNode);
        node.appendChild(sizeNode);
        doclist.appendChild(node);
    }
    let btn = document.createElement("button")
    btn.textContent = "Vamo a darle"
    btn.addEventListener("click", sendFiles)
    doclist.append(btn)
}

function dragOverHandler(event) {
    this.removeAttribute('class');

    if (event.type === 'dragenter') {
        this.children[0].textContent = "¡Suéltalo!";
        this.children[1].textContent = "Cuando quieras, no hay prisa";
        this.classList.add('file-dragged');
    }
    if (event.type === 'dragleave') {
        if (this.children[2].files.length > 0) {
            this.classList.add('file-dropped');
            this.children[0].textContent = "¡Listo!";
            this.children[1].textContent = "Cuando estés listo, da click en 'Vamo a darle'";
            return
        }

        this.children[0].textContent = "Tira los archivos aquí";
        this.children[1].textContent = "O da click aquí para seleccionarlo, funciona igual";
        this.classList.add('file-drop');
    }
}

function updateNamesList(event) {
    const parent = event.target.offsetParent;

    parent.removeAttribute('class');

    listFiles(event.target.files)
    if (event.target.files.length === 0) {
        parent.children[0].textContent = "Tira los archivos aquí";
        parent.children[1].textContent = "O da click aquí para seleccionarlo, funciona igual";
        parent.classList.add('file-drop');
        return
    }

    parent.classList.add('file-dropped');

    parent.children[0].textContent = "¡Listo!";
    parent.children[1].textContent = "Cuando estés listo, da click en 'Vamo a darle'";
}

function dropHandler() {
    this.removeAttribute('class');
    if (this.children[2].files.length > 0) {
        this.classList.add('file-dropped');
        this.children[0].textContent = "Tira los archivos aquí";
        this.children[1].textContent = this.children[2].files[0].name;
        return
    }

    this.children[0].textContent = "Drop your file here";
    this.children[1].textContent = "O da click aquí para seleccionarlo, funciona igual";
    this.classList.add('file-drop');
}


function sendFiles(event) {
    collection_div_container.children[0].textContent = "Subiendo archivos";
    collection_div_container.children[1].textContent = "Espera un momento, no tardamos...";
    collection_div_container.removeAttribute("class")
    collection_div_container.classList.add("file-blocked")
    collection_div_container.children[2].disabled = true
    let clonedMueje = collection_div_container.cloneNode(true);

    let coolContainer = document.createElement("div")
    coolContainer.classList.add("progresContainer")

    event.target.disabled = true;
    let clonedBtn = event.target.cloneNode(true);
    event.target.remove()
    coolContainer.appendChild(clonedBtn)

    collection_div_container.replaceWith(clonedMueje)

    let progrsVar = document.createElement('div');
    let upld = document.createElement('div');
    let prcSegment = document.createElement('div');
    prcSegment.classList.add("proces");

    progrsVar.textContent = "Subiendo"
    progrsVar.classList.add("progress")
    upld.classList.add('uploaded')
    upld.style.width = "0%"

    progrsVar.appendChild(upld);
    coolContainer.appendChild(progrsVar);
    coolContainer.appendChild(prcSegment);
    doclist.appendChild(coolContainer);

    const archivos = collection_div_container.children[2].files;
    const formData = new FormData();

    for (let i = 0; i < archivos.length; i++) {
        formData.append('archivos', archivos[i]);
    }

    const xhr = new XMLHttpRequest();

    xhr.open('POST', 'http://127.0.0.1:5000/upload');

    xhr.upload.addEventListener('progress', function (event) {
        if (event.lengthComputable) {
            const porcentaje = (event.loaded / event.total) * 100;
            upld.style.width = `${porcentaje.toFixed(2)}%`;

            if (event.loaded === event.total) {
                progrsVar.textContent = "¡Hecho!"
                progrsVar.appendChild(upld);
                prcSegment.classList.add("waiting");
                prcSegment.textContent = "Procesando"
            }
        }
    });

    xhr.onload = function () {
        if (xhr.status === 200) {
            const jsonResponse = JSON.parse(xhr.responseText.replace(/\\/g, '/'));
            console.log(jsonResponse);
            prcSegment.classList.remove("waiting");
            prcSegment.classList.add("done");
            prcSegment.textContent = "¡Listo!"

            getFromProccessResource()
        } else {
            console.error('Error al cargar los archivos.');
            prcSegment.classList.remove("waiting");
            prcSegment.classList.add("error");
            prcSegment.textContent = "Ha ocurrido un error al procesar los archivos..."
        }
    };

    xhr.onerror = function () {
        console.error('Error en la solicitud.');
        progrsVar.textContent = "Oh oh..."
        progrsVar.appendChild(upld);
        prcSegment.classList.remove("waiting");
        prcSegment.classList.add("error");
        prcSegment.textContent = "No se ha podido hacer la petición :("
    };

    xhr.send(formData);
}

collection_div_container.ondragenter = dragOverHandler;
collection_div_container.ondragleave = dragOverHandler;


collection_div_container.children[2].onchange = updateNamesList;
collection_div_container.ondrop = dropHandler;
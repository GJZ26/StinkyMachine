function sendPosts(event, delayInpt) {
    if (parseInt(delayInpt.value) > 1000 || parseInt(delayInpt.value) < 0) {
        alert("Ingrese un valor de delay válido")
        return
    }
    let response = true
    for (let i in documentReviewed) {
        if (!documentReviewed[i]) {
            response = confirm("Al parecer hay carpetas que no has revisado, ¿Deseas subirlo de todos modos?")
            break
        }
    }

    if (!response) return
    response = confirm("Todos los archivos seleccionados serán subido al servidor y serán publicado de forma automática, posteriormente se eliminarán los datos procesados del programa y no podrás acceder a tus modificaciones de nuevo por este medio, ¿Desea continuar?")
    if (!response) return

    event.target.disabled = true
    event.target.textContent = "Subiendo..."
    for (let i = 0; i < doclist.children.length - 1; i++) {
        if (doclist.children[i].classList.contains("error")) continue
        doclist.children[i].removeAttribute("class")
        doclist.children[i].classList.add('uploading')
    }
    const clonedDocList = doclist.cloneNode(true)
    doclist.replaceWith(clonedDocList)
    document.getElementById("contentAnalized").innerHTML = ""

    for (let i = 0; i < doclist.children.length - 1; i++) {
        if (doclist.children[i].classList.contains("error")) continue
        doclist.children[i].onclick = sendImage(doclist.children[i])
    }

    console.log(parseInt(delayInpt.value))
}

function sendImage(element) {
    const docuInde = parseInt(element.getAttribute("docindex"))

    for (let i = 0; i < Object.keys(selectedImages[docuInde]).length; i++) {
        imageURI = globalDataForSendToWP[docuInde].images[i][selectedImages[docuInde][i]]
        uploadImage(element, imageURI, i, parseInt(element.getAttribute("docindex")))
    }

}

/**
 * 
 * @param {*} element 
 * @param {string} imageURI 
 * @param {*} documentIndex 
 * @param {*} compressedFileIndex 
 */
function uploadImage(element, imageURI, documentIndex, compressedFileIndex) {
    const URL = `http://localhost:5000/computed/${globalDataForSendToWP[compressedFileIndex].extractFolder}/${imageURI}`;

    fetch(URL)
        .then(response => response.blob())
        .then(blob => {
            const mimetype = imageURI.toLocaleLowerCase().includes("jpeg") ? "image/jpeg" :
                imageURI.toLocaleLowerCase().includes("jpg") ? "image/jpg" :
                    imageURI.toLocaleLowerCase().includes("png") ? "image/png" : "";
            const image = new File([blob], imageURI, { type: mimetype });

            const formData = new FormData();
            formData.append("file", image);

            fetch('http://regimen.localhost/wp-json/wp/v2/media', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vcmVnaW1lbi5sb2NhbGhvc3QiLCJpYXQiOjE2OTMxNzkyMDIsIm5iZiI6MTY5MzE3OTIwMiwiZXhwIjoxNjkzNzg0MDAyLCJkYXRhIjp7InVzZXIiOnsiaWQiOiIxIn19fQ.bFLXiR4vJKHTJ9ysF5_58_ZF8wQMOS6WtnewyCa4M6c',
                },
            })
                .then(response => response.json())
                .then(data => {
                    console.log('Imagen subida:', data);
                    uploadInfo(element, data, documentIndex, compressedFileIndex)
                })
                .catch(error => {
                    console.error('Error al subir la imagen:', error);
                });
        }).catch(error => {
            console.error('Error al obtener el Blob:', error);
        });
}

function uploadInfo(element, image, documentIndex, compressedFileIndex) {
    let realElement = document.getElementById(element.id)
    let tagsForSend = []

    for (let i = 0; i < globalDataForSendToWP[compressedFileIndex].content[documentIndex].keyword.length; i++) {
        if (globalTags[globalDataForSendToWP[compressedFileIndex].content[documentIndex].keyword[i]])
            tagsForSend.push(globalTags[globalDataForSendToWP[compressedFileIndex].content[documentIndex].keyword[i]]);
    }

    realElement.removeAttribute("class")
    realElement.classList.add("standby")

    let bodyToSenz = {
        "slug": globalDataForSendToWP[compressedFileIndex].content[documentIndex].title.trim().toLocaleLowerCase().replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, '-'),
        "status": "publish",
        "type": "post",
        "title": globalDataForSendToWP[compressedFileIndex].content[documentIndex].title,
        "content": "",
        "excerpt": globalDataForSendToWP[compressedFileIndex].content[documentIndex].description,
        "featured_media": image.id,
        "yoast_head_json": {
            "title": `${globalDataForSendToWP[compressedFileIndex].content[documentIndex].title} | Noticiero Regimen de Chiapas`,
            "description": globalDataForSendToWP[compressedFileIndex].content[documentIndex].description,
            "og_locale": "es_ES",
            "og_type": "article",
            "og_title": `${globalDataForSendToWP[compressedFileIndex].content[documentIndex].title} | Noticiero Regimen de Chiapas`,
            "og_description": globalDataForSendToWP[compressedFileIndex].content[documentIndex].summary[0] ? globalDataForSendToWP[compressedFileIndex].content[documentIndex].summary[0] : "",
            "og_url": `https://regimendechiapas.com.mx/${globalDataForSendToWP[compressedFileIndex].content[documentIndex].title.trim().toLocaleLowerCase().replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, '-')
                .replace(/\s+/g, '-')}/`,
            "og_site_name": "Regimen de Chiapas",
            "article_publisher": "https://www.facebook.com/RegimenChiapas",
            "og_image": [
                {
                    "width": image.media_details.width,
                    "height": image.media_details.height,
                    "url": image.source_url,
                    "type": image.mime_type
                }
            ]
        },
        "categories": selectedCategories[compressedFileIndex][documentIndex],
        "tags": tagsForSend
    }

    console.log(bodyToSenz);

    for (let i = 0; i < globalDataForSendToWP[compressedFileIndex].content[documentIndex].summary.length; i++) {
        bodyToSenz.content += '<!-- wp:heading {"level":4} -->'
        bodyToSenz.content += `<h4 class="wp-block-heading" id="${globalDataForSendToWP[compressedFileIndex].content[documentIndex].title.trim().toLocaleLowerCase().replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, '-')}">${globalDataForSendToWP[compressedFileIndex].content[documentIndex].summary[i]}</h4>`
        bodyToSenz.content += '<!-- /wp:heading -->'
    }

    for (let i = 0; i < globalDataForSendToWP[compressedFileIndex].content[documentIndex].content.length; i++) {
        bodyToSenz.content += '<!-- wp:paragraph -->'
        bodyToSenz.content += `<p>${globalDataForSendToWP[compressedFileIndex].content[documentIndex].content[i]}</p>`
        bodyToSenz.content += '<!-- /wp:paragraph -->'
    }

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "http://regimen.localhost/wp-json/wp/v2/posts");
    xhr.setRequestHeader("Authorization", "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vcmVnaW1lbi5sb2NhbGhvc3QiLCJpYXQiOjE2OTMxNzkyMDIsIm5iZiI6MTY5MzE3OTIwMiwiZXhwIjoxNjkzNzg0MDAyLCJkYXRhIjp7InVzZXIiOnsiaWQiOiIxIn19fQ.bFLXiR4vJKHTJ9ysF5_58_ZF8wQMOS6WtnewyCa4M6c");
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200 || xhr.status === 201) {
                document.getElementsByClassName("progresContainer")[0].innerHTML = ""
                var data = JSON.parse(xhr.responseText);
                realElement.removeAttribute('class');
                realElement.classList.add('uploadedContent');

                const result = document.createElement('span')
                result.textContent = globalDataForSendToWP[compressedFileIndex].documents[documentIndex]

                const cpybtn = document.createElement("button")
                cpybtn.textContent = "Copiar contenido"
                cpybtn.onclick = () => { clipboardHandler(data.link) }

                const link = document.createElement("a")
                link.href = data.link
                link.target = "__blank"
                link.textContent = "Ver Entrada"

                result.appendChild(link)
                result.appendChild(cpybtn)

                document.getElementById("contentAnalized").appendChild(result)
                document.getElementById("contentAnalized").classList.add("results")
                console.log(data);
            } else {
                console.error("Ha ocurrido un error al publicar:", xhr.status, xhr.statusText);
            }
        }
    };

    xhr.send(JSON.stringify(bodyToSenz));

}

function clipboardHandler(text) {
    console.log("COPIADO: " + text)
}
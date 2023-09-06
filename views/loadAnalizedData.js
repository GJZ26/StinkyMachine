var globalDataForSendToWP = []
var globalCategories = {}
var globalTags = {}
var selectedImages = {}
var documentReviewed = {}
var selectedCategories = {}

function getFromProccessResource() {
    fetch("http://127.0.0.1:5000/computed/processData.json", {
        method: "GET"
    }).then((response) => response.json())
        .then((data) => {
            globalDataForSendToWP = data

            for (let i = 0; i < globalDataForSendToWP.length; i++) {
                if (typeof (globalDataForSendToWP[i]) == "string") continue

                documentReviewed[i] = false

                let documents = globalDataForSendToWP[i].documents
                for (let j = 0; j < documents.length; j++) {
                    if (!selectedImages[i]) {
                        selectedImages[i] = {};
                        selectedCategories[i] = {}
                    }
                    selectedCategories[i][j] = []
                    selectedImages[i][j] = randomIntFromInterval(0, globalDataForSendToWP[i].images[j].length - 1);
                }
            }
            renderData(data)
            let enviarBtn = document.createElement("button")
            let span = document.createElement('span')
            let delay = document.createElement('input')
            let span2 = document.createElement('span')

            span.textContent = "Con demora de "
            span2.textContent = "minutos entre cada publicación"
            delay.type = "number"
            delay.min = 0
            delay.max = 1000
            delay.value = 0

            enviarBtn.textContent = "¡Subir!"
            enviarBtn.classList.add("magicbtn")
            enviarBtn.onclick = (event) => { sendPosts(event, delay) }
            document.getElementsByClassName("progresContainer")[0].innerHTML = ""
            document.getElementsByClassName("progresContainer")[0].appendChild(enviarBtn)
            document.getElementsByClassName("progresContainer")[0].appendChild(span)
            document.getElementsByClassName("progresContainer")[0].appendChild(delay)
            document.getElementsByClassName("progresContainer")[0].appendChild(span2)
        })
        .catch(
            (err) => {
                console.error(err)
            })

    fetch("http://127.0.0.1:5000/assets/categoriesRaw.json", {
        method: "GET"
    }).then((response) => response.json())
        .then((data) => {
            globalCategories = data
        })

    fetch("http://127.0.0.1:5000/assets/tagsRaw.json", {
        method: "GET"
    }).then(res => res.json())
        .then(data => {
            globalTags = data
        })
}

function renderData(dataParsed) {
    const unavailableDocs = []
    const availableDocs = {}

    for (let i = 0; i < dataParsed.length; i++) {
        if (typeof (dataParsed[i]) == "string") {
            unavailableDocs.push(dataParsed[i])
            continue
        }
        availableDocs[dataParsed[i].foldername] = i
    }

    for (let i = 0; i < doclist.children.length - 1; i++) {
        if (doclist.children[i].textContent.includes(unavailableDocs)) {
            doclist.children[i].classList.add("error")
            continue
        }
        doclist.children[i].classList.add("success")
        doclist.children[i].setAttribute("docindex", i)
        doclist.children[i].onclick = (event) => {
            if (document.querySelector("li.reviewed.current")) document.querySelector("li.reviewed.current").classList.remove("current")
            event.target.classList.remove("success")
            event.target.classList.add("reviewed", "current")
            showEditPanel(event, availableDocs[doclist.children[i].id])
        }
    }

}

function showEditPanel(event, index) {
    const container = document.getElementById("contentAnalized")
    const variableContent = document.createElement('div');

    documentReviewed[index] = true

    variableContent.classList.add("variableContent");
    container.innerHTML = ""

    render_docResume(container, index);
    render_documentList(container, index);

    container.appendChild(variableContent);
    container.scrollIntoView({ behavior: 'smooth' });
}

function showInfoFromDocSelected(parentContainer, compressedFileIndex, documentIndex) {
    const container = document.getElementsByClassName("variableContent")[0]
    container.innerHTML = ""

    render_imageList(container,
        globalDataForSendToWP[compressedFileIndex].images[documentIndex],
        globalDataForSendToWP[compressedFileIndex].extractFolder,
        compressedFileIndex,
        documentIndex)

    renderPostContet(container, compressedFileIndex, documentIndex)

    parentContainer.scrollIntoView({ behavior: 'smooth' });
}

function renderPostContet(parentContainercontainer, compressedFileIndex, documentIndex) {
    const container = document.createElement('div')
    container.innerHTML = ""
    container.classList.add("postContent")

    render_title(container, documentIndex, compressedFileIndex)
    render_summaries(container, documentIndex, compressedFileIndex)
    render_content(container, documentIndex, compressedFileIndex)
    render_keywords(container, documentIndex, compressedFileIndex)
    render_description(container, documentIndex, compressedFileIndex)
    render_categories(container, documentIndex, compressedFileIndex)

    parentContainercontainer.appendChild(container);
}

function render_description(container, documentIndex, compressedFileIndex) {
    const childContainer = document.createElement('div')
    childContainer.classList.add('description')
    const title = document.createElement('h2')

    const description = document.createElement('p')
    description.textContent = globalDataForSendToWP[compressedFileIndex].content[documentIndex].description
    description.contentEditable = true

    description.onkeydown = (event) => { if (event.key === 'Enter') event.preventDefault() }
    description.oninput = () => globalDataForSendToWP[compressedFileIndex].content[documentIndex].description = description.textContent

    title.textContent = "Descripcion"
    childContainer.appendChild(title)
    childContainer.appendChild(description)

    container.appendChild(childContainer)

}

function render_keywords(container, documentIndex, compressedFileIndex) {
    const childContainer = document.createElement('div')
    childContainer.classList.add('keywords')
    const title = document.createElement('h2')

    title.textContent = "Etiquetas"
    childContainer.appendChild(title)

    for (let i in globalDataForSendToWP[compressedFileIndex].content[documentIndex].keyword) {
        let keyword = document.createElement('span')
        keyword.classList.add("keyword")
        keyword.setAttribute('index', i)
        keyword.ondblclick = (event) => {
            event.target.remove()
            globalDataForSendToWP[compressedFileIndex].content[documentIndex].keyword.splice(parseInt(event.target.getAttribute("index")), 1);

            for (let i = parseInt(event.target.getAttribute("index")); i < globalDataForSendToWP[compressedFileIndex].content[documentIndex].keyword.length; i++) {
                childContainer.children[i + 1].setAttribute("index", i)
            }
        }
        keyword.textContent = globalDataForSendToWP[compressedFileIndex].content[documentIndex].keyword[i]
        childContainer.appendChild(keyword)
    }

    container.appendChild(childContainer)
}

function render_content(container, documentIndex, compressedFileIndex) {
    const childContainer = document.createElement('div')

    childContainer.classList.add('content')

    if (globalDataForSendToWP[compressedFileIndex].content[documentIndex].content.length === 0) {
        let btn = document.createElement("button")
        btn.textContent = "Crear un parrafo nuevo"
        btn.classList.add("addSegment")
        btn.onclick = () => {
            btn.remove()
            globalDataForSendToWP[compressedFileIndex].content[documentIndex].content[0] = ""
            const newParagraph = document.createElement('p')
            newParagraph.setAttribute('index', 0)
            newParagraph.contentEditable = true
            newParagraph.oninput = () => globalDataForSendToWP[compressedFileIndex].content[documentIndex].content[
                parseInt(newParagraph.getAttribute("index"))
            ] = newParagraph.innerHTML
            newParagraph.onkeydown = (event) => {
                if (event.key === 'Enter')
                    add_new_paragraph(event, compressedFileIndex, documentIndex, 1, childContainer)
                if (event.key === 'Backspace' && event.target.textContent === "")
                    remove_paragraph(event, childContainer, compressedFileIndex, documentIndex)
            }
            childContainer.appendChild(newParagraph)
            newParagraph.focus()
        }
        childContainer.appendChild(btn)
    }

    for (let i = 0; i < globalDataForSendToWP[compressedFileIndex].content[documentIndex].content.length; i++) {
        let paragraph = document.createElement('p')
        paragraph.setAttribute('index', i)
        paragraph.contentEditable = true

        paragraph.oninput = () => {
            globalDataForSendToWP[compressedFileIndex].content[documentIndex].content[
                parseInt(paragraph.getAttribute("index"))
            ] = paragraph.innerHTML
        }
        paragraph.onkeydown = (event) => {
            if (event.key === 'Enter') {
                add_new_paragraph(event, compressedFileIndex, documentIndex, i + 1, childContainer)
            }
            if (event.key === 'Backspace' && event.target.textContent === "") {
                remove_paragraph(event, childContainer, compressedFileIndex, documentIndex)
            }
        }

        paragraph.innerHTML = globalDataForSendToWP[compressedFileIndex].content[documentIndex].content[i]
        childContainer.appendChild(paragraph)
    }

    container.appendChild(childContainer)
}

function remove_paragraph(event, container, compressedFileIndex, documentIndex) {

    if (event.target.getAttribute("index") === "0" && event.target.nextSibling) {
        event.target.nextSibling.focus()
    } else if (event.target.previousSibling) {
        event.target.previousSibling.focus()
    }

    globalDataForSendToWP[compressedFileIndex].content[documentIndex].content.splice(parseInt(event.target.getAttribute("index")), 1);

    event.target.remove()

    if (globalDataForSendToWP[compressedFileIndex].content[documentIndex].content.length === 0) {
        let btn = document.createElement("button")
        btn.textContent = "Crear un parrafo nuevo"
        btn.classList.add("addSegment")
        btn.onclick = () => {
            btn.remove()
            globalDataForSendToWP[compressedFileIndex].content[documentIndex].content[0] = ""
            const newParagraph = document.createElement('p')
            newParagraph.setAttribute('index', 0)
            newParagraph.contentEditable = true
            newParagraph.oninput = () => globalDataForSendToWP[compressedFileIndex].content[documentIndex].content[
                parseInt(newParagraph.getAttribute("index"))
            ] = newParagraph.innerHTML
            newParagraph.onkeydown = (event) => {
                if (event.key === 'Enter')
                    add_new_paragraph(event, compressedFileIndex, documentIndex, 1, container)
                if (event.key === 'Backspace' && event.target.textContent === "")
                    remove_paragraph(event, container, compressedFileIndex, documentIndex)
            }
            container.appendChild(newParagraph)
            newParagraph.focus()
        }
        container.appendChild(btn)
        return
    }

    for (let i = parseInt(event.target.getAttribute("index")); i < globalDataForSendToWP[compressedFileIndex].content[documentIndex].content.length; i++) {
        container.children[i].setAttribute("index", i)
    }
}

function add_new_paragraph(event, compressedFileIndex, documentIndex, index, container) {
    event.preventDefault()

    const newParagraph = document.createElement('p')
    newParagraph.setAttribute('index', index)
    newParagraph.contentEditable = true
    newParagraph.oninput = () => globalDataForSendToWP[compressedFileIndex].content[documentIndex].content[
        parseInt(newParagraph.getAttribute("index"))
    ] = newParagraph.innerHTML
    newParagraph.onkeydown = (event) => {
        if (event.key === 'Enter')
            add_new_paragraph(event, compressedFileIndex, documentIndex, index + 1, container)
        if (event.key === 'Backspace' && event.target.textContent === "")
            remove_paragraph(event, container, compressedFileIndex, documentIndex)
    }

    if (event.target.nextSibling)
        container.insertBefore(newParagraph, event.target.nextSibling);
    else
        container.appendChild(newParagraph)
    newParagraph.focus()
    globalDataForSendToWP[compressedFileIndex].content[documentIndex].content.splice(index, 0, ""); // Agregar un elemento vacío al array
    for (let i = index; i < globalDataForSendToWP[compressedFileIndex].content[documentIndex].content.length; i++) {
        container.children[i].setAttribute("index", i)
    }
    console.log(globalDataForSendToWP[compressedFileIndex].content[documentIndex].content)
}

function render_summaries(container, documentIndex, compressedFileIndex, sameContainer = undefined) {
    const containerChild = sameContainer ? sameContainer : document.createElement("ul")
    containerChild.classList.add("summaries")

    if (globalDataForSendToWP[compressedFileIndex].content[documentIndex].summary.length === 0) {
        let btn = document.createElement("button")
        btn.textContent = "Crear un nuevo sumario"
        btn.classList.add("addSegment")
        btn.onclick = () => {
            btn.remove()
            globalDataForSendToWP[compressedFileIndex].content[documentIndex].summary[0] = ""
            const summary = document.createElement('li')
            summary.setAttribute('index', 0)
            summary.contentEditable = true

            summary.oninput = () => {
                globalDataForSendToWP[compressedFileIndex].content[documentIndex].summary[
                    parseInt(summary.getAttribute('index'))
                ] = summary.textContent
            }

            summary.onkeydown = (event) => { summary_key_event_handler(event, compressedFileIndex, documentIndex, containerChild) }
            containerChild.appendChild(summary)
            summary.focus()
        }
        containerChild.appendChild(btn)
    }

    for (let i in globalDataForSendToWP[compressedFileIndex].content[documentIndex].summary) {
        let summary = document.createElement('li')
        summary.setAttribute("index", i)
        summary.contentEditable = true
        summary.oninput = () => {
            globalDataForSendToWP[compressedFileIndex].content[documentIndex].summary[
                parseInt(summary.getAttribute('index'))
            ] = summary.textContent
        }
        summary.textContent = globalDataForSendToWP[compressedFileIndex].content[documentIndex].summary[
            parseInt(summary.getAttribute('index'))
        ]
        summary.onkeydown = (event) => {
            summary_key_event_handler(event, compressedFileIndex, documentIndex, containerChild)
        }
        containerChild.appendChild(summary)
    }

    container.appendChild(containerChild)
}

function add_summary(event, compressedFileIndex, documentIndex, container) {
    event.preventDefault()

    const summary = document.createElement('li')
    summary.setAttribute("index", parseInt(event.target.getAttribute('index')) + 1)
    summary.contentEditable = true
    summary.oninput = () => {
        globalDataForSendToWP[compressedFileIndex].content[documentIndex].summary[
            parseInt(summary.getAttribute('index'))
        ] = summary.textContent
    }
    summary.onkeydown = (event) => {
        summary_key_event_handler(event, compressedFileIndex, documentIndex, container)
    }

    if (event.target.nextSibling)
        container.insertBefore(summary, event.target.nextSibling);
    else
        container.appendChild(summary)

    summary.focus()
    globalDataForSendToWP[compressedFileIndex].content[documentIndex].summary.splice(parseInt(event.target.getAttribute("index")) + 1, 0, "");

    for (let i = parseInt(summary.getAttribute('index')); i < globalDataForSendToWP[compressedFileIndex].content[documentIndex].summary.length; i++) {
        container.children[i].setAttribute("index", i)
    }
    console.log(globalDataForSendToWP[compressedFileIndex].content[documentIndex].summary)
}

function remove_summary(event, compressedFileIndex, documentIndex, container) {

    if (event.target.getAttribute("index") === "0" && event.target.nextSibling) {
        event.target.nextSibling.focus()
    } else if (event.target.previousSibling) {
        event.target.previousSibling.focus()
    }

    globalDataForSendToWP[compressedFileIndex].content[documentIndex].summary.splice(parseInt(event.target.getAttribute("index")), 1);
    event.target.remove()

    if (globalDataForSendToWP[compressedFileIndex].content[documentIndex].summary.length === 0) {
        let btn = document.createElement("button")
        btn.textContent = "Crear un nuevo sumario"
        btn.classList.add("addSegment")
        btn.onclick = () => {
            btn.remove()
            globalDataForSendToWP[compressedFileIndex].content[documentIndex].summary[0] = ""
            const summary = document.createElement('li')
            summary.setAttribute('index', 0)
            summary.contentEditable = true

            summary.oninput = () => {
                globalDataForSendToWP[compressedFileIndex].content[documentIndex].summary[
                    parseInt(summary.getAttribute('index'))
                ] = summary.textContent
            }

            summary.onkeydown = (event) => { summary_key_event_handler(event, compressedFileIndex, documentIndex, container) }
            container.appendChild(summary)
            summary.focus()
        }
        container.appendChild(btn)
        return
    }

    for (let i = parseInt(event.target.getAttribute('index')); i < globalDataForSendToWP[compressedFileIndex].content[documentIndex].summary.length; i++) {
        container.children[i].setAttribute("index", i)
    }
}

function summary_key_event_handler(event, compressedFileIndex, documentIndex, container) {

    if (event.key === "Enter") {
        add_summary(event, compressedFileIndex, documentIndex, container)
    }

    if (event.key === 'Backspace' && event.target.textContent === "") {
        remove_summary(event, compressedFileIndex, documentIndex, container)
    }

}

function render_title(container, documentIndex, compressedFileIndex) {
    const childContainer = document.createElement('h1');
    childContainer.style.backgroundImage = `url('http://127.0.0.1:5000/computed/${globalDataForSendToWP[compressedFileIndex].extractFolder}/${globalDataForSendToWP[compressedFileIndex].images[documentIndex][selectedImages[compressedFileIndex][documentIndex]]}')`

    const titleContent = document.createElement('span')
    childContainer.id = "postitle"

    titleContent.textContent = globalDataForSendToWP[compressedFileIndex].content[documentIndex].title
    titleContent.contentEditable = true
    titleContent.oninput = () => {
        globalDataForSendToWP[compressedFileIndex].content[documentIndex].title = titleContent.textContent
    }

    titleContent.onkeydown = (event) => {
        if (event.key === "Enter") event.preventDefault()
    }

    childContainer.appendChild(titleContent)

    container.appendChild(childContainer)
}

function render_imageList(container, imageList, folder, compressedFileIndex, documentIndex) {
    const childContainer = document.createElement('div');
    childContainer.classList.add("imageList");

    const title = document.createElement('h2')
    title.textContent = "Ímagenes para el documento seleccionado"
    childContainer.appendChild(title)

    for (let i = 0; i < imageList.length; i++) {
        let image = document.createElement('div');
        let imagep = document.createElement('p');

        imagep.textContent = imageList[i]
        image.appendChild(imagep)

        image.classList.add('image')
        if (i === selectedImages[compressedFileIndex][documentIndex]) {
            image.classList.add('active')
        }

        image.onclick = (event) => {
            document.getElementsByClassName("active")[0].classList.remove("active")
            event.target.classList.add("active")
            selectedImages[compressedFileIndex][documentIndex] = i
            let chilo = document.getElementById('postitle')
            chilo.removeAttribute('style')
            chilo.style.backgroundImage = `url('http://127.0.0.1:5000/computed/${globalDataForSendToWP[compressedFileIndex].extractFolder}/${globalDataForSendToWP[compressedFileIndex].images[documentIndex][selectedImages[compressedFileIndex][documentIndex]]}')`
        }

        image.style.backgroundImage = `url('http://127.0.0.1:5000/computed/${folder}/${imageList[i]}')`

        childContainer.appendChild(image)
    }

    container.appendChild(childContainer);
}

function render_docResume(container, index) {
    let totalImages = 0
    let totalDocuments = globalDataForSendToWP[index].documents.length

    for (let i = 0; i < globalDataForSendToWP[index].images.length; i++) {
        totalImages += globalDataForSendToWP[index].images[i].length
    }

    const docResume = document.createElement('div')
    const docResumeH2 = document.createElement('h2')
    let docResumeP = document.createElement('p')

    docResumeH2.textContent = "Resumen del documento"
    docResume.appendChild(docResumeH2)

    docResumeP.textContent = `Documentos en total: ${totalDocuments}`
    docResume.appendChild(docResumeP)

    docResumeP = document.createElement('p')
    docResumeP.textContent = `Imágenes en total: ${totalImages}`
    docResume.appendChild(docResumeP)

    docResume.classList.add('docResume')
    container.appendChild(docResume)
}

function render_documentList(container, index) {
    const containerChild = document.createElement('div')
    containerChild.classList.add("documentList")
    const containerH2 = document.createElement('h2')
    containerH2.textContent = "Documentos"

    containerChild.appendChild(containerH2)

    for (let i = 0; i < globalDataForSendToWP[index].documents.length; i++) {
        let containerChildChild = document.createElement('div')
        let spn = document.createElement('span')
        let btn = document.createElement('button')
        containerChildChild.classList.add("docitemcontainer")

        btn.classList.add("showDocBtn")
        btn.textContent = "📂"
        btn.onclick = () => {
            fetch(`http://127.0.0.1:5000/open/${globalDataForSendToWP[index].extractFolder}/${globalDataForSendToWP[index].documents[i]}`).then((response) => console.log(response))
                .catch((err) => console.log(err))
        }

        spn.textContent = globalDataForSendToWP[index].documents[i]
        spn.onclick = () => { showInfoFromDocSelected(container, index, i) }
        containerChildChild.appendChild(spn)
        containerChildChild.appendChild(btn)
        containerChild.appendChild(containerChildChild)
    }

    container.appendChild(containerChild)
}

function render_categories(container, documentIndex, compressedFileIndex) {
    console.log(globalDataForSendToWP)
    console.log(selectedCategories)
    const childContainer = document.createElement('div')
    childContainer.classList.add('categories')

    const title = document.createElement('h2')
    title.textContent = "Categorías"
    childContainer.appendChild(title)


    let keys = Object.keys(globalCategories);
    for (let i = 0; i < keys.length; i++) {
        let btn = document.createElement("button")
        btn.classList.add("categories")
        btn.textContent = keys[i]

        if (selectedCategories[compressedFileIndex][documentIndex].includes(globalCategories[keys[i]])) {
            btn.classList.add("selected")
        }

        btn.onclick = (event) => {
            if (!event.target.classList.contains("selected") && !selectedCategories[compressedFileIndex][documentIndex].includes(globalCategories[keys[i]])) {
                event.target.classList.add("selected")
                selectedCategories[compressedFileIndex][documentIndex].push(globalCategories[keys[i]])
            } else {
                event.target.classList.remove("selected")
                selectedCategories[compressedFileIndex][documentIndex].splice(selectedCategories[compressedFileIndex][documentIndex].indexOf(keys[i]))
            }
            console.log(selectedCategories)
        }
        childContainer.appendChild(btn)
    }

    container.appendChild(childContainer)
}

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}
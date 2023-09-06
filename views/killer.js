document.getElementById("kill").onclick = () => {
    if (confirm('Al apagar el servidor, todos los datos procesados serán eliminados. ¿Deseas apagar la aplicación de cualquier forma?')) {
        fetch("http://127.0.0.1:5000/shutdown", {
            method: "GET"
        })

        location.reload()
    } else {
    }
}
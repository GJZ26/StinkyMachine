import os
import subprocess
import shutil
import DocumentRecognizer as recoInstance
import sys

from flask import Flask, request, send_from_directory, render_template
from flask_cors import CORS

UPLOAD_FOLDER = 'computed'
RESORCES__FOLDER = 'assets'

BASE_DIR = os.getcwd().replace("\\", "/")

base_dir = '.'

if (not os.path.isdir(f'{UPLOAD_FOLDER}')):
    os.mkdir(f"{UPLOAD_FOLDER}")

app = Flask(__name__,
            template_folder=os.path.join(base_dir, "templates"))
CORS(app)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


@app.route('/computed/<path:filepath>')
def computed_files(filepath):
    return send_from_directory(UPLOAD_FOLDER, filepath)


@app.route('/assets/<path:filepath>')
def assets_files(filepath):
    return send_from_directory(RESORCES__FOLDER, filepath)


@app.route('/')
def hello_world():
    return render_template('index.html')


@app.route('/open/<path:filename>', methods=["GET"])
def openFile(filename):
    path = BASE_DIR+"/"+UPLOAD_FOLDER+"/"+filename
    comando = f'start "" "{path}"'
    subprocess.run(comando, shell=True)
    return "ok", 200

@app.route('/shutdown', methods=["GET"])
def shutdown():
    shutil.rmtree(UPLOAD_FOLDER)
    os._exit(0)  # Termina el proceso abruptamente

@app.route('/upload', methods=['POST'])
def upload_files():
    global os
    try:
        reSf = recoInstance.DocumentRecognizer(
            os.getcwd(), f'/{UPLOAD_FOLDER}/')
        uploaded_files = request.files.getlist('archivos')
        for file in uploaded_files:
            file_path = os.path.join(
                app.config['UPLOAD_FOLDER'], file.filename)
            file.save(file_path)  # Guardar los archivos en la carpeta "data"
        reSf.validateFilesOnDir(os.listdir(BASE_DIR + f'/{UPLOAD_FOLDER}/'))
        reSf.recognizeFromValidateList()
        reSf.extractAndRead()
        reSf.analizeFilesExtracted()
        reSf.save()
    except Exception as e:
        return '{"success":false, "message":"Error al subir los datos"}', 500

    return f'{{"success": true, "message": "ola"}}'

if __name__ == "__main__":
    os.system("start http://127.0.0.1:5000/")
    app.run('127.0.0.1', 5000,False)
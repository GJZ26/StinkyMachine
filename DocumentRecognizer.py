import zipfile as zf
import re
from docx import Document
import os
import uuid
import json


class DocumentRecognizer:

    filesRecognized = []
    validFiles = []

    THIS_DIR = ''
    ITEMS_DIR = ''

    VALID_DOC_EXTENSION = ['docx']
    VALID_IMG_EXTENSION = ['png', 'PNG', 'jpg', 'JPG', 'jpeg', 'JPEG']

    def __init__(self, currentPath, dataFolder):
        self.THIS_DIR = currentPath
        self.ITEMS_DIR = dataFolder
        self.filesRecognized = []
        self.validFiles = []

    def validateFilesOnDir(self, dir: list):
        print(f'--- Starting validation of the files in the folder ---')
        for file in dir:
            if (not file.endswith('zip')):
                print(
                    f'> The following file will not be considered because it is not a .zip file: {file}')
                continue
            self.validFiles.append(file)

        print(
            f'\t-> {len(self.validFiles)} final files can be processed correctly. <-\n')

    def recognizeFromValidateList(self):
        print("--- Starting content analysis of validated files ---")
        filesRecognized = []
        if (len(self.validFiles) == 0):
            print('Not enough data to start recognizing :(')
            return
        for i in range(len(self.validFiles)):
            filesRecognized.append(self.__readContent(self.validFiles[i]))

        self.filesRecognized = filesRecognized
        print("--- Done ---\n")

    def __readContent(self, file):
        print(f"> Started content analysis of: {file}")
        folderName = file
        zip = zf.ZipFile(self.THIS_DIR + self.ITEMS_DIR + file)
        zipContent = zip.filelist
        images = []
        documents = []

        for file in zipContent:
            for extension in self.VALID_IMG_EXTENSION:
                if (file.filename.endswith(extension)):
                    images.append(file.filename)
                    break

            for extension in self.VALID_DOC_EXTENSION:
                if (file.filename.endswith(extension)):
                    documents.append(file.filename)
                    break

        imagesfordocs = [[] for _ in documents]

        if (len(documents) == 0):
            print("\t-> No file found with valid document extension <-")
            return folderName

        if (len(documents) > 1):
            for i in range(len(images)):
                img_name = re.sub(r'\d+', '', images[i].split(".")[0]).strip()

                for j in range(len(documents)):
                    if img_name in documents[j]:
                        imagesfordocs[j].append(images[i])

            images = imagesfordocs
        else:
            images = [images]
            
        return {"documents": documents, "images": images, "foldername": folderName}

    def extractAndRead(self):
        for index in range(len(self.filesRecognized)):
            if (type(self.filesRecognized[index]) is str):
                continue
            print(f"> Extracting {self.filesRecognized[index]['foldername']}")
            folder = self.__createDir(self.filesRecognized[index],uuid.uuid1())
            self.__extractFiles(
                self.filesRecognized[index]["foldername"],
                folder)
            self.filesRecognized[index]["extractFolder"] = folder
        return

    def __createDir(self, recognizion, name=uuid.uuid1()):
        if (name is not str):
            name = str(name)
        try:
            os.mkdir(self.THIS_DIR + self.ITEMS_DIR + name)
        except:
            print("\t-> This folder already exists or something really bad happen <-")
        return name

    def __extractFiles(self, filename, foldername):

        if (filename is not str):
            filename = str(filename)

        if (foldername is not str):
            foldername = str(foldername)

        if (filename is None):
            print("Impossible to extract without filename")
            return
        zf.ZipFile(self.THIS_DIR + self.ITEMS_DIR +
                   filename).extractall(self.THIS_DIR + self.ITEMS_DIR + foldername)

    def analizeFilesExtracted(self):
        for file in self.filesRecognized:
            if (type(file) is str):
                continue
            if (not "extractFolder" in file):
                print(
                    f"\t-> The following file could not be read because its extraction folder could not be found: {file['foldername']} <-")
                continue
            file["content"] = []
            for doc in file["documents"]:
                print(f"> The following document will be analyzed: {doc}")
                instanceForFile = DocumentAnalizer()
                instanceForFile.simpleAnalizer(
                    self.THIS_DIR + self.ITEMS_DIR + file["extractFolder"] + "/" + doc)
                file["content"].append(instanceForFile.fineAnalizer())

    def save(self):
        print("Saving data on "+self.THIS_DIR +
              self.ITEMS_DIR + "processData.json")
        with open(self.THIS_DIR + self.ITEMS_DIR + "processData.json", "w", encoding="utf-8") as archivo:
            json.dump(self.filesRecognized, archivo,
                      indent=None, ensure_ascii=False)

    def clearInstance(self):
        print("REMOVING DATA")
        self.filesRecognized = []
        self.THIS_DIR = ''
        self.ITEMS_DIR = ''
        self.validFiles = []


class DocumentAnalizer:

    possiblesTitles = []
    summaries = []
    contentByParagraph = []
    contentRaw = ""

    LIST_OF_IGNORED_WORDS = None
    LIST_OF_AVAILABLE_TAGS = None

    def __init__(self):
        self.possiblesTitles = []
        self.summaries = []
        self.contentByParagraph = []
        self.contentRaw = ""
        self.LIST_OF_AVAILABLE_TAGS = json.loads(
            open(os.getcwd()+"/tags.json").read())
        self.LIST_OF_IGNORED_WORDS = json.loads(
            open(os.getcwd()+"/ignored_words.json").read())
        pass

    def simpleAnalizer(self, path: str):
        print("\t- Taking a look at the obvious information")
        doc = Document(path)

        for paragraph in doc.paragraphs:
            if (paragraph.text.strip() == "" or len(re.findall(r'[a-zA-Z]', paragraph.text.strip())) < 2):
                continue

            if (paragraph.text.startswith("•")
                or paragraph.text.startswith("-")
                or paragraph.text.startswith("*")
                    or paragraph.text.startswith("+")):
                self.contentRaw = self.contentRaw + \
                    paragraph.text[1:].strip() + " "
            else:
                self.contentRaw = self.contentRaw + paragraph.text.strip() + " "

            if (len(paragraph.runs) > 0):
                if (paragraph.runs[0].bold and not (paragraph.text.startswith("•") or
                                                    paragraph.text.startswith("-") or
                                                    paragraph.text.startswith("*") or
                                                    paragraph.text.startswith("+"))):
                    self.possiblesTitles.append(paragraph.text)
                    continue

            if (paragraph.text.startswith("•") or
                paragraph.text.startswith("-") or
                paragraph.text.startswith("*") or
                    paragraph.text.startswith("+")):
                self.summaries.append(paragraph.text[1:].strip())
                continue
            self.contentByParagraph.append(paragraph.text.strip())

    def fineAnalizer(self):
        print("\t- Taking a look at the information that is not so obvious")
        result = {
            "title": self.__selectTitle(),
            "summary": self.summaries,
            "content": self.contentByParagraph,
            "keyword": self.__analizeTextAndGetKeyword(),
            "description": self.__setDescription()
        }

        return result

    def __analizeTextAndGetKeyword(self):
        print("\t- Reading the content to obtain keyword")
        tags = []
        dividedContent = self.contentRaw.split(" ")
        wordCounter = {}

        for word in dividedContent:
            cleanWord = re.sub(r'\W+', '', word).strip().lower()
            if (cleanWord == ""):
                continue

            if (cleanWord in self.LIST_OF_IGNORED_WORDS or not cleanWord.isalpha()):
                continue

            if (cleanWord in wordCounter):
                wordCounter[cleanWord] += 1
            else:
                wordCounter[cleanWord] = 1

        ranke = dict(sorted(wordCounter.items(),
                     key=lambda item: item[1], reverse=True))

        rankedTags = {}

        for element in ranke:

            for indice, frase in enumerate(self.LIST_OF_AVAILABLE_TAGS):
                if (frase.lower() == element):
                    if (indice in rankedTags):
                        rankedTags[indice] += 2
                    else:
                        rankedTags[indice] = 2
                    continue

                palabras_en_frase = frase.split()

                if element.lower() in [p.lower() for p in palabras_en_frase]:
                    if (indice in rankedTags):
                        rankedTags[indice] += 1
                    else:
                        rankedTags[indice] = 1

        rankedTags = dict(sorted(rankedTags.items(),
                                 key=lambda item: item[1], reverse=True))

        index = 5
        if (len(rankedTags) < 5):
            index = len(rankedTags)

        if (index == -1):
            return []

        it = 0
        for i in rankedTags:
            tags.append(self.LIST_OF_AVAILABLE_TAGS[i])
            it += 1
            if (it >= index):
                break
        return tags

    def __selectTitle(self):
        print("\t- Choosing a nice title")
        if (len(self.possiblesTitles) == 1):
            return self.possiblesTitles[0]

        highestIndex = 0

        for i in range(len(self.possiblesTitles)):
            if (len(self.possiblesTitles[i]) > len(self.possiblesTitles[highestIndex])):
                if (len(self.possiblesTitles[i]) > 100):
                    continue
                highestIndex = i

        return self.possiblesTitles[highestIndex]

    def __setDescription(self):
        print("\t- Adding a brief description")
        index = 0
        good = re.sub(r'^.*\.-', '', self.contentByParagraph[index])
        while (len(good) < 50):
            index = index + 1
            good = re.sub(
                r'^.*\.-', '', self.contentByParagraph[index]).strip()

        separateByComma = good.split(",")
        variation = []

        description = ""
        for segment in separateByComma:
            description = description + segment
            variation.append(abs(140-len(description)))
            if (len(description) > 180):
                break

        description = ""
        for i in range(variation.index(min(variation))+1):
            description = description + separateByComma[i] + ","

        description = description.strip()

        if (description.endswith(",") or not description.endswith(".")):
            description = description[:-1] + "."

        return description

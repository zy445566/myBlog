Module = {
    async onRuntimeInitialized() {
      console.log(cv.getBuildInformation())
      await getFace()
    }
  }
const cv = require('./opencv.js');
const fs = require('fs');
const Jimp = require('jimp');
const path = require('path');

async function getFace() {
    var jimpSrc = await Jimp.read(path.join(__dirname,'gx.jpg'));
    let src = cv.matFromImageData(jimpSrc.bitmap);
    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    let faces = new cv.RectVector();
    let faceCascade = new cv.CascadeClassifier();
    // load pre-trained classifiers
    cv.FS_createDataFile(
        '/', 'haarcascade_frontalface_default.xml', 
        fs.readFileSync(path.join(__dirname,'haarcascade_frontalface_default.xml')), 
        true, false, false
    );
    faceCascade.load('haarcascade_frontalface_default.xml');
    // // detect faces
    let msize = new cv.Size(0, 0);
    faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0, msize, msize);
    for (let i = 0; i < faces.size(); ++i) {
        let roiGray = gray.roi(faces.get(i));
        let roiSrc = src.roi(faces.get(i));
        let point1 = new cv.Point(faces.get(i).x, faces.get(i).y);
        let point2 = new cv.Point(faces.get(i).x + faces.get(i).width,
                                faces.get(i).y + faces.get(i).height);
        cv.rectangle(src, point1, point2, [255, 0, 0, 255]);
        roiGray.delete(); roiSrc.delete();
    }
    new Jimp({
        width: src.cols,
        height: src.rows,
        data: Buffer.from(src.data)
    }).write('gxOutput.png');
    src.delete(); gray.delete(); faceCascade.delete();
    faces.delete();
}
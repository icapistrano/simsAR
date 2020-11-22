const video = document.getElementById('videoId');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

const button = document.getElementById('take-pic');

const canvasThree = document.getElementById('canvasThree');
let collections = {};

let model;
let predictions = [];

setup()

async function setup() {
    try {
        model = await cocoSsd.load();
        console.log(model);
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true
        });
        video.srcObject = stream;
        let ar = await createThreejsSetup();
        drawCanvas();

    } catch (error) {
        console.error(error);
    }
}

function drawCanvas() {
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    detect(canvas);

    if (predictions.length > 0) {
        for (let object = 0; object < predictions.length; object++) {
            if (predictions[object].class == 'person' || predictions[object].class == 'dog') {

                if (predictions.length != Object.keys(collections).length) {
                    let logo = new Diamond(object, 1, 1); // id, rad, height
                    console.log("create logo");
                }

                else {
                    let pos = predictions[object].bbox;
                    context.beginPath();
                    context.strokeStyle = 'green';
                    context.rect(pos[0], pos[1], pos[2], pos[3]); // x, y, w, h
                    context.stroke();

                    collections[0].position.x = pos[0] + (pos[2] / 2);
                    collections[0].position.y = -pos[1] + 50;
                    collections[0].scale.set(pos[2] / 8, pos[3] / 4, 1) // x, y, z
                }

            }
        }
    }

    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    requestAnimationFrame(drawCanvas);
}

async function detect(img) {
    predictions = await model.detect(img);
    // console.log(predictions);
}

async function createThreejsSetup() {
    return new Promise((resolve, reject) => {
        const aspectRatio = canvasThree.width / canvasThree.height;
        const viewSize = 480;

        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera(-aspectRatio * viewSize / 2, aspectRatio * viewSize / 2, viewSize / 2, -viewSize / 2, -1000, 1000);

        camera.position.x = 320;
        camera.position.y = -240

        renderer = new THREE.WebGLRenderer({ canvas: canvasThree, antialias: true, alpha: true }); // if antilias is false, geometries are jagged
        renderer.setSize(canvasThree.width, canvasThree.height);
        renderer.render(scene, camera);
        resolve();
    })
}

button.addEventListener('click', (e) => {
    e.preventDefault();
    drawCanvas();
})

class Diamond {
    constructor(id, radius, height) {
        this.id = id;
        this.radius = radius;
        this.height = height;
        this.createDiamond();
    }

    createCone(side) {
        return new Promise((resolve, reject) => {
            let condition = (side == 'top') ? { 'col': 0x93DB47, 'rot': 0, 'pos': this.height / 2 } : { 'col': 0x88CB42, 'rot': 180, 'pos': -this.height / 2 }
            const geometry = new THREE.ConeBufferGeometry(this.radius, this.height, 6);
            const material = new THREE.MeshBasicMaterial({ color: condition['col'] });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotateX(condition['rot'] * (Math.PI / 180));
            mesh.position.y = condition['pos'];
            resolve(mesh);
        })
    }

    createPlane() {
        return new Promise((resolve, reject) => {
            const geometry = new THREE.PlaneBufferGeometry(0.01, 0.01);
            const material = new THREE.MeshBasicMaterial({ color: 0x93DB47, side: THREE.DoubleSide });
            const plane = new THREE.Mesh(geometry, material);
            resolve(plane);
        })
    }

    async createDiamond() {
        let plane = await this.createPlane();
        scene.add(plane);

        let top = await this.createCone('top');
        let bottom = await this.createCone('bottom');

        plane.add(top)
        plane.add(bottom)

        collections[this.id] = plane;
    }
}

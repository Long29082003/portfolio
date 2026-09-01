import './style.scss'
import * as THREE from "three";
import { gsap, Linear } from "gsap";

import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

import { OrbitControls } from './utils/OrbitControls.js';
import { RectAreaLightUniformsLib, Sky } from 'three/examples/jsm/Addons.js';

import { Howler } from "howler";

const app = document.getElementById("app");

const canvas = document.querySelector(".experience-canvas");
const testWindow = document.getElementById("window");

const computerScreen = document.getElementById("MainScreen");
const secondaryScreen = document.getElementById("SecondaryScreen");
const iconContainersCollection = document.getElementsByClassName("icon-container");

const landingScreen = document.getElementById("landing-screen");
const loadingStatusText = document.querySelector(".loading-status")
const startButton = document.getElementById("start-button");

const popupWindow = document.getElementById("popup-window");
const popupWindowTitle = document.getElementById("popup-window-title");
const popupWindowContent = document.getElementById("popup-window-content");
const popupWindowExitButton = document.getElementById("popup-window-button");

const sizes = { width: window.innerWidth, height: window.innerHeight };

//? ---------------------Configs Variables---------------------
const CAMERA_INITIAL_POSITION = new THREE.Vector3(-26.29007241498762, 4.668625463735328, 24.458322733568895);
const CAMERA_INITIAL_ROTATION = new THREE.Euler(-0.5199113382729925, -0.7079822381204657, -0.35636780396877776);
const CONTROL_INITIAL_TARGET = new THREE.Vector3(-5.1321822142724205, -7.610562418677146, 3.00786548559473);

//? ---------------------Starts add videos element to html---------------------
//* Add video with my face to screens that has elements with "icon-container" class
if (Array.from(iconContainersCollection).length > 0) {

    Array.from(iconContainersCollection).forEach((iconContainer) => {
        const iconVideo = document.createElement("video");
        iconVideo.src = "/textures/videos/icon_vid.mp4";
        iconVideo.classList.add("icon-vid");
        iconVideo.muted = true;
        iconVideo.autoplay = true;
        iconVideo.loop = true;
        iconVideo.playbackRate = 2;
        iconContainer.appendChild(iconVideo);
    });

};

//* Add Witch on Broomstick video to main computer screen
const videoContainer = computerScreen.querySelector(".column-2");
const gameplayVideo = document.createElement("video");
gameplayVideo.src = "/textures/videos/gameplay_vid.mp4";
gameplayVideo.id = "wob-gameplay-vid";
gameplayVideo.muted = true;
gameplayVideo.autoplay = true;
gameplayVideo.loop = true;
videoContainer.prepend(gameplayVideo);

//! ---------------------Ends add videos element to html---------------------


//? ---------------------Basic setup for threejs---------------------

//* For the main model scene
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera( 45, sizes.width / sizes.height, 0.1, 1000 );
camera.position.copy(CAMERA_INITIAL_POSITION);
camera.rotation.copy(CAMERA_INITIAL_ROTATION);

const renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;

const rendererCSS3D = new CSS3DRenderer();
rendererCSS3D.setSize( sizes.width, sizes.height );
rendererCSS3D.domElement.style.position = "absolute";
rendererCSS3D.domElement.style.top = "0px";
rendererCSS3D.domElement.style.left = "0px";
rendererCSS3D.domElement.style.zIndex = 999;
app.appendChild( rendererCSS3D.domElement );

//* Loading manager 
const manager = new THREE.LoadingManager();
manager.onLoad = () => {

    //* Apply background after CubeTextureLoader finish loading
    scene.background = environmentMap;

    //* Only apply baked texture to object after baked texture have been loaded completely thanks to loadingManager
    applyingTextureAfterLoad(loadedGLB);

    scene.add(loadedGLB.scene);

    animateFan();
    animateChair();
    addHTMLScreensTo3dScreens();
    pairObjectsThatAnimateTogether();

    landingScreen.classList.add("loaded");

    loadingStatusText.classList.add("enabled");
    loadingStatusText.style.fontFamily = "Playwrite GB S, sans-serif";
    loadingStatusText.textContent = "Welcome, I'm Long";

    startButton.disabled = false;

};

//! ---------------------Basic setup ends---------------------


//? ---------------------Setup for objects and materials---------------------
//* Dont render css3dObjects when users have not pressed the start button
let startRenderingCSS3DObjects = false;

//* Dont raycast when camera is moving
let raycastingDisabled = true;
let raycastingObjects = [];
let justHoveredOverObject;
let lastCameraPosition = new THREE.Vector3();

let introAnimatedObjects = [];

const socialLinks = {
    Discord: "https://discord.com/",
    LinkedIn: "https://www.linkedin.com/in/long-%C4%91o%C3%A0n-4504b0366/"
};

const popupContent = {
    PortfolioVideoScreen: {
        title: "College Portfolio Video",
        content: `
            This interactive portfolio was built using Three.js, Blender, and modern web technologies to 
            showcase both my technical skills and personal projects. The experience features custom 3D environments, 
            animated models, interactive objects, and dynamic UI elements that visitors can explore. Every asset, 
            from the models to the lighting and animations, was carefully optimized to balance visual quality with performance.

            The goal of this project is not only to present my work but also to create an engaging experience that reflects 
            my passion for software development, computer graphics, and creative problem solving.
        `,
    },
    WitchGameScreen: {
        title: "Witch on Broomstick",
        content: `
            The Witch's Trial is a small side-scrolling action game developed as a personal project. Players battle enemies 
            while trying to dodge projectiles to survive as long as possible. The project focuses on responsive controls, 
            smooth animations, collision detection, and game state management.

            Building this game helped me strengthen my understanding of JavaScript programming, object-oriented design, 
            animation loops, and gameplay mechanics. It also introduced me to balancing game feel with technical implementation.
        `,
    },
    PosterFace: {
        title: "",
        content: "",
    },
};

const xAxisFans = [];
const yAxisFans = [];

const fishTankMaterialParams = {
    color: 0x58DEEA,
    transmission: 1,
    opacity: 1,
    metalness: 0,
    roughness: 0,
    ior: 1.5,
    thickness: 2,
    specularIntensity: 1,
    specularColor: 0xffffff,
    envMapIntensity: 1,
    lightIntensity: 1,
    exposure: 1,
    transmissionResolutionScale: 1
};

const waterMaterial = new THREE.MeshBasicMaterial({
    color: "#97daf2",
    opacity: 0.55,
    transparent: true,
    depthWrite: false,
});

const basePosterMaterial = new THREE.MeshBasicMaterial({
    color: "#FFFFFF",
});

let chair;

//* .blenderScreen will be added later while using glb loader
let screens = {
    MainScreen: {
        blenderScreen: null,
        HTMLScreen: computerScreen,
    },
    SecondaryScreen: {
        blenderScreen: null,
        HTMLScreen: secondaryScreen,
    },
    CurvedScreenLeft: {
        blenderScreen: null,
        HTMLScreen: null,
    },
    CurvedScreenRight: {
        blenderScreen: null,
        HTMLScreen: null,
    },
};

let screensCameraSetup = {
    MainScreen: {
        cameraPosition: new THREE.Vector3(1.1376318374353256, 2.625332732007968, -1.1033303418694915),
        cameraRotation: new THREE.Vector3(0.008608413183825487, -0.009441638061395847, 0.0000812783215305333),
        controlTarget: new THREE.Vector3(1.1838382731429438, 2.6674596760435043, -5.996903934147951),
    },
    SecondaryScreen: {
        cameraPosition: new THREE.Vector3(0.45737895175077803, 2.5263462682969715, -1.303217942295233),
        cameraRotation: new THREE.Vector3(0.02995650471700379, 0.22393310747280412, -0.006654220625666162),
        controlTarget: new THREE.Vector3(0.39590855747779835, 2.534430306082941, -1.5729963938719267),
    },
    CurvedScreenLeft: {
        cameraPosition: new THREE.Vector3(1.7231093112127138, 3.4235485989386425, -1.4422896758064192),
        cameraRotation: new THREE.Vector3(0.029221765577782145, -0.030032343233555216, 0.0008777157954170207),
        controlTarget: new THREE.Vector3(1.7757907480413642, 3.474785450868889, -3.1951703171154904),
    },
    CurvedScreenRight: {
        cameraPosition: new THREE.Vector3(1.428514411871587, 3.4278076130777326, -1.6286142827849015),
        cameraRotation: new THREE.Vector3(1.2582536371610413, -1.5400998175449685, 1.2581157421221805),
        controlTarget: new THREE.Vector3(3.3715547822070477, 3.484580511684444, -1.6469595020161787),
    },
};

const savedCameraLastPosition = {
    cameraPosition: null,
    cameraRotation: null,
    controlTarget: null,
};

//* Objects that animate together
let FishTankGlass;
let Water;
let Fish;

let PictureFrame1;
let ShelfImage1;

let PictureFrame2;
let ShelfImage2;

const pairObjectsThatAnimateTogether = () => {

    //* When an object got added as another child of another obhect, if they have the some origin
    //* just need to set the position of the child to be 0, 0, 0 to retain its position in 3d-space

    //* Scale the object to 1, 1, 1 to avoid unexpected morphing when children got added

    if (FishTankGlass && Water) {
        FishTankGlass.add(Water);
        Water.position.set(0, 0, 0);
        Water.scale.set(1, 1, 1);
    };
    if (FishTankGlass && Fish) {
        FishTankGlass.add(Fish);
        Fish.position.set(0, 0, 0);
        Fish.scale.set(1, 1, 1);
    };
    if (PictureFrame1 && ShelfImage1) {
        PictureFrame1.add(ShelfImage1);
        ShelfImage1.position.set(0, 0, 0);
        ShelfImage1.scale.set(1, 1, 1);
    };
    if (PictureFrame2 && ShelfImage2) {
        PictureFrame2.add(ShelfImage2);
        ShelfImage2.position.set(0, 0, 0);
        ShelfImage2.scale.set(1, 1, 1);
    };

};

let pianoSounds = {};

//* Add sounds pianoSounds object
for (let i = 1; i < 25; i++) {

    const map = `/audio/${i}.mp3`;
    const name = `PianoKey${i}`;

    pianoSounds[name] = new Howl(
        { 
            src: [map],
            volume: 0.5, 
        }
    );

};

//? ---------------------Loaders start---------------------
//* Loading cube texture for reflection and background
const environmentLoader = new THREE.CubeTextureLoader( manager ).setPath("/textures/sky-textures/");
const environmentMap = environmentLoader.load( ['px.webp', 'nx.webp', 'py.webp', 'ny.webp', 'pz.webp', 'nz.webp'] );


//* Loading texture images
const textureLoader = new THREE.TextureLoader( manager );

//* Loading images
const imageMap = {
    PosterFace: "/textures/images/nine-sols.webp",
    ShelfImage1: "/textures/images/hollow-knight.webp",
    ShelfImage2: "/textures/images/silksong.webp"
};

const loadedImages = {};

Object.entries(imageMap).forEach(([key, map]) => {

    textureLoader.load(map, (texture) => {
        texture.flipY = false;
        texture.colorSpace = THREE.SRGBColorSpace;
        loadedImages[key] = texture;
    });

});

//* Loading baked texture
const textureMap = {
    FurnitureBake: "textures/bake-textures/FurnitureBake.webp",
    MiscThingsBake: "textures/bake-textures/MiscellaneousThingsBake.webp",
    MiscThings2Bake: "textures/bake-textures/MiscellaneousThings2Bake.webp",
    RoomBake: "textures/bake-textures/RoomBake.webp",
    ShelvesBake: "textures/bake-textures/ShelvesBake.webp",
    TableThingsBake: "textures/bake-textures/TableThingsBake.webp",
};

const loadedTexture = {};

Object.entries(textureMap).forEach(( [key, value] ) => {

    textureLoader.load( value, (texture) => {
        //? Adjust the texture before loading
        texture.flipY = false;
        texture.colorSpace = THREE.SRGBColorSpace;
        loadedTexture[key] = texture;
    });

});

//* Loading model
let loadedGLB;

const loader = new GLTFLoader( manager );
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");
loader.setDRACOLoader(dracoLoader);

//* Only apply texture to 3d-objects after textureLoader has completed loading the baked images
const applyingTextureAfterLoad = (loadedGLB) => {

    loadedGLB.scene.traverse((children) => {

        if (children.isMesh) {

            let textureName;

            const checkTexture = (loadedTextureKeys, idsArray) => {

                return loadedTextureKeys.some(texture => {

                    if (idsArray.includes(texture)) {
                        textureName = texture;
                        return true;
                    } else {
                        return false;
                    };

                });

            };

            //* Check if children use material from baking (loadedTexture) or from images (loadedImages)
            if (checkTexture(Object.keys(loadedTexture), children.name.split("_"))) {
                const material = new THREE.MeshBasicMaterial(
                    { map: loadedTexture[textureName] }
                );
                children.material = material;
            } else if (checkTexture(Object.keys(loadedImages), children.name.split("_"))) {
                const material = new THREE.MeshBasicMaterial(
                    { map: loadedImages[textureName] }
                );
                children.material = material;
            };

            //* Add objects to raycastingObject and save scale, rotation, and location data
            if (children.name.includes("Raycaster")) {

                children.userData.initialScale = new THREE.Vector3().copy(children.scale);
                children.userData.initialRotation = new THREE.Euler().copy(children.rotation);
                children.userData.initialPosition = new THREE.Vector3().copy(children.position);

                if (children.name.includes("Hitbox")) {
                    const hitbox = createStaticHitbox(children);
                    raycastingObjects.push(hitbox);
                    scene.add(hitbox);
                } else {
                    raycastingObjects.push(children);
                };
            
            };

            //* Reducing seams when camera is far away
            if (children.material.map) {
                children.material.map.minFilter = THREE.LinearFilter; 
            };


            //* Assign glassy materials to glass objects
            if (children.name.includes("Glass")) {

                const glassMaterial = new THREE.MeshPhysicalMaterial( {
					color: children.name.includes("Water") ? fishTankMaterialParams.color : 0xffffff,
					metalness: fishTankMaterialParams.metalness,
					roughness: fishTankMaterialParams.roughness,
					ior: fishTankMaterialParams.ior,
					envMapIntensity: fishTankMaterialParams.envMapIntensity,
                    envMap: environmentMap,
					transmission: fishTankMaterialParams.transmission, // use material.transmission for glass materials
					specularIntensity: fishTankMaterialParams.specularIntensity,
					specularColor: fishTankMaterialParams.specularColor,
					opacity: fishTankMaterialParams.opacity,
                    depthWrite: false,
					transparent: true
				} );

                children.material = glassMaterial;

            };

            //* Save objects that animate together into global variables
            if (children.name.includes("FishTankGlass")) {
                FishTankGlass = children;
            };

            if (children.name.includes("Water")) {
                //* Assign water material to water in fishtank
                children.material = waterMaterial;
                Water = children;
            };

            if (children.name.includes("FishPet")) {
                Fish = children;
            };

            if (children.name.includes("PictureFrame1")) {
                PictureFrame1 = children;
            };

            if (children.name.includes("ShelfImage1")) {
                ShelfImage1 = children;
            };

            if (children.name.includes("PictureFrame2")) {
                PictureFrame2 = children;
            };

            if (children.name.includes("ShelfImage2")) {
                ShelfImage2 = children;
            };


            //* Add fans to array to animate later
            if (children.name.includes("PCFan")) {
                if (children.name.includes("PCFan1") || children.name.includes("PCFan2")) {
                    yAxisFans.push(children);
                } else {
                    xAxisFans.push(children);
                };
            };


            //* Add chair to object to animate later
            if (children.name.includes("Chair") && children.name.includes("SpinningPart")) {
                chair = children;
                //? Have to redo saving initial information because chair does not have "Raycast" for its information to be saved previously
                chair.userData.initialRotation = new THREE.Vector3().copy(chair.rotation);
                chair.userData.initialPosition = new THREE.Vector3().copy(chair.position);
                chair.userData.initialScale = new THREE.Vector3().copy(chair.scale);
            };
            //* Hide clicking hitbox for chair
            if (children.name.includes("Chair") && children.name.includes("Hitbox")) {
                children.material.opacity = 0;
                children.material.visible = false;
                children.material.transparent = true;
            };


            //* Take out and save computer screen objects to use for adding css3DObjects later
            if (children.name.includes("Screen")) {
                
                Object.keys(screens).forEach( (screen) => {
                    if (children.name.includes(screen)) {
                        screens[screen].blenderScreen = children;
                    };
                });

            };

            //* Assign white material to PosterBase because forgot to bake it in Blender
            if (children.name.includes("PosterBase")) {

                children.material = basePosterMaterial;

            };


            //* If name includes Animate, then save them to an array to use gsap to animate them later
            if (children.name.includes("Animate")) {

                children.scale.set(0, 0, 0);

                if (introAnimatedObjects.length === 0) {
                    introAnimatedObjects.push(children);
                } else {
                    let index = 0;
                    const currentChildrenOrder = Number(children.name.match(/\d+$/));
                    
                    introAnimatedObjects.some((object) => {
                        const objectOrder = Number(object.name.match(/\d+$/));
                        if (currentChildrenOrder > objectOrder) {
                            index++;
                            return false;
                        } else {
                            return true;
                        };
                    });

                    introAnimatedObjects.splice(index, 0, children);

                };

            };

        };

    });

};

loader.load("/model/model_15.glb", (glb) => {

    loadedGLB = glb;

}, undefined, (error) => {

    console.log(error);

});

const addHTMLScreensTo3dScreens = () => {

    Object.entries(screens).forEach(( [screenType, screens] ) => {

        if (!screens.HTMLScreen || !screens.blenderScreen) return;

        const HTMLScreenIn3D = new CSS3DObject(screens.HTMLScreen);
        const blenderScreen = screens.blenderScreen;

        const blenderScreenPosition = blenderScreen.getWorldPosition(new THREE.Vector3());

        HTMLScreenIn3D.position.copy(blenderScreenPosition);
        HTMLScreenIn3D.rotation.copy(blenderScreen.rotation);
        HTMLScreenIn3D.position.z += 0.001;
        HTMLScreenIn3D.scale.multiplyScalar(0.001);
        scene.add(HTMLScreenIn3D);

    });

};


//! ---------------------Loader ends here---------------------


//? ---------------------Three=related starts here---------------------

const createStaticHitbox = (needHitboxObject) => {

    //* Take out the size and center of the needHitboxObject
    const boundingBox = new THREE.Box3().setFromObject(needHitboxObject);
    const boundingBoxSize = boundingBox.getSize(new THREE.Vector3());
    const boundingBoxCenter = boundingBox.getCenter(new THREE.Vector3());

    const scaleVector = new THREE.Vector3(1.05, 1.2, 1.05);

    const hitboxGeometry = new THREE.BoxGeometry(
        boundingBoxSize.x * scaleVector.x,
        boundingBoxSize.y * scaleVector.y,
        boundingBoxSize.z * scaleVector.z
    );

    const hitboxMaterial = new THREE.MeshBasicMaterial({
        opacity: 0,
        visible: false
    });

    const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
    hitbox.position.copy(boundingBoxCenter);
    hitbox.name = `HitboxOf_${needHitboxObject.name}`;
    hitbox.userData.originalObject = needHitboxObject;

    return hitbox;
};

//! ---------------------Three-related ends here---------------------


//? ---------------------GSAP starts here---------------------

//* Open out the app display
const animateOpenApp = () => {

    gsap.to(app, {
        clipPath: `circle(100%)`,
        duration: 2.2,
        ease: "power3.inOut"
    });

};

const animateSpanningIntroCameraIn = () => {

    const tl = gsap.timeline({ onComplete : () => {
        controls.enabled = true;
        setControlRestriction();
        raycastingDisabled = false;
    }});;

    tl.to(camera.position, {
        x: -5.59665505370341, 
        y: 6.242541521616802, 
        z: 6.2383775257877785,
        ease: "power1.out",
        duration: 2.4,
    }, "0");

    tl.to(camera.rotation, {
        x: -0.5604655324858362, 
        y: -0.6159682033512951, 
        z: -0.3478503248212963,
        ease: "power1.inOut",
        duration: 2.4,
    }, "0");

    tl.to(controls.target, {
        x: -0.10803899999999998, 
        y: 2.1206459999999997, 
        z: -0.329352,
        ease: "power1.inOut",
        duration: 2.4,
    }, "0");

};

//* Intro animation for some objects
const animateObjectsIntroAnimation = () => {

    if (introAnimatedObjects.length > 0) {

        //* Divide the 3d objects in the introAnimatedObjects array into three smaller arrays to animate seperately
        let tl1ObjectsArray = [];
        let tl2ObjectsArray = [];
        let tl3ObjectsArray = [];

        introAnimatedObjects.forEach(object => {
            if (object.name.includes("PianoKey")) {
                tl3ObjectsArray.push(object);
            } else {
                const order = Number(object.name.match(/\d+$/));
                if (order >= 45) {
                    tl2ObjectsArray.unshift(object);
                } else {
                    tl1ObjectsArray.push(object);
                };
            };
        });


        //* Timelime for objects lower on the ground
        const tl1 = gsap.timeline();

        tl1ObjectsArray.forEach((object) => {
            const objectOriginalScale = new THREE.Vector3().copy(object.userData.initialScale);

            tl1.to(object.scale, {
                x: objectOriginalScale.x,
                y: objectOriginalScale.y,
                z: objectOriginalScale.z,
                ease: "bounce.out",
                duration: 0.5,
            }, "-=0.4");
        });

        
        //* Timeline for objects on shelves or on high
        const tl2 = gsap.timeline();

        tl2ObjectsArray.forEach((object) => {
            const objectOriginalScale = new THREE.Vector3().copy(object.userData.initialScale);

            tl2.to(object.scale, {
                x: objectOriginalScale.x,
                y: objectOriginalScale.y,
                z: objectOriginalScale.z,
                ease: "bounce.out",
                duration: 0.65,
            }, "-=0.6");
        });


        //* Timeline for pianokeys
        const tl3 = gsap.timeline();

        tl3ObjectsArray.forEach((object) => {
            const objectOriginalScale = new THREE.Vector3().copy(object.userData.initialScale);

            tl3.to(object.scale, {
                x: objectOriginalScale.x,
                y: objectOriginalScale.y,
                z: objectOriginalScale.z,
                ease: "bounce.out",
                duration: 0.35,
            }, "-=0.3");
        });

    };
};

//* Animate fan rotation
const animateFan = () => {

    if (xAxisFans.length < 1 || yAxisFans.length < 1) return;

    for (let i = 0; i < xAxisFans.length; i++) {

        const fan = xAxisFans[i];

        const tl = gsap.timeline( { repeat: -1 } );
        gsap.set(fan.rotation, { x : 0 });
        tl.timeScale(0.5);

        tl.to(fan.rotation, {
            x: Math.PI * 2,
            ease: "none",
            duration: 1,
        });

    };

    for (let i = 0; i < yAxisFans.length; i++) {

        const fan = yAxisFans[i];

        const tl = gsap.timeline( { repeat: -1 } );
        gsap.set(fan.rotation, { y : 0 });
        tl.timeScale(0.5);

        tl.to(fan.rotation, {
            y: Math.PI * 2,
            ease: "none",
            duration: 1,
        });

    };
};


const animateChair = () => {

    const rotation = Math.PI / 18;
    chair.userData.animation = gsap.timeline( {yoyo: true, repeat: -1} );

    chair.userData.animation.to(chair.rotation, {
        y: chair.userData.initialRotation.y + rotation,
        duration: 4,
        ease: "power1.inOut"
    });

    chair.userData.animation.to(chair.rotation, {
        y: chair.userData.initialRotation.y - rotation * 2.5,
        duration: 7,
        ease: "power1.inOut"
    }, ">");

};


const animateSpinningChairOnClick = () => {

    //* Pause chair animation before play this click spinning animation
    chair.userData.animation.pause();
    gsap.to(chair.rotation, {
        y: "+=" + Math.PI * 2,
        duration: 1.5,
        ease: "power2.out",
        onComplete: () => chair.userData.animation.play(),
    });

};


const setDefaultControl = () => {

    controls.targetMinClamp.set(-999, -999, -999);
    controls.targetMaxClamp.set(999, 999, 999);

    controls.minDistance = 0;
    controls.maxDistance = 999;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minAzimuthAngle = Infinity;
    controls.maxAzimuthAngle = Infinity;

};

const setControlRestriction = () => {

    controls.targetMinClamp.copy(controls.targetDefaultMinClamp);
    controls.targetMaxClamp.copy(controls.targetDefaultMaxClamp);

    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI / 2.8;
    controls.minAzimuthAngle = -Math.PI / 2.8;
    controls.maxAzimuthAngle = 0;
    controls.minDistance = 3.5;
    controls.maxDistance = 9.5;

};

const moveCameraToScreens = (currentScreen) => {

    raycastingDisabled = true;
    setDefaultControl();

    //* Only save camera last position before moving when there is no saved position beforehand
    //* This prevents mistakenly save the last position when moving from one screen directly to another
    const haveSavedCameraPosition = savedCameraLastPosition.cameraPosition
                                    && savedCameraLastPosition.cameraRotation
                                    && savedCameraLastPosition.controlTarget;
    if (!haveSavedCameraPosition) {
        savedCameraLastPosition.cameraPosition = new THREE.Vector3().copy(camera.position);
        savedCameraLastPosition.cameraRotation = new THREE.Vector3().copy(camera.rotation);
        savedCameraLastPosition.controlTarget = new THREE.Vector3().copy(controls.target);
    };

    controls.enabled = false;
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(camera.rotation);
    gsap.killTweensOf(controls.target);

    Object.keys(screensCameraSetup).forEach(screenName => {

        if (currentScreen.name.includes(screenName)) {
            const cameraTargetPosition = new THREE.Vector3().copy(screensCameraSetup[screenName].cameraPosition);
            const cameraTargetRotation = new THREE.Vector3().copy(screensCameraSetup[screenName].cameraRotation)
            const controlTarget = new THREE.Vector3().copy(screensCameraSetup[screenName].controlTarget);

            //* Have to animate
            const tl = gsap.timeline({ onComplete: () => {
                controls.enabled = true;
                raycastingDisabled = false;
            }});

            tl.to(camera.position, {
                x: cameraTargetPosition.x,
                y: cameraTargetPosition.y,
                z: cameraTargetPosition.z,
                duration: 1.3,
                ease: "power2.inOut",
            }, "0");

            tl.to(camera.rotation, {
                x: cameraTargetRotation.x,
                y: cameraTargetRotation.y,
                z: cameraTargetRotation.z,
                duration: 1.3,
                ease: "power2.inOut",
            }, "0");

            tl.to(controls.target, {
                x: controlTarget.x,
                y: controlTarget.y,
                z: controlTarget.z,
                duration: 1.3,
                ease: "power2.inOut",
            }, "0");
        };

    });

};

const moveCameraToPreviousLocation = () => {

    if (
        !savedCameraLastPosition.cameraPosition || 
        !savedCameraLastPosition.cameraRotation || 
        !savedCameraLastPosition.controlTarget
    ) return;

    raycastingDisabled = true;

    controls.enabled = false;
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(camera.rotation);
    gsap.killTweensOf(controls.target);

    const tl = gsap.timeline( { onComplete: () => {
        controls.enabled = true;
        setControlRestriction();
        raycastingDisabled = false;
    }});

    tl.to(camera.position, {
        x: savedCameraLastPosition.cameraPosition.x,
        y: savedCameraLastPosition.cameraPosition.y,
        z: savedCameraLastPosition.cameraPosition.z,
        duration: 1.1,
        ease: "power1.inOut",
    }, "0");

    tl.to(camera.rotation, {
        x: savedCameraLastPosition.cameraRotation.x,
        y: savedCameraLastPosition.cameraRotation.y,
        z: savedCameraLastPosition.cameraRotation.z,
        duration: 1.1,
        ease: "power1.inOut",
    }, "0");

    tl.to(controls.target, {
        x: savedCameraLastPosition.controlTarget.x,
        y: savedCameraLastPosition.controlTarget.y,
        z: savedCameraLastPosition.controlTarget.z,
        duration: 1.1,
        ease: "power1.inOut",
    }, "0");

};

const animateForwardHoverAnimation = (currentObject) => {

    let animatedObject;
    if (currentObject.name.includes("HitboxOf")) animatedObject = currentObject.userData.originalObject;
    else animatedObject = currentObject;

    //? This resets the forward hovering animation when user move the mouse out.
    //? Allow the backwardHoverAnimation to restore the object to normal
    gsap.killTweensOf(animatedObject.scale);
    gsap.killTweensOf(animatedObject.rotation);
    gsap.killTweensOf(animatedObject.position);

    const scaleFactor = 1.3;

    if (animatedObject.name.includes("Drawer")) {

        const distance = 0.08;

        gsap.to(animatedObject.position, {
            z: animatedObject.userData.initialPosition.z + distance,
            duration: 1.5,
            ease: "expoScale(0.5,7,power2.out)",
        });

    } else if (animatedObject.name.includes("PianoKey")) {
        
        const keyName = animatedObject.name.split("_")[0];
        const rotation = 0.03;

        gsap.to(animatedObject.rotation, {
            z: animatedObject.userData.initialRotation.z + rotation,
            duration: 0.05,
            ease: "power3.inOut",
        });

    } else if (animatedObject.name.includes("KeyboardKey")) {
        const distance = 0.1;

        gsap.to(animatedObject.position, {
            y: animatedObject.userData.initialPosition.y + distance,
            duration: 0.1,
            ease: "power1.inOut",
        });

    } else if (animatedObject.name.includes("Boba")) {
        const distance = 0.5;
        const scaleFactor = 1.2;
        const tl = gsap.timeline();
        
        tl.to(animatedObject.position, {
            y: animatedObject.userData.initialPosition.y + distance,
            duration: 0.4,
            ease: "power1.out",
        }, "0");

        tl.to(animatedObject.rotation, {
            y: animatedObject.userData.initialRotation.y + Math.PI * 2,
            ease: "power2.out",
            duration: 0.4,
        }, "0");

        tl.to(animatedObject.scale, {
            x: scaleFactor,
            y: scaleFactor,
            z: scaleFactor,
            ease: "bounce.inOut",
            duration: 0.2,
        }, "0");

    } else if (animatedObject.name.includes("Screen")) {

        moveCameraToScreens(animatedObject);
        //* Show screen content while the camera move to the screen
        showScreenWhenHover(animatedObject);

    } else {

        gsap.to(animatedObject.scale, {
            x: animatedObject.userData.initialScale.x * scaleFactor,
            y: animatedObject.userData.initialScale.y * scaleFactor,
            z: animatedObject.userData.initialScale.z * scaleFactor,
            duration: 0.8,
            ease: "elastic.out(1,0.3)",
        });

    };

};

const animateBackwardHoverAnimation = (currentObject) => {

    let animatedObject;
    if (currentObject.name.includes("HitboxOf")) animatedObject = currentObject.userData.originalObject;
    else animatedObject = currentObject;

    //? This resets the forward hovering animation when user move the mouse out.
    //? Allow the backwardHoverAnimation to restore the object to normal
    gsap.killTweensOf(animatedObject.scale);
    gsap.killTweensOf(animatedObject.rotation);
    gsap.killTweensOf(animatedObject.position);

    if (animatedObject.name.includes("Screen")) {

        //* Hide screen when unhover screen
        hideScreenWhenUnhover(animatedObject);

    } else {

        gsap.to(animatedObject.scale, {
            x: animatedObject.userData.initialScale.x,
            y: animatedObject.userData.initialScale.y,
            z: animatedObject.userData.initialScale.z,
            duration: 0.3,
            ease: "circ.out",
        });

        gsap.to(animatedObject.position, {
            y: animatedObject.userData.initialPosition.y,
            z: animatedObject.userData.initialPosition.z,
            x: animatedObject.userData.initialPosition.x,
            duration: 0.3,
            ease: "circ.out",
        });

        gsap.to(animatedObject.rotation, {
            x: animatedObject.userData.initialRotation.x,
            y: animatedObject.userData.initialRotation.y,
            z: animatedObject.userData.initialRotation.z,
            duration: 0.3,
            ease: "circ.out",
        });

    };
};

//! ---------------------GSAP ends here---------------------


//? ---------------------Raycasting starts---------------------

let currentIntersectObjects;
const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

window.addEventListener("mousemove", (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y =  - (event.clientY / window.innerHeight) * 2 + 1;
});

//! ---------------------Raycasting ends---------------------


//* ---------------------Controls---------------------
const controls = new OrbitControls( camera );

setDefaultControl();

controls.connect( rendererCSS3D.domElement );
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.copy(CONTROL_INITIAL_TARGET);
controls.enabled = false;

controls.addEventListener("start", () => raycastingDisabled = true);
controls.addEventListener("end", () => raycastingDisabled = false);


//? ---------------------Event listeners starts---------------------
//* Adjusting screen
const handleWindowResize = () => {

    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    rendererCSS3D.setSize(sizes.width, sizes.height);
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

};
window.addEventListener("resize", handleWindowResize);


//* Handle press start button
const handleStartButtonClick = () => {

    animateOpenApp();
    animateSpanningIntroCameraIn();

    setTimeout(() => animateObjectsIntroAnimation(), 1400);

};
startButton.addEventListener("click", handleStartButtonClick);
startButton.addEventListener("touchend", handleStartButtonClick);


//* Handle interaction. Used in touch and click eventlistener below
const handleInteraction = () => {

    if (currentIntersectObjects?.length > 0) {

        const intersectObject = currentIntersectObjects[0].object;

        //* Open new tab when user press on LinkedIn icon or Youtube icon
        Object.entries(socialLinks).forEach(( [socialMedia, link] ) => {

            if (intersectObject.name.includes(socialMedia)) {

                const newWindow = window.open();
                newWindow.location = link;
                newWindow.opener = "none";
                newWindow.target = "_blank";
                newWindow.rel = "noopener noreferrer";

            };

        });

        
        //* Spin chair when press on chair
        if (intersectObject.name.includes("HitboxOf") && intersectObject.name.includes("Chair")) {
            animateSpinningChairOnClick();
        };


        //* Play pianoSound when press on pianoKey
        if (intersectObject.name.includes("HitboxOf") && intersectObject.name.includes("PianoKey")) {

            //* The [0] item after split would be "HitboxOf", the [1] one is the object's name
            const keyName = intersectObject.name.split("_")[1];
            console.log(keyName);
            pianoSounds[keyName].play();

        };
    };

};

//* Handle touch paired with raycasting
const handleWindowTouchStart = (event) => {
    event.preventDefault();
    pointer.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
}
window.addEventListener("touchstart", handleWindowTouchStart, { passive: false });

const handleWindowTouchEnd = (event) => {
    event.preventDefault();
    handleInteraction();
};
window.addEventListener("touchend", handleWindowTouchEnd, { passive: false });

//* Handle click paired with raycasting
const handleWindowMouseClick = () => {
    handleInteraction();
};
window.addEventListener("click", handleWindowMouseClick);


//! ---------------------Event listeners ends---------------------

//* ----------------------------Raycasting----------------------------
const raycasting = () => {

    //* If camera is moving then dont raycast so that the camera is not glitched around by hover movement
    if (raycastingDisabled) return;

    raycaster.setFromCamera(pointer, camera);
    currentIntersectObjects = raycaster.intersectObjects(raycastingObjects);

    if (currentIntersectObjects.length > 0) document.body.style.cursor = "pointer";
    else document.body.style.cursor = "default";

    //* ----------------------------Hovering effect starts----------------------------

    let currentIntersectObjectWithHoverId = null;

    if (currentIntersectObjects?.length > 0 
        && currentIntersectObjects[0].object.name.includes("Hover")) {
        currentIntersectObjectWithHoverId = currentIntersectObjects[0].object;
    };

    if (currentIntersectObjectWithHoverId !== justHoveredOverObject) {

        if (currentIntersectObjectWithHoverId) {
            //* If the next hovered object is a 3dObject, then trigger animation
            animateForwardHoverAnimation(currentIntersectObjectWithHoverId);
        } else {
            //* If cursor does not detect hover object and there is savedCameraPosition, return camera to previous position
            const haveSavedCameraPosition = savedCameraLastPosition.cameraPosition
                                      && savedCameraLastPosition.cameraRotation
                                      && savedCameraLastPosition.controlTarget;

            if (haveSavedCameraPosition) {
                moveCameraToPreviousLocation();
                savedCameraLastPosition.cameraPosition = null;
                savedCameraLastPosition.cameraRotation = null;
                savedCameraLastPosition.controlTarget = null;
            };
        };

        //* If the just hovered out object is a 3d object, then trigger animation
        if (justHoveredOverObject) animateBackwardHoverAnimation(justHoveredOverObject);
        justHoveredOverObject = currentIntersectObjectWithHoverId;
    };   

};

//* ----------------------------Other stuffs----------------------------

const showScreenWhenHover = (screen3DObject) => {
    
    //* Query the main-content-container and icon-container divs in the html screen and toggle class transition
    const screenName = screen3DObject.name.split("_")[0];
    if (!screenName) return;

    const screenElement = document.getElementById(screenName);
    if (!screenElement) return;

    const screenContentContainer = screenElement.querySelector(".main-content-container");
    const screenIconContainer = screenElement.querySelector(".icon-container");
    if (!screenContentContainer || !screenIconContainer) return;

    screenContentContainer.classList.remove("hide");
    screenIconContainer.classList.add("hide");
    
};

const hideScreenWhenUnhover = (justHoveredOverObject) => {

    //* Query the main-content-container and icon-container divs in the html screen and toggle class transition
    const screenName = justHoveredOverObject.name.split("_")[0];
    if (!screenName) return;

    const screenElement = document.getElementById(screenName);
    if (!screenElement) return;

    const screenContentContainer = screenElement.querySelector(".main-content-container");
    const screenIconContainer = screenElement.querySelector(".icon-container");
    if (!screenContentContainer || !screenIconContainer) return;

    screenContentContainer.classList.add("hide");
    screenIconContainer.classList.remove("hide");
    
};

const animate = ( time ) => {

    controls.update();

    raycasting();

    rendererCSS3D.render( scene, camera );

    renderer.render( scene, camera );
};

renderer.setAnimationLoop( animate );

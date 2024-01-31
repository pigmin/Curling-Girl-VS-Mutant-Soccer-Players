import { ActionManager, Color3, Color4, FollowCamera, FreeCamera, HavokPlugin, HemisphericLight, InterpolateValueAction, KeyboardEventTypes, Mesh, MeshBuilder, ParticleSystem, PhysicsAggregate, PhysicsHelper, PhysicsMotionType, PhysicsRadialImpulseFalloff, PhysicsShapeType, Scene, SetValueAction, ShadowGenerator, SpotLight, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";
import { Inspector } from '@babylonjs/inspector';
import HavokPhysics from "@babylonjs/havok";

import floorUrl from "../assets/textures/floor.png";
import floorBumpUrl from "../assets/textures/floor_bump.png";
import Player from "./player";
import Arena from "./arena";
import CurlingStone from "./curlingStone";
import { GlobalManager } from "./globalmanager";
import { InputController } from "./inputcontroller";

class Game {

    #canvas;
    #engine;
    #havokInstance;

    #gameCamera;

    #bInspector = false;

    #elevator;
    #elevatorAggregate;


    #phase = 0.0;
    #vitesseY = 1.8;


    #arena;
    #player;
    #curlingStone;

    constructor(canvas, engine) {
        this.#canvas = canvas;
        this.#engine = engine;
        GlobalManager.init(canvas, engine);
    }

    async start() {
        await this.initGame()
        this.gameLoop();
        this.endGame();
    }

    createScene() {


        const hk = new HavokPlugin(true, this.#havokInstance);
        // enable physics in the scene with a gravity
        GlobalManager.scene.enablePhysics(new Vector3(0, -9.81, 0), hk);

        this.#gameCamera = new FollowCamera("camera1", Vector3.Zero(), GlobalManager.scene);
        this.#gameCamera.heightOffset = 4;
        this.#gameCamera.radius = -8;
        this.#gameCamera.maxCameraSpeed = 1;
        this.#gameCamera.cameraAcceleration = 0.025;
        this.#gameCamera.rotationOffset = 0;
        //this.#gameCamera.setTarget(Vector3.Zero());
        //this.#gameCamera.attachControl(this.#canvas, true);

        const light = new HemisphericLight("light", new Vector3(0, 1, 0), GlobalManager.scene);
        light.intensity = 0.4;
        light.diffuse = new Color3(.5, .5, .7);
        light.specular = new Color3(1, 1, 1);
        light.groundColor = new Color3(.7, .7, .9);

        const sLight = new SpotLight("spot1", new Vector3(0, 20, 30), new Vector3(0, -1, -0.5), 2 * Math.PI / 3, 15, GlobalManager.scene);
        sLight.shadowMinZ = 1;
        sLight.shadowMaxZ = 200;
        sLight.diffuse = new Color3(222, 222, 240);
        sLight.intensity = 7;

        const shadowGenerator = new ShadowGenerator(1024, sLight);
        shadowGenerator.useBlurExponentialShadowMap = true;
        shadowGenerator.frustumEdgeFalloff = 1.0;
        shadowGenerator.setDarkness(0.1);
        GlobalManager.addShadowGenerator(shadowGenerator);

        const sLight2 = new SpotLight("spot2", new Vector3(0, 20, -30), new Vector3(0, -1, 0.5), 2 * Math.PI / 3, 15, GlobalManager.scene);
        sLight2.shadowMinZ = 1;
        sLight2.shadowMaxZ = 200;
        sLight2.diffuse = new Color3(222, 222, 240);
        sLight2.intensity = 7;

        const shadowGenerator2 = new ShadowGenerator(1024, sLight2);
        shadowGenerator2.useBlurExponentialShadowMap = true;
        shadowGenerator2.frustumEdgeFalloff = 1.0;
        shadowGenerator2.setDarkness(0.1);
        GlobalManager.addShadowGenerator(shadowGenerator2);


        const elevator = MeshBuilder.CreateDisc("sphere", { diameter: 2, segments: 32 }, GlobalManager.scene);
        elevator.rotate(Vector3.Right(), Math.PI / 2)
        elevator.position = new Vector3(30, 0, 30);
        this.#elevator = elevator;

        const ground = MeshBuilder.CreateGround("ground", { width: 640, height: 640, subdivisions: 128 }, GlobalManager.scene);
        ground.position = new Vector3(0, -0.1, 0);

        const matGround = new StandardMaterial("boue", GlobalManager.scene);
        //matGround.diffuseColor = new Color3(1, 0.4, 0);
        matGround.diffuseTexture = new Texture(floorUrl);
        matGround.diffuseTexture.uScale = 64;
        matGround.diffuseTexture.vScale = 64;
        matGround.bumpTexture = new Texture(floorBumpUrl);
        matGround.bumpTexture.uScale = 64;
        matGround.bumpTexture.vScale = 64;

        ground.material = matGround;
        ground.receiveShadows = true;
        // Create a static box shape.
        const groundAggregate = new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0, friction: 0.7, restitution: 0.2 }, GlobalManager.scene);
        groundAggregate.body.setMotionType(PhysicsMotionType.STATIC);

        const matSphere = new StandardMaterial("silver", GlobalManager.scene);
        matSphere.diffuseColor = new Color3(0.8, 0.8, 1);
        matSphere.specularColor = new Color3(0.4, 0.4, 1);
        elevator.material = matSphere;

        GlobalManager.addShadowCaster(elevator);


        // Create a sphere shape and the associated body. Size will be determined automatically.
        this.#elevatorAggregate = new PhysicsAggregate(elevator, PhysicsShapeType.CONVEX_HULL, { mass: 1, restitution: 0.0 }, GlobalManager.scene);
        this.#elevatorAggregate.body.setMotionType(PhysicsMotionType.ANIMATED);
    }

    async getInitializedHavok() {
        return await HavokPhysics();
    }

    async initGame() {

        this.#havokInstance = await this.getInitializedHavok();
        GlobalManager.scene = new Scene(this.#engine);
        GlobalManager.scene.collisionsEnabled = true;

        InputController.init();

        this.createScene();

        this.#player = new Player(3, 2, 3);
        await this.#player.init();
        this.#gameCamera.lockedTarget = this.#player.transform;
        GlobalManager.addShadowCaster(this.#player.gameObject, true);

        this.#arena = new Arena(0, 0, 0);
        await this.#arena.init();
        GlobalManager.addShadowCaster(this.#arena.gameObject, true);

        this.#curlingStone = new CurlingStone(0, 1, 0, this.scene);
        await this.#curlingStone.init();
        GlobalManager.addShadowCaster(this.#curlingStone.gameObject);
    }


    endGame() {

    }

    gameLoop() {

        const divFps = document.getElementById("fps");
        this.#engine.runRenderLoop(() => {

            this.updateGame();


            //Debug
            if (InputController.actions["KeyI"]) {
                this.#bInspector = !this.#bInspector;

                if (this.#bInspector)
                    Inspector.Show();
                else
                    Inspector.Hide();
            }

            InputController.resetActions();
            divFps.innerHTML = this.#engine.getFps().toFixed() + " fps";
            GlobalManager.scene.render();
        });
    }

    updateGame() {

        let delta = this.#engine.getDeltaTime() / 1000.0;

        
        this.#player.update(InputController.inputMap, InputController.actions, delta);
        
        this.#curlingStone.update(delta);

        this.#arena.update(delta);

        //Animation
        this.#phase += this.#vitesseY * delta;
        this.#elevatorAggregate.body.setLinearVelocity(new Vector3(0, Math.sin(this.#phase)), 0);
    }
}

export default Game;
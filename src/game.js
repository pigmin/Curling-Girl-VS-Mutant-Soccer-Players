import { ActionManager, Color3, Color4, Engine, FollowCamera, FreeCamera, GlowLayer, HavokPlugin, HemisphericLight, InterpolateValueAction, KeyboardEventTypes, Mesh, MeshBuilder, ParticleSystem, PhysicsAggregate, PhysicsHelper, PhysicsMotionType, PhysicsRadialImpulseFalloff, PhysicsShapeType, Scalar, Scene, SetValueAction, ShadowGenerator, SpotLight, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";
import { Inspector } from '@babylonjs/inspector';
import HavokPhysics from "@babylonjs/havok";

import floorUrl from "../assets/textures/floor.png";
import floorBumpUrl from "../assets/textures/floor_bump.png";
import Player from "./player";
import Arena from "./arena";
import CurlingStone from "./curlingStone";
import { GlobalManager, States } from "./globalmanager";
import { InputController } from "./inputcontroller";
import { SoundManager } from "./soundmanager";
import MenuUI from "./menuUi";
import GameUI from "./gameUi";
import Ball from "./ball";

class Game {

    #canvas;
    #engine;
    #havokInstance;
    
    #gameCamera;
    
    #bInspector = false;
    
    #menuUI;
    #gameUI;
    #elevator;
    #elevatorAggregate;


    #phase = 0.0;
    #vitesseY = 1.8;


    #arena;
    #player;
    #curlingStone;
    #oneBall;

    constructor(canvas, engine) {
        this.#canvas = canvas;
        this.#engine = engine;
        GlobalManager.init(canvas, engine);
    }

    async start() {
        await this.initGame();
        GlobalManager.gameState = States.STATE_MENU;
        this.gameLoop();
        this.endGame();
    }

    createScene() {


        const hk = new HavokPlugin(true, this.#havokInstance);
        // enable physics in the scene with a gravity
        GlobalManager.scene.enablePhysics(new Vector3(0, -9.81, 0), hk);

        GlobalManager.camera = new FollowCamera("camera1", Vector3.Zero(), GlobalManager.scene);
        GlobalManager.camera.heightOffset = 8;
        GlobalManager.camera.radius = -16;
        GlobalManager.camera.maxCameraSpeed = 1.5;
        GlobalManager.camera.cameraAcceleration = 0.035;
        GlobalManager.camera.rotationOffset = 90;
        
       /* GlobalManager.glowLayer = new GlowLayer("glowLayer", GlobalManager.scene);
        GlobalManager.glowLayer.intensity = 1.2;*/

        
        //GlobalManager.camera.setTarget(Vector3.Zero());
        //GlobalManager.camera.attachControl(this.#canvas, true);

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

        const ground = MeshBuilder.CreateGround("ground", { width: 320, height: 320, subdivisions: 128 }, GlobalManager.scene);
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

        GlobalManager.gameState = States.STATE_INIT;

        this.#havokInstance = await this.getInitializedHavok();
        GlobalManager.scene = new Scene(this.#engine);
        GlobalManager.scene.collisionsEnabled = true;


        InputController.init();
        await SoundManager.init();
        this.createScene();

        this.#player = new Player(3, 2, 3);
        await this.#player.init();
        GlobalManager.camera.lockedTarget = this.#player.transform;
        GlobalManager.addShadowCaster(this.#player.gameObject, true);

        this.#curlingStone = new CurlingStone(0, 1, 0, this.scene);
        await this.#curlingStone.init();
        GlobalManager.addShadowCaster(this.#curlingStone.gameObject);

        this.#arena = new Arena(0, 0, 0);
        await this.#arena.init();
        GlobalManager.addShadowCaster(this.#arena.gameObject, true);
        this.#arena.setCollisionZones(this.#curlingStone.gameObject);

        
        this.#oneBall = new Ball(5, 8, 0, this.scene);
        await this.#oneBall.init();
        GlobalManager.addShadowCaster(this.#oneBall.gameObject);


        this.#menuUI = new MenuUI();
        await this.#menuUI.init();
        this.#menuUI.show(true);

        this.#gameUI = new GameUI();
        await this.#gameUI.init();
        this.#gameUI.show(false);

        SoundManager.playMusic(SoundManager.Musics.START_MUSIC);
    }


    endGame() {

    }

    gameLoop() {

        const divFps = document.getElementById("fps");
        this.#engine.runRenderLoop(() => {

            let delta = this.#engine.getDeltaTime() / 1000.0;
            let now = performance.now();

            InputController.update(delta);
            SoundManager.update(delta);
            GlobalManager.update(delta);

            switch (GlobalManager.gameState) {
                case States.STATE_MENU:
                    //GlobalManager.gameState = States.STATE_START_GAME;
                    break;
                case States.STATE_START_GAME:
                    this.#menuUI.show(false);
                    this.#gameUI.show(true);

                    GlobalManager.gameState = States.STATE_LEVEL_READY;
                    break;
                case States.STATE_BALL_CENTER:
                    GlobalManager.gameState = States.STATE_NEW_LEVEL;
                    GlobalManager.timeToDo = now + 3000;
                    break;
                case States.STATE_NEW_LEVEL:
                    if (now > GlobalManager.timeToDo)
                    {
                        this.#curlingStone.resetToCenter();
                        GlobalManager.gameState = States.STATE_LEVEL_READY;
                    }
                    break;
                case States.STATE_LEVEL_READY:
                    GlobalManager.gameState = States.STATE_RUNNING;
                    break;

                case States.STATE_RUNNING:
                    this.updateGame(delta);
                    break;
            }

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

    updateGame(delta) {

        if (this.#curlingStone.gameObject.absolutePosition.x < -10) {
            
            this.#arena.Boards_primitive1.material.alpha = Scalar.Lerp(1, 0.5, (this.#curlingStone.gameObject.absolutePosition.x / -14));
        }
        else 
            this.#arena.Boards_primitive1.material.alpha = 1;


        this.#player.update(delta);

        this.#curlingStone.update(delta);
        this.#oneBall.update(delta);

        this.#arena.update(delta);

        //Animation
        this.#phase += this.#vitesseY * delta;
        this.#elevatorAggregate.body.setLinearVelocity(new Vector3(0, Math.sin(this.#phase)), 0);
    }
}

export default Game;
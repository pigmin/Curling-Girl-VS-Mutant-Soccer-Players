import { Color3, Matrix, Mesh, MeshBuilder, Physics6DoFConstraint, PhysicsAggregate, PhysicsConstraintAxis, PhysicsMotionType, PhysicsRaycastResult, PhysicsShapeType, Quaternion, Ray, RayHelper, Scalar, SceneLoader, TransformNode, Vector3 } from "@babylonjs/core";

import girlModelUrl from "../assets/models/girl1.glb";
import { GlobalManager, PhysMasks } from "./globalmanager";
import { SoundManager } from "./soundmanager";
import { InputController } from "./inputcontroller";

const USE_FORCES = true;
let RUNNING_SPEED = 8;
let JUMP_IMPULSE = 6;
const PLAYER_HEIGHT = 1.7;
const PLAYER_RADIUS = 0.4;


class Player {

    //Position dans le monde
    transform;
    //Mesh
    gameObject;
    //Physic
    capsuleAggregate;

    //Animations
    animationsGroup;

    bWalking = false;
    bOnGround = false;
    bFalling = false;
    bJumping = false;

    idleAnim;
    runAnim;
    walkAnim;

    moveDir = new Vector3(0, 0, 0);

    x = 0.0;
    y = 0.0;
    z = 0.0;

    speedX = 0.0;
    speedY = 0.0;
    speedZ = 0.0;

    constructor(x, y, z) {

        this.x = x || 0.0;
        this.y = y || 0.0;
        this.z = z || 0.0;
        this.transform = new MeshBuilder.CreateCapsule("player", { height: PLAYER_HEIGHT, radius: PLAYER_RADIUS }, GlobalManager.scene);
        this.transform.visibility = 0.0;
        this.transform.position = new Vector3(this.x, this.y, this.z);
    }

    async init() {
        //On cré le mesh et on l'attache à notre parent
        const result = await SceneLoader.ImportMeshAsync("", "", girlModelUrl, GlobalManager.scene);
        this.gameObject = result.meshes[0];
        this.gameObject.scaling = new Vector3(1, 1, 1);
        this.gameObject.position = new Vector3(0, -PLAYER_HEIGHT / 2, 0);
        this.gameObject.rotate(Vector3.UpReadOnly, Math.PI);
        this.gameObject.bakeCurrentTransformIntoVertices();

        this.capsuleAggregate = new PhysicsAggregate(this.transform, PhysicsShapeType.CAPSULE, { mass: 1, friction: 1, restitution: 0.1 }, GlobalManager.scene);
        this.capsuleAggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);
        
        //On bloque les rotations avec cette méthode, à vérifier.
        this.capsuleAggregate.body.setMassProperties({
            inertia: new Vector3(0, 0, 0),
            centerOfMass: new Vector3(0, PLAYER_HEIGHT / 2, 0),
            mass: 1,
            inertiaOrientation: new Quaternion(0, 0, 0, 1)
        });

        //On annule tous les frottements, on laisse le IF pour penser qu'on peut changer suivant le contexte
        if (USE_FORCES) {
            this.capsuleAggregate.body.setLinearDamping(0.0);
            this.capsuleAggregate.body.setAngularDamping(0.0);
        }
        else {
            this.capsuleAggregate.body.setLinearDamping(0);
            this.capsuleAggregate.body.setAngularDamping(0.0);
        }

        this.gameObject.parent = this.transform;
        this.animationsGroup = result.animationGroups;
        this.animationsGroup[0].stop();
        this.idleAnim = GlobalManager.scene.getAnimationGroupByName('Idle');
        this.runAnim = GlobalManager.scene.getAnimationGroupByName('Running');
        this.walkAnim = GlobalManager.scene.getAnimationGroupByName('Walking');
        this.idleAnim.start(true, 1.0, this.idleAnim.from, this.idleAnim.to, false);
    }

    checkGround() {
        let ret = false;

        var rayOrigin = this.transform.absolutePosition;
        var ray1Dir = Vector3.Down();
        var ray1Len = (PLAYER_HEIGHT / 2) + 0.1;
        var ray1Dest = rayOrigin.add(ray1Dir.scale(ray1Len));

        const raycastResult = GlobalManager.scene.getPhysicsEngine().raycast(rayOrigin, ray1Dest, PhysMasks.PHYS_MASK_GROUND);
        if (raycastResult.hasHit) {
            //console.log("Collision at ", raycastResult.hitPointWorld);
            if (!this.bOnGround)
                console.log("Grounded");
            ret = true;
        }
/*
        var ray1 = new Ray(rayOrigin, ray1Dir, ray1Len);
        var ray1Helper = new RayHelper(ray1);
        ray1Helper.show(GlobalManager.scene, new Color3(1, 1, 0));
*/

        return ret;
    }

    inputMove() {
        let ret = false;
        const axis = InputController.getAxisVectorP1();

        if (axis.length() < 0.01) {
            this.moveDir.setAll(0);            
        }
        else {
            this.moveDir.x = axis.y * RUNNING_SPEED;
            this.moveDir.y = 0;
            this.moveDir.z = -axis.x * RUNNING_SPEED;
            ret = true;
        }
        return ret;
    }
    //Pour le moment on passe les events clavier ici, on utilisera un InputManager plus tard
    update(delta) {
        let bWasOnGround = this.bOnGround;
        this.bOnGround = this.checkGround();

        let bWasWalking = this.bWalking;
        this.bWalking = this.inputMove();


        if (this.bOnGround) {
            //Inputs
            if (!this.moveDir.equals(Vector3.Zero())) {
                this.speedX = this.moveDir.x;
                this.speedZ = this.moveDir.z;
            }
            else {
               if (!USE_FORCES) {
                    this.speedX = Scalar.MoveTowards(this.speedX, 0, delta/3);
                    this.speedZ = Scalar.MoveTowards(this.speedZ, 0, delta/3);
               }
            }
        }
        else {
            //Inputs
            if (!this.moveDir.equals(Vector3.Zero())) {
                this.speedX = this.moveDir.x/1.5;
                this.speedZ = this.moveDir.z/1.5;
            }
            else {
                if (!USE_FORCES) {
                    this.speedX = Scalar.MoveTowards(this.speedX, 0, delta/3);
                    this.speedZ = Scalar.MoveTowards(this.speedZ, 0, delta/3);
               }
            }
        }


        if (InputController.actions["Space"] && this.bOnGround) {
            SoundManager.playSound(0);
            this.capsuleAggregate.body.applyImpulse(new Vector3(0, JUMP_IMPULSE, 0), Vector3.Zero());
        }
        
        //On applique tout
        if (USE_FORCES) {
            this.moveDir.set(this.speedX, 0, this.speedZ);
            this.capsuleAggregate.body.applyForce(this.moveDir, Vector3.Zero());
        }
        else {
            //Gravity  + deplacement + saut
            this.moveDir.set(this.speedX, this.capsuleAggregate.body.getLinearVelocity().y, this.speedZ);
            this.capsuleAggregate.body.setLinearVelocity(this.moveDir);
        }        
        
        //Animations
        if (this.bWalking) {
            //Orientation
            let directionXZ = new Vector3(this.speedX, 0, this.speedZ);
            this.gameObject.lookAt(directionXZ.normalize());

            if (!bWasWalking) {
                this.runAnim.start(true, 1.0, this.runAnim.from, this.runAnim.to, false);
            }
        }
        else {
            if (bWasWalking) {
                this.runAnim.stop();
                this.idleAnim.start(true, 1.0, this.idleAnim.from, this.idleAnim.to, false);
            }
        }
    }

}

export default Player;
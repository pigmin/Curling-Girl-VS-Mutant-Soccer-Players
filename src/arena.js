import { ActionManager, Color3, ExecuteCodeAction, MeshBuilder, PhysicsAggregate, PhysicsMotionType, PhysicsShape, PhysicsShapeType, SceneLoader, StandardMaterial, TransformNode, Vector3 } from "@babylonjs/core";

import arenaModelUrl from "../assets/models/ice_hockey.glb";
import { GlobalManager, PhysMasks } from "./globalmanager";

class Arena {

    x;
    y;
    z;

    gameObject;
    meshAggregate;

    zoneA;
    zoneB;


    constructor(x, y, z) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;

        this.gameObject = new TransformNode("arena", GlobalManager.scene);
        this.gameObject.position = new Vector3(x, y, z);
    }

    async init() {


        const result = await SceneLoader.ImportMeshAsync("", "", arenaModelUrl, GlobalManager.scene);
        
        this.gameObject = result.meshes[0];
        this.gameObject.name = "arena";
        this.gameObject.setParent(null);
        this.gameObject.scaling.scaleInPlace(2.5);
        this.gameObject.position.set(this.x, this.y, this.z);


        for (let childMesh of result.meshes) {

            childMesh.refreshBoundingInfo(true);
            if (childMesh.getTotalVertices() > 0) {
                const meshAggregate = new PhysicsAggregate(childMesh, PhysicsShapeType.MESH, {mass:0, friction: 0.4, restitution : 0.1});
                meshAggregate.body.setMotionType(PhysicsMotionType.STATIC);
                meshAggregate.shape.filterMembershipMask = PhysMasks.PHYS_MASK_GROUND;
                childMesh.receiveShadows = true;
           }
        }


        this.zoneA = MeshBuilder.CreateBox("zoneA", { width: 4.2, height: 0.2, depth: 2.0 }, GlobalManager.scene);
        let zoneMat = new StandardMaterial("zoneA", GlobalManager.scene);
        zoneMat.diffuseColor = Color3.Red();
        //zoneMat.alpha = 0.5;
        this.zoneA.material = zoneMat;
        this.zoneA.position = new Vector3(0, 0.1, 27.5);


        this.zoneB = MeshBuilder.CreateBox("zoneB",  { width: 4.2, height: 0.2, depth: 2.0 }, GlobalManager.scene);
        let zoneMatB = new StandardMaterial("zoneB", GlobalManager.scene);
        zoneMatB.diffuseColor = Color3.Green();
        //zoneMatB.alpha = 0.5;
        this.zoneB.material = zoneMatB;
        this.zoneB.position = new Vector3(0, 0.1, -27.5);


    }

    setCollisionZones(culingMesh) {
        this.zoneA.actionManager = new ActionManager(GlobalManager.scene);
        this.zoneA.actionManager.registerAction(
            new ExecuteCodeAction(
                {
                    trigger: ActionManager.OnIntersectionEnterTrigger, 
                    parameter: culingMesh,
                }, 
                (actionEv) => {
                    console.log(actionEv);
                }
            )
        );
        this.zoneB.actionManager = new ActionManager(GlobalManager.scene);
        this.zoneB.actionManager.registerAction(
            new ExecuteCodeAction(
                {
                    trigger: ActionManager.OnIntersectionEnterTrigger, 
                    parameter: culingMesh,
                }, 
                (actionEv) => {
                    console.log(actionEv);
                }
            )
        );        
    }

    update(delta) {

    }
}

export default Arena;
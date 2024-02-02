import { ActionManager, Color3, Engine, ExecuteCodeAction, Material, MeshBuilder, PhysicsAggregate, PhysicsMotionType, PhysicsShape, PhysicsShapeType, SceneLoader, StandardMaterial, TransformNode, Vector3 } from "@babylonjs/core";

import arenaModelUrl from "../assets/models/ice_hockey.glb";
import { GlobalManager, PhysMasks, States } from "./globalmanager";

class Arena {

    x;
    y;
    z;

    gameObject;
    meshAggregate;

    zoneA;
    zoneB;

    Boards_primitive1;


    constructor(x, y, z) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
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
                let meshAggregate;
                //On teste le nom
                if (childMesh.name == "Boards_primitive2")
                    meshAggregate = new PhysicsAggregate(childMesh, PhysicsShapeType.MESH, {mass:0, friction: 0.7, restitution : 0.5});
                else
                    meshAggregate = new PhysicsAggregate(childMesh, PhysicsShapeType.MESH, {mass:0, friction: 0.4, restitution : 0.1});

                //FX transparent
                if (childMesh.name == "Boards_primitive1") {
                    this.Boards_primitive1 = childMesh;
                    let mat = this.Boards_primitive1.material;
                    mat.transparencyMode = Material.MATERIAL_ALPHABLEND;
                    mat.alphaMode = Engine.ALPHA_COMBINE;
                }

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

    setCollisionZones(curlingMesh) {
        this.zoneA.actionManager = new ActionManager(GlobalManager.scene);
        this.zoneA.actionManager.registerAction(
            new ExecuteCodeAction(
                {
                    trigger: ActionManager.OnIntersectionEnterTrigger, 
                    parameter: curlingMesh,
                }, 
                (actionEv) => {
                    GlobalManager.goalZoneA();
                }
            )
        );
        this.zoneB.actionManager = new ActionManager(GlobalManager.scene);
        this.zoneB.actionManager.registerAction(
            new ExecuteCodeAction(
                {
                    trigger: ActionManager.OnIntersectionEnterTrigger, 
                    parameter: curlingMesh,
                }, 
                (actionEv) => {
                    GlobalManager.goalZoneB();
                }
            )
        );        
    }

    update(delta) {

    }
}

export default Arena;
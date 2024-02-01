import { PhysicsAggregate, PhysicsShapeType, Scene, SceneLoader, Vector3 } from "@babylonjs/core";

import curlingStoneModelUrl from "../assets/models/curling_stone.glb";
import { GlobalManager } from "./globalmanager";

class CurlingStone {

    x;
    y;
    z;

    gameObject;
    meshAggregate;

    constructor(x, y, z) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
    }

    async init() {
        const result = await SceneLoader.ImportMeshAsync("", "", curlingStoneModelUrl, GlobalManager.scene);
        this.gameObject = result.meshes[1];
        this.gameObject.setParent(null);
        result.meshes[0].dispose();

        this.gameObject.scaling.scaleInPlace(0.025);
        this.gameObject.position = new Vector3(this.x, this.y, this.z);
        this.meshAggregate = new PhysicsAggregate(this.gameObject, PhysicsShapeType.CONVEX_HULL, { mass: .25, friction: 0.05, restitution: 0.3 });
    }

    update(delta) {

    }

    resetToCenter() {
        this.meshAggregate.body.disablePreStep = false;
        // The position where you want to move the body to
        this.meshAggregate.body.transformNode.position.set(this.x, this.y, this.z);
        this.meshAggregate.body.setLinearVelocity(Vector3.Zero());
        GlobalManager.scene.onAfterRenderObservable.addOnce(() => {
            // Turn disablePreStep on again for maximum performance
            this.meshAggregate.body.disablePreStep = true;
        });
    }
}

export default CurlingStone;
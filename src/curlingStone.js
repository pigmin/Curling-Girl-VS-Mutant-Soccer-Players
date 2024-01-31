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

    update(delta)  {

    }

}

export default CurlingStone;